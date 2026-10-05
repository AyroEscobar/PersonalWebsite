#!/usr/bin/env node
/*
  QA run (PLAN.md 12, 13). Headless Chrome over CDP against the prerendered
  build, served the way Vercel serves it.

    npm run qa                 everything (build, pages, axe, keyboard, motion, Lighthouse x3, links, shots)
    npm run qa -- --fast       skip Lighthouse and external links (about 1 minute)
    npm run qa -- --no-build   reuse the current dist
    npm run qa -- --lh-runs 1  fewer Lighthouse runs
    npm run qa -- --strict     treat "pending" (parts not built yet) as failures
    npm run qa -- --widths 390,1440 --no-shots

  Every route ('/' and an unknown path for the 404) at 390, 768, 1440 and
  1920: horizontal overflow, console errors, failed or third-party requests,
  broken links and images, contrast spot checks, target sizes, structure.
  Then axe (390 and 1440), reduced motion, the keyboard walk, hydration, the
  404 status, the copy toast, print, the r1 regressions that still apply,
  the glass checks (DESIGN.md 9: measured composite contrast, the reader
  and the morph, forced colours, quiet mode), Lighthouse, and the bundle
  report. Writes qa-report.md and qa-report.json to the reviews dir and
  screenshots to the shots dir (tools/local.json, or .build/qa).

  Exit code 1 when any check fails. Chrome always runs headless with its own
  profile under the scratch dir, and is killed and deleted at the end.
*/
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { serveDist } from '../serve-dist.mjs'
import { launchChrome, localConfig, scratchDir } from '../lib/chrome.mjs'
import { connect } from '../lib/cdp.mjs'
import { measure } from '../budget.mjs'
import { staticScan } from './static.mjs'
import { runLighthouse, TARGETS } from './lighthouse.mjs'
import * as P from './page-checks.mjs'
import { writeReport } from './report.mjs'
import { glassChecks } from './glass-checks.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO = path.resolve(ROOT, '..')
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opt = (n, d) => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : d
}
const cfg = localConfig()
const FAST = flag('--fast')
const STRICT = flag('--strict')
const WIDTHS = opt('--widths', '390,768,1440,1920').split(',').map(Number)
const LH_RUNS = Number(opt('--lh-runs', 3))
const REVIEWS = opt('--out', process.env.QA_REVIEWS_DIR || cfg.reviewsDir || path.join(ROOT, '.build/qa'))
const SHOTS = opt('--shots', process.env.QA_SHOTS_DIR || cfg.shotsDir || path.join(REVIEWS, 'shots'))
const NO_SHOTS = flag('--no-shots')
const ROUTES = [
  { label: 'home', path: '/' },
  { label: '404', path: '/nothing-here' },
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fn = (f, ...args) => `(${f.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`
const log = (...a) => console.log('qa:', ...a)

mkdirSync(REVIEWS, { recursive: true })
if (!NO_SHOTS) mkdirSync(SHOTS, { recursive: true })

const R = {
  startedAt: new Date().toISOString(),
  options: { FAST, STRICT, WIDTHS, LH_RUNS },
  checks: [],
  pages: [],
  keyboard: null,
  motion: {},
  lighthouse: null,
  budget: null,
  shots: [],
  links: { internal: [], external: [] },
}
const check = (area, id, status, detail = '', data) => {
  R.checks.push({ area, id, status, detail, data })
  const mark = { pass: 'ok  ', fail: 'FAIL', warn: 'warn', pending: 'pend', manual: 'man ' }[status] || status
  console.log(`  ${mark} ${area}/${id}${detail ? ': ' + detail : ''}`)
}

// ---------- 1. build ----------
if (!flag('--no-build')) {
  log('build')
  const b = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, stdio: 'inherit', env: process.env })
  check('build', 'npm run build', b.status === 0 ? 'pass' : 'fail', b.status === 0 ? 'check-content, vite, prerender, budget' : `exit ${b.status}`)
  if (b.status !== 0) {
    writeReport(R, { REVIEWS, SHOTS, ROOT })
    process.exit(1)
  }
} else check('build', 'npm run build', existsSync(path.join(ROOT, 'dist/index.html')) ? 'pass' : 'fail', 'skipped (--no-build), using dist')

// ---------- 2. budget ----------
log('bundle report')
try {
  R.budget = measure()
  check('budget', 'budgets', R.budget.fails.length ? 'fail' : 'pass', R.budget.fails.join('; ') || `entry ${(R.budget.rows[0].gz / 1024).toFixed(1)} KB gz, initial ${(R.budget.initial / 1024).toFixed(1)} KB`)
} catch (e) {
  check('budget', 'budgets', 'fail', e.message)
}

