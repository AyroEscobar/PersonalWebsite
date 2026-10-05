/*
  The mountain (DESIGN.md 3.4), ported from v3/prototypes/a3/src/scene/terrain.js.

    makeSlope({ length, width })           a noise-displaced slope mesh whose centre strip is a clean
                                           ramp (so the figure's ground stays y = 0 in the slope frame);
                                           makeSlopeAsync builds the same mesh in slices across tasks
    contourMaterial(opts)                  MeshStandardMaterial + stone relief (a procedural normal
                                           perturbation at 0.35 and 1.3 m), wet specular breakup, and a
                                           family of equal hairline contours, via onBeforeCompile.
                                           The two practicals inside the rock light it diffusely only:
                                           their specular is dropped so the wet ground never shows a
                                           coloured blob away from the rock.
    makeReflection()                       the rock's light on the wet ground, under the rock only
    makeContactShadow(size, opacity)       a soft dark disc that sits a centimetre over the ground
    fbm, hash                              the deterministic value noise the world shares
*/
import * as THREE from 'three'

// cheap value noise with fbm, deterministic
export function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export function fbm(x, y, oct = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); a *= 0.5; f *= 2.1 } return s }

// The slope's heights are computed in slices (a generator), so a slow phone never sees one long task
// (DESIGN.md 9): makeSlope runs it to the end at once, makeSlopeAsync yields between slices. Same mesh.
function* slopeSteps(g, { pathHalf, relief, cliff, slices }) {
  const pos = g.attributes.position, n = pos.count, per = Math.ceil(n / slices)
  for (let s0 = 0; s0 < n; s0 += per) {
    for (let i = s0, e = Math.min(n, s0 + per); i < e; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const az = Math.abs(z)
      // a flat path down the centre; the near side (+z) rises gently into broken rock,
      // the far side (-z) breaks off into a cliff that falls toward the city below.
      // Large smooth forms only: the fine octaves are kept small so the surface reads as stone, not noise.
      const side = THREE.MathUtils.smoothstep(az, pathHalf, pathHalf + 9)
      const rock = (fbm(x * 0.05 + 3.1, z * 0.05) - 0.45) * relief * side + (fbm(x * 0.3, z * 0.3, 3) - 0.5) * 0.25 * side
      // a soft swell beside the path so the contours bend even near him (never a straight line)
      const swell = THREE.MathUtils.smoothstep(az, 0.9, pathHalf + 2) * (fbm(x * 0.11 + 7.7, z * 0.17) - 0.5) * 0.9
      const near = z > 0 ? Math.pow(Math.max(0, z - pathHalf - 6), 1.25) * 0.12 : 0
      const far = z < cliff ? -Math.pow(-(z - cliff), 1.6) * 0.45 - fbm(x * 0.08, z * 0.08, 3) * 6 : 0
      pos.setY(i, rock + swell + near + far)
    }
    yield
  }
  g.computeVertexNormals()
}

function slopeParts({ length = 320, width = 120, segs = 440, material, pathHalf = 2.4, relief = 7, cliff = -9, slices = 8 } = {}) {
  const g = new THREE.PlaneGeometry(length, width, segs, Math.round(segs * width / length))
  g.rotateX(-Math.PI / 2) // x along the climb, z across, y up (slope frame)
  const m = new THREE.Mesh(g, material || contourMaterial())
  m.receiveShadow = true
  return { mesh: m, steps: slopeSteps(g, { pathHalf, relief, cliff, slices }) }
}

export function makeSlope(opts) {
  const { mesh, steps } = slopeParts(opts)
  for (const step of steps) void step
  return mesh
}

/** next: a function returning a promise that resolves on the next task (boulder.js) */
export async function makeSlopeAsync(opts, next) {
  const { mesh, steps } = slopeParts(opts)
  for (const step of steps) {
    void step
    await next()
  }
  return mesh
}

// the point-light loop of three's lights_fragment_begin, rewritten to add diffuse only (no specular)
function lightsNoPointSpecular() {
  const c = THREE.ShaderChunk.lights_fragment_begin
  const i = c.indexOf('#if ( NUM_POINT_LIGHTS > 0 )'), j = c.indexOf('#pragma unroll_loop_end', i)
  if (i < 0 || j < 0) return c
  const block = c.slice(i, j).replace(
    'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
    'reflectedLight.directDiffuse += directLight.color * saturate( dot( geometryNormal, directLight.direction ) ) * BRDF_Lambert( material.diffuseColor );',
  )
  return c.slice(0, i) + block + c.slice(j)
}

