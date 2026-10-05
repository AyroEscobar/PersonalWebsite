/*
  The lens (DESIGN.md 4.3), ported from prototype a. Its own lazy chunk:
  src/lib/client.js imports it after fonts are ready and the page is idle.

  Chrome (html[data-lens='on']): each [data-lens-preset] element gets an SVG
  displacement map sized to its box, so its backdrop really bends
  (glass.css applies it as `backdrop-filter: url(#id) ...`).
  The words under a reading lens (the hero, the 404, the reduced-motion
  line) are magnified by the loupe in every browser: a magnified copy of
  the words, drawn crisp inside the glass, with the originals hidden under
  it. Displacement resamples whole pixels, so magnifying type through it
  tore descenders and doubled contours (v2/reviews/site-art.md 1); on the
  reading lens it only bends the rim and the field.

    startLens()                       wire everything up (idempotent)
    applyLens(el, preset, w, h, s)    give one element its map (s: lensing strength 0 to 1)
    lensFilter(preset, w, h, s)       the filter id, built once per size and cached
    wordLines(root)                   the word spans of root, grouped by rendered line
    loupeOn(lens, line, mag) / loupeOff(lens)   line: a .lens-line, or one line of word spans
    materialize(el, preset, w, h)     the entry: lensing at 0.35, 0.7, 1 over 400 ms, once per session

  The map (research/glass.md 3): everything samples inward (a convex lens),
  color-interpolation-filters is sRGB, feImage is sized to the element and
  drawn at devicePixelRatio, then smoothed, so the field bends without
  steps. The interior is a rod profile, s(u) = u/M + (1 - 1/M) u^3. Two
  bezels: 'snell' (a convex squircle with a Snell bend, for heavily
  pre-blurred glass: nav, dock, buttons, cards) and 'soft' (1 - t)^3 for the
  reading lens. A Snell bezel's slope at the rim is about -11, so any push
  over 0.09 of the bezel folds the map: content near the rim shows twice,
  mirrored. 'soft' keeps push x 3 / bezel under 1, so the map never folds
  and a stroke crossing the rim stays one stroke. Dispersion is three
  displacement passes (scale x 1-k, 1, 1+k) recombined per channel.
*/

const NS = 'http://www.w3.org/2000/svg'
const html = () => document.documentElement
const lensOn = () => html().dataset.lens === 'on'
const mq = (s) => window.matchMedia?.(s).matches
const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 800 }) : window.setTimeout(() => fn(), 60))

