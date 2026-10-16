/*
  The world around the mountain (DESIGN.md 3.5): the sky dome, the stars, the far ridge,
  the city carpet and the rain. Ported from v3/prototypes/a3/src/scene/sky.js and the
  makeCity / makeRain halves of its terrain.js.

    makeSky()      gradient dome drawn inside-out, not fogged, not tone mapped, dithered so the
                   gradient never bands. Deep navy overhead, a teal band at the horizon, a soft
                   blue glow on the city side and a neutral haze opposite (no pink). uDawn (0 to 0.35 over the
                   last 15% of scroll) lifts the lower third of the sky to a cold pale grey-blue: no
                   warm term anywhere.
    makeStars()    a few sharp stars, above the horizon only, that fade with the dawn band.
    makeRidge()    a far mountain silhouette with air in front of it, lighter than the near slope and
                   darker than the sky; lifts with uDawn.
    makeCity()     additive points far below over a plain that fades into the sky: a calm carpet of
                   light under the horizon, never beside him.
    makeRain()     sparse tapered streaks, below the camera's eye line and never within 1.5 m of
                   the man (v4 does not create it: the calm scene has no rain).
*/
import * as THREE from 'three'
import { fbm, hash } from './terrain.js'

export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uGlowAMix: { value: 1 }, uDawn: { value: 0 },
      uTop: { value: new THREE.Color(0x05070f) }, uHorizon: { value: new THREE.Color(0x12304a) },
      uGlowA: { value: new THREE.Color(0x0c5a70) }, uGlowB: { value: new THREE.Color(0x2b2a3a) }, uDawnCol: { value: new THREE.Color(0xa9d8f0) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uGlowAMix, uDawn; uniform vec3 uTop, uHorizon, uGlowA, uGlowB, uDawnCol; varying vec3 vP;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      float h = clamp(vP.y, -0.2, 1.0);
      float horizon = exp(-h * 7.0);
      vec3 col = mix(uTop, uHorizon, horizon);
      col += uGlowA * horizon * smoothstep(0.2, 1.0, -vP.z) * 0.5 * uGlowAMix;
      col += uGlowB * horizon * smoothstep(0.2, 1.0, vP.z * 0.3 - vP.x * 0.7) * 0.45;
      col = mix(col, uTop * 0.6, smoothstep(0.55, 1.0, h));
      // above the weather: the lower third goes cold and pale
      col = mix(col, uDawnCol, uDawn * smoothstep(0.62, -0.08, h));
      gl_FragColor = vec4(col, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
      // dither after the colour-space conversion: one LSB of noise kills the banding
      gl_FragColor.rgb += (h21(gl_FragCoord.xy) - 0.5) / 255.0;
    }`,
  })
  const m = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), mat)
  m.frustumCulled = false
  m.renderOrder = -10
  return m
}

export function makeStars({ count = 260, radius = 290 } = {}) {
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3)
  const h = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s) }
  for (let i = 0; i < count; i++) {
    const a = h(i, 1) * Math.PI * 2, e = 0.12 + Math.pow(h(i, 2), 0.7) * 0.8 // elevation: above the horizon haze only
    const r = Math.cos(e) * radius
    pos.set([Math.cos(a) * r, Math.sin(e) * radius, Math.sin(a) * r], i * 3)
    const b = 0.35 + h(i, 3) * 0.65
    col.set([b * 0.9, b * 0.97, b], i * 3)
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const m = new THREE.PointsMaterial({ size: 1.6, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false })
  const p = new THREE.Points(g, m)
  p.frustumCulled = false
  p.renderOrder = -9
  return p
}

// The far ridge stands beyond the city (so the lights sit in front of it) and runs far down,
// so no sky can show under its lower edge. It is drawn after the sky (renderOrder). It has air in
// front of it: its colour sits near the sky's horizon band (0x0c2236 at night, lifting with uDawn),
// lightens toward its top edge, and mixes toward the dome's own horizon colour, so it reads as a
// distant mountain, lighter than the near slope and darker than the sky, never a black cutout.
// scale / origin: the ridge can stand farther out with the same silhouette, scaled about a point near the
// hero camera (origin), so every camera sees a3's outline while the valley floor runs further before it.
export function makeRidge({ dist = 470, width = 2400, height = 170, segs = 300, color = 0x0c2236, lift = 0x4a6886, skyUniforms = null, scale = 1, origin = [0, 0, 0] } = {}) {
  const s = scale
  width *= s; height *= s
  const g = new THREE.PlaneGeometry(width, height, segs, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    if (y > 0) pos.setY(i, (fbm(x / s * 0.004 + 11, 0.3) - 0.3) * height * 1.2 + Math.sin(x / s * 0.0026) * height * 0.3)
    else pos.setY(i, -600 * s)
  }
  const sky = skyUniforms || { uGlowAMix: { value: 1 }, uDawn: { value: 0 }, uHorizon: { value: new THREE.Color(0x12324a) }, uGlowA: { value: new THREE.Color(0x0c5a70) }, uGlowB: { value: new THREE.Color(0x2b2a3a) }, uDawnCol: { value: new THREE.Color(0xa9d8f0) } }
  const [ox, oy, oz] = origin
  const y0 = oy + (-60 - oy) * s
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { uBase: { value: new THREE.Color(color) }, uLift: { value: new THREE.Color(lift) }, uY0: { value: y0 }, uS: { value: s }, uGlowAMix: sky.uGlowAMix, uDawn: sky.uDawn, uHorizon: sky.uHorizon, uGlowA: sky.uGlowA, uGlowB: sky.uGlowB, uDawnCol: sky.uDawnCol },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uBase, uLift, uHorizon, uGlowA, uGlowB, uDawnCol; uniform float uY0, uS, uGlowAMix, uDawn; varying vec3 vW;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float k = uDawn / 0.35;
        vec3 col = mix(uBase, uLift, k);
        vec3 dir = normalize(vW - cameraPosition);
        vec3 hor = uHorizon + uGlowA * smoothstep(0.2, 1.0, -dir.z) * 0.5 * uGlowAMix + uGlowB * smoothstep(0.2, 1.0, dir.z * 0.3 - dir.x * 0.7) * 0.45;
        hor = mix(hor, uDawnCol, uDawn * 0.9);
        // air: more of the sky's colour toward the top edge, where the ridge is thinnest against it
        float top = smoothstep(uY0 - 60.0 * uS, uY0 + 150.0 * uS, vW.y);
        col = mix(col, hor, 0.14 + 0.26 * top);
        gl_FragColor = vec4(col, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
        gl_FragColor.rgb += (h21(gl_FragCoord.xy) - 0.5) / 255.0;
      }`,
  })
  const m = new THREE.Mesh(g, mat)
  m.position.set(ox * (1 - s), y0, oz + (-dist - oz) * s)
  m.frustumCulled = false
  return m
}

