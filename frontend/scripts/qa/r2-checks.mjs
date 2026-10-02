/*
  Round 2 checks (reviews/r2-triage.md U1 to U8, N2, N15, N17), ported from
  the reviewers' reviews/r2-qa-interact.mjs and run by run.mjs after the r1
  checks. Each one reports through check('r2', ...).

    U1  builds: no text on a visible city name, exit sign or hot spot; text
        contrast over #builds at the 95th-percentile background; no hard edge
        at a specimen frame
    U2  exit signs at phone, tablet and desktop sizes (and at #work, #crew):
        inside the map, off the cities, the copy, the bars and each other, no
        line across US-75, Allen below the bar
    U3  turning a phone from #builds keeps you in builds; at 400% zoom the
        bars take under a third of the screen
    U4  forced colors, dark and light: no text in the color of its own
        background or the page's
    U5  the ping on a phone (tier lite) at 700 ms: US-75 stays in LED's hue
    U6  each stop head's strip is a real stretch of a road chain; the closer
        appears once; each place flares once per visit, then the loop idles
    U7  origin opens on the level paragraph; never more than two "trying"s in
        one phone screen, none above the fold
    U8  the hero contact row: the address written out, body size, ink
    N15, N17  the phone bar's contact link; search finds what readers type
*/
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ---------- in-page helpers (strings, evaluated in the page) ----------

const VIS = `const vis = (e) => { for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false } return true }`
const RECT = `const R = (b) => ({ l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) })`
const HIT = `const hit = (a, b, p = 0) => a.l < b.r + p && b.l < a.r + p && a.t < b.b + p && b.t < a.b + p`
const TEXTS = (root, extraSkip = '') => `(() => {
  const out = []
  const w = document.createTreeWalker(${root}, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.textContent.trim()) continue
    const el = n.parentElement
    if (!el || el.closest('.sr-only, .ng, svg, details:not([open]) > :not(summary)${extraSkip}') || !vis(el)) continue
    const rg = document.createRange()
    rg.selectNodeContents(n)
    for (const b of rg.getClientRects()) if (b.width > 1 && b.height > 1 && b.bottom > 0 && b.top < innerHeight) out.push({ s: n.textContent.trim().slice(0, 24), el, ...R(b) })
  }
  return out
})()`

