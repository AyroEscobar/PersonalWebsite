/*
  composite.mjs: text contrast measured on the real composite over the live scene (BRIEF.md budgets,
  DESIGN.md 4.2 and 10.10). Used by scripts/poster.mjs, which has Chrome and the built dist up.

  For every view and every progress p, the home page is opened with the scene's clock fixed
  (?t=2.3, so a scroll renders one still at the scrolled progress) and scrolled to p. Every visible
  text line is listed (its client rects, its computed colour, its size and weight); then the page is
  captured with all text made transparent (text shadows kept: a shadow sits under its glyph), so each line's backdrop is exactly
  what sits behind it: the scene through the glass's blur, saturate and brightness, the fill, the
  scrim, the sheen and the grain. The worst backdrop pixel under each line (after a 3x3 mean, so a
  lone star or grain speck cannot decide it) is compared with the text colour:

    4.5:1 for body text, 3:1 for large text (24 px and up, or 18.66 px and up at weight 700+)

  Disabled controls are skipped (WCAG exempts them); text inside .sr-only is not drawn, so it is skipped;
  a line box under the fixed nav pill or wordmark is covered by them (hidden, not low contrast), so it is skipped.
  Returns { views: { [name]: { [p]: { lines, lowest, worst } } }, lowest, failures }.
*/

export const COMPOSITE_VIEWS = [
  { name: '1440', w: 1440, h: 900, dpr: 1, mobile: false },
  { name: '390', w: 390, h: 844, dpr: 2, mobile: true },
  { name: '768', w: 768, h: 1024, dpr: 1, mobile: false },
  { name: '1920', w: 1920, h: 1080, dpr: 1, mobile: false },
]
export const COMPOSITE_PS = [0, 0.3, 0.56, 0.8, 1]

const lin = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
export const relLum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export const ratio = (a, b) => {
  const la = relLum(a), lb = relLum(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// in the page: scroll to progress p with the scene's own anchors (src/scene/scroll.js), list the text
const PAGE_LIST = (p) => `(async () => {
  const d = document.documentElement
  const A = [['top', 0], ['check-out', 0.2], ['experience', 0.45], ['stack', 0.7], ['contact', 0.85]]
  const max = Math.max(1, d.scrollHeight - innerHeight)
  const an = A.filter(([id]) => document.getElementById(id)).map(([id, q]) => [Math.min(max, document.getElementById(id).offsetTop), q])
  an[0][0] = 0; an.push([max, 1])
  let y = 0
  for (let i = 1; i < an.length; i++) { const [y0, p0] = an[i - 1], [y1, p1] = an[i]; if (${p} <= p1) { y = y0 + (y1 - y0) * (p1 > p0 ? (${p} - p0) / (p1 - p0) : 0); break } }
  scrollTo(0, Math.round(y))
  await new Promise((r) => setTimeout(r, 450))
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return { rgb: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 } }
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o }
  const lines = []
  // the fixed header controls sit on top of whatever scrolls under them: text they cover is hidden, not low contrast
  const covers = [...document.querySelectorAll('.top .nav, .top .wordmark')].map((e) => e.getBoundingClientRect()).filter((b) => b.width && getComputedStyle(document.querySelector('.top')).visibility === 'visible')
  const covered = (x0, y0, x1, y1, el) => !el.closest('.top') && covers.some((b) => x0 < b.right && x1 > b.left && y0 < b.bottom && y1 > b.top)
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = w.nextNode())) {
    const text = n.textContent.replace(/\\s+/g, ' ').trim()
    if (!text) continue
    const el = n.parentElement
    if (!el || el.closest('.sr-only, script, style, noscript, template, [hidden]')) continue
    if (el.closest(':disabled, [aria-disabled="true"]')) continue
    const cs = getComputedStyle(el)
    if (cs.visibility !== 'visible' || cs.display === 'none') continue
    const op = opacityOf(el)
    if (op < 0.05) continue
    const col = parse(cs.color)
    if (!col) continue
    const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400
    const r = document.createRange(); r.selectNodeContents(n)
    for (const b of r.getClientRects()) {
      const x0 = Math.max(0, b.left), y0 = Math.max(0, b.top), x1 = Math.min(innerWidth, b.right), y1 = Math.min(innerHeight, b.bottom)
      if (x1 - x0 < 2 || y1 - y0 < 2) continue
      if (covered(x0, y0, x1, y1, el)) continue
      lines.push({ text: text.slice(0, 48), sel: el.className && typeof el.className === 'string' ? el.tagName.toLowerCase() + '.' + el.className.split(' ')[0] : el.tagName.toLowerCase(), rgb: col.rgb, a: col.a * op, size, weight, box: [x0, y0, x1, y1] })
    }
  }
  return { y: Math.round(y), lines }
})()`

const HIDE = `(() => { const s = document.createElement('style'); s.id = '__hide-text'; s.textContent = '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; caret-color: transparent !important }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))) })()`

/** measure one capture: worst backdrop under each line */
async function measureLines(sharp, png, dpr, lines) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = []
  for (const L of lines) {
    const x0 = Math.max(1, Math.floor(L.box[0] * dpr)), y0 = Math.max(1, Math.floor(L.box[1] * dpr))
    const x1 = Math.min(width - 1, Math.ceil(L.box[2] * dpr)), y1 = Math.min(height - 1, Math.ceil(L.box[3] * dpr))
    // the text colour composited over the backdrop at its alpha is the drawn colour; with alpha 1 it is the colour
    const textLum = relLum(L.rgb)
    let worst = null, worstR = Infinity
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        let r = 0, g = 0, b = 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((y + dy) * width + (x + dx)) * channels; r += data[i]; g += data[i + 1]; b += data[i + 2] }
        const bg = [r / 9, g / 9, b / 9]
        const fg = L.a >= 0.999 ? L.rgb : L.rgb.map((c, k) => c * L.a + bg[k] * (1 - L.a))
        const cr = ratio(fg, bg)
        if (cr < worstR) { worstR = cr; worst = bg }
      }
    }
    if (!worst) continue
    const large = L.size >= 24 || (L.size >= 18.66 && L.weight >= 700)
    out.push({ text: L.text, sel: L.sel, size: L.size, weight: L.weight, large, min: large ? 3 : 4.5, ratio: Number(worstR.toFixed(2)), bg: worst.map((v) => Math.round(v)), textLum: Number(textLum.toFixed(3)) })
  }
  return out
}

