/*
  Scroll progress (DESIGN.md 3.9). Section tops are the anchors of the climb:
  hero 0..0.2, check out 0.2..0.45, experience 0.45..0.7, stack 0.7..0.85, contact 0.85..1.
  progress() is piecewise linear between them, re-measured on resize, load and font load.
  The scene follows the target with a critically damped spring (omega 11 rad/s), stepped
  exactly per frame, which settles in about 0.4 s and cannot overshoot.

    const sp = makeProgress()        sp.progress(), sp.measure(), sp.dispose()
    const s = makeSpring(11)         s.step(target, dt) -> position; s.set(p); s.pos; s.vel
*/
const ANCHORS = [['top', 0], ['check-out', 0.2], ['experience', 0.45], ['stack', 0.7], ['contact', 0.85]]

export function makeProgress({ kitEnd = 0.16 } = {}) {
  const d = document.documentElement
  let anchors = []
  function measure() {
    const max = Math.max(1, d.scrollHeight - innerHeight)
    anchors = ANCHORS.filter(([id]) => document.getElementById(id)).map(([id, p]) => [Math.min(max, document.getElementById(id).offsetTop), p])
    if (anchors.length < 2) { anchors = [[0, 0], [max, kitEnd]]; return } // the kit: a short climb inside the hero
    anchors[0][0] = 0
    anchors.push([max, 1])
  }
  function progress() {
    const y = scrollY
    for (let i = anchors.length - 1; i > 0; i--) {
      const [y0, p0] = anchors[i - 1], [y1, p1] = anchors[i]
      if (y >= y0) return y1 > y0 ? p0 + (p1 - p0) * Math.min(1, (y - y0) / (y1 - y0)) : p1
    }
    return 0
  }
  measure()
  addEventListener('resize', measure)
  addEventListener('load', measure)
  document.fonts?.ready?.then(measure)
  return { progress, measure, anchors: () => anchors, dispose: () => { removeEventListener('resize', measure); removeEventListener('load', measure) } }
}

export function makeSpring(w = 11) {
  const s = { pos: 0, vel: 0 }
  s.set = (p) => { s.pos = p; s.vel = 0 }
  s.step = (target, dt) => {
    if (dt <= 0) return s.pos
    const e = Math.exp(-w * dt), dx = s.pos - target
    const nx = (dx + (s.vel + w * dx) * dt) * e
    s.vel = (s.vel - w * (s.vel + w * dx) * dt) * e
    s.pos = target + nx
    return s.pos
  }
  return s
}
