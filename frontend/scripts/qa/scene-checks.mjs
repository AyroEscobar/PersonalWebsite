/*
  The page and scene checks for v5, the amphora (they replaced v4's glass checks). Run by run.mjs; each
  reports through check('page' | 'scene' | 'theme', ...).

  page
    contrast     every visible text line measured on the real composite (scripts/lib/composite.mjs):
                 the page with its text made transparent over the frozen frieze (?t=T_POSTER) at p 0,
                 0.3, 0.56, 0.8 and 1, at 1440, 390, 768 and 1920, in both themes; 4.5:1, 3:1 large
    deep link    /#experience lands with the experience section current in the nav, below the neck
    keyboard     a Tab walk reaches every link, button and summary
    overflow     nothing scrolls sideways at 320, 390, 768, 1024, 1440, 1920
    forced       forced colours: the stage and the clay art are hidden, every plate has a 2 px border
    quiet        ?quiet=1: the switch is checked, the poster is shown, no canvas, no scene request
    scroll CLS   scrolling down the page and back: session-window layout shift 0.02 or less

  theme
    served       ?theme=light and ?theme=dark render, the boot script sets data-theme before the first
                 stylesheet, the theme-color meta matches; the served HTML holds one theme-color, the clay
    default      no stored choice serves the light vase (the black-figure picture), whatever the system's
                 scheme: prefers-color-scheme dark and light both serve light
    toggle       the switch flips the theme without a reload, the scene's program count does not
                 change (a uniform write, no recompile), the posters and the meta follow, it is announced
    reload       a stored theme survives a reload with no flash (data-theme is there before CSS)

  scene
    poster       both poster pictures in the served HTML with width, height, alt and fetchpriority; the
                 boot script preloads exactly one, and only one poster file is fetched
    canvas on    the canvas fades in within 3 s after load on full and on lite
    still        under reduced motion the scene chunk is never requested and no canvas exists
    hidden       a hidden document pauses the loop (__stats.paused)
    ground       the ground line's box relative to its band is identical at p 0, 0.5 and 1
    framing      __bounds at T_POSTER: his mesh box 300 px or more at 1440x900, 130 or more at 390x844
                 and 120 or more at 393x659 and 375x667 (Safari's first screen on an iPhone 15 Pro, an
                 SE); no header, plate or button box touches him or the disk; the disk is never cut by
                 the room's top or by the plate (on a phone it may run off the right edge)
    catch        ?slip=1 (the catch period and its first): the catch shows within 2 s and repeats; at the
                 deepest give he stays 8 px or more right of the hero plate at 1440x900; by default the first
                 is at 6.5 s and then every 18 s (the source)
    gait         __gait(): the swing knee 0.30 m or more over the slope, the flattest rear shin 21 degrees or
                 more, the feet 0.28 m or more apart at landing (no frame of the cycle reads as a kneel)
    contact      __contact(): a planted ball never slides during its stance; the palms are never more than
                 2 mm off the rock's real surface
    acts         ?t= with ?act=: the catch, the painting and every phase of the loop as a still; his box never
                 meets a plate, a button or the neck in any of them
    painting     the programs are the same before and after the painting at Contact
    pot          the canvas lands on the pot's turned-away still (mean difference under 2 levels); the pot pass
                 (both of its passes, forced) costs 2.0 ms or less on lite at 390x844 DPR 2
    one canvas   exactly one <canvas>: in the hero band at the top, in the contact band when it is on
                 screen, where he stands near the right edge and never crests; on a phone he stands
                 further right in the contact band than in the hero (not the hero picture again)
    luminance    the light composite's mean luminance (public/poster/meta.json) is 0.25 or more
    frame cost   __bench(60): full at 1440x900 DPR 1 2.5 ms or less with 10 draws or fewer; lite at
                 390x844 DPR 1.5 2.0 ms or less (this Mac)
*/
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { measureComposite } from '../lib/composite.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

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

const waitReady = (page) => page.eval('new Promise((r, j) => { let n = 0; const f = () => window.__ready ? setTimeout(r, 250) : (++n > 300 ? j(new Error("scene never became ready")) : setTimeout(f, 50)); f() })')
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
const isScene = (u) => /\/assets\/scene-[\w-]+\.js/.test(u) || /\.glb(\?|$)/.test(u)
const isPoster = (u) => /\/poster\/frieze-[\w-]+\.(avif|webp)(\?|$)/.test(u)