// ---------- the map ----------
function sdf(px, py, w, h, r) {
  const qx = Math.abs(px - w / 2) - (w / 2 - r)
  const qy = Math.abs(py - h / 2) - (h / 2 - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}
const sq = (t) => Math.pow(1 - Math.pow(1 - t, 4), 0.25)
function snell(slope, n = 1.5) {
  const th = Math.atan(slope)
  const ph = Math.asin(Math.min(1, Math.sin(th) / n))
  return Math.tan(th - ph)
}
const NORM = snell(1e6)
export const rod = (u, M) => {
  const a = Math.abs(u)
  return Math.sign(u) * (a / M + (1 - 1 / M) * a * a * a)
}
export function rodInv(u, M) {
  let lo = -1
  let hi = 1
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2
    if (rod(m, M) < u) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

// the bezel's bend at depth t (0 at the rim, 1 at the bezel's inner edge), 1 at the rim
const BEZEL = {
  snell: (t) => {
    const sl = (sq(Math.min(1, t + 0.002)) - sq(Math.max(0, t - 0.002))) / 0.004
    return snell(sl) / NORM
  },
  soft: (t) => (1 - t) * (1 - t) * (1 - t),
}

// a separable box blur over the inside of the lens only (outside stays 0)
function smooth(A, IN, W, H, rad) {
  if (rad < 1) return
  const T = new Float32Array(A.length)
  for (let pass = 0; pass < 2; pass++) {
    const horiz = pass === 0
    const src = horiz ? A : T
    const dst = horiz ? T : A
    const n = horiz ? W : H
    const lines = horiz ? H : W
    for (let l = 0; l < lines; l++) {
      for (let k = 0; k < n; k++) {
        const i = horiz ? l * W + k : k * W + l
        if (!IN[i]) {
          dst[i] = 0
          continue
        }
        let sum = 0
        let cnt = 0
        for (let o = -rad; o <= rad; o++) {
          const kk = k + o
          if (kk < 0 || kk >= n) continue
          const j = horiz ? l * W + kk : kk * W + l
          if (!IN[j]) continue
          sum += src[j]
          cnt++
        }
        dst[i] = cnt ? sum / cnt : 0
      }
    }
  }
}

/**
 * The displacement map for a w by h CSS-pixel box with corner radius r,
 * drawn at `dpr` device pixels per CSS pixel. Displacements are in CSS
 * pixels (the filter's user space), so `scale` is too.
 */
export function lensMap(w, h, r, { mag = 1, magY = mag, bezel = 16, push = 12, profile = 'snell' }, strength = 1, dpr = 1) {
  const W = Math.max(1, Math.round(w * dpr))
  const H = Math.max(1, Math.round(h * dpr))
  const N = W * H
  const DX = new Float32Array(N)
  const DY = new Float32Array(N)
  const IN = new Uint8Array(N)
  const bend = BEZEL[profile] || BEZEL.snell
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const px = (x + 0.5) / dpr
      const py = (y + 0.5) / dpr
      const s = sdf(px, py, w, h, r)
      if (s >= 0) continue
      IN[i] = 1
      const u = (px - w / 2) / (w / 2)
      const v = (py - h / 2) / (h / 2)
      let dx = (rod(u, mag) - u) * (w / 2)
      let dy = (rod(v, magY) - v) * (h / 2)
      const t = Math.min(1, -s / bezel)
      if (t < 1) {
        // the outward normal of the rounded box, analytically: from the corner's centre in a
        // corner, else straight out through the nearer side
        const m = bend(t)
        const sx = px < w / 2 ? -1 : 1
        const sy = py < h / 2 ? -1 : 1
        const qx = Math.abs(px - w / 2) - (w / 2 - r)
        const qy = Math.abs(py - h / 2) - (h / 2 - r)
        let nx = 0
        let ny = 0
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1
          nx = (sx * qx) / l
          ny = (sy * qy) / l
        } else if (qx > qy) nx = sx
        else ny = sy
        dx -= nx * m * push
        dy -= ny * m * push
      }
      DX[i] = dx * strength
      DY[i] = dy * strength
    }
  }
  const rad = Math.round(dpr)
  smooth(DX, IN, W, H, rad)
  smooth(DY, IN, W, H, rad)
  let max = 1
  for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(DX[i]), Math.abs(DY[i]))
  const scale = Math.ceil(max * 2 + 2)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const im = ctx.createImageData(W, H)
  const d = im.data
  for (let i = 0; i < N; i++) {
    const o = i * 4
    d[o] = Math.round(128 + (DX[i] / (scale / 2)) * 127)
    d[o + 1] = Math.round(128 + (DY[i] / (scale / 2)) * 127)
    d[o + 2] = 128
    d[o + 3] = 255
  }
  ctx.putImageData(im, 0, 0)
  return { url: c.toDataURL(), scale }
}

const dpr = () => Math.min(3, Math.max(1, Math.round((window.devicePixelRatio || 1) * 2) / 2))

// Map resolution: device pixels only for the reading lens, whose type shows through sharp
// (the other presets pre-blur 4 to 11px, so a 1x map is already finer than what they show),
// and only up to MAP_PX map pixels, so no map costs a long task on a slow phone.
const MAP_PX = 150000
const mapScale = (p, w, h) => (p.hi ? Math.max(1, Math.min(dpr(), Math.floor(Math.sqrt(MAP_PX / (w * h)) * 2) / 2)) : 1)

