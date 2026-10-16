/*
  The camera (DESIGN.md 3.8), as built in a3's boulder.js. PerspectiveCamera fov 32 landscape,
  40 portrait (aspect < 0.9). F is his slope-frame x in world space; the camera sits at
  F + (sin(a) d, h, cos(a) d) and looks at F + (ax, ay, az), every term a lerp over p 0 to 1.
  Check out (p 0.2 to 0.45): landscape rides 1.5 m higher beside the cards; portrait lifts him
  into the top half above the cards. The wide (p0 0.55 to 1): an eased onset then a linear ramp
  to d 19.5, h 3.2, aimed at the rock plus (-3.4, 0.4, 0), so the pale sky fills the upper 40%.
  Pointer parallax on fine pointers only: a + 0.015 x, h + 0.015 d y, smoothed at 3 /s.

  v4 framing (measured with __bounds at t 2.3, p 0): at 1440x900 the man and the rock sit under the
  nav and right of the hero plate (rock top 106, man from x 662, 306 px tall); at 390x844 the whole
  rock and the man stand between the header and the plate (rock top 73, feet 447, the plate at 461).
  The fit: the page passes the free room at p 0 (frame: under the header, beside or above the plate,
  inside the gutters; src/hero/Stage.jsx). If the composite would not fit (a shorter phone, a narrow
  laptop), the camera zooms out (never under 0.75) and shifts just enough, then lets go of it over
  p 0.02 to 0.2. At 1440x900 and 390x844 the fit is the identity, so the posters are this frame.
*/
import * as THREE from 'three'

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) }
const bump = (x, a, b, e = 0.06) => sstep(a - e, a + e, x) * (1 - sstep(b - e, b + e, x))

export const CAM = {
  land: { a: [-0.58, -0.32], d: [10.2, 14.5], h: [4.6, 6.0], ax: [-0.6, -1.2], ay: [2.46, 1.6], az: [-0.55, -0.3], fov: 32 },
  // the wide (contact): pulls out over p 0.55..1 to d, h above him, aimed at the rock plus aim (world m)
  wide: { p0: 0.55, d: 19.5, h: 3.2, aim: [-3.4, 0.4, 0], dP: 20, hP: 0.8, aimP: [0, -6.5, 0] },
  portrait: { a: [-0.36, -0.21], d: [15.7, 20], h: [1.6, 6.2], ax: [1.15, 1.2], ay: [-0.03, 0.6], az: [0.13, 0], fov: 40, co: [-0.7, -1.6, 1.2] },
  // the composite (rock and man together) at p 0 for the frames above, in frame heights from the frame's
  // centre [x0, y0, x1, y1]: land 662..1355 x 106..880 at 1440x900, portrait 23..378 x 73..447 at 390x844
  fit: { land: [-0.0644, -0.3822, 0.7056, 0.4778], portrait: [-0.2038, -0.4135, 0.2168, 0.0296], kMin: 0.75 },
}

export function makeCamera() {
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 3200)
  const aim = new THREE.Vector3(), aimB = new THREE.Vector3(), tmpAim = new THREE.Vector3()
  /** p: progress; F: his world position (feet); Bcam: the rock's world centre (camera-shifted); ptr: { x, y } parallax;
      size: [w, h]; frame: the free room at p 0 { x0, y0, x1, y1 } in CSS px, or null */
  function place(p, F, Bcam, ptr, [w, h0], frame = null) {
    const portrait = w / h0 < 0.9
    const K = portrait ? CAM.portrait : CAM.land
    let a = lerp(K.a[0], K.a[1], p), d = lerp(K.d[0], K.d[1], p), h = lerp(K.h[0], K.h[1], p)
    const co = bump(p, 0.2, 0.45)
    if (!portrait) h += 1.5 * co
    aim.set(F.x + lerp(K.ax[0], K.ax[1], p) + (portrait ? K.co[0] * co : 0), F.y + lerp(K.ay[0], K.ay[1], p) + (portrait ? K.co[1] * co : 0), F.z + lerp(K.az[0], K.az[1], p))
    if (portrait) h += K.co[2] * co
    cam.fov = K.fov
    // the wide: a linear ramp over p0..1 (its rate per pixel of scroll is then flat; an eased ramp peaked in
    // the stack section, which has fewer pixels per unit of p), so the pull-out never lurches
    const W = CAM.wide, cu = clamp((p - W.p0) / (1 - W.p0), 0, 1), ce = 0.2
    const c = (cu < ce ? cu * cu / (2 * ce) : cu - ce / 2) / (1 - ce / 2)
    d = lerp(d, portrait ? W.dP : W.d, c); h = lerp(h, portrait ? W.hP : W.h, c)
    const wa = portrait ? W.aimP : W.aim
    aim.lerp(aimB.copy(Bcam).add(tmpAim.set(wa[0], wa[1], wa[2])), c)
    a += ptr.x * 0.015
    h += ptr.y * d * 0.015
    cam.position.set(F.x + Math.sin(a) * d, F.y + h, F.z + Math.cos(a) * d)
    cam.aspect = w / h0
    // the fit (the hero only): zoom out and shift so the composite sits in the free room
    const wgt = frame ? 1 - sstep(0.02, 0.2, p) : 0
    let k = 1, dx = 0, dy = 0
    if (wgt > 0) {
      const [X0, Y0, X1, Y1] = portrait ? CAM.fit.portrait : CAM.fit.land
      k = clamp(Math.min((frame.x1 - frame.x0) / ((X1 - X0) * h0), (frame.y1 - frame.y0) / ((Y1 - Y0) * h0)), CAM.fit.kMin, 1)
      const x0 = w / 2 + X0 * h0 * k, x1 = w / 2 + X1 * h0 * k, y0 = h0 / 2 + Y0 * h0 * k, y1 = h0 / 2 + Y1 * h0 * k
      // move only as far as it takes; the left edge wins over the right, the top over the bottom
      if (x1 > frame.x1) dx = frame.x1 - x1
      if (x0 + dx < frame.x0) dx = frame.x0 - x0
      if (y1 > frame.y1) dy = frame.y1 - y1
      if (y0 + dy < frame.y0) dy = frame.y0 - y0
      // a pixel or two is font metrics, not a different screen: the reference frames stay exact
      if (Math.abs(dx) < 2) dx = 0
      if (Math.abs(dy) < 2) dy = 0
      if (k > 0.995) k = 1
      k = 1 + (k - 1) * wgt; dx *= wgt; dy *= wgt
    }
    if (k !== 1) cam.fov = (2 * Math.atan(Math.tan((K.fov * Math.PI) / 360) / k) * 180) / Math.PI
    if (dx || dy) cam.setViewOffset(w, h0, -dx, -dy, w, h0)
    else if (cam.view?.enabled) cam.clearViewOffset()
    cam.updateProjectionMatrix()
    cam.lookAt(aim)
  }
  return { cam, place }
}
