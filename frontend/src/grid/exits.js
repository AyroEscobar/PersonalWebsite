/*
  Off-grid exits (PLAN.md 4.3, r1 M15). Owned by A. New York City and
  Waterloo are not on the map, so their lines are drawn only where they
  leave it: the last STRETCH px before the frame edge, at the true bearing
  from the Texas node they leave from, with the city name set level at the
  edge like an exit sign. NightGrid draws the signs in the DOM; the WebGL
  layer runs the ping's spark along the same stretch. Both use exitOf(), in
  the map viewport's own px (.ng-view, which the canvas fills exactly).

  No imports, so the lazy canvas chunk can carry it for a few hundred bytes.
*/

export const STRETCH = 120

/** Insets that keep a sign off the bars and the frame's very edge. */
export function exitInsets() {
  let bar = 56
  if (typeof document !== 'undefined') {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'))
    if (Number.isFinite(v)) bar = v
  }
  return { top: bar + 22, right: 20, bottom: 20, left: 20 }
}

/** Unit vector on screen for a bearing in degrees (0 north, 90 east; y points down). */
export const bearingVec = (deg) => {
  const r = (deg * Math.PI) / 180
  return [Math.sin(r), -Math.cos(r)]
}

/**
 * Where a ray from (px, py) along (ux, uy) leaves the box [0, w] x [0, h]
 * shrunk by `inset`. Returns { x, y, sx, sy, side, t } (the edge point, the
 * start of the drawn stretch, which edge, and the distance to the edge), or
 * null when the start point is already outside the box.
 */
export function exitOf(px, py, ux, uy, w, h, inset = exitInsets()) {
  const x0 = inset.left
  const x1 = w - inset.right
  const y0 = inset.top
  const y1 = h - inset.bottom
  if (px < x0 || px > x1 || py < y0 || py > y1) return null
  let t = Infinity
  let side = null
  const tryT = (tt, s) => {
    if (tt > 0 && tt < t) {
      t = tt
      side = s
    }
  }
  if (ux > 1e-6) tryT((x1 - px) / ux, 'right')
  if (ux < -1e-6) tryT((x0 - px) / ux, 'left')
  if (uy > 1e-6) tryT((y1 - py) / uy, 'bottom')
  if (uy < -1e-6) tryT((y0 - py) / uy, 'top')
  if (!Number.isFinite(t)) return null
  const run = Math.min(STRETCH, t)
  return { x: px + ux * t, y: py + uy * t, sx: px + ux * (t - run), sy: py + uy * (t - run), side, t }
}