const EXIT_AUDIT = `(() => {
  ${VIS}; ${RECT}; ${HIT}
  const view = document.querySelector('.ng-view').getBoundingClientRect()
  if (view.bottom <= 0 || view.top >= innerHeight) return { skipped: true, issues: [] }
  const exits = [...document.querySelectorAll('.ng-exit')].filter(vis).map((e) => ({ id: e.dataset.node, ...R(e.getBoundingClientRect()) }))
  const nodes = []
  for (const n of document.querySelectorAll('.ng-cam[data-variant="hero"] .ng-node'))
    for (const p of n.querySelectorAll('.ng-dot, .ng-label:not(.ng-label-hot)')) {
      const b = p.getBoundingClientRect()
      if (b.width && vis(p)) nodes.push({ id: n.dataset.node, ...R(b) })
    }
  const text = ${TEXTS("document.querySelector('main')")}
  const chrome = []
  for (const sel of ['header .tb-name', 'header .clock-btn', 'header .tb-contact', 'header .quiet-toggle', 'header .search-chip', '.bottombar']) {
    const e = document.querySelector(sel)
    if (e && vis(e)) { const b = e.getBoundingClientRect(); if (b.width && b.bottom > 0) chrome.push({ s: sel, ...R(b) }) }
  }
  const issues = []
  for (const e of exits) {
    if (e.l < view.left - 1 || e.r > view.right + 1 || e.t < Math.max(0, view.top) - 1 || e.b > Math.min(innerHeight, view.bottom) + 1) issues.push(e.id + ' outside the map')
    for (const n of nodes) if (hit(e, n)) issues.push(e.id + ' on ' + n.id)
    for (const t of text) if (hit(e, t)) issues.push(e.id + ' on text "' + t.s + '"')
    for (const c of chrome) if (hit(e, c)) issues.push(e.id + ' on ' + c.s)
  }
  for (let i = 0; i < exits.length; i++) for (let j = i + 1; j < exits.length; j++) if (hit(exits[i], exits[j], 2)) issues.push(exits[i].id + ' on ' + exits[j].id)
  const path = document.querySelector('[id$="hero-spine"]')
  const cam = document.querySelector('.ng-cam[data-variant="hero"]')
  const m = cam.getScreenCTM()
  const svg = cam.ownerSVGElement
  const sp = []
  const L = path.getTotalLength()
  for (let i = 0; i <= 64; i++) { const q = path.getPointAtLength((L * i) / 64); const pt = svg.createSVGPoint(); pt.x = q.x; pt.y = q.y; const c = pt.matrixTransform(m); sp.push([c.x, c.y]) }
  const cross = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]]; const den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return false; const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 }
  for (const ln of document.querySelectorAll('.ng-exit-road')) {
    if (!vis(ln)) continue
    const b = ln.ownerSVGElement.getBoundingClientRect()
    const a = [b.left + +ln.getAttribute('x1'), b.top + +ln.getAttribute('y1')]
    const z = [b.left + +ln.getAttribute('x2'), b.top + +ln.getAttribute('y2')]
    for (let i = 0; i + 1 < sp.length; i++) if (cross(a, z, sp[i], sp[i + 1])) { issues.push(ln.dataset.node + ' line crosses US-75'); break }
  }
  const allen = document.querySelector('.ng-cam[data-variant="hero"] .ng-node[data-node="allen"] .ng-label:not(.ng-label-hot)').getBoundingClientRect()
  const tb = document.querySelector('.topbar')
  const bar = vis(tb) ? tb.getBoundingClientRect().bottom : 0
  // The hero frame keeps Allen below the bar (the reading frames sit under a filled bar).
  if (scrollY < 10 && allen.bottom > 0 && allen.top < innerHeight && allen.top < bar) issues.push('allen under the top bar')
  return { exits: exits.map((e) => e.id + '[' + [e.l, e.t, e.r, e.b] + ']'), lines: document.querySelectorAll('.ng-exit-road').length, issues: [...new Set(issues)] }
})()`

// Decode a PNG screenshot in the page (a data: image on a canvas) and hand back a sampler.
const SAMPLER = `window.__px = async (b64) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + b64
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  window.__img = { w: c.width, h: c.height, at: (px, py) => { const i = (Math.round(py) * c.width + Math.round(px)) * 4; return [d[i], d[i + 1], d[i + 2]] }, lum }
  return [c.width, c.height]
};
window.__rgb = (css) => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = css; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3]] };`

async function capture(page) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' })
  return data
}