// Presets (DESIGN.md 4.3), w and h in px.
export const PRESET = {
  // The reading lens. Its words are magnified by the loupe (crisp in every browser), so the
  // map leaves the interior at 1x and only bends a soft rim band: bezel 0.3h, push 0.07h,
  // push x 3 / bezel = 0.7, so the map never folds (see BEZEL). The pre-blur matches the
  // 1.5px backdrop blur the loupe browsers get, so the neighbouring lines' tails that reach
  // into the glass look the same everywhere. No dispersion: with no magnified type in the
  // backdrop it would only fringe those tails.
  lens: (w, h, phone) => ({ r: h / 2, mag: 1, bezel: Math.round(h * 0.3), push: Math.max(1.5, h * 0.02), blur: phone ? 0.5 : 0.7, disp: 0, profile: 'soft', hi: true }),
  nav: (w, h) => ({ r: h / 2, mag: 1.03, bezel: 16, push: 14, blur: 11, disp: 0.03 }),
  dock: () => ({ r: 28, mag: 1.02, bezel: 16, push: 14, blur: 11, disp: 0.03 }),
  btn: (w, h) => ({ r: h / 2, mag: 1, bezel: 14, push: 12, blur: 7, disp: 0 }),
  row: () => ({ r: 14, mag: 1, bezel: 14, push: 12, blur: 5, disp: 0 }),
  card: () => ({ r: 28, mag: 1.03, bezel: 44, push: 34, blur: 4, disp: 0.03 }),
  ruler: (w, h) => ({ r: h / 2, mag: 1.12, bezel: 9, push: 6, blur: 0, disp: 0 }),
}

let defs = null
function defsEl() {
  if (defs?.isConnected) return defs
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  defs = document.createElementNS(NS, 'defs')
  svg.appendChild(defs)
  document.body.appendChild(svg)
  return defs
}

const cache = new Map()
const maps = new Map()
let seq = 0
export function lensFilter(preset, w, h, strength = 1) {
  w = Math.max(8, Math.round(w))
  h = Math.max(8, Math.round(h))
  const phone = window.innerWidth <= 640
  const p = (PRESET[preset] || PRESET.btn)(w, h, phone)
  const k = mapScale(p, w, h)
  const mkey = `${preset}-${w}x${h}-${phone ? 'p' : 'd'}${k}`
  const key = `${mkey}-${strength}`
  if (cache.has(key)) return cache.get(key)
  // one map per size; a weaker lens (the entry) is the same map at a smaller scale,
  // since the displacement is the map value times the scale
  let full = maps.get(mkey)
  if (!full) {
    full = lensMap(w, h, p.r, p, 1, k)
    maps.set(mkey, full)
  }
  const map = { url: full.url, scale: full.scale * strength }
  const id = `lf${++seq}`
  const f = document.createElementNS(NS, 'filter')
  f.setAttribute('id', id)
  f.setAttribute('x', '0')
  f.setAttribute('y', '0')
  f.setAttribute('width', '100%')
  f.setAttribute('height', '100%')
  f.setAttribute('color-interpolation-filters', 'sRGB')
  const S = map.scale
  const disp = (inp, scale, res) => `<feDisplacementMap in="${inp}" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G"${res ? ` result="${res}"` : ''}/>`
  let body =
    `<feImage href="${map.url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${p.blur}" result="soft"/>`
  if (p.disp) {
    const k = p.disp
    body +=
      disp('soft', (S * (1 - k)).toFixed(1), 'dr') +
      disp('soft', S, 'dg') +
      disp('soft', (S * (1 + k)).toFixed(1), 'db') +
      `<feColorMatrix in="dr" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>` +
      `<feColorMatrix in="dg" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>` +
      `<feColorMatrix in="db" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>` +
      `<feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg"/>` +
      `<feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1"/>`
  } else {
    body += disp('soft', S)
  }
  f.innerHTML = body
  defsEl().appendChild(f)
  cache.set(key, id)
  return id
}