// The city far below: lights on a street grid over a dark valley floor, a carpet of light under the
// cloud. Round soft points, pale blue, warm white and peach, a dense core that thins out, a few low
// towers. Additive, no fog, not tone mapped. Calm: small points, moderate brightness, no sparkle.
//
// The valley haze (REFINE.md build item 1). Haze is thick at a grazing angle and thin straight down:
// the light from a point at depression angle a crosses an optical depth that grows as k / sin(a)
// (raised to the 4th power here, so the cloud has an edge a few degrees wide, not a smear), so the lights
// show through only where the camera looks steeply down, which on this mountain is below his feet,
// and the far, shallow lights stay under the cloud instead of floating beside him. k falls as he
// climbs (setHaze, driven by progress in boulder.js): the cloud thins and the carpet spreads.
// The same transmittance mixes the valley floor into the far ridge's own foot colour, so the floor
// and the ridge never meet on an edge and no bright wedge of plain ever shows past the cliff.
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d'), grd = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,0.7)'); grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace
  return t
}
/** the haze transmittance for a point seen from the camera, the same formula as the shaders */
export function hazeT(k, camPos, p) {
  const dx = p.x - camPos.x, dy = camPos.y - p.y, dz = p.z - camPos.z
  const sinA = dy / Math.sqrt(dx * dx + dy * dy + dz * dz)
  return Math.exp(-((k / Math.max(sinA, 0.02)) ** 4))
}
const HAZE_GLSL = 'float hazeT(vec3 w){ vec3 d = w - cameraPosition; float s = -d.y / length(d); float q = uHazeK / max(s, 0.02); q *= q; return exp(-q * q); }'
// skyUniforms: the sky dome's uniforms; ridge: the far ridge mesh. Both shared, so the floor hazes into
// exactly the colour the ridge has at its foot, and is all haze by the time it reaches the ridge.
export function makeCity({ count = 2600, below = -200, near = 500, far = 1100, cx = -110, width = 1000, size = 3.2, skyUniforms = null, ridge } = {}) {
  const grp = new THREE.Group()
  const uHazeK = { value: 0.3 }
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), c = new THREE.Color()
  const grid = 13 * (far - near) / 380 // the street grid keeps a3's spacing in angle at this distance
  const zc = -(near + far) / 2 + 10
  const span = (far - near) / 2.53 // a3's core falloff (150 m over 380 m of depth), scaled
  let n = 0
  for (let i = 0; n < count && i < count * 6; i++) {
    let x = cx + (hash(i, 1) - 0.5) * width, z = -near - hash(i, 2) * (far - near)
    const dens = Math.exp(-(((x - cx - 30) / (width * 0.29)) ** 2) - (((z - zc) / span) ** 2)) * 0.8 + fbm(x * 0.012 * 380 / (far - near), z * 0.012 * 380 / (far - near), 3) * 0.55
    if (hash(i, 9) > dens) continue
    if (hash(i, 4) < 0.5) z = Math.round(z / grid) * grid + (hash(i, 5) - 0.5) * 1.2
    else x = Math.round(x / grid) * grid + (hash(i, 5) - 0.5) * 1.2
    const tower = hash(i, 8) > 0.95 && dens > 0.6
    const y = below + 0.4 + (tower ? Math.pow(hash(i, 3), 1.5) * 24 : 0)
    pos.set([x, y, z], n * 3)
    const k = hash(i, 6)
    c.set(k < 0.5 ? 0x8fc8ea : k < 0.86 ? 0xfff1e6 : 0xffd9b8).multiplyScalar(0.55 + hash(i, 7) * 0.9)
    col.set([c.r, c.g, c.b], n * 3)
    n++
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3))
  g.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, n * 3), 3))
  const m = new THREE.PointsMaterial({ size, map: dotTexture(), vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uHazeK = uHazeK
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uHazeK;\n${HAZE_GLSL}`)
      .replace('#include <color_vertex>', '#include <color_vertex>\nvColor.rgb *= hazeT((modelMatrix * vec4(position, 1.0)).xyz);')
  }
  m.customProgramCacheKey = () => 'city-haze'
  const pts = new THREE.Points(g, m)
  grp.add(pts)
  grp.userData.points = pts
  const sky = skyUniforms || {
    uGlowAMix: { value: 1 }, uDawn: { value: 0 }, uHorizon: { value: new THREE.Color(0x12324a) }, uGlowA: { value: new THREE.Color(0x0c5a70) }, uGlowB: { value: new THREE.Color(0x2b2a3a) }, uDawnCol: { value: new THREE.Color(0xa9d8f0) },
  }
  // the valley floor: dark, with a little of the light the city throws up into its own haze (kept dim:
  // the carpet is the points, never a glowing lake), hazing into the far ridge's foot colour
  const depth = far - near + 2 * span
  const plain = new THREE.Mesh(new THREE.PlaneGeometry(width * 4, depth * 2.4), new THREE.ShaderMaterial({
    fog: false, depthWrite: true,
    uniforms: {
      uA: { value: new THREE.Color(0x0b4a5c) }, uB: { value: new THREE.Color(0x22283a) }, uBase: { value: new THREE.Color(0x04060c) },
      uCore: { value: new THREE.Vector2(cx + 30, zc) }, uSpan: { value: new THREE.Vector2(width * 0.33, span) }, uHazeK,
      uRidge: ridge.material.uniforms.uBase, uRidgeLift: ridge.material.uniforms.uLift, uY0: ridge.material.uniforms.uY0, uS: ridge.material.uniforms.uS,
      uRidgeZ: { value: ridge.position.z }, uFloorY: { value: below - 2 },
      uGlowAMix: sky.uGlowAMix, uDawn: sky.uDawn, uHorizon: sky.uHorizon, uGlowA: sky.uGlowA, uGlowB: sky.uGlowB, uDawnCol: sky.uDawnCol,
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uA, uB, uBase, uHorizon, uGlowA, uGlowB, uDawnCol, uRidge, uRidgeLift; uniform float uGlowAMix, uDawn, uHazeK, uY0, uS, uRidgeZ, uFloorY; uniform vec2 uCore, uSpan; varying vec3 vW;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      ${HAZE_GLSL}
      void main(){ vec2 p = (vW.xz - uCore) / uSpan;
        vec3 col = uBase + uA * exp(-dot(p, p)) * 0.22 + uB * exp(-dot(p - vec2(0.5, 0.25), p - vec2(0.5, 0.25)) * 1.6) * 0.12;
        // the far ridge's foot colour in this direction (makeRidge's terms at its lower edge)
        vec3 dir = normalize(vW - cameraPosition);
        vec3 hor = uHorizon + uGlowA * smoothstep(0.2, 1.0, -dir.z) * 0.5 * uGlowAMix + uGlowB * smoothstep(0.2, 1.0, dir.z * 0.3 - dir.x * 0.7) * 0.45;
        hor = mix(hor, uDawnCol, uDawn * 0.9);
        float top = smoothstep(uY0 - 60.0 * uS, uY0 + 150.0 * uS, uFloorY);
        vec3 haze = mix(mix(uRidge, uRidgeLift, uDawn / 0.35), hor, 0.14 + 0.26 * top);
        // all haze over the last stretch before the ridge, so the floor never meets it on an edge
        float toRidge = smoothstep(0.55, 0.85, (cameraPosition.z - vW.z) / (cameraPosition.z - uRidgeZ));
        col = mix(haze, col, hazeT(vW) * (1.0 - toRidge));
        gl_FragColor = vec4(col, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
        gl_FragColor.rgb += (h21(gl_FragCoord.xy) - 0.5) / 255.0;
 }`,
  }))
  plain.rotation.x = -Math.PI / 2
  plain.position.set(cx, below - 2, zc)
  grp.add(plain)
  grp.userData.setHaze = (k) => { uHazeK.value = k }
  grp.userData.haze = () => uHazeK.value
  return grp
}

