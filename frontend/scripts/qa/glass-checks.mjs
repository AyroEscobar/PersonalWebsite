/*
  Glass and scene checks (DESIGN.md 7 "scripts/qa/glass-checks.mjs", 9, 10; REFINE.md build items).
  Run by run.mjs; each reports through check('glass' | 'scene', ...).

  glass
    contrast    every visible text line measured on the real composite (scripts/lib/composite.mjs):
                the page with its text made transparent over the frozen scene (?t=2.3) at p 0, 0.3,
                0.56, 0.8 and 1, at 1440, 390, 768 and 1920; 4.5:1, 3:1 for large text
    surfaces    1 to 3 glass surfaces with a live backdrop-filter on the first screen (v4: the hero
                plate and the glass email button; the nav is plain words)
    deep link   /#experience lands with the experience section current in the nav
    keyboard    a Tab walk reaches every link, button and summary
    overflow    nothing scrolls sideways at 320, 390, 768, 1024, 1440, 1920
    forced      forced colours: every glass surface has a 2px border, the stage is gone
    quiet       ?quiet=1: every glass surface is a solid plate, the switch is checked
    no blur     a browser without backdrop-filter, simulated for real (the CSS patched in flight,
                CSS.supports says no): every panel and card is a solid plate, the text is all there
    scroll CLS  scrolling down the page and back: session-window layout shift 0.02 or less

  scene
    poster      the poster <picture> is in the served HTML with width, height, alt and fetchpriority
    canvas on   the canvas gets .on within 3 s after load on full and on lite
    still       under reduced motion the scene chunk is never requested and no canvas draws
    hidden      a hidden document pauses the loop (__stats.paused)
    framing     __bounds at t 2.3: the figure's mesh box 300 px or more at 1440x900 and 130 or more
                at 390x844 at p 0, whole, no panel over it; the joints box recorded; the rock never
                cut by the top edge on landscape. v4: at p 0 no .nav or .panel box touches the
                figure's box or the rock's box, at both sizes (the nav never covers them, and on a
                phone the whole rock and the man stand above the hero plate; with the plate that
                says who he is, 390x844 leaves 377 px for the composite, so the man is 130 to 140
                px there, not v3's 170)
    city        wherever a city light is visible (through the haze, past the mountain), the carpet's
                top edge is below his feet, at p 0, 0.3, 0.56, 0.8 and 1, at 1440 and 390
    mapping     the rock's top moves at most 2.0 px per 20 px of scroll as a phase mean and 4 px as a
                single step (REFINE.md build item 4), at 1440
    luminance   the poster's mean luminance (public/poster/meta.json) is 0.25 or more
    frame cost  __bench(60): full at 1440x900 DPR 1 under 6 ms, DPR 2 under 12 ms; lite at
                390x844 DPR 1.5 under 3 ms (this Mac; DESIGN.md 3.9a)
*/
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { measureComposite } from '../lib/composite.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const fn = (f, ...args) => `(${f.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`