// ---------- 3. static scans ----------
log('static scans of dist')
for (const s of await staticScan(ROOT)) check('static', s.id, s.status, s.detail)

// ---------- 4. serve and launch ----------
const { server, url } = await serveDist({ port: 0 })
log(`serving dist at ${url}`)
const chrome = await launchChrome({ tag: 'qa' })
log(`chrome ${chrome.version.Browser} on :${chrome.port}, profile ${chrome.profileDir}`)
const cdp = await connect(chrome.wsUrl)

let exitCode = 0
try {
  // ---------- 5. raw HTML: prerender, 404, headers, meta ----------
  log('raw responses')
  const { HERO } = await import(pathToFileURL(path.join(ROOT, 'src/content/identity.js')))
  const { SECTION_IDS, headingId } = await import(pathToFileURL(path.join(ROOT, 'src/content/sections.js')))
  const { NOT_FOUND, HEAD } = await import(pathToFileURL(path.join(ROOT, 'src/content/meta.js')))
  const home = await fetch(`${url}/`)
  const homeHtml = await home.text()
  const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<!-- -->/g, '')
  const plain = decode(homeHtml)
  const missingH2 = SECTION_IDS.filter((id) => !new RegExp(`<h2[^>]*id="${headingId(id)}"`).test(homeHtml))
  // The h1 sets each word in its own span from 1100 px up (r1 T12): compare its text, not its markup.
  const h1Text = ((plain.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  check('prerender', 'h1 and h2s before JS', h1Text === HERO.name.text && !missingH2.length ? 'pass' : 'fail', missingH2.length ? `missing ${missingH2.join(', ')}` : `h1 "${h1Text}" and four h2s in the served HTML`)
  check('prerender', 'the hero line before JS', plain.includes(HERO.line.text) ? 'pass' : 'fail', 'the one line under the role is in the served HTML')
  check('prerender', 'the role line before JS', plain.includes(HERO.role.text) ? 'pass' : 'fail', 'Co-founder and Founding Engineer at Viaere. Founder of Esvo Technologies. in the served HTML')
  const poster = (homeHtml.match(/<picture class="poster">[\s\S]*?<\/picture>/) || [])[0] || ''
  check('prerender', 'the poster before JS', /hero-1440\.avif/.test(poster) && /hero-780\.avif/.test(poster) && /fetchpriority="high"/i.test(poster) ? 'pass' : 'fail', 'both AVIF sources and a fetchpriority high <img> in the served HTML')
  const nf = await fetch(`${url}/nothing-here`)
  const nfHtml = await nf.text()
  check('http', '404 status', nf.status === 404 && nfHtml.includes(NOT_FOUND.line.text) ? 'pass' : 'fail', `/nothing-here -> ${nf.status}, ${nfHtml.includes(NOT_FOUND.line.text) ? 'themed' : 'not themed'}`)
  for (const [p, mime] of [['/robots.txt', 'text/plain'], ['/sitemap.xml', 'application/xml']]) {
    const r = await fetch(url + p)
    const body = await r.text()
    check('http', p, r.status === 200 && (r.headers.get('content-type') || '').startsWith(mime) && body.includes('www.ayroescobar.com') ? 'pass' : 'fail', `${r.status} ${r.headers.get('content-type')}`)
  }
  const asset = (homeHtml.match(/src="(\/assets\/[^"]+\.js)"/) || [])[1]
  if (asset) {
    const r = await fetch(url + asset)
    check('http', 'immutable assets', /immutable/.test(r.headers.get('cache-control') || '') ? 'pass' : 'fail', r.headers.get('cache-control'))
  }
  const sec = ['x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options', 'content-security-policy'].filter((h) => !home.headers.get(h))
  check('http', 'security headers', sec.length ? 'fail' : 'pass', sec.length ? `missing ${sec.join(', ')}` : 'five headers plus CSP from vercel.json')
  const metaOk =
    homeHtml.includes(`<title>${HEAD.title.text}</title>`) &&
    homeHtml.includes(`<link rel="canonical" href="${HEAD.canonical}"`) &&
    homeHtml.includes(`property="og:url" content="${HEAD.canonical}"`) &&
    /<meta name="twitter:card"/.test(homeHtml) &&
    !/property="twitter:/.test(homeHtml)
  check('meta', 'title, canonical, og, twitter', metaOk ? 'pass' : 'fail', `${HEAD.title.text}, ${HEAD.canonical}`)
  const ld = (homeHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]
  let ldOk = false
  try {
    const j = JSON.parse(ld)
    ldOk = j['@type'] === 'Person' && ['name', 'url', 'jobTitle', 'homeLocation', 'affiliation', 'sameAs'].every((k) => j[k])
  } catch {
    /* invalid */
  }
  check('meta', 'json-ld person', ldOk ? 'pass' : 'fail', ldOk ? 'name, url, jobTitle, homeLocation, affiliation, sameAs' : 'missing or invalid')
  const og = path.join(ROOT, 'public/og.png')
  if (existsSync(og)) {
    const b = readFileSync(og)
    const w = b.readUInt32BE(16)
    const h = b.readUInt32BE(20)
    const alt = HEAD.ogImage.alt.text
    check('meta', 'og.png', w === 1200 && h === 630 && b.length <= 300 * 1024 && !/[–—\d]/.test(alt) ? 'pass' : 'fail', `${w}x${h}, ${(b.length / 1024).toFixed(0)} KB, alt "${alt}"`)
  }

  // ---------- 6. every route at every width ----------
  log('pages')
  const origin = new URL(url).origin
  const allLinks = new Map()
  for (const route of ROUTES) {
    for (const w of WIDTHS) {
      const mobile = w < 720
      const vh = mobile ? 844 : w >= 1920 ? 1080 : 900
      const page = await cdp.newPage({ width: w, height: vh, dpr: mobile ? 2 : 1, mobile })
      await page.addInitScript(fn(P.rafCounterInit))
      await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
      await page.goto(url + route.path, { settle: 1800 })
      const tag = `after-${route.label}-${w}`
      if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, `${tag}-fold.png`))))
      const height = await page.eval(fn(P.scrollThrough))
      const facts = await page.eval(fn(P.domFacts))
      const overflow = await page.eval(fn(P.overflowCheck, w))
      const images = await page.eval(fn(P.imagesCheck))
      const contrastRes = await page.eval(fn(P.contrastCheck))
      const targets = await page.eval(fn(P.targetsCheck))
      const badHash = await page.eval(fn(P.hashTargets))
      for (const l of await page.eval(fn(P.linksList))) allLinks.set(l.abs, l)
      let axe = null
      if ([390, 1440].includes(w)) {
        try {
          const { axeSource } = await import('../../tools/axe.mjs')
          await page.eval(axeSource + ';true')
          axe = await page.eval(
            `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ')) })))`,
          )
        } catch (e) {
          axe = [{ id: 'axe-error', help: e.message.slice(0, 200), n: 1 }]
        }
      }
      if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, `${tag}-full.png`), { fullPage: true })))
      const docUrl = url + route.path
      const consoleErrors = page.console.filter((c) => c.type !== 'warning' && c.type !== 'log-warning').filter((c) => !(route.label === '404' && c.text.includes(docUrl) && /404/.test(c.text)))
      const hydration = page.console.filter((c) => /hydrat|did not match|#418|#423|#425/i.test(c.text))
      const failedReqs = page.requests.filter((r) => (r.failed && !r.canceled) || (r.status >= 400 && !(route.label === '404' && r.url === docUrl)))
      const thirdParty = page.requests.filter((r) => r.url && /^https?:/.test(r.url) && !r.url.startsWith(origin))
      const media = page.requests.filter((r) => /\.(mp3|wav|mp4|mov|ogg|m4a|webm)(\?|$)/i.test(r.url || ''))
      const banned = page.requests.filter((r) => /firestore|googleapis|mapbox/i.test(r.url || ''))
      const p = { route: route.label, width: w, height, facts, overflow, images, contrast: contrastRes, targets, badHash, axe, consoleErrors, hydration, failedReqs, thirdParty, media, banned, bytes: page.requests.reduce((s, r) => s + (r.bytes || 0), 0) }
      R.pages.push(p)
      const at = `${route.label}@${w}`
      check('page', `${at} overflow`, overflow.overflow || overflow.offenderCount ? 'fail' : 'pass', overflow.overflow || overflow.offenderCount ? `laid out ${overflow.layout} wide, scrollWidth ${overflow.scrollWidth}, screen ${overflow.viewport}; ${overflow.offenders.map((o) => o.sel).join(', ')}` : '')
      check('page', `${at} console`, consoleErrors.length ? 'fail' : 'pass', consoleErrors.map((c) => c.text.slice(0, 120)).join(' | '))
      check('page', `${at} network`, failedReqs.length || thirdParty.length || media.length || banned.length ? 'fail' : 'pass', [...failedReqs.map((r) => `${r.status || r.failed} ${r.url}`), ...thirdParty.map((r) => `third-party ${r.url}`), ...media.map((r) => `media ${r.url}`)].join(' | ') || `${page.requests.length} requests, ${(p.bytes / 1024).toFixed(0)} KB`)
      check('page', `${at} images`, images.broken.length || images.noAlt.length ? 'fail' : 'pass', [...images.broken.map((s) => `broken ${s}`), ...images.noAlt.map((s) => `no alt ${s}`)].join(' | ') || `${images.total} images`)
      check('page', `${at} hash links`, badHash.length ? 'fail' : 'pass', badHash.join(', '))
      check('page', `${at} contrast`, contrastRes.failCount ? 'fail' : 'pass', contrastRes.failCount ? contrastRes.failures.slice(0, 4).map((f) => `"${f.text}" ${f.ratio}`).join(' | ') : `${contrastRes.checked} text elements, lowest ${contrastRes.lowest[0]?.ratio ?? '-'}${contrastRes.complex ? `, ${contrastRes.complex} over images skipped` : ''}`)
      check('page', `${at} targets`, targets.smallCount ? 'fail' : targets.spacedCount ? 'warn' : 'pass', targets.smallCount ? targets.small.slice(0, 4).map((t) => `"${t.text}" ${t.w}x${t.h}`).join(' | ') : targets.spacedCount ? `under 24px but spaced (allowed by 2.5.8, PLAN.md 8 asks for 24): ${targets.spaced.slice(0, 4).map((t) => `"${t.text}" ${t.w}x${t.h}`).join(' | ')}` : '')
      check('page', `${at} structure`, facts.h1.length === 1 && facts.landmarks.main === 1 && facts.skipFirst && !facts.positiveTabindex && !facts.unnamedButtons ? 'pass' : 'fail', `h1 ${facts.h1.length}, main ${facts.landmarks.main}, skip first ${facts.skipFirst}, positive tabindex ${facts.positiveTabindex}, unnamed buttons ${facts.unnamedButtons}`)
      if (hydration.length) check('page', `${at} hydration`, 'fail', hydration.map((c) => c.text.slice(0, 120)).join(' | '))
      if (axe) check('axe', at, axe.length ? 'fail' : 'pass', axe.map((v) => `${v.id} (${v.n})`).join(', '))
      await page.close()
    }
  }
  const fontFamilies = [...new Set(R.pages.flatMap((p) => p.facts.fonts.map((f) => f.replace(/ [\d ]+$/, ''))))]
  check('fonts', 'only Mona Sans and Geist Mono', fontFamilies.length && fontFamilies.every((f) => /^(Mona Sans|Geist Mono)$/.test(f)) ? 'pass' : 'fail', fontFamilies.join(', '))

  // ---------- 7. links ----------
  log('links')
  for (const [abs, l] of allLinks) {
    if (!/^https?:/.test(abs)) continue
    if (abs.startsWith(origin)) {
      if ((l.href || '').startsWith('#')) continue // in-page links: checked by the hash-target check
      const r = await fetch(abs)
      R.links.internal.push({ href: l.href, status: r.status })
    }
  }
  const badInternal = R.links.internal.filter((l) => l.status !== 200)
  check('links', 'internal', badInternal.length ? 'fail' : 'pass', badInternal.map((l) => `${l.status} ${l.href}`).join(', ') || `${R.links.internal.length} same-origin links`)
  if (!FAST) {
    // r1 M22: every link is logged as it is checked; the step has a hard
    // deadline; a timeout or a 5xx from a host the site links on purpose is a
    // warning (their outage is not our bug), a 4xx anywhere is a failure.
    const KNOWN = /(^|\.)(github\.com|linkedin\.com|instagram\.com|viaere\.com|interview-lens\.com|ayroescobar\.com)$/
    const ext = [...allLinks.keys()].filter((h) => /^https?:/.test(h) && !h.startsWith(origin))
    const deadline = Date.now() + 75000
    for (const href of ext) {
      let status = 0
      if (Date.now() > deadline) {
        status = 'skipped (step deadline)'
      } else {
        try {
          const ctl = AbortSignal.timeout(10000)
          let r = await fetch(href, { method: 'HEAD', redirect: 'follow', signal: ctl, headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) site-link-check' } })
          if (r.status === 405 || r.status === 404) r = await fetch(href, { redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) site-link-check' } })
          status = r.status
        } catch (e) {
          status = `error ${e.name}`
        }
      }
      console.log(`    link ${status} ${href}`)
      R.links.external.push({ href, status })
    }
    const hostOf = (h) => {
      try {
        return new URL(h).hostname
      } catch {
        return ''
      }
    }
    const soft = (l) =>
      [999, 403, 429].includes(l.status) ||
      /^skipped/.test(String(l.status)) ||
      (KNOWN.test(hostOf(l.href)) && (typeof l.status !== 'number' || l.status >= 500))
    const unverifiable = R.links.external.filter(soft)
    const broken = R.links.external.filter((l) => !soft(l) && !(typeof l.status === 'number' && l.status < 400))
    check('links', 'external', broken.length ? 'fail' : unverifiable.length ? 'warn' : 'pass', [...broken.map((l) => `${l.status} ${l.href}`), ...unverifiable.map((l) => `unverifiable ${l.status} ${l.href}`)].join(', ') || `${R.links.external.length} external links`)
  }

  // ---------- 8. motion: reduced, idle, the entry ----------
  log('motion')
  const motionProbe = async (label, { reduce = false, query = '', hash = '', scrollTo = null } = {}) => {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.addInitScript(fn(P.rafCounterInit))
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    if (reduce) await page.media([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(`${url}/${query}${hash}`, { settle: 0 })
    await sleep(1800)
    if (scrollTo) {
      await page.eval(`document.getElementById(${JSON.stringify(scrollTo)})?.scrollIntoView({ behavior: 'instant' })`)
      await sleep(1000)
    }
    await page.eval('window.__qa.raf = 0')
    await sleep(3000)
    const res = await page.eval(`({
      raf: window.__qa.raf,
      canvas: document.querySelectorAll('canvas').length,
      mode: document.documentElement.dataset.mode,
      motion: document.documentElement.dataset.motion,
      tier: document.documentElement.dataset.tier,
      lensSeen: (() => { try { return sessionStorage.getItem('ae.lens') } catch { return null } })(),
      nav: document.getElementById('nav')?.className || '',
    })`)
    res.animations = await page.eval(fn(P.runningAnimations))
    await page.close()
    R.motion[label] = res
    return res
  }
  const rm = await motionProbe('reduced', { reduce: true })
  check('motion', 'reduced motion', rm.raf === 0 && rm.canvas === 0 && rm.mode === 'split' && !rm.animations.length ? 'pass' : 'fail', `rAF ${rm.raf} in 3 s, canvas ${rm.canvas}, mode ${rm.mode} (the nav is a pill from the start, the lens rests on the last line), long animations ${rm.animations.length}`)
  const fresh = await motionProbe('first-visit')
  check('motion', 'the lens enters once per session', fresh.lensSeen === '1' && fresh.mode === 'morph' && /is-lens/.test(fresh.nav) ? 'pass' : 'fail', `ae.lens ${fresh.lensSeen} after the first visit, mode ${fresh.mode}, nav "${fresh.nav.split(' ').filter((c) => /^is-/.test(c)).join(' ')}"`)
  const idle = await motionProbe('idle-offscreen', { scrollTo: 'work' })
  check('motion', 'rAF idle with hero offscreen', idle.raf === 0 ? 'pass' : 'fail', `${idle.raf} callbacks in 3 s without input, canvas ${idle.canvas}`)

  // ---------- 9. keyboard ----------
  log('keyboard')
  {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.goto(`${url}/`, { settle: 1800 })
    const seq = []
    for (let i = 0; i < 90; i++) {
      await page.key('Tab')
      await sleep(40)
      const f = await page.eval(fn(P.focusInfo))
      if (f.tag === 'body' || (seq.length && f.name === seq[0].name && f.href === seq[0].href)) break
      seq.push(f)
    }
    const noRing = seq.filter((f) => !f.outline && !f.shadow)
    const obscured = seq.filter((f) => f.obscured)
    check('keyboard', 'skip link first', seq[0] && /skip/i.test(seq[0].name) ? 'pass' : 'fail', seq[0]?.name)
    check('keyboard', 'visible focus', noRing.length ? 'fail' : 'pass', noRing.slice(0, 5).map((f) => `${f.tag} "${f.name}"`).join(', ') || `${seq.length} stops, all with a ring`)
    check('keyboard', 'focus not obscured', obscured.length ? 'fail' : 'pass', obscured.slice(0, 5).map((f) => `${f.tag} "${f.name}"`).join(', '))
    // v2 (DESIGN.md 5.1, 10): the skip link, the six nav words (the nav comes first; focusing a
    // word while it is the lens turns it into the pill), the name, the quiet switch, then the hero
    // pills. The nav word's own text is "work work" (upright and italic), so match on href.
    const EXPECT = [
      ['skip link', (f) => /skip/i.test(f.name)],
      ...SECTION_IDS.map((id) => [`nav ${id}`, (f) => f.tag === 'a' && f.href === `#${id}` && f.name !== 'Ayro Escobar']),
      ['name', (f) => f.name === 'Ayro Escobar'],
      ['quiet', (f) => /^quiet/i.test(f.name)],
      ['hero email', (f) => /^mailto:/.test(f.href || '')],
      ['see the work', (f) => f.href === '#work' && /see the work/i.test(f.name)],
    ]
    let j = 0
    for (const f of seq) if (j < EXPECT.length && EXPECT[j][1](f)) j++
    const missing = EXPECT.filter(([, m]) => !seq.some(m)).map(([n]) => n)
    check('keyboard', 'tab order spec', j === EXPECT.length ? 'pass' : 'fail', j === EXPECT.length ? 'skip, six nav words, name, quiet, hero email, see the work' : missing.length ? `never reached: ${missing.join(', ')}` : `out of order at "${EXPECT[j][0]}"`)

    // Enter on a nav word lands the heading below the pill.
    const rail = await page.eval(`!!document.querySelector('nav a[href="#work"]')`)
    if (rail) {
      // The tab walk can end with a focus scroll still in flight: jump to the top
      // without animation and wait for scrollY to hold still before pressing Enter.
      await page.eval(`new Promise((done) => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        let last = -1, still = 0
        const t = setInterval(() => {
          still = window.scrollY === last ? still + 1 : 0
          last = window.scrollY
          if (still >= 4) { clearInterval(t); done() }
        }, 25)
      })`)
      await page.eval(`document.querySelector('nav a[href="#work"]').focus({ preventScroll: true })`)
      await page.key('Enter')
      await sleep(1300)
      const pos = await page.eval(`(() => { const h = document.getElementById('work-h').getBoundingClientRect(); const nav = document.getElementById('nav'); const b = getComputedStyle(nav).position === 'fixed' && nav.getBoundingClientRect().top < 100 ? nav.getBoundingClientRect().bottom : 0; const cur = document.querySelector('#nav [aria-current] .nav-sans'); return { top: Math.round(h.top), bar: Math.round(b), vh: innerHeight, current: cur ? cur.textContent.trim() : null } })()`)
      check('keyboard', 'nav word lands below the pill', pos.top >= pos.bar && pos.top < pos.vh ? 'pass' : 'fail', `heading top ${pos.top}, pill bottom ${pos.bar}`)
      check('nav', 'aria-current tracks the section', pos.current === 'work' ? 'pass' : pos.current == null ? 'pending' : 'fail', `aria-current on "${pos.current}" after jumping to work`)
    }
    R.keyboard = { sequence: seq }
    await page.close()
  }

  // ---------- 10. interaction states: the copy toast, quiet ----------
  log('interaction states')
  for (const w of [390, 1440]) {
    const mobile = w < 720
    const page = await cdp.newPage({ width: w, height: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile })
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.goto(`${url}/`, { settle: 1800 })
    await page.eval(`document.querySelector('.contact .btn--primary').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await sleep(400)
    await page.eval(`document.querySelector('.contact .btn--primary').click()`)
    await sleep(700)
    if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, `after-state-${w}-copied.png`))))
    const said = await page.eval(`document.querySelector('.toast-region')?.textContent.trim() || ''`)
    check('interaction', `copy email toast @${w}`, said.length > 0 ? 'pass' : 'fail', `the status region says "${said}"`)
    await page.close()
    const q = await cdp.newPage({ width: w, height: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile })
    await q.goto(`${url}/?quiet=1`, { settle: 800 })
    if (!NO_SHOTS) R.shots.push(path.basename(await q.screenshot(path.join(SHOTS, `after-state-${w}-quiet.png`))))
    await q.close()
  }

  // Print: the nav, buttons and the first screen hidden (the print masthead stands in).
  {
    const page = await cdp.newPage({ width: 816, height: 1056 })
    await page.goto(`${url}/`, { settle: 600 })
    await page.media([{ name: 'print', value: '' }])
    await page.send('Emulation.setEmulatedMedia', { media: 'print' })
    const pr = await page.eval(`(() => { const vis = (s) => [...document.querySelectorAll(s)].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).length; return { canvas: vis('canvas'), buttons: vis('button'), nav: vis('nav'), bg: getComputedStyle(document.body).backgroundColor } })()`)
    check('print', 'print hides chrome', !pr.canvas && !pr.buttons && !pr.nav ? 'pass' : 'fail', `visible in print: canvas ${pr.canvas}, buttons ${pr.buttons}, nav ${pr.nav}; body ${pr.bg}`)
    await page.close()
  }

  // ---------- 10b. r1 regressions that still apply in v2 (T2, T6, T9, T12, T14) ----------
  // v1's map, rail, stops sheet, ping and clock are gone (DESIGN.md 7.2), and so are their checks
  // (T5, T11, T13, T15). What they protected that still matters is checked here or in glass-checks.
  log('r1 regressions')
  {
    // T2 and T6: a way to write to him on the first screen; the name high on a phone.
    for (const [w, h] of [[390, 844], [360, 780], [1440, 900]]) {
      const mobile = w < 720
      const page = await cdp.newPage({ width: w, height: h, dpr: mobile ? 2 : 1, mobile })
      await page.goto(`${url}/`, { settle: 1200 })
      const c = await page.eval(`(() => {
        const m = document.querySelector('main .hero a[href^="mailto:"]')
        const h1 = document.querySelector('h1')
        return { mail: m ? Math.round(m.getBoundingClientRect().bottom) : null, vh: innerHeight, h1: Math.round(h1.getBoundingClientRect().top), sw: document.documentElement.scrollWidth, iw: innerWidth }
      })()`)
      check('r1', `T2 email on the first screen @${w}x${h}`, c.mail != null && c.mail <= c.vh ? 'pass' : 'fail', `the hero email pill ends at ${c.mail} of ${c.vh}`)
      if (mobile) check('r1', `T6 name high on a phone @${w}x${h}`, c.h1 < 300 && c.sw <= w && c.iw === w ? 'pass' : 'fail', `h1 top ${c.h1}, scrollWidth ${c.sw}`)
      await page.close()
    }

    // T14: WCAG 1.4.12 text spacing at 320 and 390: no sideways scroll, the name and the quiet switch stay in.
    for (const w of [320, 390]) {
      const page = await cdp.newPage({ width: w, height: 800, dpr: 2, mobile: true })
      await page.goto(`${url}/`, { settle: 800 })
      const r = await page.eval(`new Promise((done) => {
        const s = document.createElement('style')
        s.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }'
        document.head.appendChild(s)
        setTimeout(() => {
          const h1 = document.querySelector('h1')
          const b = h1.getBoundingClientRect()
          const q = document.querySelector('.masthead .quiet').getBoundingClientRect()
          done({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: innerWidth, h1Clip: h1.scrollWidth > h1.clientWidth + 1 || b.right > innerWidth + 1, quietRight: Math.round(q.right) })
        }, 400)
      })`)
      check('r1', `T14 text spacing @${w}`, r.sw === r.cw && r.iw === w && !r.h1Clip && r.quietRight <= w ? 'pass' : 'fail', `scrollWidth ${r.sw}, clientWidth ${r.cw}, layout ${r.iw}, h1 clipped ${r.h1Clip}, quiet switch right edge ${r.quietRight}`)
      await page.close()
    }

    // At 1440, everything mounted: no monospace at all (v2), boxes only for plates (T9).
    {
      const page = await cdp.newPage({ width: 1440, height: 900 })
      await page.goto(`${url}/`, { settle: 1200 })
      await page.eval(fn(P.scrollThrough))
      const m = await page.eval(fn(P.monoShare))
      const b = await page.eval(fn(P.borderedBoxes))
      check('v2', 'no monospace at 1440 (DESIGN.md 9.3)', m.mono === 0 ? 'pass' : 'fail', `${m.mono} of ${m.total} visible text nodes are monospace, must be 0`)
      check('r1', 'T9 bordered boxes at 1440', b.count < 40 ? 'pass' : 'fail', `${b.count} fully bordered elements in main (under 40): ${b.sample.join(', ')}`)
      await page.close()
    }

    // T12: fonts held back 500 ms must not move the page, on desktop and on a phone.
    {
      const slow = await serveDist({ port: 0, delay: (p) => (/\.woff2$/.test(p) ? 500 : 0) })
      const shifts = []
      for (const [w, h, mobile] of [[1280, 800, false], [1440, 900, false], [1920, 1080, false], [390, 844, true]]) {
        const page = await cdp.newPage({ width: w, height: h, dpr: mobile ? 2 : 1, mobile })
        await page.addInitScript(fn(P.clsInit))
        await page.send('Storage.clearDataForOrigin', { origin: new URL(slow.url).origin, storageTypes: 'local_storage,session_storage' })
        await page.goto(`${slow.url}/`, { settle: 2000 })
        shifts.push([w, await page.eval('Math.round(window.__cls * 10000) / 10000')])
        await page.close()
      }
      slow.server.close()
      check('r1', 'T12 no shift when the fonts arrive late', shifts.every(([, v]) => v <= 0.02) ? 'pass' : 'fail', shifts.map(([w, v]) => `${w}: CLS ${v}`).join(', '))
    }
  }

  // ---------- 10c. the glass checks (DESIGN.md 9; they replaced the r2 map checks) ----------
  log('glass checks')
  await glassChecks({ cdp, url, check, sleep })

  // ---------- 11. Lighthouse ----------
  if (!FAST) {
    log(`lighthouse (${LH_RUNS} run(s) per preset)`)
    R.lighthouse = await runLighthouse({ port: chrome.port, url, runs: LH_RUNS, log: (m) => console.log(m) })
    if (R.lighthouse.skipped) check('lighthouse', 'lighthouse', 'warn', R.lighthouse.skipped)
    else {
      if (R.lighthouse.retries) check('lighthouse', 'retried runs', 'warn', R.lighthouse.retries.join(' | '))
      for (const [key, { median: m }] of Object.entries(R.lighthouse)) {
        const t = key.startsWith('mobile') ? TARGETS.mobile : TARGETS.desktop
        const misses = ['performance', 'accessibility', 'best-practices', 'seo'].filter((c) => m[c] < t[c]).map((c) => `${c} ${m[c]} < ${t[c]}`)
        if (m.lcp > t.lcp) misses.push(`LCP ${Math.round(m.lcp)} ms > ${t.lcp}`)
        if (m.tbt > t.tbt) misses.push(`TBT ${Math.round(m.tbt)} ms > ${t.tbt}`)
        if (m.cls > t.cls) misses.push(`CLS ${m.cls.toFixed(3)} > ${t.cls}`)
        check('lighthouse', key, misses.length ? 'fail' : 'pass', misses.join('; ') || `perf ${m.performance}, a11y ${m.accessibility}, bp ${m['best-practices']}, seo ${m.seo}, LCP ${Math.round(m.lcp)} ms, TBT ${Math.round(m.tbt)} ms, CLS ${m.cls.toFixed(3)}`)
      }
      for (const form of ['mobile', 'desktop']) {
        const full = R.lighthouse[`${form}-full`].median
        const quiet = R.lighthouse[`${form}-quiet`].median
        const worse = ['performance', 'accessibility', 'best-practices', 'seo'].filter((c) => quiet[c] < full[c])
        check('lighthouse', `${form} quiet >= full`, worse.length ? 'fail' : 'pass', worse.map((c) => `${c} ${quiet[c]} < ${full[c]}`).join('; '))
      }
    }
  }
} catch (e) {
  check('qa', 'run', 'fail', e.stack?.split('\n').slice(0, 3).join(' ') || String(e))
} finally {
  cdp.close()
  await chrome.kill()
  server.close()
}

// ---------- 12. repo hygiene and handoff ----------
// In the branch, not on disk: git leaves an emptied folder behind (backend/ after v1 removed it).
const tracked = (p) => spawnSync('git', ['ls-files', '--', p], { cwd: REPO }).stdout.toString().trim().length > 0
const gone = ['frontend/public/audio', 'frontend/src/assets/pfp.JPG', 'frontend/src/assets/pfp123.jpg', 'backend', 'frontend/src/components/pages/Admin.jsx', 'frontend/src/components/pages/Review.jsx'].filter(tracked)
check('repo', 'removed files', gone.length ? 'fail' : 'pass', gone.join(', ') || 'no audio, EXIF photos, backend, Admin or Review in the branch')
const vercel = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value || ''
check('repo', 'vercel.json', !vercel.rewrites && vercel.headers.some((h) => h.source === '/assets/(.*)' && h.headers.some((x) => /immutable/.test(x.value))) && /sha256-/.test(csp) ? 'pass' : 'fail', `rewrites ${vercel.rewrites ? 'present' : 'none'}, CSP hash ${/sha256-/.test(csp) ? 'set' : 'missing'}`)
const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: REPO }).stdout.toString().trim()
const bodies = spawnSync('git', ['log', 'master..HEAD', '--format=%B'], { cwd: REPO }).stdout.toString()
const nCommits = Number(spawnSync('git', ['rev-list', '--count', 'master..HEAD'], { cwd: REPO }).stdout.toString().trim() || 0)
const attributed = /co-authored-by|generated with|noreply@anthropic|\bclaude code\b/i.test(bodies)
const upstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '@{u}'], { cwd: REPO }).status === 0
check('repo', 'commits', !attributed && !upstream ? 'pass' : 'fail', `branch ${branch}, ${nCommits} commits since master, attribution ${attributed ? 'FOUND' : 'none'}, upstream ${upstream ? 'set (pushed?)' : 'none'}`)
const scratch = scratchDir()
const du = spawnSync('du', ['-sk', scratch]).stdout.toString().split('\t')[0]
const leftovers = existsSync(scratch) ? readdirSync(scratch).filter((d) => /^(qa|og)-\d+-\d+$/.test(d) && statSync(path.join(scratch, d)).isDirectory()) : []
check('repo', 'scratch', Number(du) < 1024 * 1024 && !leftovers.length ? 'pass' : 'fail', `${(Number(du) / 1024).toFixed(0)} MB, leftover profiles ${leftovers.length}`)

if (STRICT) for (const c of R.checks) if (c.status === 'pending') c.status = 'fail'
R.finishedAt = new Date().toISOString()
const { md } = writeReport(R, { REVIEWS, SHOTS, ROOT })
const fails = R.checks.filter((c) => c.status === 'fail')
const pend = R.checks.filter((c) => c.status === 'pending')
log(`${R.checks.length} checks: ${R.checks.filter((c) => c.status === 'pass').length} pass, ${fails.length} fail, ${pend.length} pending, ${R.checks.filter((c) => c.status === 'warn').length} warn`)
log(`report: ${md}`)
exitCode = fails.length ? 1 : 0
process.exit(exitCode)
