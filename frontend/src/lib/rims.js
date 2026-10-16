/*
  The scrim follows the light. The scene projects the rock once a frame ({ x, y, r } in CSS px);
  this module writes, on every .glass currently in view (v4's rim is a flat hairline, so there is
  no angle to write any more):

    --rx --ry --rr  the rock's centre relative to the element and its glow radius, which the scrim
                    turns into a radial darkening exactly where the rock shines through the glass,
                    so text keeps its contrast when a panel passes over the rock (phones mid-climb)
                    without darkening the whole panel

  At most every 33 ms. Before the scene runs, in the still tier, after a context loss and while the
  scene is paused, the last rock (or the poster's rock, measured with __bounds at t 2.3, p 0) is
  re-applied on scroll, since the panels move over a still frame. No React state is touched.
*/
const seen = new WeakMap()
const inView = new Set()
let io = null
let lastAt = 0
let lastB = null
let lastFrameAt = 0

// the poster's rock (centre and radius), measured with __bounds on the v4 poster frames (t 2.3, p 0):
// 1440x900 box 767,106 to 1355,681; 390x844 box 87,73 to 378,368
export function posterRock() {
  const w = window.innerWidth, h = window.innerHeight
  const portrait = w / h < 0.9
  return portrait ? { x: w * 0.596, y: h * 0.261, r: h * 0.175 } : { x: w * 0.737, y: h * 0.437, r: h * 0.319 }
}

const GLOW = 1.3 // the scrim pool reaches past the rock's edge, over its glow

let trailing = 0

function applyOne(el, b, force) {
  const rr = Math.max(1, (b.r || 0) * GLOW)
  const r = el.getBoundingClientRect()
  const prev = seen.get(el) ?? { rx: 1e9, ry: 1e9, rr: 0 }
  const rx = b.x - r.left, ry = b.y - r.top
  const next = { rx: prev.rx, ry: prev.ry, rr: prev.rr }
  if (force || Math.abs(rx - prev.rx) > 1 || Math.abs(ry - prev.ry) > 1 || Math.abs(rr - prev.rr) > 1) {
    el.style.setProperty('--rx', `${rx.toFixed(0)}px`)
    el.style.setProperty('--ry', `${ry.toFixed(0)}px`)
    el.style.setProperty('--rr', `${rr.toFixed(0)}px`)
    next.rx = rx; next.ry = ry; next.rr = rr
  }
  seen.set(el, next)
}

export function setRims(b, { force = false, fromScene = false } = {}) {
  const now = performance.now()
  if (fromScene) lastFrameAt = now
  lastB = b
  // a skipped call leaves a trailing one, so the last rock always lands (a fixed clock renders once per scroll)
  clearTimeout(trailing)
  if (!force && now - lastAt < 33) {
    trailing = setTimeout(() => setRims(lastB, { force: true }), 40)
    return
  }
  lastAt = now
  for (const el of inView) applyOne(el, b, force)
}

export function watchRims() {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  // glass that comes into view takes the last rock at once (the scene may not draw another frame)
  io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      inView.add(e.target)
      if (lastB) applyOne(e.target, lastB, true)
    } else inView.delete(e.target)
  }), { rootMargin: '80px' })
  const observeAll = () => document.querySelectorAll('.glass').forEach((el) => io.observe(el))
  observeAll()
  // glass that mounts later (the phone nav sheet, the kit) joins on the next tick
  const mo = new MutationObserver(() => observeAll())
  mo.observe(document.body, { childList: true, subtree: true })
  const facePoster = () => setRims(posterRock(), { force: true })
  // no scene frame for a while (still tier, poster, paused, lost): the panels still move over the
  // still frame, so the last rock is re-applied as they scroll
  let raf = 0
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      if (performance.now() - lastFrameAt > 120) setRims(lastB || posterRock(), { force: true })
    })
  }
  lastB = posterRock()
  requestAnimationFrame(() => requestAnimationFrame(facePoster))
  window.addEventListener('resize', facePoster)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    clearTimeout(trailing)
    io.disconnect()
    mo.disconnect()
    window.removeEventListener('resize', facePoster)
    window.removeEventListener('scroll', onScroll)
  }
}
