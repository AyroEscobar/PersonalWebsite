/*
  The clear lens (DESIGN.md 4.3): the nav pill's backdrop really bends, in Chromium only. v2's
  lens.js trimmed to one job: an SVG displacement map sized to the nav, applied by glass.css as
  `backdrop-filter: var(--g-url) saturate(200%) brightness(1.08)` (html[data-lens='on'] .has-lens).
  No loupe, no reader, no dispersion split: the rock does the dispersion. Its own lazy chunk,
  imported by src/lib/client.js on idle after the first paint; budget 8 KB gz.

  The map: a convex squircle bezel with a Snell bend at n 1.5 (everything samples inward), a 2.5%
  interior zoom, sized to the element at 1x (the clear tier pre-blurs 6 px, so a 1x map is finer
  than anything it shows), smoothed so the field bends without steps. A ResizeObserver rebuilds it
  when the nav changes size (the phone's round button opening into its sheet), debounced 120 ms.

    startLens()   wire it up (idempotent); returns a stop function
*/
const NS = 'http://www.w3.org/2000/svg'
const BEZEL = 12
const PUSH = 10
const MAG = 1.025
const BLUR = 6

// is the backdrop able to take an SVG filter (Chromium), and does the page want glass at all
export function lensAllowed() {
  try {
    const mq = (s) => window.matchMedia?.(s).matches
    const chromium = !!navigator.userAgentData?.brands?.some((b) => /Chromium/i.test(b.brand))
    return (
      chromium &&
      CSS.supports('backdrop-filter', 'url(#x)') &&
      document.documentElement.dataset.transparency !== 'reduced' &&
      document.documentElement.dataset.tier !== 'lite' &&
      !mq('(prefers-reduced-transparency: reduce)') &&
      !mq('(prefers-contrast: more)') &&
      !mq('(forced-colors: active)')
    )
  } catch {
    return false
  }
}

function sdf(px, py, w, h, r) {
  const qx = Math.abs(px - w / 2) - (w / 2 - r)
  const qy = Math.abs(py - h / 2) - (h / 2 - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}
const sq = (t) => Math.pow(1 - Math.pow(1 - t, 4), 0.25)
const snell = (slope, n = 1.5) => {
  const th = Math.atan(slope)
  return Math.tan(th - Math.asin(Math.min(1, Math.sin(th) / n)))
}
const NORM = snell(1e6)
const bend = (t) => snell((sq(Math.min(1, t + 0.002)) - sq(Math.max(0, t - 0.002))) / 0.004) / NORM
const rod = (u, M) => Math.sign(u) * (Math.abs(u) / M + (1 - 1 / M) * Math.abs(u) ** 3)

function smooth(A, IN, W, H) {
  const T = new Float32Array(A.length)
  for (let pass = 0; pass < 2; pass++) {
    const horiz = pass === 0, src = horiz ? A : T, dst = horiz ? T : A
    const n = horiz ? W : H, lines = horiz ? H : W
    for (let l = 0; l < lines; l++) {
      for (let k = 0; k < n; k++) {
        const i = horiz ? l * W + k : k * W + l
        if (!IN[i]) { dst[i] = 0; continue }
        let sum = 0, cnt = 0
        for (let o = -1; o <= 1; o++) {
          const kk = k + o
          if (kk < 0 || kk >= n) continue
          const j = horiz ? l * W + kk : kk * W + l
          if (IN[j]) { sum += src[j]; cnt++ }
        }
        dst[i] = cnt ? sum / cnt : 0
      }
    }
  }
}

/** the displacement map for a w by h box with corner radius r, as a PNG data URL and its scale */
function lensMap(w, h, r) {
  const N = w * h
  const DX = new Float32Array(N), DY = new Float32Array(N), IN = new Uint8Array(N)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, px = x + 0.5, py = y + 0.5
      const s = sdf(px, py, w, h, r)
      if (s >= 0) continue
      IN[i] = 1
      const u = (px - w / 2) / (w / 2), v = (py - h / 2) / (h / 2)
      let dx = (rod(u, MAG) - u) * (w / 2), dy = (rod(v, MAG) - v) * (h / 2)
      const t = Math.min(1, -s / BEZEL)
      if (t < 1) {
        const m = bend(t)
        const sx = px < w / 2 ? -1 : 1, sy = py < h / 2 ? -1 : 1
        const qx = Math.abs(px - w / 2) - (w / 2 - r), qy = Math.abs(py - h / 2) - (h / 2 - r)
        let nx = 0, ny = 0
        if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = (sx * qx) / l; ny = (sy * qy) / l }
        else if (qx > qy) nx = sx
        else ny = sy
        dx -= nx * m * PUSH
        dy -= ny * m * PUSH
      }
      DX[i] = dx; DY[i] = dy
    }
  }
  smooth(DX, IN, w, h)
  smooth(DY, IN, w, h)
  let max = 1
  for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(DX[i]), Math.abs(DY[i]))
  const scale = Math.ceil(max * 2 + 2)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d'), im = ctx.createImageData(w, h), d = im.data
  for (let i = 0; i < N; i++) {
    d[i * 4] = Math.round(128 + (DX[i] / (scale / 2)) * 127)
    d[i * 4 + 1] = Math.round(128 + (DY[i] / (scale / 2)) * 127)
    d[i * 4 + 2] = 128
    d[i * 4 + 3] = 255
  }
  ctx.putImageData(im, 0, 0)
  return { url: c.toDataURL(), scale }
}

let defs = null
function defsEl() {
  if (defs?.isConnected) return defs
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  defs = document.createElementNS(NS, 'defs')
  svg.appendChild(defs)
  document.body.appendChild(svg)
  return defs
}

const cache = new Map()
function lensFilter(w, h, r) {
  const key = `${w}x${h}r${r}`
  if (cache.has(key)) return cache.get(key)
  const { url, scale } = lensMap(w, h, r)
  const id = `lens-nav-${cache.size + 1}`
  const f = document.createElementNS(NS, 'filter')
  f.setAttribute('id', id)
  f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('width', '100%'); f.setAttribute('height', '100%')
  f.setAttribute('color-interpolation-filters', 'sRGB')
  f.innerHTML =
    `<feImage href="${url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${BLUR}" result="soft"/>` +
    `<feDisplacementMap in="soft" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>`
  defsEl().appendChild(f)
  cache.set(key, id)
  return id
}

function apply(el) {
  const r = el.getBoundingClientRect()
  const w = Math.round(r.width), h = Math.round(r.height)
  if (w < 8 || h < 8) return
  const radius = Math.min(h / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2)
  el.style.setProperty('--g-url', `url(#${lensFilter(w, h, Math.round(radius))})`)
  el.classList.add('has-lens')
}

let started = null
export function startLens() {
  if (started) return started
  if (!lensAllowed()) return (started = () => {})
  const d = document.documentElement
  d.dataset.lens = 'on'
  const els = [...document.querySelectorAll('.glass--clear')]
  let t = 0
  const ro = new ResizeObserver(() => {
    clearTimeout(t)
    t = setTimeout(() => els.forEach(apply), 120)
  })
  els.forEach((el) => { apply(el); ro.observe(el) })
  started = () => {
    ro.disconnect()
    clearTimeout(t)
    delete d.dataset.lens
    els.forEach((el) => { el.classList.remove('has-lens'); el.style.removeProperty('--g-url') })
    started = null
  }
  return started
}
