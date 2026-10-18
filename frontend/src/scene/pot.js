/*
  The amphora: the real pot the page is painted on. A neck amphora turned on a lathe (Munich 1494's
  family: a torus foot, a belly that swells to a broad shoulder, a tall neck, an echinus lip), two round
  handles from the shoulder to the neck buried in the body, in burnished clay and black gloss under one
  low warm sun. Its figure band carries the live frieze: the same man, the same rock, drawn into a render
  target by the frieze scene whenever he moves and wrapped round a sector of the band (about 105 degrees).

    const pot = makePot({ tier, theme })
    pot.group                      the pot (turn it with pot.group.rotation.y)
    pot.scene, pot.cam             the pot pass (one draw for the pot and handles, one for the shadow)
    pot.rt, pot.win                the frieze pass: its target and its window in metres round O
    pot.frame(cssW, cssH)          fit the camera to the host box
    pot.setSun(k)                  the late sun: k 0 is 35 degrees at Work, 1 the low sun (12) at Stack
    pot.setTheme(theme)            black-figure by day, red-figure by night (uniform writes)

  The zones are by height on the profile, so a theme switch or the sun is a uniform write, never a
  recompile. Every ornament is procedural: the tongues, the meander (the site's own 6 x 5 key) and the
  rays. No textures are fetched.
*/
import * as THREE from 'three'
import { NOISE_GLSL } from './noise.js'

// the profile (r, y), outer surface from the foot up, over the lip and down inside the mouth
const PROFILE = [
  [0.0, 0.0], [0.4, 0.0], [0.5, 0.006], [0.545, 0.03], [0.555, 0.06], [0.54, 0.09], [0.5, 0.112], [0.42, 0.13],
  [0.335, 0.15], [0.31, 0.175], [0.315, 0.2], [0.345, 0.25], [0.4, 0.33], [0.48, 0.43], [0.57, 0.54], [0.66, 0.66],
  [0.75, 0.79], [0.83, 0.93], [0.9, 1.08], [0.95, 1.23], [0.985, 1.39], [1.0, 1.54], [0.995, 1.66], [0.975, 1.78],
  [0.935, 1.89], [0.87, 1.99], [0.78, 2.075], [0.665, 2.14], [0.545, 2.185], [0.45, 2.215], [0.425, 2.235],
  [0.432, 2.255], [0.41, 2.28], [0.392, 2.38], [0.388, 2.5], [0.395, 2.62], [0.42, 2.72], [0.46, 2.775],
  [0.505, 2.8], [0.53, 2.835], [0.528, 2.88], [0.5, 2.915], [0.455, 2.935], [0.41, 2.93], [0.385, 2.9],
  [0.37, 2.82], [0.36, 2.6], [0.0, 2.58],
]
export const POT_H = 2.935
// the figure band (y) and the sector it is painted on; the frieze window (metres round his foot point
// O) has the band's aspect over the sector's arc, so the painting is not stretched
export const BAND = { y0: 1.085, y1: 1.875, r: 0.975 }
export const WIN = { l: -2.05, r: 3.75, b: -0.5, t: 2.05 }
const WIN_ASPECT = (WIN.r - WIN.l) / (WIN.t - WIN.b)
export const SECTOR = (WIN_ASPECT * (BAND.y1 - BAND.y0)) / BAND.r
const RT_SIZE = { full: [768, 338], lite: [512, 226] }

const lin = (h) => new THREE.Color(h) // hex is sRGB; THREE.Color holds linear