export function applyLens(el, preset, w, h, strength = 1) {
  if (!lensOn() || !el) return
  const id = lensFilter(preset, w, h, strength)
  el.style.setProperty('--g-url', `url(#${id})`)
  el.classList.add('has-lens')
}

function lensAll() {
  if (!lensOn()) return
  // elements a controller owns (data-lens-own: the page's reader) get their maps from it
  const queue = [...document.querySelectorAll('[data-lens-preset]:not([data-lens-own])')]
  const step = (deadline) => {
    while (queue.length && (!deadline || deadline.timeRemaining() > 4)) {
      const el = queue.shift()
      const r = el.getBoundingClientRect()
      if (r.width && r.height) applyLens(el, el.dataset.lensPreset, r.width, r.height)
      if (!deadline) break
    }
    if (queue.length) idle(step)
  }
  idle(step)
}

// ---------- the loupe: the magnified words of a reading lens, in every browser ----------
const bfOK = () => {
  try {
    return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  } catch {
    return false
  }
}
// Off wherever the lens is a solid plate under the line (no backdrop-filter, reduced
// transparency, more contrast, forced colours): there the originals stay and read once.
export const loupeAllowed = () =>
  bfOK() &&
  html().dataset.transparency !== 'reduced' &&
  !mq('(prefers-reduced-transparency: reduce)') &&
  !mq('(prefers-contrast: more)') &&
  !mq('(forced-colors: active)')