export async function sceneChecks({ cdp, url, check, sleep, scratch }) {
  const origin = new URL(url).origin
  const { T_POSTER } = await import(pathToFileURL(path.join(ROOT, 'src/scene/comp.js')))
  const fresh = async (opts, p = '/', settle = 1800, init = null) => {
    const page = await cdp.newPage(opts)
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    if (init) await page.addInitScript(init)
    await page.goto(url + p, { settle })
    return page
  }
  const SIZES = [
    ['1440', { width: 1440, height: 900, dpr: 1 }],
    ['390', { width: 390, height: 844, dpr: 2, mobile: true }],
  ]

  // ---------- composite contrast at five scroll positions, four widths, both themes ----------
  {
    let sharp = null
    try {
      sharp = (await import('../../tools/sharp.mjs')).default
    } catch {
      sharp = null
    }
    if (!sharp) check('page', 'measured contrast', 'fail', 'sharp is missing (npm run tools)')
    else {
      const tmpDir = path.join(scratch || path.join(ROOT, '.build/qa'), 'composite')
      mkdirSync(tmpDir, { recursive: true })
      for (const theme of ['light', 'dark']) {
        const comp = await measureComposite({ cdp, url, sharp, tmpDir, theme, t: T_POSTER, log: () => {} })
        for (const [view, ps] of Object.entries(comp.views)) {
          const fails = comp.failures.filter((f) => f.view === view)
          const low = Object.values(ps).reduce((a, m) => (m.worst && (!a || m.worst.ratio / m.worst.min < a.ratio / a.min) ? m.worst : a), null)
          const lines = Object.values(ps).reduce((n, m) => n + m.lines, 0)
          check('page', `measured contrast ${theme} @${view}`, fails.length ? 'fail' : 'pass', fails.length ? fails.slice(0, 5).map((f) => `p ${f.p} "${f.text}" ${f.ratio} (needs ${f.min})`).join(' | ') : `${lines} text lines at p 0, 0.3, 0.56, 0.8, 1; lowest "${low?.text}" ${low?.ratio} (needs ${low?.min})`)
        }
      }
    }
  }

  // ---------- a deep link lands on its section ----------
  {
    const page = await fresh({ width: 1440, height: 900 }, '/#experience', 2200)
    const d = await page.eval(`(() => { const h = document.getElementById('experience-h').getBoundingClientRect(); const neck = document.querySelector('.neck .neck-row').getBoundingClientRect(); const cur = document.querySelector('.neck .nav [aria-current="true"]'); return { top: Math.round(h.top), bar: Math.round(neck.bottom), vh: innerHeight, cur: cur ? cur.getAttribute('href') : null } })()`)
    check('page', 'deep link lands on its section', d.cur === '#experience' && d.top >= d.bar && d.top < d.vh ? 'pass' : 'fail', `heading top ${d.top} (neck bottom ${d.bar}) of ${d.vh}, current "${d.cur}"`)
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
        if (e.closest('[inert], .sr-only, [hidden]') || e.getAttribute('tabindex') === '-1') return false
        if (e.closest('details:not([open])') && !e.matches('summary')) return false
        for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden') return false }
        return true
      }
      const all = [...document.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(ok)
      const missed = all.filter((e) => !window.__seen.has(e))
      return { total: all.length, seen: window.__seen.size, missed: missed.slice(0, 6).map((e) => e.tagName.toLowerCase() + ' "' + (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30) + '"') }
    })()`)
    check('page', 'keyboard reaches every control', r.missed.length ? 'fail' : 'pass', r.missed.length ? `missed ${r.missed.join(', ')}` : `${r.total} links and buttons, all reached`)
    await page.close()
  }

  // ---------- the phone menu: opens, holds the words, Escape closes it and returns focus ----------
  {
    const page = await fresh({ width: 390, height: 844, dpr: 2, mobile: true })
    const r = await page.eval(`(async () => {
      const btn = document.querySelector('.neck .menu-btn')
      btn.focus(); btn.click()
      await new Promise((d) => setTimeout(d, 200))
      const sheet = document.getElementById(btn.getAttribute('aria-controls'))
      const open = btn.getAttribute('aria-expanded') === 'true' && !sheet.hidden
      const words = [...sheet.querySelectorAll('.sheet-nav a')].map((a) => a.getAttribute('href'))
      const focusIn = sheet.contains(document.activeElement)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((d) => setTimeout(d, 200))
      return { open, words, focusIn, closed: sheet.hidden && btn.getAttribute('aria-expanded') === 'false', back: document.activeElement === btn }
    })()`)
    check('page', 'phone menu', r.open && r.words.length === 4 && r.focusIn && r.closed && r.back ? 'pass' : 'fail', `opens ${r.open}, ${r.words.length} words, focus moves in ${r.focusIn}, Escape closes ${r.closed}, focus back on the button ${r.back}`)
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
    check('page', 'no sideways scroll at 320 to 1920', bad.length ? 'fail' : 'pass', bad.join(' | ') || '320, 390, 768, 1024, 1440, 1920')
  }

  // ---------- forced colours ----------
  for (const [label, opts] of SIZES) {
    const page = await cdp.newPage(opts)
    await page.media([{ name: 'forced-colors', value: 'active' }])
    await page.goto(url + '/', { settle: 1500 })
    const r = await page.eval(`(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }
      const plates = [...document.querySelectorAll('.plate, .card')].filter(shown)
      const thin = plates.filter((g) => { const cs = getComputedStyle(g); return cs.borderTopStyle !== 'solid' || parseFloat(cs.borderTopWidth) < 2 })
      const stage = [...document.querySelectorAll('.stage, .frieze-art')].filter(shown).length
      return { plates: plates.length, thin: thin.slice(0, 5).map((g) => g.className.slice(0, 50)), stage }
    })()`)
    check('page', `forced colours @${label}`, r.plates > 0 && !r.thin.length && !r.stage ? 'pass' : 'fail', `${r.plates} plates, ${r.thin.length} without a 2px border${r.thin.length ? ': ' + r.thin.join(' | ') : ''}; stage or art shown ${r.stage}`)
    await page.close()
  }

  // ---------- quiet: the poster instead of the live scene ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts, '/?quiet=1', 3500)
    // under 960 px the quiet switch lives in the menu sheet: open it first
    await page.eval(`(async () => { const b = document.querySelector('.neck .menu-btn'); if (b && b.offsetParent !== null && b.getAttribute('aria-expanded') !== 'true') { b.click(); await new Promise((r) => setTimeout(r, 300)) } })()`)
    const r = await page.eval(`(() => {
      const imgs = [...document.querySelectorAll('[data-band="hero"] .poster img')].filter((i) => i.offsetParent !== null)
      return { attr: document.documentElement.dataset.transparency, canvas: document.querySelectorAll('canvas').length, poster: imgs.length === 1 && imgs[0].complete && imgs[0].naturalWidth > 0 && getComputedStyle(imgs[0].parentElement).opacity !== '0', checked: [...document.querySelectorAll('.quiet[role="switch"]')].filter((b) => b.offsetParent !== null)[0]?.getAttribute('aria-checked') }
    })()`)
    const scene = page.requests.filter((q) => isScene(q.url))
    check('page', `quiet mode @${label}`, r.attr === 'reduced' && !r.canvas && r.poster && r.checked === 'true' && !scene.length ? 'pass' : 'fail', `data-transparency ${r.attr}, canvas ${r.canvas}, poster shown ${r.poster}, switch checked ${r.checked}, ${scene.length} scene request(s)`)
    await page.close()
  }

  // ---------- scrolling the page shifts no layout ----------
  for (const [label, opts] of [['320', { width: 320, height: 700, dpr: 2, mobile: true }], ...SIZES]) {
    const page = await fresh(opts)
    const r = await page.eval(`(${scrollShift.toString()})()`)
    check('page', `scroll layout shift @${label}`, r.cls <= 0.02 ? 'pass' : 'fail', `session-window CLS ${r.cls} (at most 0.02) scrolling down the page and back; largest ${r.worst}`)
    await page.close()
  }

  // ======================= the theme =======================
  {
    const html = await (await fetch(url + '/')).text()
    const boot = html.indexOf('<script>')
    const firstCss = Math.min(...[html.indexOf('<style'), html.indexOf('rel="stylesheet"')].filter((i) => i >= 0))
    check('theme', 'data-theme set before the first stylesheet', boot >= 0 && boot < firstCss && /data-theme/.test(html.slice(boot, firstCss)) ? 'pass' : 'fail', `boot script at ${boot}, first stylesheet at ${firstCss}`)
    const metas = [...html.matchAll(/<meta name="theme-color"[^>]*>/g)].map((m) => m[0])
    check('theme', 'one theme-color meta, the clay', metas.length === 1 && /content="#C47D45"/.test(metas[0]) && !/media=/.test(metas[0]) ? 'pass' : 'fail', metas.join(' ') || 'none')
  }
  for (const theme of ['light', 'dark']) {
    const page = await fresh({ width: 1440, height: 900 }, `/?theme=${theme}`, 1500)
    const r = await page.eval(`(() => ({ attr: document.documentElement.dataset.theme, meta: document.querySelector('meta[name="theme-color"]:not([media])')?.content, bg: getComputedStyle(document.body).backgroundColor, poster: getComputedStyle(document.querySelector('[data-band="hero"] .poster--${theme}')).display, h1: document.querySelector('h1').textContent }))()`)
    const want = theme === 'dark' ? { meta: '#141110', bg: 'rgb(20, 17, 16)' } : { meta: '#C47D45', bg: 'rgb(241, 227, 207)' }
    check('theme', `?theme=${theme} renders`, r.attr === theme && r.meta === want.meta && r.bg === want.bg && r.poster === 'block' && r.h1 === 'Ayro Escobar' ? 'pass' : 'fail', `data-theme ${r.attr}, theme-color ${r.meta}, ground ${r.bg}, ${theme} poster ${r.poster}`)
    await page.close()
  }
  {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.media([{ name: 'prefers-color-scheme', value: 'dark' }])
    await page.goto(url + '/', { settle: 1200 })
    const dark = await page.eval('document.documentElement.dataset.theme')
    await page.media([{ name: 'prefers-color-scheme', value: 'light' }])
    await page.goto(url + '/', { settle: 1200 })
    const light = await page.eval('document.documentElement.dataset.theme')
    check('theme', 'light by default, whatever the system', dark === 'light' && light === 'light' ? 'pass' : 'fail', `no stored choice: prefers dark serves ${dark}, prefers light serves ${light} (both must be light)`)
    await page.close()
  }
  {
    const page = await fresh({ width: 1440, height: 900 }, '/?tier=full&theme=light', 1500)
    await waitReady(page).catch(() => {})
    const before = await page.eval('({ theme: document.documentElement.dataset.theme, programs: window.__bench ? __bench(2).programs : null, nav: performance.getEntriesByType("navigation").length, t0: performance.timeOrigin })')
    await page.eval(`document.querySelector('.neck-tools .tog--theme').click()`)
    await sleep(700)
    const after = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('ae.theme'), programs: window.__bench ? __bench(2).programs : null, t0: performance.timeOrigin, meta: document.querySelector('meta[name="theme-color"]:not([media])')?.content, pressed: document.querySelector('.neck-tools .tog--theme').getAttribute('aria-pressed'), said: [...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join('|'), poster: getComputedStyle(document.querySelector('[data-band="hero"] .poster--dark')).display })`)
    check('theme', 'the switch flips without a reload or a recompile', before.theme === 'light' && after.theme === 'dark' && after.t0 === before.t0 && before.programs != null && after.programs === before.programs && after.meta === '#141110' && after.pressed === 'true' && /dark theme/.test(after.said) && after.poster === 'block' && after.stored === 'dark' ? 'pass' : 'fail', `${before.theme} to ${after.theme}, same document ${after.t0 === before.t0}, programs ${before.programs} to ${after.programs}, theme-color ${after.meta}, pressed ${after.pressed}, announced "${after.said}", dark poster ${after.poster}, stored ${after.stored}`)
    // reload: the stored choice comes back before the first paint
    await page.goto(url + '/', { settle: 800 })
    const reload = await page.eval(`({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor, paint: performance.getEntriesByType('paint').map((p) => p.name) })`)
    check('theme', 'a reload keeps the stored theme', reload.theme === 'dark' && reload.bg === 'rgb(20, 17, 16)' ? 'pass' : 'fail', `data-theme ${reload.theme}, ground ${reload.bg} (set by the inline boot script before any stylesheet)`)
    await page.close()
  }

  // ======================= the scene =======================

  // the poster is the first paint
  {
    const html = await (await fetch(url + '/')).text()
    const hero = html.slice(html.indexOf('id="top"'), html.indexOf('id="check-out"'))
    const bad = []
    for (const theme of ['light', 'dark']) {
      const img = hero.match(new RegExp(`<picture class="poster poster--${theme}">[\\s\\S]*?<\\/picture>`))?.[0] || ''
      const ok = img.includes(`frieze-${theme}.avif`) && img.includes(`frieze-${theme}-m.avif`) && /<img[^>]*width="1600"[^>]*height="\d+"/.test(img) && /<img[^>]*alt="[^"]+"/.test(img) && /fetchpriority="high"/i.test(img)
      if (!ok) bad.push(theme)
    }
    check('scene', 'both posters in the served HTML', bad.length ? 'fail' : 'pass', bad.length ? `incomplete: ${bad.join(', ')}` : 'light and dark, each with its phone cut, width, height, alt, fetchpriority high')
    const files = []
    for (const f of ['frieze-light', 'frieze-light-m', 'frieze-dark', 'frieze-dark-m']) for (const ext of ['avif', 'webp']) files.push([`${f}.${ext}`, (await fetch(`${url}/poster/${f}.${ext}`)).status])
    const missing = files.filter(([, s]) => s !== 200)
    check('scene', 'eight poster files served', missing.length ? 'fail' : 'pass', missing.map(([f, s]) => `${s} ${f}`).join(', ') || files.map(([f]) => f).join(', '))
  }
  for (const [label, opts, theme, want] of [
    ['1440 light', { width: 1440, height: 900 }, 'light', 'frieze-light.avif'],
    ['1440 dark', { width: 1440, height: 900 }, 'dark', 'frieze-dark.avif'],
    ['390 light', { width: 390, height: 844, dpr: 2, mobile: true }, 'light', 'frieze-light-m.avif'],
  ]) {
    const page = await fresh(opts, `/?theme=${theme}&quiet=1`, 2500)
    const pre = await page.eval(`[...document.querySelectorAll('link[rel="preload"][as="image"]')].map((l) => l.getAttribute('href'))`)
    const got = [...new Set(page.requests.filter((q) => isPoster(q.url)).map((q) => q.url.replace(/^.*\/poster\//, '')))]
    check('scene', `one poster fetched @${label}`, pre.length === 1 && pre[0].endsWith(want) && got.length === 1 && got[0] === want ? 'pass' : 'fail', `preload ${pre.join(', ') || 'none'}; fetched ${got.join(', ') || 'none'}`)
    await page.close()
  }

  // the canvas fades in on full and lite
  for (const [label, q, opts] of [['full', '?tier=full', { width: 1440, height: 900 }], ['lite', '?tier=lite', { width: 390, height: 844, dpr: 2, mobile: true }]]) {
    const page = await cdp.newPage(opts)
    await page.goto(url + '/' + q, { settle: 0 })
    const t = await page.eval(`new Promise((r) => { const t0 = performance.now(); const f = () => { const c = document.querySelector('.frieze-canvas'); if (c && c.classList.contains('on')) r(Math.round(performance.now() - t0)); else if (performance.now() - t0 > 8000) r(-1); else setTimeout(f, 50) }; f() })`)
    const load = await page.eval('Math.round(performance.getEntriesByType("navigation")[0].loadEventEnd)')
    check('scene', `canvas on @${label}`, t >= 0 && t - Math.max(0, load) <= 3000 ? 'pass' : 'fail', t < 0 ? 'the canvas never turned on' : `on ${t} ms after the page opened, load at ${load} ms`)
    await page.close()
  }

  // the still tier is the finished page: nothing waiting at opacity 0 or turned, the pot facing (both themes,
  // 1440 and a phone); reduced motion lands on the same tier
  for (const [label, opts] of SIZES) {
    for (const theme of ['light', 'dark']) {
      const page = await fresh(opts, `/?tier=still&theme=${theme}`, 1200)
      const r = await page.eval(`(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((d) => setTimeout(d, 60)) }
        await new Promise((d) => setTimeout(d, 400))
        const hidden = [], turned = []
        for (const e of document.querySelectorAll('main *, footer *')) {
          const cs = getComputedStyle(e)
          if (cs.display === 'none' || e.closest('[aria-hidden="true"]') && !e.matches('.pot-still')) continue
          const b = e.getBoundingClientRect()
          if (!b.width || !b.height) continue
          if (cs.opacity === '0' && !e.matches('.poster, .poster img, .pot-snap')) hidden.push(e.className || e.tagName)
          if (e.matches('.turn, .sec-title, .carve') && cs.transform !== 'none') turned.push(e.className)
        }
        const cover = [...document.querySelectorAll('.carve')].filter((e) => getComputedStyle(e, '::after').content !== 'none' && getComputedStyle(e, '::after').display !== 'none').length
        const face = [...document.querySelectorAll('.pot-still--face.pot-still--${theme}')].filter((i) => i.getClientRects().length && i.complete && i.naturalWidth > 0).length
        return { hidden: hidden.slice(0, 6), turned: turned.slice(0, 6), cover, face, rv: document.documentElement.classList.contains('rv'), canvas: document.querySelectorAll('canvas').length }
      })()`)
      check('scene', `still tier is the finished page @${label} ${theme}`, !r.hidden.length && !r.turned.length && !r.cover && r.face === 1 && !r.rv && !r.canvas ? 'pass' : 'fail', `hidden ${r.hidden.join(', ') || 'none'}; turned ${r.turned.join(', ') || 'none'}; carve covers ${r.cover}; the facing pot still shown ${r.face}; html.rv ${r.rv}; canvas ${r.canvas}`)
      await page.close()
    }
  }

  // the still tier never asks for the scene
  {
    const page = await cdp.newPage({ width: 1440, height: 900 })
    await page.media([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(url + '/', { settle: 3000 })
    const scene = page.requests.filter((r) => isScene(r.url))
    const r = await page.eval(`({ tier: document.documentElement.dataset.tier, canvas: document.querySelectorAll('canvas').length, poster: [...document.querySelectorAll('[data-band="hero"] .poster img')].some((i) => i.offsetParent !== null && i.complete && i.naturalWidth > 0) })`)
    check('scene', 'still tier: the poster, no scene request', r.tier === 'still' && !scene.length && !r.canvas && r.poster ? 'pass' : 'fail', `tier ${r.tier}, ${scene.length} scene request(s), canvas ${r.canvas}, poster shown ${r.poster}`)
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

  // the ground line never moves on its band
  {
    const page = await fresh({ width: 1440, height: 900 }, `/?tier=full&t=${T_POSTER}`, 1500)
    await waitReady(page).catch(() => {})
    const rows = []
    for (const p of [0, 0.5, 1]) {
      rows.push(await page.eval(`(async () => {
        const band = document.querySelector('[data-band="hero"]')
        window.scrollTo({ top: Math.round(band.offsetHeight * ${p}) - (${p} === 1 ? 1 : 0), behavior: 'instant' })
        await new Promise((d) => setTimeout(d, 250))
        const b = band.getBoundingClientRect(), g = band.querySelector('.ground').getBoundingClientRect()
        return [Math.round((g.left - b.left) * 10) / 10, Math.round((g.top - b.top) * 10) / 10]
      })()`))
    }
    const same = rows.every((r) => r[0] === rows[0][0] && r[1] === rows[0][1])
    check('scene', 'the ground line holds still on its band', same ? 'pass' : 'fail', `foot point relative to the band at p 0, 0.5, 1: ${rows.map((r) => r.join(',')).join(' | ')}`)
    await page.close()
  }

  // framing with __bounds at the poster frame
  // the phone sizes include what Safari shows at load (about 390x664 on an iPhone 14, 393x659 on a 15 Pro:
  // the toolbars take the rest of the 844) and the whole screen of an SE (375x667)
  for (const [label, opts, minH] of [
    ['1440', { width: 1440, height: 900, dpr: 1 }, 300],
    ['390', { width: 390, height: 844, dpr: 2, mobile: true }, 130],
    ['393x659', { width: 393, height: 659, dpr: 3, mobile: true }, 120],
    ['375x667', { width: 375, height: 667, dpr: 2, mobile: true }, 120],
  ]) {
    for (const theme of ['light', 'dark']) {
      const page = await fresh(opts, `/?tier=full&t=${T_POSTER}&theme=${theme}`, 1200)
      await waitReady(page)
      const b = await page.eval('(window.__frameAt(' + T_POSTER + '), window.__bounds())')
      const H = b.figure.y1 - b.figure.y0
      const touching = b.panels.filter((p) => overlap(p, b.figure) || overlap(p, b.disk))
      const plate = b.panels.find((p) => p.kind === 'plate' && p.y0 < innerHeightOf(opts))
      const cut = b.disk.y0 < b.room.y0 - 1 || (plate && overlap(plate, b.disk))
      check('scene', `framing at the poster frame @${label} ${theme}`, H >= minH && !touching.length && !cut && b.host === 'hero' ? 'pass' : 'fail', `his mesh box ${H} px tall (at least ${minH}), ${touching.length} header, plate or button box(es) touching him or the disk${touching.length ? ': ' + touching.map((t) => `${t.kind} ${JSON.stringify(t)}`).join(' ') : ''}, disk ${JSON.stringify(b.disk)} in room ${JSON.stringify(b.room)} cut ${!!cut}`)
      await page.close()
    }
  }

  // the slip: shows within 2 s, repeats, never under the plate
  {
    const page = await fresh({ width: 1440, height: 900, dpr: 1 }, '/?tier=full&slip=1', 1200)
    await waitReady(page)
    const r = await page.eval(`new Promise((done) => {
      const t0 = performance.now(); let first = -1, slips = 0, was = false, gap = 1e9
      const plate = document.querySelector('.hero-plate').getBoundingClientRect()
      const f = () => {
        const s = window.__stats.slipping
        if (s && !was) { slips++; if (first < 0) first = performance.now() - t0 }
        was = s
        if (s) gap = Math.min(gap, window.__bounds().figure.x0 - plate.right)
        if (performance.now() - t0 < 7000) setTimeout(f, 40); else done({ first: Math.round(first), slips, gap: Math.round(gap) })
      }
      f()
    })`)
    check('scene', 'the catch', r.first >= 0 && r.first <= 2000 && r.slips >= 2 && r.gap >= 8 ? 'pass' : 'fail', `first catch at ${r.first} ms (at most 2000), ${r.slips} catches in 7 s (?slip=1), deepest give ${r.gap} px right of the plate (at least 8)`)
    await page.close()
    const src = readFileSync(path.join(ROOT, 'src/scene/frieze.js'), 'utf8')
    const ok = /const CATCH = \{[^}]*first: 6\.5, every: 18 \}/.test(src) && /catchEvery: Number\(q\.get\('slip'\)\) \|\| CATCH\.every/.test(src)
    check('scene', 'the catch at 6.5 s, then every 18 s', ok ? 'pass' : 'fail', 'src/scene/frieze.js: CATCH first 6.5, every 18; ?slip= overrides the period')
  }

  // the gait and the contacts: no kneel, no sliding foot, no hand off the rock
  {
    const page = await fresh({ width: 1440, height: 900, dpr: 1 }, `/?tier=full&t=${T_POSTER}`, 1200)
    await waitReady(page)
    const g = await page.eval('window.__gait(100)')
    check('scene', 'gait floors', g.swingKneeMin >= 0.3 && g.shinMin >= 21 && g.sepMin >= 0.28 ? 'pass' : 'fail', `swing knee ${g.swingKneeMin} m (at least 0.30), flattest rear shin ${g.shinMin} degrees (at least 21), feet ${g.sepMin} m apart at landing (at least 0.28)`)
    const c = await page.eval('window.__contact(120)')
    check('scene', 'feet planted, palms on the rock', c.drift <= 1e-4 && c.gap <= 0.002 ? 'pass' : 'fail', `a planted ball slides ${c.drift} m in its stance (must be 0), the palms are at most ${c.gap} m off the rock (pressed in up to ${-c.press} m; at most 0.002 off)`)
    await page.close()
  }

  // every moment of the catch, the painting and the loop as a still: his box never meets a plate, a button or
  // the neck (at 1440 and on a phone)
  for (const [label, opts] of SIZES) {
    const bad = [], seen = []
    for (const [act, u] of [['catch', 0.3], ['catch', 0.75], ['paint', 0.5], ['paint', 1.4], ['stall', 0.4], ['getaway', 0.4], ['watch', 0.3], ['turn', 0.3], ['walk', 1.0], ['walk', 3.0], ['plant', 0.4], ['push', 0.6]]) {
      const page = await fresh(opts, `/?tier=full&t=${T_POSTER}&act=${act}&u=${u}`, 1000)
      await waitReady(page)
      if (act !== 'catch') { await page.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`); await sleep(500) }
      const b = await page.eval('window.__bounds()')
      const hit = b.panels.filter((p) => overlap(p, b.figure))
      seen.push(`${act} ${u}: ${b.host}`)
      if (hit.length) bad.push(`${act} ${u}: ${hit.map((h) => h.kind).join(', ')}`)
      if (b.host !== (act === 'catch' ? 'hero' : 'contact')) bad.push(`${act} ${u}: host ${b.host}`)
      await page.close()
    }
    check('scene', `every act clear of the plates @${label}`, bad.length ? 'fail' : 'pass', bad.join(' | ') || `${seen.length} stills: catch, painting, stall, get-away, watch, turn, walk, plant, push`)
  }

  // the painting changes no program
  {
    const page = await fresh({ width: 1440, height: 900, dpr: 1 }, '/?tier=full', 1500)
    await waitReady(page)
    const before = await page.eval('__bench(2).programs')
    await page.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`)
    await sleep(3500)
    const r = await page.eval(`({ programs: __bench(2).programs, host: __stats.host, painted: !!document.querySelector('[data-band="contact"].painted') })`)
    check('scene', 'the painting compiles nothing', r.painted && r.host === 'contact' && r.programs === before ? 'pass' : 'fail', `programs ${before} before, ${r.programs} after the painting (host ${r.host}, painted ${r.painted})`)
    await page.close()
  }

  // the pot: the canvas lands on its still, and its passes are cheap on a phone
  {
    let sharp = null
    try {
      sharp = (await import('../../tools/sharp.mjs')).default
    } catch {
      sharp = null
    }
    const rows = []
    for (const theme of ['light', 'dark']) {
      const shots = []
      for (const [q, css] of [[`/?tier=full&theme=${theme}`, '.frieze-canvas, .pot-snap { visibility: hidden !important } .pot .pot-still--in { opacity: 1 !important; transition: none !important }'], [`/?tier=full&t=${T_POSTER}&pot=-70&theme=${theme}`, '']]) {
        const page = await fresh({ width: 1440, height: 900, dpr: 2 }, q, 1500)
        await waitReady(page).catch(() => {})
        await page.eval(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); const r = document.querySelector('.belly').getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - 40, behavior: 'instant' }) })()`)
        await sleep(1500)
        // (the capture's clip is in document coordinates)
        const box = await page.eval(`(() => { const r = document.querySelector('.pot-rail .pot').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, host: window.__stats && window.__stats.host } })()`)
        const dir = path.join(scratch || path.join(ROOT, '.build/qa'), 'pot')
        mkdirSync(dir, { recursive: true })
        const png = path.join(dir, `pot-${theme}-${shots.length}.png`)
        await page.screenshot(png, { clip: box })
        shots.push(png)
        await page.close()
      }
      if (sharp) {
        const [a, c] = await Promise.all(shots.map((f) => sharp(f).raw().toBuffer({ resolveWithObject: true })))
        let sum = 0
        const n = Math.min(a.data.length, c.data.length)
        for (let i = 0; i < n; i++) sum += Math.abs(a.data[i] - c.data[i])
        rows.push([theme, +(sum / n).toFixed(2)])
      }
    }
    check('scene', 'the canvas lands on the pot still', rows.length === 2 && rows.every(([, d]) => d < 2) ? 'pass' : 'fail', rows.map(([t, d]) => `${t} ${d} levels`).join(', ') + ' mean difference (under 2)')
    const page = await cdp.newPage({ width: 390, height: 844, dpr: 2, mobile: true })
    await page.goto(url + '/?tier=lite', { settle: 1500 })
    await waitReady(page)
    await page.eval(`document.querySelector('.pot-band').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await sleep(1500)
    await page.eval('__bench(20)')
    // the median of five benches (one alone moves with whatever else the machine is doing)
    const bp = await page.eval('(() => { const xs = []; let b; for (let i = 0; i < 5; i++) { b = __bench(60); xs.push(b.avgMs) } xs.sort((a, c) => a - c); return { ...b, avgMs: xs[2], host: __stats.host } })()')
    check('scene', 'pot pass cost on lite', bp.host === 'pot' && bp.avgMs <= 2.0 ? 'pass' : 'fail', `pot host ${bp.host}, ${Math.round(bp.avgMs * 100) / 100} ms a frame (median of five, at most 2.0) at ${bp.size.join('x')}, ${bp.draws} draws`)
    await page.close()
  }

  // one canvas, and it moves to the contact band
  {
    const page = await fresh({ width: 1440, height: 900, dpr: 1 }, '/?tier=full', 1500)
    await waitReady(page)
    const top = await page.eval(`({ n: document.querySelectorAll('canvas').length, inHero: !!document.querySelector('[data-band="hero"] canvas'), host: window.__stats.host })`)
    await page.eval(`document.querySelector('[data-band="contact"]').scrollIntoView({ block: 'end', behavior: 'instant' })`)
    await sleep(1800)
    const low = await page.eval(`(() => { const b = window.__bounds(); return { n: document.querySelectorAll('canvas').length, inContact: !!document.querySelector('[data-band="contact"] canvas'), host: window.__stats.host, fig: b.figure, disk: b.disk, room: b.room, vw: innerWidth } })()`)
    const near = low.fig && low.disk.x1 <= low.vw && low.fig.x0 > low.vw * 0.45 && low.disk.y0 >= low.room.y0 - 1
    check('scene', 'one canvas, hero then contact', top.n === 1 && top.inHero && top.host === 'hero' && low.n === 1 && low.inContact && low.host === 'contact' && near ? 'pass' : 'fail', `top: ${top.n} canvas in the hero ${top.inHero}; contact: ${low.n} canvas in the contact band ${low.inContact}, host ${low.host}, his box ${JSON.stringify(low.fig)}, disk ${JSON.stringify(low.disk)} within the room ${JSON.stringify(low.room)}`)
    await page.close()
  }
  // on a phone the contact band is not the hero picture again: he stands further right, the rock running off the edge
  {
    const page = await fresh({ width: 390, height: 844, dpr: 2, mobile: true }, '/?tier=lite', 1500)
    await waitReady(page)
    const hero = await page.eval(`(() => { const f = window.__bounds().figure; return Math.round((f.x0 + f.x1) / 2) })()`)
    await page.eval(`document.querySelector('[data-band="contact"]').scrollIntoView({ block: 'end', behavior: 'instant' })`)
    await sleep(2200)
    const low = await page.eval(`(() => { const b = window.__bounds(); return { host: window.__stats.host, mid: Math.round((b.figure.x0 + b.figure.x1) / 2), fig: b.figure, disk: b.disk, vw: innerWidth } })()`)
    check('scene', 'the phone contact band is further up the line', low.host === 'contact' && low.mid >= hero + 30 && low.fig.x1 <= low.vw && low.disk.x0 < low.vw ? 'pass' : 'fail', `his centre at ${hero} px in the hero and ${low.mid} px in the contact band (at least 30 px further right), his box ${JSON.stringify(low.fig)}, disk ${JSON.stringify(low.disk)} on a ${low.vw} px screen`)
    await page.close()
  }

  // the light poster's luminance
  {
    const metaPath = path.join(ROOT, 'public/poster/meta.json')
    const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {}
    check('scene', 'light composite luminance', meta.luminance >= 0.25 && meta.alpha?.dark > 0.01 ? 'pass' : 'fail', `mean luminance ${meta.luminance} (at least 0.25); the dark poster draws ${meta.alpha?.dark}`)
  }

  // frame cost on this machine
  {
    const rows = []
    for (const [label, q, opts, budget] of [
      ['full 1440x900 DPR 1', '?tier=full', { width: 1440, height: 900, dpr: 1 }, 2.5],
      ['lite 390x844 DPR 1.5', '?tier=lite', { width: 390, height: 844, dpr: 1.5, mobile: true }, 2.0],
    ]) {
      const page = await cdp.newPage(opts)
      await page.goto(url + '/' + q, { settle: 1500 })
      await waitReady(page)
      await page.eval('__bench(20)')
      const b = await page.eval('__bench(60)')
      rows.push({ label, ms: Math.round(b.avgMs * 100) / 100, draws: b.draws, budget })
      await page.close()
    }
    const over = rows.filter((r) => r.ms > r.budget || r.draws > 10)
    check('scene', 'frame cost', over.length ? 'fail' : 'pass', rows.map((r) => `${r.label} ${r.ms} ms (at most ${r.budget}), ${r.draws} draws`).join(', '))
  }
}

function innerHeightOf(opts) {
  return opts.height
}