const VERT = /* glsl */ `
  attribute float aHandle;
  varying vec3 vPos; varying vec3 vN; varying vec3 vW; varying float vHandle;
  void main(){
    vPos = position; vHandle = aHandle;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uRT; uniform float uRTOn;
  uniform vec4 uSector; // centre angle, width, y0, y1
  uniform vec3 uSun, uSunCol, uSky, uGround, uClay, uGloss, uLit, uSheenCol;
  uniform float uDark, uSheen, uPaint;
  varying vec3 vPos; varying vec3 vN; varying vec3 vW; varying float vHandle;
  ${NOISE_GLSL}
  // the site's meander: one 6 x 5 cell tile, a bit per filled cell (rows top to bottom)
  float meanderCell(vec2 c){
    int x = int(mod(c.x, 6.0)), y = int(c.y);
    int row = y == 0 ? 31 : y == 1 ? 17 : y == 2 ? 29 : y == 3 ? 5 : 61;
    return float((row >> x) & 1);
  }
  float meander(vec2 p){
    // a 2 x 2 box filter so the key stays clean at any size
    vec2 dx = dFdx(p) * 0.25, dy = dFdy(p) * 0.25;
    float s = 0.0;
    for (int i = 0; i < 4; i++){
      vec2 o = (i == 0 ? dx + dy : i == 1 ? dx - dy : i == 2 ? -dx + dy : -dx - dy);
      vec2 q = p + o;
      s += (q.y >= 0.0 && q.y < 5.0) ? meanderCell(floor(q)) : 0.0;
    }
    return s * 0.25;
  }
  float band(float y, float a, float b){ float w = fwidth(y) * 0.75; return smoothstep(a - w, a + w, y) - smoothstep(b - w, b + w, y); }
  void main(){
    float y = vPos.y;
    float r = length(vPos.xz);
    float th = atan(vPos.x, vPos.z); // 0 at the front of the pot, + to its right
    float circ = th / 6.28318530718 + 0.5;
    // ---- the zones: 0 is clay, 1 is gloss; the ornament inverts in red-figure (uDark)
    float g = 1.0;
    float orn = 0.0; // 1 where an ornament (or the frieze) reserves the ground
    float ornInk = 0.0; // the ornament's own ink on that ground
    // the foot's outer edge is reserved
    g -= band(y, 0.022, 0.078) * step(0.53, r);
    // the rays above the foot: black rays rising from a rule, 44 round the pot
    float rz = band(y, 0.235, 0.515);
    {
      float u = fract(circ * 44.0), v = (y - 0.235) / 0.28;
      float d = abs(u - 0.5) - 0.5 * (1.0 - v) * 0.92;
      float w = fwidth(d) * 0.8;
      ornInk += rz * (1.0 - smoothstep(-w, w, d));
    }
    orn += rz;
    // the meander band between two rules
    float mz = band(y, 0.935, 1.066);
    {
      float unit = (1.066 - 0.935) / 5.0;
      float n = floor(6.28318530718 * 0.86 / (6.0 * unit));
      vec2 p = vec2(circ * n * 6.0, (1.066 - y) / unit);
      ornInk += mz * meander(p);
    }
    orn += mz;
    // the figure band: clay (or black at night) and the live painting on its sector
    float fz = band(y, ${BAND.y0.toFixed(3)}, ${BAND.y1.toFixed(3)});
    orn += fz;
    // the tongues under the neck: black tongues hanging from the neck ring on the shoulder's clay
    float tz = band(y, 1.905, 2.205);
    {
      float u = fract(circ * 30.0 + 0.5), v = (2.205 - y) / 0.17;
      float d = length(vec2((u - 0.5) / 0.3, max(v - 0.45, 0.0) / 0.55)) - 1.0;
      d = max(d, -v);
      float w = fwidth(d) * 0.8;
      ornInk += tz * (1.0 - smoothstep(-w, w, d)) * step(0.0, v);
    }
    orn += tz;
    orn = clamp(orn, 0.0, 1.0) * (1.0 - vHandle);
    ornInk = clamp(ornInk, 0.0, 1.0);
    float dk = uDark;
    // black-figure: ornaments in gloss on reserved clay; red-figure: reserved ornaments on gloss
    float ground = dk;
    float ink = 1.0 - dk;
    g = mix(g, mix(ground, ink, ornInk), orn);
    vec3 albedo = mix(uClay, uGloss, g);
    float gloss = g;
    // ---- the painting on the band's sector (premultiplied: ink over the band's ground)
    if (uRTOn > 0.5) {
      float d = th - uSector.x; d = mod(d + 3.14159265, 6.28318530718) - 3.14159265;
      vec2 uv = vec2(d / uSector.y + 0.5, (y - uSector.z) / (uSector.w - uSector.z));
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        vec4 p = texture2D(uRT, uv);
        // the painter stops short of the sector's ends: a soft fade over the last 4 percent
        float edge = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x) * fz * uPaint;
        p *= edge;
        albedo = p.rgb + albedo * (1.0 - p.a);
        float lum = dot(p.rgb / max(p.a, 1e-3), vec3(0.2126, 0.7152, 0.0722));
        gloss = mix(gloss, 1.0 - smoothstep(0.02, 0.2, lum), p.a);
      }
    }
    // ---- the burnished clay: grain and the wheel's ridges (they show under a grazing light)
    vec3 N = normalize(vN);
    // one octave of grain on a phone (the band is small there; three on the full tier)
    #ifdef LITE
    float grain = vnoise3(vPos * 38.0) * 0.875;
    #else
    float grain = fbm3l(vPos * 38.0);
    #endif
    albedo *= 1.0 + (grain - 0.5) * 0.09 * (1.0 - gloss);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 tp = normalize(up - N * dot(N, up) + 1e-4);
    N = normalize(N + tp * (0.05 * sin(y * 6.28318530718 * 34.0) * (1.0 - 0.8 * gloss) * (1.0 - vHandle)) + tp * (grain - 0.5) * 0.06);
    vec3 V = normalize(cameraPosition - vW);
    vec3 L = normalize(uSun);
    float ndl = dot(N, L);
    float wrap = mix(0.35, 0.2, gloss);
    float diff = max((ndl + wrap) / (1.0 + wrap), 0.0);
    vec3 amb = mix(uGround, uSky, N.y * 0.5 + 0.5);
    vec3 col = albedo * (uSunCol * diff + amb);
    vec3 H = normalize(L + V);
    float ndh = max(dot(N, H), 0.0), ndv = max(dot(N, V), 0.0);
    // the fired gloss is a semi-matte: a soft Blinn sheen and a broad grazing sheen; burnished clay a whisper
    float lit = smoothstep(-0.35, 0.15, ndl);
    col += uSheenCol * uSheen * (gloss * (pow(ndh, 40.0) * 0.22 + pow(1.0 - ndv, 2.0) * 0.06 * lit) + (1.0 - gloss) * (pow(ndh, 14.0) * 0.07 + pow(1.0 - ndv, 2.5) * 0.03) * lit);
    // the gloss mirrors the room a little at grazing angles, so the shadow side is black glaze, not a hole
    col += gloss * uSky * (0.05 + 0.35 * pow(1.0 - ndv, 3.0)) * (0.6 + 0.4 * N.y);
    // a warm rim on the sunward side
    vec3 Lh = normalize(vec3(L.x, 0.0, L.z) + 1e-4);
    col += uLit * pow(1.0 - ndv, 3.0) * 0.25 * smoothstep(-0.1, 0.5, dot(N, Lh)) * (1.0 - 0.5 * gloss);
    // the lip and the handle tops are worn back toward the clay
    float wear = smoothstep(2.905, 2.93, y) * step(0.42, r) * (1.0 - vHandle) + vHandle * smoothstep(0.75, 0.95, N.y) * 0.5;
    col = mix(col, uClay * (uSunCol * diff + amb), wear * 0.25 * gloss);
    gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
  }
`