/**
 * Run the whole measurement.
 * cdp: a connected client (scripts/lib/cdp.mjs); url: the served dist; sharp; tmpDir for the captures.
 */
export async function measureComposite({ cdp, url, sharp, tmpDir, views = COMPOSITE_VIEWS, ps = COMPOSITE_PS, tier = 'full', scheme = 'dark', log = console.log }) {
  const result = { scheme, views: {}, lowest: null, failures: [], method: 'text hidden, 3x3 mean, worst pixel under each line box' }
  for (const v of views) {
    // the scheme is emulated before the first goto, so the page paints in it from the start
    const page = await cdp.newPage({ width: v.w, height: v.h, dpr: v.dpr, mobile: v.mobile, scheme })
    result.views[v.name] = {}
    for (const p of ps) {
      await page.goto(`${url}/?tier=${tier}&t=2.3`, { settle: 600 })
      await page.eval('new Promise((r) => { let n = 0; const f = () => (window.__ready || ++n > 200) ? setTimeout(r, 300) : setTimeout(f, 50); f() })')
      const { y, lines } = await page.eval(PAGE_LIST(p))
      await page.eval(HIDE)
      const png = `${tmpDir}/composite-${scheme}-${v.name}-p${p}.png`
      await page.screenshot(png)
      const measured = await measureLines(sharp, png, v.dpr, lines)
      const fails = measured.filter((m) => m.ratio < m.min)
      const low = measured.reduce((a, m) => (!a || m.ratio / m.min < a.ratio / a.min ? m : a), null)
      result.views[v.name][p] = { scrollY: y, lines: measured.length, lowest: low && low.ratio, worst: low }
      for (const f of fails) result.failures.push({ view: v.name, p, ...f })
      if (low && (!result.lowest || low.ratio / low.min < result.lowest.ratio / result.lowest.min)) result.lowest = { view: v.name, p, ...low }
      log(`composite: ${v.name} p ${p}: ${measured.length} lines, lowest ${low ? `${low.ratio} (${low.sel} "${low.text}", needs ${low.min})` : 'n/a'}${fails.length ? `, ${fails.length} FAIL` : ''}`)
    }
    await page.close()
  }
  return result
}
