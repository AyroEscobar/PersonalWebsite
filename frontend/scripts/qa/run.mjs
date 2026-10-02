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
  Then axe (390 and 1440), reduced motion and quiet mode, the keyboard walk,
  hydration, the 404 status, interaction states, Lighthouse, and the bundle
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
import { r2Checks } from './r2-checks.mjs'

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
  check('prerender', 'h1 and h2s before JS', h1Text === HERO.name.text && !missingH2.length ? 'pass' : 'fail', missingH2.length ? `missing ${missingH2.join(', ')}` : `h1 "${h1Text}" and six h2s in the served HTML`)
  check('prerender', 'hero caption before JS', plain.includes(HERO.lead.text) ? 'pass' : 'fail', 'full hero caption in the served HTML')
  check('prerender', 'proof line before JS', plain.includes(HERO.proof.text) ? 'pass' : 'fail', 'the JPMorgan and RBC line under the deck is in the served HTML (r1 T7)')
  const nf = await fetch(`${url}/nothing-here`)
  const nfHtml = await nf.text()
  check('http', '404 status', nf.status === 404 && nfHtml.includes(NOT_FOUND.heading.text) ? 'pass' : 'fail', `/nothing-here -> ${nf.status}, ${nfHtml.includes(NOT_FOUND.heading.text) ? 'themed' : 'not themed'}`)
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
  check('fonts', 'only overpass', fontFamilies.every((f) => /Overpass/.test(f)) && fontFamilies.length ? 'pass' : 'fail', fontFamilies.join(', '))

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

  // ---------- 8. motion: reduced, quiet, boot, idle ----------
  log('motion')
  const motionProbe = async (label, { reduce = false, query = '', hash = '', presetSession = false, scrollTo = null } = {}) => {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.addInitScript(fn(P.rafCounterInit))
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    if (reduce) await page.media([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    if (presetSession) {
      await page.goto(`${url}/robots.txt`, { settle: 0 })
      await page.eval("sessionStorage.setItem('ae.booted','1')")
    }
    await page.goto(`${url}/${query}${hash}`, { settle: 0 })
    const bootAtLoad = await page.eval('document.documentElement.dataset.boot || null')
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
      boot: document.documentElement.dataset.boot || null,
      mode: document.documentElement.dataset.mode,
      motion: document.documentElement.dataset.motion,
      tier: document.documentElement.dataset.tier,
    })`)
    res.bootAtLoad = bootAtLoad
    res.animations = await page.eval(fn(P.runningAnimations))
    await page.close()
    R.motion[label] = res
    return res
  }
  const rm = await motionProbe('reduced', { reduce: true })
  check('motion', 'reduced motion', rm.raf === 0 && rm.canvas === 0 && !rm.bootAtLoad && !rm.animations.length ? 'pass' : 'fail', `rAF ${rm.raf} in 3 s, canvas ${rm.canvas}, data-boot ${rm.bootAtLoad}, long animations ${rm.animations.length}, tier ${rm.tier}`)
  const qm = await motionProbe('quiet', { query: '?quiet' })
  check('motion', 'quiet mode', qm.raf === 0 && qm.canvas === 0 && !qm.bootAtLoad && qm.mode === 'quiet' && !qm.animations.length ? 'pass' : 'fail', `rAF ${qm.raf}, canvas ${qm.canvas}, data-boot ${qm.bootAtLoad}, mode ${qm.mode}, long animations ${qm.animations.length}`)
  const fresh = await motionProbe('first-visit')
  check('motion', 'first paint runs once', fresh.bootAtLoad === 'run' && !fresh.boot ? 'pass' : 'fail', `data-boot at load ${fresh.bootAtLoad}, after 1.8 s ${fresh.boot}`)
  const again = await motionProbe('repeat-visit', { presetSession: true })
  const deep = await motionProbe('deep-link', { hash: '#work' })
  check('motion', 'no first paint on repeat or deep link', !again.bootAtLoad && !deep.bootAtLoad ? 'pass' : 'fail', `repeat ${again.bootAtLoad}, #work ${deep.bootAtLoad}`)
  const idle = await motionProbe('idle-offscreen', { scrollTo: 'work' })
  check('motion', 'rAF idle with hero offscreen', idle.raf === 0 ? 'pass' : 'fail', `${idle.raf} callbacks in 3 s, canvas ${idle.canvas}`)

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
    const EXPECT = [
      ['skip link', (f) => /skip/i.test(f.name)],
      ['name', (f) => f.name === 'Ayro Escobar'],
      ['clock chip', (f) => /plano/i.test(f.name) && f.tag !== 'a'],
      ['contact', (f) => f.tag === 'a' && f.href === '#signal' && /^contact$/i.test(f.name)],
      ['quiet', (f) => /^quiet/i.test(f.name)],
      ['search', (f) => /^search/i.test(f.name)],
      ...SECTION_IDS.map((id) => [`rail ${id}`, (f) => f.href === `#${id}`]),
      ['hero email', (f) => /^mailto:/.test(f.href || '')],
      ['ping', (f) => /^ping$/i.test(f.name)],
    ]
    let j = 0
    for (const f of seq) if (j < EXPECT.length && EXPECT[j][1](f)) j++
    const missing = EXPECT.filter(([, m]) => !seq.some(m)).map(([n]) => n)
    check('keyboard', 'tab order spec', j === EXPECT.length ? 'pass' : missing.length ? 'pending' : 'fail', j === EXPECT.length ? 'skip, name, clock, contact, quiet, search, six stops, hero email, ping' : missing.length ? `not built yet: ${missing.join(', ')}` : `out of order at "${EXPECT[j][0]}"`)

    // Cmd+K and Esc with focus return.
    const hasSearch = await page.eval(`!![...document.querySelectorAll('header button')].find(b => /^search/i.test(b.innerText.trim()))`)
    if (hasSearch) {
      await page.eval(`[...document.querySelectorAll('header button')].find(b => /^search/i.test(b.innerText.trim())).focus()`)
      await page.key('k', { modifiers: 4, code: 'KeyK' })
      await sleep(400)
      const open = await page.eval(`(() => { const d = document.querySelector('dialog[open]'); return { open: !!d, inInput: !!d && d.contains(document.activeElement) && /input/i.test(document.activeElement.tagName) } })()`)
      if (!NO_SHOTS && open.open) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, 'after-state-1440-jumplist.png'))))
      await page.key('Escape')
      await sleep(300)
      const back = await page.eval(`(() => ({ closed: !document.querySelector('dialog[open]'), onChip: /^search/i.test((document.activeElement.innerText || '').trim()) }))()`)
      check('keyboard', 'cmd+k and esc', open.open && open.inInput && back.closed && back.onChip ? 'pass' : 'fail', `open ${open.open}, focus in input ${open.inInput}, closed ${back.closed}, focus back on chip ${back.onChip}`)
    } else check('keyboard', 'cmd+k and esc', 'pending', 'no search chip yet (B)')

    // Enter on a rail stop lands the heading below the top bar.
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
      const pos = await page.eval(`(() => { const h = document.getElementById('work-h').getBoundingClientRect(); const bar = document.querySelector('header'); const b = bar ? bar.getBoundingClientRect().bottom : 0; const cur = document.querySelector('nav [aria-current]'); return { top: Math.round(h.top), bar: Math.round(b), vh: innerHeight, current: cur ? cur.textContent.trim() : null } })()`)
      check('keyboard', 'rail stop lands below the bar', pos.top >= pos.bar && pos.top < pos.vh ? 'pass' : 'fail', `heading top ${pos.top}, bar bottom ${pos.bar}`)
      check('nav', 'aria-current tracks the section', pos.current === 'work' ? 'pass' : pos.current == null ? 'pending' : 'fail', `aria-current on "${pos.current}" after jumping to work`)
    }
    R.keyboard = { sequence: seq }
    await page.close()
  }

  // ---------- 10. interaction states ----------
  log('interaction states')
  for (const w of [390, 1440]) {
    const mobile = w < 720
    const page = await cdp.newPage({ width: w, height: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile })
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.goto(`${url}/`, { settle: 1800 })
    const hasPing = await page.eval(`!![...document.querySelectorAll('button')].find(b => /^ping$/i.test(b.innerText.trim()))`)
    if (hasPing) {
      await page.eval(`[...document.querySelectorAll('button')].find(b => /^ping$/i.test(b.innerText.trim())).click()`)
      await sleep(800)
      if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, `after-state-${w}-ping-800ms.png`))))
      await sleep(900)
      const said = await page.eval(`[...document.querySelectorAll('[role="status"]')].map(s => s.textContent.trim()).join(' | ')`)
      check('signature', `ping status @${w}`, /pinged from plano/.test(said) ? 'pass' : 'fail', `status regions: "${said}"`)
    } else check('signature', `ping status @${w}`, 'pending', 'no ping button yet (A)')
    const ta = await page.eval(fn(P.domFacts)).then((f) => f.touchAction)
    if (w === 390) check('signature', 'map touch-action pan-y', ta == null ? 'pending' : /pan-y/.test(ta) ? 'pass' : 'fail', ta == null ? 'no map yet (A)' : ta)
    await page.close()
    const q = await cdp.newPage({ width: w, height: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile })
    await q.goto(`${url}/?quiet`, { settle: 800 })
    if (!NO_SHOTS) R.shots.push(path.basename(await q.screenshot(path.join(SHOTS, `after-state-${w}-quiet.png`))))
    await q.close()
  }

  // Print: map, buttons and rail hidden.
  {
    const page = await cdp.newPage({ width: 816, height: 1056 })
    await page.goto(`${url}/`, { settle: 600 })
    await page.media([{ name: 'print', value: '' }])
    await page.send('Emulation.setEmulatedMedia', { media: 'print' })
    const pr = await page.eval(`(() => { const vis = (s) => [...document.querySelectorAll(s)].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).length; return { canvas: vis('canvas'), buttons: vis('button'), nav: vis('nav'), bg: getComputedStyle(document.body).backgroundColor } })()`)
    check('print', 'print hides chrome', !pr.canvas && !pr.buttons && !pr.nav ? 'pass' : 'pending', `visible in print: canvas ${pr.canvas}, buttons ${pr.buttons}, nav ${pr.nav}; body ${pr.bg}`)
    await page.close()
  }

  // ---------- 10b. r1 regressions (triage T2, T5, T6, T8, T9, T11 to T14) ----------
  log('r1 regressions')
  {
    // T2 and T6: a way to write to him on the first screen, the name high on a phone.
    for (const [w, h] of [[390, 844], [360, 780], [1440, 900]]) {
      const mobile = w < 720
      const page = await cdp.newPage({ width: w, height: h, dpr: mobile ? 2 : 1, mobile })
      await page.goto(`${url}/`, { settle: 1200 })
      const c = await page.eval(`(() => {
        const m = document.querySelector('main a[href^="mailto:"]')
        const h1 = document.querySelector('h1')
        const ok = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'
        const all = [...document.querySelectorAll('a[href], button, input, summary, [tabindex]:not([tabindex="-1"])')].filter(ok)
        const after = all.filter((e) => h1.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)
        const first = after.find((e) => !e.closest('.hero-deck'))
        const ping = document.querySelector('.hero-ping')
        const bar = document.querySelector('header').getBoundingClientRect().bottom
        return {
          mail: m ? Math.round(m.getBoundingClientRect().top) : null,
          vh: innerHeight,
          first: first ? first.getAttribute('href') : null,
          deck: after.filter((e) => e.closest('.hero-deck')).length,
          h1: Math.round(h1.getBoundingClientRect().top),
          hintUnderBar: !!ping && ping.getBoundingClientRect().top < bar + 40,
          sw: document.documentElement.scrollWidth,
          iw: innerWidth,
        }
      })()`)
      check('r1', `T2 contact on the first screen @${w}x${h}`, c.mail != null && c.mail < c.vh && /^mailto:/.test(c.first || '') ? 'pass' : 'fail', `mailto top ${c.mail} of ${c.vh}; first stop after the h1${c.deck ? ` (past ${c.deck} inline deck link)` : ''}: ${c.first}`)
      if (mobile) check('r1', `T6 name high on a phone @${w}x${h}`, c.h1 < 300 && !c.hintUnderBar && c.sw <= w && c.iw === w ? 'pass' : 'fail', `h1 top ${c.h1}, hint under the bar ${c.hintUnderBar}, scrollWidth ${c.sw}`)
      await page.close()
    }

    // T15: on a tablet the rail's names never touch the copy, at any stop.
    {
      const page = await cdp.newPage({ width: 768, height: 1024 })
      await page.goto(`${url}/`, { settle: 1000 })
      const hits = []
      for (const id of SECTION_IDS) {
        await page.eval(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({ behavior: 'instant' })`)
        await sleep(350)
        const h = await page.eval(`(() => {
          const labels = [...document.querySelectorAll('.rail-label')].filter((l) => Number(getComputedStyle(l).opacity) > 0.05).map((l) => l.getBoundingClientRect())
          const out = []
          const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT)
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent.trim() || n.parentElement.closest('svg, .sr-only, .ng')) continue
            const range = document.createRange()
            range.selectNodeContents(n)
            for (const r of range.getClientRects()) for (const l of labels) if (r.left < l.right && l.left < r.right && r.top < l.bottom && l.top < r.bottom) out.push(n.textContent.trim().slice(0, 24))
          }
          return out
        })()`)
        if (h.length) hits.push(`${id}: ${h.slice(0, 3).join(', ')}`)
      }
      check('r1', 'T15 rail names clear of the copy @768', hits.length ? 'fail' : 'pass', hits.join(' | ') || 'checked at all six stops')
      await page.close()
    }

    // T13: the map scrolls and pinch-zooms; neither pings.
    {
      const page = await cdp.newPage({ width: 390, height: 844, dpr: 2, mobile: true })
      await page.goto(`${url}/`, { settle: 600 })
      const ta = await page.eval(`[...document.querySelectorAll('.hero-stage, .ng, svg.ng-svg')].map((e) => getComputedStyle(e).touchAction)`)
      check('r1', 'T13 pinch zoom on the map', ta.length >= 2 && ta.every((t) => /pan-y/.test(t) && /pinch-zoom/.test(t)) ? 'pass' : 'fail', ta.join(' | '))
      await page.close()
    }

    // T14: WCAG 1.4.12 text spacing at 320 and 390: no sideways scroll, the name never clips.
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
          const clock = document.querySelector('.clock-btn').getBoundingClientRect()
          done({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: innerWidth, h1Clip: h1.scrollWidth > h1.clientWidth + 1 || b.right > innerWidth + 1, clockRight: Math.round(clock.right) })
        }, 400)
      })`)
      check('r1', `T14 text spacing @${w}`, r.sw === r.cw && r.iw === w && !r.h1Clip && r.clockRight <= w ? 'pass' : 'fail', `scrollWidth ${r.sw}, clientWidth ${r.cw}, layout ${r.iw}, h1 clipped ${r.h1Clip}, clock right edge ${r.clockRight}`)
      await page.close()
    }

    // T8 and T9 at 1440, everything mounted: mono only for data, boxes only for plates.
    {
      const page = await cdp.newPage({ width: 1440, height: 900 })
      await page.goto(`${url}/`, { settle: 1200 })
      await page.eval(fn(P.scrollThrough))
      const m = await page.eval(fn(P.monoShare))
      const b = await page.eval(fn(P.borderedBoxes))
      check('r1', 'T8 mono share at 1440', m.share <= 35 ? 'pass' : 'fail', `${m.mono} of ${m.total} visible text nodes (${m.share}%) are mono, limit 35%`)
      check('r1', 'T9 bordered boxes at 1440', b.count < 40 ? 'pass' : 'fail', `${b.count} fully bordered elements in main (under 40): ${b.sample.join(', ')}`)
      await page.close()
    }

    // T11: the phone stops sheet hands focus back, and closes when the screen turns wide.
    {
      const page = await cdp.newPage({ width: 390, height: 844, dpr: 2, mobile: true })
      await page.goto(`${url}/`, { settle: 1000 })
      await page.eval(`document.querySelector('.bb-stop').focus()`)
      await page.key('Enter')
      await sleep(350)
      const opened = await page.eval(`!!document.querySelector('dialog.stops-sheet[open]')`)
      await page.key('Escape')
      await sleep(350)
      const back = await page.eval(`document.activeElement === document.querySelector('.bb-stop')`)
      await page.eval(`document.querySelector('.bb-stop').focus()`)
      await page.key('Enter')
      await sleep(350)
      await page.setViewport({ width: 844, height: 390, dpr: 2, mobile: true })
      await sleep(500)
      const turned = await page.eval(`(() => { const d = document.querySelector('dialog.stops-sheet'); if (!d.open) return 'closed'; const r = d.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? 'visible' : 'invisible' })()`)
      check('r1', 'T11 stops sheet focus and rotation', opened && back && turned !== 'invisible' ? 'pass' : 'fail', `opened ${opened}, focus back on the stop button ${back}, after turning to 844x390 the sheet is ${turned}`)
      await page.close()
    }

    // T12: fonts held back 500 ms on desktop must not move the page.
    {
      const slow = await serveDist({ port: 0, delay: (p) => (/\.woff2$/.test(p) ? 500 : 0) })
      const shifts = []
      for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
        const page = await cdp.newPage({ width: w, height: h })
        await page.addInitScript(fn(P.clsInit))
        await page.send('Storage.clearDataForOrigin', { origin: new URL(slow.url).origin, storageTypes: 'local_storage,session_storage' })
        await page.goto(`${slow.url}/`, { settle: 2000 })
        shifts.push([w, await page.eval('Math.round(window.__cls * 10000) / 10000')])
        await page.close()
      }
      slow.server.close()
      check('r1', 'T12 no shift when the fonts arrive late', shifts.every(([, v]) => v <= 0.02) ? 'pass' : 'fail', shifts.map(([w, v]) => `${w}: CLS ${v}`).join(', '))
    }

    // T5: the ping's frames, and the loop idle once the afterglow has cooled (4 s).
    for (const w of [390, 1440]) {
      const mobile = w < 720
      const page = await cdp.newPage({ width: w, height: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile })
      await page.addInitScript(fn(P.rafCounterInit))
      await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
      await page.goto(`${url}/`, { settle: 2500 })
      const tier = await page.eval('document.documentElement.dataset.tier || null')
      await page.eval(`[...document.querySelectorAll('button')].find((b) => /^ping$/i.test(b.innerText.trim())).click()`)
      const t0 = Date.now()
      for (const t of [200, 600, 1000, 1600, 3000, 4000]) {
        await sleep(Math.max(0, t - (Date.now() - t0)))
        if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, `after-state-${w}-ping-${t}ms.png`))))
      }
      await sleep(Math.max(0, 4100 - (Date.now() - t0)))
      await page.eval('window.__qa.raf = 0')
      await sleep(1000)
      const raf = await page.eval('window.__qa.raf')
      const said = await page.eval(`[...document.querySelectorAll('[role="status"]')].map((s) => s.textContent.trim()).join(' | ')`)
      // Tier full keeps its ambient trails running until 20 s without input (by design); lite and static have none.
      check('r1', `T5 ping settles by 4 s @${w}`, (tier === 'full' || raf === 0) && /pinged from plano/.test(said) ? 'pass' : 'fail', `tier ${tier}, rAF callbacks in the second after 4.1 s: ${raf}${tier === 'full' ? ' (ambient trails)' : ''}; status "${said}"`)
      await page.close()
    }
  }

  // ---------- 10c. r2 regressions (triage U1 to U8, N15, N17) ----------
  log('r2 checks')
  await r2Checks({
    cdp,
    url,
    check,
    sleep,
    SECTION_IDS,
    shot: async (page, name) => {
      if (!NO_SHOTS) R.shots.push(path.basename(await page.screenshot(path.join(SHOTS, name))))
    },
  })

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
const gone = ['frontend/public/audio', 'frontend/src/assets/pfp.JPG', 'frontend/src/assets/pfp123.jpg', 'backend', 'frontend/src/components/pages/Admin.jsx', 'frontend/src/components/pages/Review.jsx'].filter((p) => existsSync(path.join(REPO, p)))
check('repo', 'removed files', gone.length ? 'fail' : 'pass', gone.join(', ') || 'no audio, EXIF photos, backend, Admin or Review')
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