/** In the page: visible glass surfaces with a live backdrop-filter on screen. */
function liveGlass() {
  return [...document.querySelectorAll('.glass')].filter((g) => {
    const cs = getComputedStyle(g)
    const r = g.getBoundingClientRect()
    if (cs.visibility === 'hidden' || cs.display === 'none' || !r.width || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false
    const bf = cs.backdropFilter || cs.webkitBackdropFilter || 'none'
    return bf !== 'none'
  }).map((g) => g.className.split(' ').filter((c) => /^(glass--|panel|card|btn|nav)/.test(c)).join('.'))
}

/** The page's CSS as a browser without backdrop-filter would apply it. */
function noBlurCss(text) {
  return text
    .replace(/@supports not \(\(backdrop-filter:\s*blur\(1px\)\)\s*or\s*\(-webkit-backdrop-filter:\s*blur\(1px\)\)\)/g, '@supports (display: block)')
    .replace(/@supports not \(backdrop-filter:\s*url\(#x\)\)/g, '@supports (display: block)')
    .replace(/-webkit-backdrop-filter\s*:/g, '--x-wbf:')
    .replace(/backdrop-filter\s*:/g, '--x-bf:')
}
const NO_BF_SUPPORTS = `(() => { const o = CSS.supports.bind(CSS); CSS.supports = (...a) => (a.some((x) => /backdrop-filter/.test(String(x))) ? false : o(...a)) })()`

/** In the page: scroll down the page and back, and the worst session window of layout shifts. */
async function scrollShift() {
  const entries = []
  const po = new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) entries.push(e)
  })
  po.observe({ type: 'layout-shift', buffered: false })
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const end = document.documentElement.scrollHeight - innerHeight
  for (let y = 0; y <= end; y += 60) {
    scrollTo(0, y)
    await sleep(30)
  }
  await sleep(700)
  for (let y = end; y >= 0; y -= 90) {
    scrollTo(0, y)
    await sleep(30)
  }
  await sleep(700)
  po.disconnect()
  let max = 0
  let cur = 0
  let start = 0
  let last = -Infinity
  for (const e of entries) {
    if (e.startTime - last > 1000 || e.startTime - start > 5000) {
      cur = 0
      start = e.startTime
    }
    cur += e.value
    last = e.startTime
    max = Math.max(max, cur)
  }
  const top = entries.sort((a, b) => b.value - a.value)[0]
  const who = top?.sources?.[0]?.node
  return { cls: Math.round(max * 1000) / 1000, worst: top ? `${top.value.toFixed(3)} on ${who?.id || who?.className || who?.nodeName || '?'}` : 'none' }
}

// In the page: the scroll position of progress p with the scene's own anchors (src/scene/scroll.js)
const SCROLL_FOR_P = `window.__yForP = (p) => {
  const d = document.documentElement
  const A = [['top', 0], ['check-out', 0.2], ['experience', 0.45], ['stack', 0.7], ['contact', 0.85]]
  const max = Math.max(1, d.scrollHeight - innerHeight)
  const an = A.filter(([id]) => document.getElementById(id)).map(([id, q]) => [Math.min(max, document.getElementById(id).offsetTop), q])
  an[0][0] = 0; an.push([max, 1])
  for (let i = 1; i < an.length; i++) { const [y0, p0] = an[i - 1], [y1, p1] = an[i]; if (p <= p1) return y0 + (y1 - y0) * (p1 > p0 ? (p - p0) / (p1 - p0) : 0) }
  return max
}; true`

const waitReady = (page) => page.eval('new Promise((r, j) => { let n = 0; const f = () => window.__ready ? setTimeout(r, 250) : (++n > 300 ? j(new Error("scene never became ready")) : setTimeout(f, 50)); f() })')

export async function glassChecks({ cdp, url, check, sleep, scratch }) {
  const origin = new URL(url).origin
  const fresh = async (opts, p = '/', settle = 1800) => {
    const page = await cdp.newPage(opts)
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.goto(url + p, { settle })
    return page
  }
  const SIZES = [
    ['1440', { width: 1440, height: 900, dpr: 1 }],
    ['390', { width: 390, height: 844, dpr: 2, mobile: true }],
  ]

  // ---------- composite contrast at five scroll positions and four widths ----------
  {
    let sharp = null
    try {
      sharp = (await import('../../tools/sharp.mjs')).default
    } catch {
      sharp = null
    }
    if (!sharp) check('glass', 'measured contrast', 'fail', 'sharp is missing (npm run tools)')
    else {
      const tmpDir = path.join(scratch || path.join(ROOT, '.build/qa'), 'composite')
      mkdirSync(tmpDir, { recursive: true })
      const comp = await measureComposite({ cdp, url, sharp, tmpDir, log: () => {} })
      for (const [view, ps] of Object.entries(comp.views)) {
        const fails = comp.failures.filter((f) => f.view === view)
        const low = Object.values(ps).reduce((a, m) => (m.worst && (!a || m.worst.ratio / m.worst.min < a.ratio / a.min) ? m.worst : a), null)
        const lines = Object.values(ps).reduce((n, m) => n + m.lines, 0)
        check('glass', `measured contrast @${view}`, fails.length ? 'fail' : 'pass', fails.length ? fails.slice(0, 5).map((f) => `p ${f.p} "${f.text}" ${f.ratio} (needs ${f.min})`).join(' | ') : `${lines} text lines at p 0, 0.3, 0.56, 0.8, 1; lowest "${low?.text}" ${low?.ratio} (needs ${low?.min})`)
      }
    }
  }

  // ---------- glass surfaces on the first screen ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts)
    const live = await page.eval(fn(liveGlass))
    check('glass', `first-screen surfaces @${label}`, live.length >= 1 && live.length <= 3 ? 'pass' : 'fail', `${live.length} live backdrop-filters (1 to 3): ${live.join(', ')}`)
    await page.close()
  }

  // ---------- a deep link lands on its section ----------
  {
    const page = await fresh({ width: 1440, height: 900 }, '/#experience', 2200)
    const d = await page.eval(`(() => { const h = document.getElementById('experience-h').getBoundingClientRect(); const nav = document.querySelector('.nav').getBoundingClientRect(); const cur = document.querySelector('.nav [aria-current="true"]'); return { top: Math.round(h.top), bar: Math.round(nav.bottom), vh: innerHeight, cur: cur ? cur.getAttribute('href') : null } })()`)
    check('glass', 'deep link lands on its section', d.cur === '#experience' && d.top >= 0 && d.top < d.vh ? 'pass' : 'fail', `heading top ${d.top} of ${d.vh}, current "${d.cur}"`)
    await page.close()
  }

  // ---------- keyboard reaches everything ----------
  {
    const page = await fresh({ width: 1440, height: 900 })
    await page.eval('window.__seen = new Set(); document.addEventListener("focusin", (e) => window.__seen.add(e.target), true); true')
    for (let i = 0; i < 160; i++) {
      await page.key('Tab')
      await sleep(25)
      const done = await page.eval('document.activeElement === document.body')
      if (done && i > 5) break
    }
    await sleep(300)
    const r = await page.eval(`(() => {
      const ok = (e) => {
        if (e.closest('[inert], .sr-only') || e.getAttribute('tabindex') === '-1') return false
        if (e.closest('details:not([open])') && !e.matches('summary')) return false
        for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden') return false }
        return true
      }
      const all = [...document.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(ok)
      const missed = all.filter((e) => !window.__seen.has(e))
      return { total: all.length, seen: window.__seen.size, missed: missed.slice(0, 6).map((e) => e.tagName.toLowerCase() + ' "' + (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30) + '"') }
    })()`)
    check('glass', 'keyboard reaches every control', r.missed.length ? 'fail' : 'pass', r.missed.length ? `missed ${r.missed.join(', ')}` : `${r.total} links and buttons, all reached`)
    await page.close()
  }

  // ---------- no sideways scroll ----------
  {
    const bad = []
    for (const w of [320, 390, 768, 1024, 1440, 1920]) {
      const mobile = w < 720
      const page = await fresh({ width: w, height: mobile ? 800 : 900, dpr: mobile ? 2 : 1, mobile }, '/', 1200)
      const r = await page.eval(`(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((d) => setTimeout(d, 40)) }
        window.scrollTo({ top: 0, behavior: 'instant' })
        await new Promise((d) => setTimeout(d, 300))
        const d = document.documentElement
        return { sw: d.scrollWidth, cw: d.clientWidth, iw: innerWidth }
      })()`)
      if (r.sw > r.cw + 1 || r.iw > w + 1) bad.push(`${w}: scrollWidth ${r.sw}, clientWidth ${r.cw}, layout ${r.iw}`)
      await page.close()
    }
    check('glass', 'no sideways scroll at 320 to 1920', bad.length ? 'fail' : 'pass', bad.join(' | ') || '320, 390, 768, 1024, 1440, 1920')
  }

  // ---------- forced colours ----------
  for (const [label, opts] of SIZES) {
    const page = await cdp.newPage(opts)
    await page.media([{ name: 'forced-colors', value: 'active' }])
    await page.goto(url + '/', { settle: 1500 })
    const r = await page.eval(`(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }
      const glass = [...document.querySelectorAll('.glass')].filter(shown)
      const thin = glass.filter((g) => { const cs = getComputedStyle(g); return cs.borderTopStyle !== 'solid' || parseFloat(cs.borderTopWidth) < 2 })
      const stage = [...document.querySelectorAll('.stage')].filter(shown).length
      return { glass: glass.length, thin: thin.slice(0, 5).map((g) => g.className.slice(0, 50)), stage }
    })()`)
    check('glass', `forced colours @${label}`, !r.thin.length && !r.stage ? 'pass' : 'fail', `${r.glass} glass surfaces, ${r.thin.length} without a 2px border${r.thin.length ? ': ' + r.thin.join(' | ') : ''}; stage shown ${r.stage}`)
    await page.close()
  }

  // ---------- quiet: solid plates ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts, '/?quiet=1')
    const r = await page.eval(`(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }
      const glass = [...document.querySelectorAll('.glass')].filter(shown)
      const blurred = glass.filter((g) => { const cs = getComputedStyle(g); return (cs.backdropFilter || 'none') !== 'none' })
      return { attr: document.documentElement.dataset.transparency, glass: glass.length, blurred: blurred.length, checked: document.querySelector('.quiet[role="switch"]')?.getAttribute('aria-checked') }
    })()`)
    check('glass', `quiet mode @${label}`, r.attr === 'reduced' && r.glass > 0 && !r.blurred && r.checked === 'true' ? 'pass' : 'fail', `data-transparency ${r.attr}, ${r.glass} glass surfaces, ${r.blurred} still blurred, switch checked ${r.checked}`)
    await page.close()
  }

  // ---------- no backdrop-filter at all: every panel a plate ----------
  for (const [label, opts] of SIZES) {
    const page = await cdp.newPage(opts)
    await page.addInitScript(NO_BF_SUPPORTS)
    await page.send('Fetch.enable', { patterns: [{ resourceType: 'Document', requestStage: 'Response' }, { resourceType: 'Stylesheet', requestStage: 'Response' }] })
    const off = page.on('Fetch.requestPaused', async (p) => {
      try {
        const { body, base64Encoded } = await page.send('Fetch.getResponseBody', { requestId: p.requestId })
        const text = noBlurCss(base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body)
        const headers = (p.responseHeaders || []).filter((h) => !/^(content-encoding|content-length)$/i.test(h.name))
        await page.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: headers, body: Buffer.from(text).toString('base64') })
      } catch {
        await page.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {})
      }
    })
    await page.goto(url + '/', { settle: 2200 })
    const r = await page.eval(`(() => {
      const surfaces = [...document.querySelectorAll('.panel, .card')]
      const notPlate = surfaces.filter((s) => { const cs = getComputedStyle(s); return !/gradient/.test(cs.backgroundImage) || (cs.backdropFilter || 'none') !== 'none' })
      const words = document.querySelector('main').innerText.length
      return { surfaces: surfaces.length, notPlate: notPlate.length, words }
    })()`)
    off()
    check('glass', `no backdrop-filter: every panel a plate @${label}`, r.surfaces > 0 && !r.notPlate && r.words > 600 ? 'pass' : 'fail', `${r.surfaces} panels and cards, ${r.notPlate} not on the plate, ${r.words} characters of text in main`)
    await page.close()
  }

  // ---------- scrolling the page shifts no layout ----------
  for (const [label, opts] of [['320', { width: 320, height: 700, dpr: 2, mobile: true }], ...SIZES]) {
    const page = await fresh(opts)
    const r = await page.eval(`(${scrollShift.toString()})()`)
    check('glass', `scroll layout shift @${label}`, r.cls <= 0.02 ? 'pass' : 'fail', `session-window CLS ${r.cls} (at most 0.02) scrolling down the page and back; largest ${r.worst}`)
    await page.close()
  }

  // ======================= the scene =======================

  // the poster is the first paint
  {
    const html = await (await fetch(url + '/')).text()
    const img = html.match(/<picture class="poster">[\s\S]*?<\/picture>/)?.[0] || ''
    const ok = /hero-1440\.avif/.test(img) && /hero-780\.avif/.test(img) && /<img[^>]*width="1440"[^>]*height="900"/.test(img) && /<img[^>]*alt="[^"]+"/.test(img) && /fetchpriority="high"/i.test(img)
    check('scene', 'poster in the served HTML', ok ? 'pass' : 'fail', 'both AVIF sources, width, height, alt, fetchpriority high')
  }

  // the canvas fades in on full and lite
  for (const [label, q, opts] of [['full', '?tier=full', { width: 1440, height: 900 }], ['lite', '?tier=lite', { width: 390, height: 844, dpr: 2, mobile: true }]]) {
    const page = await cdp.newPage(opts)
    await page.goto(url + '/' + q, { settle: 0 })
    const t = await page.eval(`new Promise((r) => { const t0 = performance.now(); const f = () => { const c = document.querySelector('.stage canvas'); if (c && c.classList.contains('on')) r(Math.round(performance.now() - t0)); else if (performance.now() - t0 > 8000) r(-1); else setTimeout(f, 50) }; f() })`)
    const load = await page.eval('Math.round(performance.getEntriesByType("navigation")[0].loadEventEnd)')
    check('scene', `canvas on @${label}`, t >= 0 && t - Math.max(0, load) <= 3000 ? 'pass' : 'fail', t < 0 ? 'the canvas never turned on' : `on ${t} ms after the page opened, load at ${load} ms`)
    await page.close()
  }

  // the still tier never asks for the scene
  {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.media([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(url + '/', { settle: 3000 })
    const scene = page.requests.filter((r) => /\/assets\/scene-[\w-]+\.js/.test(r.url) || /\.glb(\?|$)/.test(r.url))
    const r = await page.eval(`({ tier: document.documentElement.dataset.tier, on: !!document.querySelector('.stage canvas.on'), ctl: document.querySelector('.ctl[aria-pressed]')?.disabled ?? null })`)
    check('scene', 'still tier: no scene request', r.tier === 'still' && !scene.length && !r.on ? 'pass' : 'fail', `tier ${r.tier}, ${scene.length} scene request(s), canvas on ${r.on}`)
    await page.close()
  }

  // a hidden tab stops the loop
  {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.goto(url + '/?tier=full', { settle: 1500 })
    await waitReady(page).catch(() => {})
    const r = await page.eval(`new Promise((done) => {
      const before = window.__stats ? window.__stats.paused : null
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
      setTimeout(() => { const f0 = window.__stats.frames; setTimeout(() => done({ before, paused: window.__stats.paused, frames: window.__stats.frames - f0 }), 600) }, 100)
    })`)
    check('scene', 'hidden tab pauses the loop', r.before === false && r.paused === true && r.frames === 0 ? 'pass' : 'fail', `running before ${r.before === false}, paused after ${r.paused}, ${r.frames} frames in 600 ms while hidden`)
    await page.close()
  }

  // framing and the city, with __bounds at a fixed clock
  for (const [label, opts, minH] of [['1440', { width: 1440, height: 900, dpr: 1 }, 300], ['390', { width: 390, height: 844, dpr: 2, mobile: true }, 130]]) {
    const page = await cdp.newPage(opts)
    await page.goto(url + '/?tier=full&t=2.3', { settle: 1200 })
    await waitReady(page)
    await page.eval(SCROLL_FOR_P)
    const rows = []
    for (const p of [0, 0.3, 0.56, 0.8, 1]) {
      await page.eval(`window.scrollTo({ top: Math.round(window.__yForP(${p})), behavior: 'instant' })`)
      await sleep(250)
      rows.push(await page.eval(`(() => { __frameAt(2.3, ${p}); const b = __bounds(); return { p: ${p}, fig: b.figure, joints: b.joints, feet: b.feet, rock: b.boulder, city: b.city, n: b.cityVisible, panels: b.panels, view: b.view } })()`))
    }
    const p0 = rows[0]
    const H = p0.fig.y1 - p0.fig.y0, J = p0.joints.y1 - p0.joints.y0
    const whole = p0.fig.x0 >= -40 && p0.fig.y0 >= 0 && p0.fig.y1 <= p0.view[1] && p0.joints.x0 >= 0
    const over = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
    const covered = p0.panels.filter((b) => over(b, p0.joints)).length
    check('scene', `figure at p 0 @${label}`, H >= minH && whole && !covered ? 'pass' : 'fail', `mesh box ${H} px tall (at least ${minH}), joints box ${J} px, whole ${whole}, panels over his joints ${covered}`)
    // the nav and the plates never touch the man or the rock on the first screen
    const touching = p0.panels.filter((b) => over(b, p0.fig) || over(b, p0.rock))
    const rockIn = p0.rock.x0 >= 0 && p0.rock.x1 <= p0.view[0] && p0.rock.y0 >= 0
    check('scene', `nav and plates clear of the man and the rock at p 0 @${label}`, !touching.length && rockIn ? 'pass' : 'fail', `figure ${JSON.stringify(p0.fig)}, rock ${JSON.stringify(p0.rock)}, ${touching.length} nav or plate box(es) touching${touching.length ? ': ' + touching.map((b) => JSON.stringify(b)).join(' ') : ''}, whole rock in frame ${rockIn}`)
    if (label === '1440') {
      const cut = rows.filter((r) => r.rock.y0 < 0).map((r) => `p ${r.p} rock top ${r.rock.y0}`)
      check('scene', 'rock never cut by the top edge @1440', cut.length ? 'fail' : 'pass', cut.join(', ') || rows.map((r) => `p ${r.p} ${r.rock.y0}`).join(', '))
    }
    const beside = rows.filter((r) => r.city && r.city.y0 <= r.feet.y1)
    check('scene', `city below his feet @${label}`, beside.length ? 'fail' : 'pass', beside.length ? beside.map((r) => `p ${r.p}: city top ${r.city.y0}, feet ${r.feet.y1}`).join(' | ') : rows.map((r) => (r.city ? `p ${r.p}: ${r.n} lights, top ${r.city.y0} > feet ${r.feet.y1}` : `p ${r.p}: under the cloud`)).join(' | '))
    await page.close()
  }

  // the scroll mapping (REFINE.md build item 4)
  {
    const page = await cdp.newPage({ width: 1440, height: 900, dpr: 1 })
    await page.goto(url + '/?tier=full&t=2.3', { settle: 1200 })
    await waitReady(page)
    await page.eval(SCROLL_FOR_P)
    const r = await page.eval(`(() => {
      const d = document.documentElement, max = d.scrollHeight - innerHeight
      const A = [['top', 0], ['check-out', 0.2], ['experience', 0.45], ['stack', 0.7], ['contact', 0.85]]
      const an = A.map(([id, q]) => [id, Math.min(max, document.getElementById(id).offsetTop), q]); an.push(['end', max, 1])
      const pAt = (y) => { for (let i = 1; i < an.length; i++) { const [, y0, p0] = an[i - 1], [, y1, p1] = an[i]; if (y <= y1) return y1 > y0 ? p0 + (p1 - p0) * (y - y0) / (y1 - y0) : p1 } return 1 }
      const rows = []
      for (let y = 0; y <= max; y += 20) { const p = pAt(y); __frameAt(2.3, p); rows.push([y, __bounds().boulder.y0]) }
      let worst = { d: 0 }
      for (let i = 1; i < rows.length; i++) { const dd = Math.abs(rows[i][1] - rows[i - 1][1]); if (dd > worst.d) worst = { d: dd, y: rows[i][0] } }
      const phases = []
      for (let i = 1; i < an.length; i++) { const seg = rows.filter((x) => x[0] >= an[i - 1][1] && x[0] <= an[i][1]); if (seg.length > 1) phases.push([an[i - 1][0] + ' to ' + an[i][0], Math.abs(seg[seg.length - 1][1] - seg[0][1]) / (seg.length - 1)]) }
      return { worst, phases: phases.map(([n, v]) => [n, Math.round(v * 100) / 100]) }
    })()`)
    const badPhase = r.phases.filter(([, v]) => v > 2.0)
    check('scene', 'scroll mapping @1440', !badPhase.length && r.worst.d <= 4 ? 'pass' : 'fail', `${r.phases.map(([n, v]) => `${n} ${v}`).join(', ')} px of rock travel per 20 px (at most 2.0); worst step ${r.worst.d} px at ${r.worst.y} (at most 4)`)
    await page.close()
  }

  // the poster's luminance
  {
    const metaPath = path.join(ROOT, 'public/poster/meta.json')
    const lum = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')).luminance : null
    check('scene', 'poster luminance', lum >= 0.25 ? 'pass' : 'fail', `mean luminance ${lum} (at least 0.25)`)
  }

  // frame cost on this machine
  {
    const rows = []
    for (const [label, q, opts, budget] of [
      ['full 1440x900 DPR 1', '?tier=full', { width: 1440, height: 900, dpr: 1 }, 6],
      ['full 1440x900 DPR 2', '?tier=full', { width: 1440, height: 900, dpr: 2 }, 12],
      ['lite 390x844 DPR 1.5', '?tier=lite', { width: 390, height: 844, dpr: 1.5, mobile: true }, 3],
    ]) {
      const page = await cdp.newPage(opts)
      await page.goto(url + '/' + q, { settle: 1500 })
      await waitReady(page)
      await page.eval('__bench(20)')
      const b = await page.eval('__bench(60)')
      rows.push({ label, ms: Math.round(b.avgMs * 100) / 100, budget })
      await page.close()
    }
    const over = rows.filter((r) => r.ms > r.budget)
    check('scene', 'frame cost', over.length ? 'fail' : 'pass', rows.map((r) => `${r.label} ${r.ms} ms (under ${r.budget})`).join(', '))
  }
}