export async function r2Checks({ cdp, url, check, sleep, shot = async () => {}, SECTION_IDS }) {
  const { ORIGIN } = await import(pathToFileURL(path.join(ROOT, 'src/content/identity.js')))
  const { SIGNAL } = await import(pathToFileURL(path.join(ROOT, 'src/content/signal.js')))
  const open = async (w, h, { mobile = w < 720 || h < 500, touch = mobile || w < 1100, dpr = mobile ? 2 : 1, init } = {}) => {
    const p = await cdp.newPage({ width: w, height: h, dpr, mobile, touch })
    if (init) await p.addInitScript(init)
    return p
  }

  // ---------- U1: builds over the sticky map ----------
  for (const [w, h] of [[1100, 800], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]]) {
    const p = await open(w, h)
    await p.goto(`${url}/`, { settle: 1500 })
    await p.eval(SAMPLER)
    await p.eval(`document.getElementById('builds').scrollIntoView({ behavior: 'instant' })`)
    await sleep(1400)
    const bad = []
    let worst = Infinity
    let edge = 0
    for (const dy of [0, 900]) {
      if (dy) {
        await p.eval(`window.scrollBy(0, ${dy})`)
        await sleep(1100)
      }
      const o = await p.eval(`(() => {
        ${VIS}; ${RECT}; ${HIT}
        const ng = document.querySelector('.ng')
        const marks = [...document.querySelectorAll('.ng-cam[data-variant="hero"] .ng-label:not(.ng-label-hot), .ng-exit')].filter(vis).map((e) => ({ s: e.textContent.trim(), ...R(e.getBoundingClientRect()) })).filter((m) => m.r > m.l)
        const veil = +getComputedStyle(document.querySelector('.ng-view'), '::after').opacity
        const W = innerWidth
        // A hot spot shows only where the builds veil thins out (past 88% of the frame).
        const hubs = [...document.querySelectorAll('.ng-hubs circle[r="40"]')].map((c) => c.getBoundingClientRect()).map((b) => ({ s: 'hot spot', l: Math.round(b.left + b.width / 2 - 20), t: Math.round(b.top + b.height / 2 - 20), r: Math.round(b.left + b.width / 2 + 20), b: Math.round(b.top + b.height / 2 + 20) })).filter((b) => veil < 0.5 || b.l + 20 > W * 0.88)
        const text = ${TEXTS("document.querySelector('main')")}.map(({ el, ...t }) => t)
        const hits = []
        for (const m of [...marks, ...hubs]) for (const t of text) if (hit(m, t)) hits.push(m.s + ' on "' + t.s + '"')
        return { focus: ng.dataset.focus, veil, hits: [...new Set(hits)] }
      })()`)
      if (o.focus !== 'builds') bad.push(`focus ${o.focus} at +${dy}`)
      bad.push(...o.hits.map((x) => `+${dy}: ${x}`))
      // Contrast: read each text's color, hide the text, shoot the background.
      const rects = await p.eval(`(() => {
        ${VIS}; ${RECT}
        const t = ${TEXTS("document.getElementById('builds')", ', .spec-stage')}
        return t.map(({ el, ...r }) => ({ ...r, c: __rgb(getComputedStyle(el).color) }))
      })()`)
      await p.eval(`(() => { const s = document.createElement('style'); s.id = 'qa-hide'; s.textContent = '#builds, #builds * { color: transparent !important; text-decoration-color: transparent !important; -webkit-text-fill-color: transparent !important }'; document.head.appendChild(s) })()`)
      await sleep(80)
      await p.eval(`__px(${JSON.stringify(await capture(p))})`)
      await p.eval(`document.getElementById('qa-hide').remove()`)
      const res = await p.eval(`(() => {
        const I = window.__img
        const rects = ${JSON.stringify(rects)}
        let worst = Infinity, at = ''
        for (const r of rects) {
          const L = []
          for (let y = Math.max(0, r.t); y < Math.min(I.h, r.b); y += 2) for (let x = Math.max(0, r.l); x < Math.min(I.w, r.r); x += 2) { const [a, b, c] = I.at(x, y); L.push(I.lum(a, b, c)) }
          if (!L.length) continue
          L.sort((a, b) => a - b)
          const bg = L[Math.floor(L.length * 0.95)]
          const fg = I.lum(r.c[0], r.c[1], r.c[2])
          const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
          if (ratio < worst) { worst = ratio; at = r.s }
        }
        // A specimen frame must not show an edge: a 2px strip inside vs outside its left side.
        let edge = 0
        for (const f of document.querySelectorAll('#builds .spec-frame')) {
          const b = f.getBoundingClientRect()
          if (b.bottom < 0 || b.top > innerHeight || b.left < 4) continue
          const med = (x0) => { const v = []; for (let y = Math.max(0, b.top + 4); y < Math.min(I.h, b.bottom - 4); y += 3) v.push(I.lum(...I.at(x0, y))); v.sort((a, c) => a - c); return v[Math.floor(v.length / 2)] || 0 }
          edge = Math.max(edge, Math.abs(med(b.left + 1) - med(b.left - 3)))
        }
        return { worst: Math.round(worst * 100) / 100, at, edge: Math.round(edge * 1000) / 1000 }
      })()`)
      if (res.worst < worst) worst = res.worst
      edge = Math.max(edge, res.edge)
      if (res.worst < 4.5) bad.push(`+${dy}: "${res.at}" at ${res.worst}:1`)
      if (res.edge > 0.01) bad.push(`+${dy}: a specimen frame shows an edge (luminance step ${res.edge})`)
    }
    if (w === 1366 || w === 1920) await shot(p, `r2-builds-${w}.png`)
    // The hero key never slides over the sticky map's labels (1366x768, 450px down).
    if (w === 1366) {
      await p.eval('window.scrollTo(0, 450)')
      await sleep(900)
      const k = await p.eval(`(() => { ${VIS}; ${RECT}; ${HIT}; const key = document.querySelector('.hero-side'); if (!vis(key)) return []; const kb = R(key.getBoundingClientRect()); return [...document.querySelectorAll('.ng-cam[data-variant="hero"] .ng-label:not(.ng-label-hot)')].filter(vis).map((l) => ({ s: l.textContent, ...R(l.getBoundingClientRect()) })).filter((l) => hit(l, kb)).map((l) => l.s) })()`)
      if (k.length) bad.push(`hero key on ${k.join(', ')} at 450px`)
    }
    check('r2', `U1 builds clear of the map @${w}x${h}`, bad.length ? 'fail' : 'pass', bad.slice(0, 5).join(' | ') || `no text on a city, sign or hot spot; lowest contrast ${worst}:1; frame edge ${edge}`)
    await p.close()
  }

  // ---------- U2: exit signs ----------
  const SIZES = [
    [320, 568], [360, 640], [375, 667], [390, 664], [393, 659], [390, 844], [430, 932], [844, 390], [667, 375],
    [768, 1024], [1024, 768], [1100, 700], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
  ]
  for (const [w, h] of SIZES) {
    const p = await open(w, h)
    await p.goto(`${url}/`, { settle: 2800 })
    const issues = []
    const a = await p.eval(EXIT_AUDIT)
    issues.push(...a.issues.map((x) => `hero: ${x}`))
    if (w < 480 && a.lines) issues.push('phone draws exit lines')
    if ([390, 844, 1440, 2560].includes(w)) await shot(p, `r2-exits-${w}x${h}.png`)
    if (w >= 720 && h >= 500) {
      for (const id of ['work', 'crew']) {
        await p.eval(`document.getElementById('${id}').scrollIntoView({ behavior: 'instant' })`)
        await sleep(1700)
        const b = await p.eval(EXIT_AUDIT)
        issues.push(...b.issues.map((x) => `#${id}: ${x}`))
      }
    }
    check('r2', `U2 exit signs @${w}x${h}`, issues.length ? 'fail' : 'pass', issues.slice(0, 4).join(' | ') || `${a.exits.join(' ')}${a.lines ? `, ${a.lines} lines` : ', one row, no lines'}`)
    await p.close()
  }

  // ---------- U3: turning a phone; 400% zoom ----------
  {
    const p = await open(390, 844)
    await p.goto(`${url}/#builds`, { settle: 2000 })
    const where = `({ y: Math.round(scrollY), bb: document.querySelector('.bb-current')?.textContent, rail: document.querySelector('.rail [aria-current]')?.textContent?.trim(), vh: innerHeight })`
    const a = await p.eval(where)
    await p.setViewport({ width: 844, height: 390, dpr: 2, mobile: true, touch: true })
    await sleep(900)
    const b = await p.eval(where)
    await p.setViewport({ width: 390, height: 844, dpr: 2, mobile: true, touch: true })
    await sleep(900)
    const c = await p.eval(where)
    const ok = a.bb === 'builds' && b.rail === 'builds' && Math.abs(b.y - a.y) < 390 && c.bb === 'builds'
    check('r2', 'U3 turning a phone keeps your place', ok ? 'pass' : 'fail', `portrait y ${a.y} (${a.bb}), landscape y ${b.y} (${b.rail}), back y ${c.y} (${c.bb})`)
    await p.close()
    const z = await open(320, 200)
    await z.goto(`${url}/`, { settle: 1500 })
    const top0 = await z.eval(`getComputedStyle(document.querySelector('.topbar')).position`)
    await z.eval('window.scrollTo(0, 900)')
    await sleep(500)
    const bars = await z.eval(`(() => { let px = 0; for (const s of ['.topbar', '.bottombar']) { const e = document.querySelector(s); const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const r = e.getBoundingClientRect(); px += Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) } return { px, vh: innerHeight } })()`)
    check('r2', 'U3 at 400% zoom the bars take under a third', top0 === 'fixed' && bars.px < bars.vh / 3 ? 'pass' : 'fail', `top bar ${top0}, bars ${bars.px} of ${bars.vh} px after scrolling`)
    await z.close()
  }

  // ---------- U4: forced colors ----------
  for (const scheme of ['dark', 'light']) {
    const p = await open(1440, 900)
    await p.media([
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ])
    await p.goto(`${url}/`, { settle: 1500 })
    await p.eval(SAMPLER)
    await p.eval(`new Promise((done) => { let y = 0; const t = setInterval(() => { y += 700; scrollTo(0, y); if (y > document.documentElement.scrollHeight) { clearInterval(t); scrollTo(0, 0); setTimeout(done, 400) } }, 60) })`)
    const bad = await p.eval(`(() => {
      ${VIS}
      const body = __rgb(getComputedStyle(document.body).backgroundColor).slice(0, 3).join()
      const out = []
      for (const el of document.querySelectorAll('body *')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
        if (el.closest('.sr-only, svg, dialog:not([open]), details:not([open]) > :not(summary), [aria-hidden="true"] .sr-only') || !vis(el)) continue
        const b = el.getBoundingClientRect()
        if (!b.width || !b.height) continue
        const color = __rgb(getComputedStyle(el).color)
        if (color[3] === 0) continue
        let bg = null
        for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 200) { bg = c.slice(0, 3).join(); break } }
        const c3 = color.slice(0, 3).join()
        if (c3 === body || c3 === bg) out.push((el.className?.baseVal ?? el.className ?? el.tagName).toString().split(' ')[0] + ' "' + el.textContent.trim().slice(0, 18) + '"')
      }
      return [...new Set(out)]
    })()`)
    check('r2', `U4 forced colors (${scheme}): text keeps its own color`, bad.length ? 'fail' : 'pass', bad.slice(0, 6).join(' | ') || 'every visible text differs from its background and the page')
    if (scheme === 'dark') await shot(p, 'r2-forced-colors-dark.png')
    await p.close()
  }

  // ---------- U5: the ping on a phone keeps US-75 in LED ----------
  {
    const p = await open(390, 844)
    await p.goto(`${url}/`, { settle: 2500 })
    await p.eval(SAMPLER)
    const tier = await p.eval('document.documentElement.dataset.tier')
    await p.eval(`document.querySelector('.hero-ping-btn').click()`)
    await sleep(700)
    const png = await capture(p)
    await shot(p, 'r2-ping-390-lite-700ms.png')
    await p.eval(`__px(${JSON.stringify(png)})`)
    const hue = await p.eval(`(() => {
      const I = window.__img
      const dpr = devicePixelRatio
      const path = document.querySelector('[id$="hero-spine"]'); const cam = document.querySelector('.ng-cam[data-variant="hero"]'); const m = cam.getScreenCTM(); const svg = cam.ownerSVGElement
      const L = path.getTotalLength()
      const hues = []
      for (let i = 2; i <= 46; i++) {
        const q = path.getPointAtLength((L * i) / 48); const pt = svg.createSVGPoint(); pt.x = q.x; pt.y = q.y; const c = pt.matrixTransform(m)
        let best = null, bl = -1
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const px = I.at((c.x + dx) * dpr, (c.y + dy) * dpr); const l = I.lum(...px); if (l > bl) { bl = l; best = px } }
        if (bl < 0.08) continue
        const [r, g, b] = best.map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
        if (mx - mn < 0.06) { hues.push(-1); continue }
        let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4
        hues.push(Math.round(((h * 60) + 360) % 360))
      }
      const led = hues.filter((h) => h >= 190 && h <= 240).length
      const sodium = hues.filter((h) => h >= 15 && h <= 50).length
      return { n: hues.length, led, sodium, white: hues.filter((h) => h < 0).length }
    })()`)
    check('r2', 'U5 ping on a phone: US-75 stays LED', tier === 'lite' && hue.n > 8 && hue.led + hue.white >= hue.n * 0.6 ? 'pass' : 'fail', `tier ${tier}; lit samples along US-75 at 700 ms: ${hue.led} LED, ${hue.white} white-hot, ${hue.sodium} sodium of ${hue.n}`)
    await p.close()
  }

  // ---------- U6: road strips, the closer, arrival flares ----------
  {
    const grid = JSON.parse(readFileSync(path.join(ROOT, 'src/data/dfw-grid.json'), 'utf8'))
    const { decodeChains } = await import(pathToFileURL(path.join(ROOT, 'src/grid/graph.js')))
    const chains = decodeChains(grid).map((c) => {
      const pts = []
      for (let i = 0; i < c.length; i += 2) pts.push(`${c[i]},${c[i + 1]}`)
      return `;${pts.join(';')};`
    })
    const p = await open(1440, 900, {
      init: `window.__flares = {}; const __a = Element.prototype.animate; Element.prototype.animate = function (...args) { if (this.classList?.contains('ng-label-hot')) { const n = this.closest('.ng-node')?.dataset.node; window.__flares[n] = (window.__flares[n] || 0) + 1 } return __a.apply(this, args) }; window.__raf = 0; const __r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => __r((t) => { window.__raf++; cb(t) })`,
    })
    await p.goto(`${url}/`, { settle: 2500 })
    const heads = await p.eval(`[...document.querySelectorAll('.stop-head')].map((h) => ({ d: h.querySelector('svg path')?.getAttribute('d') || '', tab: h.querySelector('.stop-no')?.textContent.trim() }))`)
    const bad = []
    const seen = new Set()
    heads.forEach((h, i) => {
      const nums = (h.d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
      const pts = []
      for (let k = 0; k + 1 < nums.length; k += 2) pts.push(`${nums[k]},${nums[k + 1]}`)
      const fwd = `;${pts.join(';')};`
      const rev = `;${[...pts].reverse().join(';')};`
      if (pts.length < 6 || !chains.some((c) => c.includes(fwd) || c.includes(rev))) bad.push(`stop ${i + 1}: not a stretch of a road chain`)
      if (seen.has(h.d)) bad.push(`stop ${i + 1}: same stretch as another stop`)
      seen.add(h.d)
      if (!/^exit \d\d$/.test(h.tab || '')) bad.push(`stop ${i + 1}: tab reads "${h.tab}"`)
    })
    check('r2', 'U6 stop heads are exit tabs on real roads', heads.length === SECTION_IDS.length && !bad.length ? 'pass' : 'fail', bad.join(' | ') || `${heads.length} heads, ${seen.size} different stretches, each a run of a chain in dfw-grid.json`)
    const closer = await p.eval(`(document.querySelector('main').innerText.match(new RegExp(${JSON.stringify(SIGNAL.closer.text.replace('.', '\\.'))}, 'g')) || []).length`)
    const band = await p.eval(`({ uses: document.querySelectorAll('.closer-band use').length, beacon: !!document.querySelector('.closer-band .beacon') })`)
    check('r2', 'U6 the closer, once, on a band of the map', closer === 1 && band.uses > 20 && band.beacon ? 'pass' : 'fail', `"${SIGNAL.closer.text}" ${closer} time(s); band: ${band.uses} roads by reference, beacon ${band.beacon}`)
    // Down through origin and work slowly, back up, and down again: each place flares once.
    await p.eval(`document.getElementById('now').scrollIntoView({ behavior: 'instant' })`)
    await sleep(600)
    const run = async (n, dir) => {
      for (let i = 0; i < n; i++) {
        await p.eval(`window.scrollBy(0, ${dir * 140})`)
        await sleep(110)
      }
    }
    await p.eval(`document.querySelector('[data-flare="richardson"]').scrollIntoView({ block: 'end', behavior: 'instant' })`)
    await sleep(300)
    await run(6, 1)
    await p.eval(`document.getElementById('work').scrollIntoView({ behavior: 'instant' })`)
    await sleep(900)
    await run(26, 1)
    await run(26, -1)
    await run(26, 1)
    await sleep(1600)
    const fl = await p.eval('window.__flares')
    await p.eval('window.__raf = 0')
    await sleep(1500)
    const idle = await p.eval('window.__raf')
    const once = ['allen', 'plano', 'richardson'].every((n) => fl[n] === 1)
    check('r2', 'U6 each place flares once per visit, then the loop idles', once && idle === 0 ? 'pass' : 'fail', `label flares ${JSON.stringify(fl)}; rAF callbacks in 1.5 s after: ${idle}`)
    await p.close()
  }

  // ---------- U7: origin order and the trying count ----------
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await open(w, h)
    await p.goto(`${url}/`, { settle: 1200 })
    const r = await p.eval(`(() => {
      const first = document.querySelector('.origin-body p')?.textContent.trim()
      const ys = []
      const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT)
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (n.parentElement.closest('.sr-only')) continue
        const t = n.textContent.toLowerCase()
        for (let i = t.indexOf('trying'); i >= 0; i = t.indexOf('trying', i + 1)) { const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 6); const b = rg.getBoundingClientRect(); if (b.height) ys.push({ top: b.top + scrollY, bottom: b.bottom + scrollY }) }
      }
      let most = 0
      for (const a of ys) most = Math.max(most, ys.filter((b) => b.top >= a.top && b.bottom <= a.top + innerHeight).length)
      return { first, most, fold: ys.filter((b) => b.top < innerHeight).length, n: ys.length }
    })()`)
    const ok = r.first === ORIGIN.level.text && r.fold === 0 && (w >= 720 || r.most <= 2)
    check('r2', `U7 origin opens on the level paragraph @${w}`, ok ? 'pass' : 'fail', `first paragraph is ${r.first === ORIGIN.level.text ? 'voice-level' : `"${(r.first || '').slice(0, 30)}"`}; "trying" above the fold ${r.fold}; most in one screen ${r.most} of ${r.n}`)
    await p.close()
  }

  // ---------- U8: the contact row ----------
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await open(w, h)
    await p.goto(`${url}/`, { settle: 1000 })
    const r = await p.eval(`(() => {
      const a = document.querySelector('.hero-contact a[href^="mailto:"]')
      const probe = document.createElement('span'); probe.style.color = 'var(--ink)'; document.body.appendChild(probe)
      const ink = getComputedStyle(probe).color; probe.remove()
      const cs = getComputedStyle(a)
      return { text: a.textContent.trim(), fs: parseFloat(cs.fontSize), color: cs.color, ink, top: Math.round(a.getBoundingClientRect().top), vh: innerHeight }
    })()`)
    const ok = r.text.includes('@') && r.fs >= 16 && r.color === r.ink && r.top < r.vh
    check('r2', `U8 contact row @${w}x${h}`, ok ? 'pass' : 'fail', `"${r.text}" at ${r.fs}px, ${r.color === r.ink ? 'ink' : r.color}, top ${r.top} of ${r.vh}`)
    await p.close()
  }

  // ---------- N15, N17: the phone bar, search ----------
  {
    const p = await open(390, 844)
    await p.goto(`${url}/`, { settle: 1200 })
    const bb = await p.eval(`(() => { const a = document.querySelector('.bottombar .bb-contact'); return a ? { href: a.getAttribute('href'), text: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) } : null })()`)
    check('r2', 'N15 the phone bar ends in contact', bb && bb.href === '#signal' && bb.h >= 44 ? 'pass' : 'fail', bb ? `"${bb.text}" to ${bb.href}, ${bb.h}px tall` : 'missing')
    await p.close()
    const q = await open(1440, 900)
    await q.goto(`${url}/`, { settle: 2500 })
    const want = { 'mlh coach': /Major League Hacking/, 'planning for chaos': /Planning for Chaos|Hackcon/, desks: /RBC/, hire: /^contact$/, availability: /^contact$/ }
    const miss = []
    for (const [query, re] of Object.entries(want)) {
      await q.eval(`document.querySelector('header .search-chip').click()`)
      await sleep(450)
      await q.send('Input.insertText', { text: query })
      await sleep(400)
      const top = await q.eval(`document.querySelector('dialog.jumplist [role=option] .jl-title')?.textContent.trim() || ''`)
      if (!re.test(top)) miss.push(`"${query}" -> "${top}"`)
      await q.key('Escape')
      await sleep(250)
    }
    check('r2', 'N17 search finds what readers type', miss.length ? 'fail' : 'pass', miss.join(' | ') || Object.keys(want).map((k) => `"${k}"`).join(', '))
    await q.close()
  }
}
