/*
  The camera (DESIGN.md 3.8), as built in a3's boulder.js. PerspectiveCamera fov 32 landscape,
  40 portrait (aspect < 0.9). F is his slope-frame x in world space; the camera sits at
  F + (sin(a) d, h, cos(a) d) and looks at F + (ax, ay, az), every term a lerp over p 0 to 1.
  Check out (p 0.2 to 0.45): landscape rides 1.5 m higher beside the cards; portrait lifts him
  into the top half above the cards. The wide (p0 0.55 to 1): an eased onset then a linear ramp
  to d 19.5, h 3.2, aimed at the rock plus (-3.4, 0.4, 0), so the pale sky fills the upper 40%.
  Pointer parallax on fine pointers only: a + 0.03 x, h + 0.03 d y, smoothed at 3 /s.
*/
import * as THREE from 'three'

const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) }
const bump = (x, a, b, e = 0.06) => sstep(a - e, a + e, x) * (1 - sstep(b - e, b + e, x))

export const CAM = {
  land: { a: [-0.58, -0.32], d: [10.2, 14.5], h: [3.3, 6.0], ax: [0.1, -1.2], ay: [1.95, 1.6], az: [-0.55, -0.3], fov: 32 },
  // the wide (contact): pulls out over p 0.55..1 to d, h above him, aimed at the rock plus aim (world m)
  wide: { p0: 0.55, d: 19.5, h: 3.2, aim: [-3.4, 0.4, 0], dP: 20, hP: 0.8, aimP: [0, -6.5, 0] },
  portrait: { a: [-0.36, -0.21], d: [9.2, 20], h: [1.05, 6.2], ax: [0.5, 1.2], ay: [-0.2, 0.6], az: [0.13, 0], fov: 40, co: [-0.7, -1.6, 1.2] },
}

export function makeCamera() {
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 1200)
  const aim = new THREE.Vector3(), aimB = new THREE.Vector3(), tmpAim = new THREE.Vector3()
  /** p: progress; F: his world position (feet); Bcam: the rock's world centre (camera-shifted); ptr: { x, y } parallax; size: [w, h] */
  function place(p, F, Bcam, ptr, [w, h0]) {
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
    a += ptr.x * 0.03
    h += ptr.y * d * 0.03
    cam.position.set(F.x + Math.sin(a) * d, F.y + h, F.z + Math.cos(a) * d)
    cam.aspect = w / h0
    cam.updateProjectionMatrix()
    cam.lookAt(aim)
  }
  return { cam, place }
}