export function contourMaterial({ base = 0x1c2231, lineA = new THREE.Color(0.12, 1.05, 1.35), lineB = new THREE.Color(1.5, 0.2, 1.05), spacing = 1.0, strength = 1, wet = 0.6 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.5, metalness: 0.12, envMapIntensity: 1.0 })
  mat.userData.u = {
    uLineA: { value: lineA }, uLineB: { value: lineB }, uSpacing: { value: spacing }, uStrength: { value: strength }, uWet: { value: wet },
    uFigure: { value: new THREE.Vector3() }, uRock: { value: new THREE.Vector3() }, uDawn: { value: 0 },
    uDawnAlbedo: { value: new THREE.Color(0x2a3444) },
  }
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mat.userData.u)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; varying vec3 vN;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz; vN = normalize(mat3(modelMatrix) * objectNormal);')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vW; varying vec3 vN; uniform vec3 uLineA, uLineB, uFigure, uRock, uDawnAlbedo; uniform float uSpacing, uStrength, uWet, uDawn;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        // the stone height field: two octaves, 1.3 m and 0.35 m
        float hf(vec2 q){ return vn(q * 0.77 + 1.7) * 1.0 + vn(q * 2.9 + 5.3) * 0.16; }`)
      .replace('#include <lights_fragment_begin>', lightsNoPointSpecular())
      .replace('#include <color_fragment>', `#include <color_fragment>
        // the ground lifts with the dawn, above the weather
        diffuseColor.rgb = mix(diffuseColor.rgb, uDawnAlbedo, uDawn / 0.35);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        // wet sheen: flatter facets are wetter and more mirror-like, broken up by patches of drier stone;
        // the ground dries above the weather
        float flat_ = clamp(vN.y, 0.0, 1.0);
        float pwet = vn(vW.xz * 1.1 + 2.0), grain = vn(vW.xz * 3.7 + 8.0);
        float wetK = uWet * flat_ * flat_ * (1.0 - 0.5 * uDawn / 0.35) * smoothstep(0.2, 0.7, pwet + 0.1);
        roughnessFactor = mix(roughnessFactor, mix(0.10, 0.45, grain), wetK);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // stone relief: the height field's gradient tilts the normal; it fades out before it could alias
          vec2 pw = vW.xz;
          float fwp = fwidth(pw.x) + fwidth(pw.y);
          float fade = 1.0 - smoothstep(0.1, 0.45, fwp);
          if (fade > 0.001) {
            float e = max(0.03, fwp * 0.75);
            float h0 = hf(pw), hx = hf(pw + vec2(e, 0.0)), hz = hf(pw + vec2(0.0, e));
            vec2 g = vec2(hx - h0, hz - h0) / e;
            float k = 0.11 * fade * (0.4 + 0.6 * clamp(vN.y, 0.0, 1.0));
            vec3 nw = normalize(vN - vec3(g.x, 0.0, g.y) * k);
            normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
          }
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          // contour lines on world height, warped by a little 2D noise so a flat ramp never draws a straight
          // line; a family of equal hairlines, anti-aliased with fwidth, gone before they could shimmer,
          // slightly stronger around him and fading with distance. No line is brighter than its neighbours.
          float warp = (vn(vW.xz * 0.18 + 3.0) - 0.5) * 0.3 + (vn(vW.xz * 0.6 + 9.0) - 0.5) * 0.08;
          float hh = (vW.y + warp) / uSpacing;
          float fw = fwidth(hh);
          float dline = min(fract(hh), 1.0 - fract(hh));
          float line = 1.0 - smoothstep(0.0, fw * 1.0 + 0.003, dline);
          float sub = 1.0 - smoothstep(0.18, 0.45, fw);      // thinner than a pixel: fade out, never shimmer
          float dcam = length(vW - cameraPosition);
          float dist = exp(-dcam * 0.05);
          float dfig = distance(vW, uFigure);
          float near = 0.25 + 0.75 * smoothstep(18.0, 5.0, dfig);
          float farMix = smoothstep(6.0, 30.0, dfig);
          vec3 colA = mix(uLineA, vec3(1.4, 1.8, 2.0), farMix * 0.6);
          // a trace of magenta only just downhill of the rock
          float down = smoothstep(6.0, 1.0, distance(vW, uRock)) * step(vW.x, uRock.x);
          vec3 col = mix(colA, uLineB, down * 0.5);
          col = mix(col, vec3(2.2), 0.15 * uDawn / 0.35);
          totalEmissiveRadiance += col * line * sub * dist * near * uStrength * 0.16;
        }`)
  }
  mat.customProgramCacheKey = () => 'contour-a3b'
  return mat
}

// The rock's light on the wet ground: an additive pool directly under it, stretched along the
// camera's ground direction like a reflection on wet asphalt. Cyan-white with a trace of magenta,
// below the bloom threshold, so it never blooms and never reads as a pink blob. boulder.js sizes it
// to the rock's footprint (2 R along the camera line, 1.4 R across, 0.3 R toward the camera).
export function makeReflection() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    uniforms: { uA: { value: new THREE.Color(0.10, 0.55, 0.70) }, uB: { value: new THREE.Color(0.45, 0.12, 0.40) }, uI: { value: 0.35 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uA, uB; uniform float uI; varying vec2 vUv;
      void main(){ vec2 c = vUv - 0.5; float r = length(c) * 2.0; float k = exp(-r * r * 4.5);
        vec3 col = mix(uA, uB, 0.06 * smoothstep(-0.4, 0.4, c.y)); gl_FragColor = vec4(col * k * uI, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
 }`,
  }))
  m.rotation.x = -Math.PI / 2
  m.scale.set(4, 2.8, 1)
  m.renderOrder = 1
  return m
}

// a contact shadow: a soft radial dark disc, 1 cm above the ground, following a foot or the rock
let shadowTex = null
function discTexture() {
  if (shadowTex) return shadowTex
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.35, 'rgba(0,0,0,0.75)'); grd.addColorStop(0.7, 'rgba(0,0,0,0.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  shadowTex = new THREE.CanvasTexture(c); shadowTex.colorSpace = THREE.NoColorSpace
  return shadowTex
}
export function makeContactShadow(size = 0.5, opacity = 0.55) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: discTexture(), color: 0x000000, transparent: true, opacity, depthWrite: false, fog: false }))
  m.rotation.x = -Math.PI / 2
  m.scale.set(size, size, 1)
  m.position.y = 0.012
  m.renderOrder = 2
  return m
}
