/*
  The glass rims face the rock (DESIGN.md 4.2). The scene projects the rock's
  centre once a frame; this module writes --rim on every .glass currently in
  view, at most every 33 ms and only when the angle moved more than 0.8
  degrees. Before the scene runs, and in the still tier, every rim faces the
  poster's rock (72%, 38% of the viewport on landscape; 60%, 30% on portrait).
  No React state is touched: it is a WeakMap and style properties.
*/
const seen = new WeakMap()
const inView = new Set()
let io = null
let lastAt = 0

export function posterRock() {
  const portrait = window.innerWidth / window.innerHeight < 0.9
  return portrait ? { x: window.innerWidth * 0.6, y: window.innerHeight * 0.3 } : { x: window.innerWidth * 0.72, y: window.innerHeight * 0.38 }
}

export function setRims(b, { force = false } = {}) {
  const now = performance.now()
  if (!force && now - lastAt < 33) return
  lastAt = now
  for (const el of inView) {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const ang = (Math.atan2(b.x - cx, -(b.y - cy)) * 180) / Math.PI
    const prev = seen.get(el) ?? 999
    if (force || Math.abs(ang - prev) > 0.8) {
      el.style.setProperty('--rim', `${ang.toFixed(1)}deg`)
      seen.set(el, ang)
    }
  }
}

export function watchRims() {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target))), { rootMargin: '80px' })
  const observeAll = () => document.querySelectorAll('.glass').forEach((el) => io.observe(el))
  observeAll()
  // glass that mounts later (the phone nav sheet, the kit) joins on the next tick
  const mo = new MutationObserver(() => observeAll())
  mo.observe(document.body, { childList: true, subtree: true })
  const facePoster = () => setRims(posterRock(), { force: true })
  requestAnimationFrame(facePoster)
  window.addEventListener('resize', facePoster)
  return () => {
    io.disconnect()
    mo.disconnect()
    window.removeEventListener('resize', facePoster)
  }
}