// a soft contact shadow under the foot, away from the sun
const SHADOW_FRAG = /* glsl */ `
  uniform vec3 uTint; uniform float uDark; varying vec2 vUv;
  void main(){
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p * vec2(1.0, 1.0));
    float a = (1.0 - smoothstep(0.25, 1.0, d)) * mix(0.32, 0.5, uDark);
    gl_FragColor = vec4(uTint * a, a);
  }
`

function handleGeometry(sign) {
  const pts = [[0.6, 2.0], [0.7, 2.08], [0.81, 2.22], [0.855, 2.41], [0.8, 2.58], [0.64, 2.68], [0.46, 2.685], [0.34, 2.68]].map(([r, y]) => new THREE.Vector3(sign * r, y, 0))
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  return new THREE.TubeGeometry(curve, 36, 0.048, 10, false)
}

function merge(geos) {
  let n = 0, m = 0
  for (const [g] of geos) { n += g.attributes.position.count; m += g.index.count }
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), Hn = new Float32Array(n), I = new Uint32Array(m)
  let o = 0, k = 0
  for (const [g, h] of geos) {
    P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Hn.fill(h, o, o + g.attributes.position.count)
    const idx = g.index.array
    for (let i = 0; i < idx.length; i++) I[k + i] = idx[i] + o
    o += g.attributes.position.count; k += idx.length
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(P, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3))
  out.setAttribute('aHandle', new THREE.BufferAttribute(Hn, 1))
  out.setIndex(new THREE.BufferAttribute(I, 1))
  out.computeBoundingSphere()
  return out
}

const LIGHT = {
  light: { sky: 0x6b5a4a, ground: 0x4a3324, sun0: 0xffe7c2, sun1: 0xffb27a, sheen: 1.0, sheenCol: 0xffe2b8, shadow: 0x3a2a20 },
  dark: { sky: 0x1e2430, ground: 0x15110f, sun0: 0xb8c4d8, sun1: 0xc9b8a8, sheen: 0.45, sheenCol: 0xc8d2e6, shadow: 0x000000 },
}