// Rain: a few hundred thin streaks, additive, low alpha, tapered from a bright head to a transparent tail
// (vertex colours), lengths 0.5 to 1.2 m, fading in and out at the top and bottom of the box so nothing
// pops. The box rides below the camera's eye line (boulder.js places it), so no streak crosses the sky,
// and update() takes the man's position in the box so no streak falls within `clear` metres of him.
export function makeRain({ count = 320, box = [34, 14, 34], clear = 1.5 } = {}) {
  const g = new THREE.BufferGeometry()
  const p = new Float32Array(count * 6), c = new Float32Array(count * 6), seeds = [], lens = [], tint = []
  for (let i = 0; i < count; i++) {
    const x = (hash(i, 11) - 0.5) * box[0], y = hash(i, 12) * box[1], z = (hash(i, 13) - 0.5) * box[2]
    const len = 0.5 + hash(i, 15) * 0.7
    p.set([x, y, z, x + 0.03, y - len, z], i * 6); seeds.push(hash(i, 14)); lens.push(len); tint.push(0.55 + hash(i, 16) * 0.45)
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3))
  g.setAttribute('color', new THREE.BufferAttribute(c, 3))
  const head = new THREE.Color(0x9fd8ff)
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }))
  lines.frustumCulled = false
  lines.userData.box = box
  const r2 = clear * clear
  lines.userData.update = (t, man = null) => {
    const a = g.attributes.position.array, cc = g.attributes.color.array
    for (let i = 0; i < count; i++) {
      const y0 = ((seeds[i] * box[1] - t * 8) % box[1] + box[1]) % box[1]
      a[i * 6 + 1] = y0; a[i * 6 + 4] = y0 - lens[i]
      let k = tint[i] * Math.min(1, y0 / 2) * Math.min(1, (box[1] - y0) / 2)
      if (man) { const dx = a[i * 6] - man.x, dz = a[i * 6 + 2] - man.z; const d2 = dx * dx + dz * dz; if (d2 < r2 * 2.25) k *= Math.min(1, Math.max(0, (Math.sqrt(d2) - clear) / (clear * 0.5))) }
      cc[i * 6] = head.r * k; cc[i * 6 + 1] = head.g * k; cc[i * 6 + 2] = head.b * k
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true
  }
  return lines
}
