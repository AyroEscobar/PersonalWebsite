/*
  Dust with a reason: grit his feet (and the rock) kick back onto the painter's line, and the stones that
  lie on it. One Points draw: a ring of 48 specks simulated on the CPU (no allocation per frame) and up to
  24 stones, round anti-aliased dots in the figure's ink.

  A speck flies under gravity (9.81 m/s2 along world down, which in the slope frame leans back down the
  hill), lands on the line and stays there as a mark, fixed to the slope: as the camera follows him up the
  line the marks slide back under his feet, so he is no longer walking in place. Paint does not fade: a
  mark rests REST seconds, then shrinks out over SHRINK. The stones are permanent, a few to the metre at
  hashed places along the slope, in the posters too (so the first live frame still lands on the poster).

    const dust = makeDust()                 add dust.points to the slope group
    dust.kick(x, y, n, { vx, vy, t, s })    n specks from (x, y) in the slope frame (metres, m/s)
    dust.update(t, dt)                      advance and upload; returns how many specks are moving
    dust.stones(x0, x1)                     lay the stones between x0 and x1 (slope frame) once per window
    dust.setInk(hex), dust.setScale(pxPerMetre, dpr), dust.clear()

  Jitter comes from the value noise (noise.js) on the speck's serial number, so a recording, and
  __frameAt(t), replay the same grit.
*/
import * as THREE from 'three'
import { vnoise3 } from './noise.js'

const N = 48 // kicked grit
const M = 24 // stones: permanent grit on the line, fixed to the slope, so the ground itself can be seen to pass
const STONE_STEP = 0.45 // metres between stone cells; about two in three cells hold one
const REST = 6, SHRINK = 0.4
const G = 9.81
const SLOPE = THREE.MathUtils.degToRad(14)
// world down in the slope frame: back down the hill and into it
const GX = -G * Math.sin(SLOPE), GY = -G * Math.cos(SLOPE)
// a speck rests on top of the painter's line (the line's top edge is the foot point), never inside it
const FLOOR = 0.013
const Z = -0.35 // behind him and the rock (they occlude it), in front of nothing else
const rnd = (n, k) => vnoise3(n * 0.731 + k * 3.17, n * 0.317 + 4.1, 7.3 + k * 1.9)

export function makeDust() {
  const pos = new Float32Array((N + M) * 3), size = new Float32Array(N + M)
  const st = Array.from({ length: N }, () => ({ live: false, x: 0, y: 0, vx: 0, vy: 0, s0: 3, land: -1 }))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage))
  const u = { uInk: { value: new THREE.Color(0x17110d) }, uDpr: { value: 1 } }
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aSize; uniform float uDpr;
      void main() {
        gl_PointSize = aSize * uDpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float aa = fwidth(r) * 1.2;
        float m = 1.0 - smoothstep(1.0 - aa, 1.0, r);
        if (m <= 0.0) discard;
        gl_FragColor = linearToOutputTexel(vec4(uInk, 1.0)) * m;
      }`,
  })
  // premultiplied ink over whatever is behind (the clay shows through the canvas, or the band's target)
  mat.blending = THREE.CustomBlending
  mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor
  mat.blendSrcAlpha = THREE.OneFactor; mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
  const points = new THREE.Points(g, mat)
  points.frustumCulled = false
  points.renderOrder = 6
  let head = 0, serial = 0, moving = 0, alive = 0, pxPerM = 200, sizeK = 1
  // a mark sits in the line's top edge, a bump on the line
  const restY = (s) => FLOOR * 0.5 + (s * sizeK * 0.22) / pxPerM

  function kick(x, y, n, { vx = [-1.2, -0.6], vy = [0.3, 0.5], t = 0, s = [2.4, 3.2], spread = 0.04 } = {}) {
    for (let k = 0; k < n; k++) {
      const p = st[head]; head = (head + 1) % N
      const sn = ++serial
      p.live = true; p.land = -1
      p.x = x + (rnd(sn, 4) - 0.5) * spread; p.y = Math.max(y, FLOOR)
      p.vx = vx[0] + (vx[1] - vx[0]) * rnd(sn, 1)
      p.vy = vy[0] + (vy[1] - vy[0]) * rnd(sn, 2)
      p.s0 = s[0] + (s[1] - s[0]) * rnd(sn, 3)
      p.born = t
    }
  }

  function update(t, dt) {
    moving = 0; alive = 0
    for (let i = 0; i < N; i++) {
      const p = st[i]
      if (!p.live) { size[i] = 0; continue }
      alive++
      if (p.land < 0) {
        moving++
        p.vx += GX * dt; p.vy += GY * dt
        p.x += p.vx * dt; p.y += p.vy * dt
        const ry = restY(p.s0 * 0.6)
        if (p.y <= ry && p.vy < 0) { p.y = ry; p.land = t }
        size[i] = p.s0
      } else {
        // it settles to a smaller mark over a fifth of a second, rests, then shrinks out
        const age = t - p.land
        const k = Math.min(1, age / 0.2)
        let sz = p.s0 * (1 - 0.4 * k)
        if (age < 0.2 || age > REST) moving++
        if (age > REST) sz *= Math.max(0, 1 - (age - REST) / SHRINK)
        if (age > REST + SHRINK) { p.live = false; sz = 0 }
        size[i] = sz
        p.y = restY(sz)
      }
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = Z
    }
    g.attributes.position.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
    points.visible = alive > 0 || stonesOn
    return moving
  }

  // the stones between x0 and x1 (slope frame): cell k holds one at a hashed place and size, or none
  let stonesOn = false, sx0 = NaN, sx1 = NaN
  function stones(x0, x1) {
    if (Math.abs(x0 - sx0) < 0.02 && Math.abs(x1 - sx1) < 0.02) return
    sx0 = x0; sx1 = x1
    let j = N
    const k0 = Math.floor(x0 / STONE_STEP), k1 = Math.ceil(x1 / STONE_STEP)
    for (let k = k0; k <= k1 && j < N + M; k++) {
      if (rnd(k, 11) < 0.36) continue
      const sz = 1.5 + 1.6 * rnd(k, 12)
      pos[j * 3] = (k + 0.15 + 0.7 * rnd(k, 13)) * STONE_STEP; pos[j * 3 + 1] = restY(sz); pos[j * 3 + 2] = Z
      size[j] = sz
      j++
    }
    for (; j < N + M; j++) size[j] = 0
    stonesOn = true
    g.attributes.position.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
    points.visible = true
  }

  function clear() { for (const p of st) p.live = false; size.fill(0, 0, N); g.attributes.aSize.needsUpdate = true; points.visible = stonesOn; alive = moving = 0 }
  function setInk(hex) { u.uInk.value.set(hex) }
  // grit is a little larger where he is drawn larger (the hero at 1440), never under a pixel and a half
  function setScale(ppm, dpr) { pxPerM = Math.max(1, ppm); sizeK = THREE.MathUtils.clamp(ppm / 150, 0.9, 1.6); u.uDpr.value = dpr * sizeK; sx0 = NaN }
  points.visible = false
  return { points, kick, update, stones, clear, setInk, setScale, alive: () => alive, material: mat, dispose: () => { g.dispose(); mat.dispose() } }
}