export function makePot({ tier = 'full', theme = 'light' } = {}) {
  const lathe = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 96)
  // the lathe starts its sweep at +z; the handles stand at the sides (+x and -x)
  const geo = merge([[lathe, 0], [handleGeometry(1), 1], [handleGeometry(-1), 1]])
  const [rw, rh] = RT_SIZE[tier] || RT_SIZE.full
  // MSAA on the target: 4 on the full tier, 2 on a phone (the band is small there and the GPU is not)
  const rt = new THREE.WebGLRenderTarget(rw, rh, { samples: tier === 'lite' ? 2 : 4, depthBuffer: true, colorSpace: THREE.SRGBColorSpace })
  rt.texture.generateMipmaps = false
  rt.texture.minFilter = THREE.LinearFilter
  const u = {
    uRT: { value: rt.texture }, uRTOn: { value: 1 }, uPaint: { value: 1 },
    uSector: { value: new THREE.Vector4(0, SECTOR, BAND.y0, BAND.y1) },
    uSun: { value: new THREE.Vector3(0.55, 0.57, 0.6) }, uSunCol: { value: lin(0xffe7c2) },
    uSky: { value: lin(0x6b5a4a) }, uGround: { value: lin(0x4a3324) },
    uClay: { value: lin(0xc47d45) }, uGloss: { value: lin(0x141110) }, uLit: { value: lin(0xe09249) }, uSheenCol: { value: lin(0xffe2b8) },
    uDark: { value: 0 }, uSheen: { value: 1 },
  }
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, defines: tier === 'lite' ? { LITE: '' } : {} })
  const mesh = new THREE.Mesh(geo, mat)
  const group = new THREE.Group()
  group.add(mesh)
  const su = { uTint: { value: lin(0x3a2a20) }, uDark: { value: 0 } }
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({ uniforms: su, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.scale.set(1.9, 1.1, 1)
  shadow.position.set(-0.18, 0.001, -0.05)
  shadow.renderOrder = -1
  const scene = new THREE.Scene()
  scene.add(shadow, group)
  const cam = new THREE.PerspectiveCamera(28, 1, 0.5, 40)
  let k = 0, th = theme
  function setSun(kk = k) {
    k = kk
    const L = LIGHT[th]
    // elevation 35 degrees at Work to 12 at Stack; from the front right
    const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(35, 12, k)), az = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(42, 58, k))
    u.uSun.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    u.uSunCol.value.copy(lin(L.sun0)).lerp(lin(L.sun1), k).multiplyScalar(th === 'dark' ? 0.55 : THREE.MathUtils.lerp(1.05, 0.95, k))
    shadow.position.x = -0.18 - 0.25 * k
    shadow.scale.x = 1.9 + 0.6 * k
  }
  function setTheme(t) {
    th = t
    const L = LIGHT[t]
    u.uDark.value = t === 'dark' ? 1 : 0
    su.uDark.value = u.uDark.value
    u.uSky.value.copy(lin(L.sky)); u.uGround.value.copy(lin(L.ground)); u.uSheen.value = L.sheen; u.uSheenCol.value.copy(lin(L.sheenCol))
    su.uTint.value.copy(lin(L.shadow))
    setSun(k)
  }
  setTheme(theme)
  // fit: the pot (and its shadow) fills the box's height, a little above centre, seen from 8 degrees up
  function frame(cssW, cssH) {
    cam.aspect = cssW / cssH
    const fov = THREE.MathUtils.degToRad(cam.fov)
    const fitH = POT_H * 1.12, fitW = 2.25
    const dH = fitH / 2 / Math.tan(fov / 2)
    const dW = fitW / 2 / (Math.tan(fov / 2) * cam.aspect)
    const d = Math.max(dH, dW)
    const el = THREE.MathUtils.degToRad(8)
    const cy = POT_H * 0.49
    cam.position.set(0, cy + Math.sin(el) * d, Math.cos(el) * d)
    cam.lookAt(0, cy, 0)
    cam.updateProjectionMatrix()
  }
  function dispose() { geo.dispose(); mat.dispose(); shadow.geometry.dispose(); shadow.material.dispose(); rt.dispose() }
  return { scene, cam, group, mesh, shadow, rt, u, win: WIN, setSun, setTheme, frame, dispose, sector: SECTOR }
}
