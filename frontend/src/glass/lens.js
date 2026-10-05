/*
  The lens (DESIGN.md 4.3), ported from prototype a. Its own lazy chunk:
  src/lib/client.js imports it after fonts are ready and the page is idle.

  Chrome (html[data-lens='on']): each [data-lens-preset] element gets an SVG
  displacement map sized to its box, so its backdrop really bends and
  magnifies (glass.css applies it as `backdrop-filter: url(#id) ...`).
  Everywhere else: the loupe, a magnified copy of the words under a lens
  resting on a line of type (.lens-line > .lens-static).

    startLens()                       wire everything up (idempotent)
    applyLens(el, preset, w, h, s)    give one element its map (s: lensing strength 0 to 1)
    lensFilter(preset, w, h, s)       the filter id, built once per size and cached
    lineBoxes(el)                     the rendered lines of an element's text, page coordinates
    wordLines(root)                   the word spans of root, grouped by rendered line
    loupeOn(lens, line, mag) / loupeOff(lens)   line: a .lens-line, or one line of word spans
    materialize(el, preset, w, h)     the entry: lensing at 0.35, 0.7, 1 over 400 ms, once per session

  The map (research/glass.md 3): everything samples inward (a convex lens),
  color-interpolation-filters is sRGB, feImage is sized to the element. The
  interior is a rod profile, s(u) = u/M + (1 - 1/M) u^3, so the middle of a
  line reads M times larger and the ends compress back to meet the rim; the
  bezel is a convex squircle with a Snell bend. Dispersion is three
  displacement passes (scale x 1-k, 1, 1+k) recombined per channel. The
  hero lens disperses only on screens of 1.5x and up (k 0.008): the map
  samples whole pixels, so at 1x any k splits the type into 1px red and
  cyan patches, which read as misregistration (DESIGN.md 0.3).
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

export function lensMap(w, h, r, { mag = 1, magY = mag, bezel = 16, push = 12 }, strength = 1) {
  const N = w * h
  const DX = new Float32Array(N)
  const DY = new Float32Array(N)
  const IN = new Uint8Array(N)
  let max = 1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const px = x + 0.5
      const py = y + 0.5
      const s = sdf(px, py, w, h, r)
      if (s >= 0) continue
      IN[i] = 1
      const u = (px - w / 2) / (w / 2)
      const v = (py - h / 2) / (h / 2)
      let dx = (rod(u, mag) - u) * (w / 2)
      let dy = (rod(v, magY) - v) * (h / 2)
      const t = Math.min(1, -s / bezel)
      if (t < 1) {
        const sl = (sq(Math.min(1, t + 0.002)) - sq(Math.max(0, t - 0.002))) / 0.004
        const m = snell(sl) / NORM
        const gx = sdf(px + 1, py, w, h, r) - s
        const gy = sdf(px, py + 1, w, h, r) - s
        const gl = Math.hypot(gx, gy) || 1
        dx += (-gx / gl) * m * push
        dy += (-gy / gl) * m * push
      }
      dx *= strength
      dy *= strength
      DX[i] = dx
      DY[i] = dy
      max = Math.max(max, Math.abs(dx), Math.abs(dy))
    }
  }
  const scale = Math.ceil(max * 2 + 2)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const im = ctx.createImageData(w, h)
  const d = im.data
  for (let i = 0; i < N; i++) {
    const o = i * 4
    if (IN[i]) {
      d[o] = Math.round(128 + (DX[i] / (scale / 2)) * 127)
      d[o + 1] = Math.round(128 + (DY[i] / (scale / 2)) * 127)
    } else {
      d[o] = d[o + 1] = 128
    }
    d[o + 2] = 128
    d[o + 3] = 255
  }
  ctx.putImageData(im, 0, 0)
  return { url: c.toDataURL(), scale }
}

const dense = () => (window.devicePixelRatio || 1) >= 1.5

// Presets (DESIGN.md 4.3), w and h in px.
export const PRESET = {
  // Dispersion only on dense screens. feDisplacementMap samples the nearest pixel, so any
  // per-channel offset rounds to whole device pixels: at 1x that is a 1px red and cyan
  // patch on the type at any k (v2/shots/site/r1/lens-crop.png); at 2x it is half a
  // CSS pixel and reads as glass.
  lens: (w, h, phone) => ({ r: h / 2, mag: 1.16, bezel: Math.round(h * 0.2), push: Math.round(h * (phone ? 0.18 : 0.22)), blur: phone ? 0 : 0.45, disp: phone || !dense() ? 0 : 0.008 }),
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
let seq = 0
export function lensFilter(preset, w, h, strength = 1) {
  w = Math.max(8, Math.round(w))
  h = Math.max(8, Math.round(h))
  const phone = window.innerWidth <= 640
  const key = `${preset}-${w}x${h}-${strength}-${phone ? 'p' : 'd'}${dense() ? '2' : '1'}`
  if (cache.has(key)) return cache.get(key)
  const p = (PRESET[preset] || PRESET.btn)(w, h, phone)
  const map = lensMap(w, h, p.r, p, strength)
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

// ---------- lines of type ----------
/** Each rendered line of an element's text: { left, right, top, bottom, cy } in page coordinates. */
export function lineBoxes(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const lines = []
  for (const r of range.getClientRects()) {
    if (r.width < 1 || r.height < 1) continue
    const cy = (r.top + r.bottom) / 2
    const L = lines.find((l) => Math.abs(l.cy - cy) < r.height * 0.35)
    if (L) {
      L.left = Math.min(L.left, r.left)
      L.right = Math.max(L.right, r.right)
    } else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, cy })
  }
  lines.sort((a, b) => a.cy - b.cy)
  return lines.map((l) => ({
    left: l.left + window.scrollX,
    right: l.right + window.scrollX,
    top: l.top + window.scrollY,
    bottom: l.bottom + window.scrollY,
    cy: l.cy + window.scrollY,
  }))
}

// ---------- the loupe: magnification where the backdrop cannot be displaced ----------
export const loupeAllowed = () =>
  !lensOn() &&
  html().dataset.transparency !== 'reduced' &&
  !mq('(prefers-reduced-transparency: reduce)') &&
  !mq('(prefers-contrast: more)') &&
  !mq('(forced-colors: active)')

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
  const H = lr.height
  // A word's box is its content area, centred on its line box: the line box starts lh/2 above that centre.
  const wr = words[0].getBoundingClientRect()
  const oy = (wr.top + wr.bottom) / 2 - lh / 2 - lr.top
  const ty = H / 2 + (oy - H / 2) * M
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
  document.querySelectorAll('.lens-line > .lens-static').forEach((lens) => {
    if (lensOn()) return
    loupeOn(lens, lens.parentElement)
  })
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
        defs?.replaceChildren()
      }
      run()
    }, 150)
  })
  window.addEventListener('ae:quiet', () => loupeAll())
}
