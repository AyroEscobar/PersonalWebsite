/*
  Off-grid exits (PLAN.md 4.3, r1 M15, r2 U2). Owned by A. New York City and
  Waterloo are not on the map, so their lines are drawn only where they
  leave it: the last stretch before the frame edge, at the true bearing from
  the Texas node they leave from, with the city name set level beside an
  arrow at the line's end, like an exit sign. NightGrid draws the signs in
  the DOM and publishes the drawn stretch (live.exits); the WebGL layer runs
  the ping's spark along that same stretch. Both work in the map viewport's
  own px (.ng-view, which the canvas fills exactly).

  The stretch is min(120px, 14% of the frame width), so on a phone it never
  reaches back across the city. Under 480px wide there are no lines at all:
  the two signs sit as one row along the map's top edge (NightGrid).

  No imports, so the lazy canvas chunk can carry it for a few hundred bytes.
*/

export const STRETCH = 120
export const STRETCH_SHARE = 0.14
// Under this frame width the lines are dropped and the signs share one row.
export const ROW_BELOW = 480
// Wider than this, the signs keep to the content frame, not the screen edge.
export const FRAME_FROM = 2000
// The content frame (.page): --page-max plus the desktop rail.
const FRAME_W = 1360 + 72

/** The drawn stretch for a frame this wide. */
export const stretchFor = (w) => Math.min(STRETCH, w * STRETCH_SHARE)

/** Insets that keep a sign off the bars and the frame's very edge. */
export function exitInsets(w = 0) {
  let bar = 56
  if (typeof document !== 'undefined') {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'))
    if (Number.isFinite(v)) bar = v
  }
  // Very wide screens: the copy, the key and the bar keep to a centered
  // frame, so the exits do too (r2 U2).
  const side = w >= FRAME_FROM ? Math.max(20, (w - FRAME_W) / 2 + 20) : 20
  return { top: bar + 22, right: side, bottom: 20, left: 20 }
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
export function exitOf(px, py, ux, uy, w, h, inset = exitInsets(w), stretch = stretchFor(w)) {
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
  const run = Math.min(stretch, t)
  return { x: px + ux * t, y: py + uy * t, sx: px + ux * (t - run), sy: py + uy * (t - run), side, t }
}

/** Where segment a-b crosses segment c-d, as the share along a-b (0..1), or -1. */
export function crossAt(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax
  const ry = by - ay
  const sx = dx - cx
  const sy = dy - cy
  const den = rx * sy - ry * sx
  if (Math.abs(den) < 1e-9) return -1
  const t = ((cx - ax) * sy - (cy - ay) * sx) / den
  const u = ((cx - ax) * ry - (cy - ay) * rx) / den
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1
}

/** Does the polyline [x, y, x, y, ...] touch the box { l, t, r, b }? */
export function lineHitsBox(pts, box) {
  const inside = (x, y) => x >= box.l && x <= box.r && y >= box.t && y <= box.b
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const [ax, ay, bx, by] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]]
    if (inside(ax, ay) || inside(bx, by)) return true
    if (
      crossAt(ax, ay, bx, by, box.l, box.t, box.r, box.t) >= 0 ||
      crossAt(ax, ay, bx, by, box.r, box.t, box.r, box.b) >= 0 ||
      crossAt(ax, ay, bx, by, box.l, box.b, box.r, box.b) >= 0 ||
      crossAt(ax, ay, bx, by, box.l, box.t, box.l, box.b) >= 0
    )
      return true
  }
  return false
}