/*
  Where a line's ink sits in its line box: the centre between the tallest
  ascender and the deepest descender of the face, measured once per font and
  size. The loupe magnifies about it, so a line's ascenders and descenders
  grow evenly and stay inside a lens centred on it (components.css centres
  the reading lens there too).
*/
const inkCache = new Map()
function inkCentre(cs, fs, lh) {
  const font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`
  const key = `${font}/${lh}`
  if (inkCache.has(key)) return inkCache.get(key)
  let c = lh / 2
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.font = font
    const m = ctx.measureText('hgjly')
    const fa = m.fontBoundingBoxAscent
    const fd = m.fontBoundingBoxDescent
    if (fa > 0 && fd > 0) {
      const base = (lh - (fa + fd)) / 2 + fa
      c = base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
    }
  } catch {
    // no canvas text metrics: the line box centre
  }
  inkCache.set(key, c)
  return c
}

function wrapWords(root, skip) {
  if (root.dataset.words) return [...root.querySelectorAll(':scope .w')]
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (skip && skip.contains(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const n of nodes) {
    if (!n.textContent.trim()) continue
    const frag = document.createDocumentFragment()
    for (const part of n.textContent.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part))
      else {
        const s = document.createElement('span')
        s.className = 'w'
        s.textContent = part
        frag.appendChild(s)
      }
    }
    n.replaceWith(frag)
  }
  root.dataset.words = '1'
  return [...root.querySelectorAll(':scope .w')]
}

const under = new WeakMap()
export function loupeOff(lens) {
  lens.querySelector(':scope > .loupe')?.classList.remove('is-on')
  ;(under.get(lens) || []).forEach((w) => w.classList.remove('is-under'))
  under.set(lens, [])
}

/** The word spans (.w) of `root`, grouped by rendered line, top to bottom. */
export function wordLines(root) {
  const lines = []
  for (const w of root.querySelectorAll('.w')) {
    const r = w.getBoundingClientRect()
    if (!r.width) continue
    const cy = (r.top + r.bottom) / 2
    const L = lines.find((l) => Math.abs(l.cy - cy) < r.height * 0.35)
    if (L) L.words.push(w)
    else lines.push({ cy, words: [w] })
  }
  return lines.sort((a, b) => a.cy - b.cy).map((l) => l.words)
}

/**
 * Show a magnified copy of `line`'s words inside `lens`, along the same rod
 * profile as the SVG map, and fade the originals out from under the glass.
 * `line` is one line of type (a .lens-line) or the word spans of one rendered
 * line (from wordLines): every word in it sits under the lens.
 */
export function loupeOn(lens, line, M = 1.16) {
  const lp = lens.querySelector(':scope > .loupe')
  if (!lp || !loupeAllowed()) return loupeOff(lens)
  const words = Array.isArray(line) ? line : wrapWords(line, lens)
  if (!words.length) return loupeOff(lens)
  const lr = lens.getBoundingClientRect()
  const cs = getComputedStyle(words[0])
  const fs = parseFloat(cs.fontSize)
  const lh = parseFloat(cs.lineHeight) || fs
  const W = lr.width
  // A word's box is its content area, centred on its line box: the line box starts lh/2 above that centre.
  const wr = words[0].getBoundingClientRect()
  const oy = (wr.top + wr.bottom) / 2 - lh / 2 - lr.top
  // magnify about the line's ink centre: a point y down the line box lands at oy + gc + (y - gc) * M
  const gc = inkCentre(cs, fs, lh)
  const ty = oy + gc * (1 - M)
  lp.style.setProperty('--loupe-size', `${fs}px`)
  lp.style.setProperty('--loupe-lh', `${lh}px`)
  lp.replaceChildren(
    ...words.map((w) => {
      const r = w.getBoundingClientRect()
      const x0 = r.left - lr.left
      const x1 = r.right - lr.left
      const p0 = rodInv((x0 - W / 2) / (W / 2), M)
      const p1 = rodInv((x1 - W / 2) / (W / 2), M)
      const left = W / 2 + (p0 * W) / 2
      const sx = ((p1 - p0) * W) / 2 / Math.max(1, x1 - x0)
      const s = document.createElement('span')
      s.className = 'lw'
      s.textContent = w.textContent
      s.style.transform = `translate(${left.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sx.toFixed(4)}, ${M})`
      return s
    }),
  )
  ;(under.get(lens) || []).forEach((w) => w.classList.remove('is-under'))
  under.set(lens, words)
  words.forEach((w) => w.classList.add('is-under'))
  requestAnimationFrame(() => lp.classList.add('is-on'))
}

function loupeAll() {
  document.querySelectorAll('.lens-line > .lens-static').forEach((lens) => loupeOn(lens, lens.parentElement))
}

// ---------- the entry ----------
/**
 * Once per session. `fx: false` keeps the rim and streak as they are (the
 * hero lens is already on screen when it takes over from its stand-in) and
 * only raises the lensing strength.
 */
export function materialize(el, preset, w, h, { fx = true } = {}) {
  let seen = false
  try {
    seen = sessionStorage.getItem('ae.lens') === '1'
    sessionStorage.setItem('ae.lens', '1')
  } catch {
    seen = true
  }
  if (seen || html().dataset.motion === 'reduced') return applyLens(el, preset, w, h)
  if (fx) {
    el.classList.add('is-entering')
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-entering')))
  }
  if (!lensOn()) return
  ;[0.35, 0.7, 1].forEach((s, k) => window.setTimeout(() => applyLens(el, preset, w, h, s), k * 200))
}

// ---------- start ----------
let started = false
export function startLens() {
  if (started) return
  started = true
  const run = () => {
    lensAll()
    loupeAll()
  }
  run()
  let t = 0
  window.addEventListener('resize', () => {
    window.clearTimeout(t)
    t = window.setTimeout(() => {
      if (cache.size > 64) {
        cache.clear()
        maps.clear()
        defs?.replaceChildren()
      }
      run()
    }, 150)
  })
  window.addEventListener('ae:quiet', () => loupeAll())
}
