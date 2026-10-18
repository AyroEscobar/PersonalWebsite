/*
  The vase look (v5, the amphora), adapted from the v5 lab (research/three-lab/lib/vase.js) by way of
  prototype A.

  Attic black-figure by day: a black gloss silhouette on the clay, details incised through the black
  back to the clay, the boulder in added white with a painted contour. Red-figure by night: the same
  figure reserved in clay on a black ground, black relief lines. Flat colour, no lights, no tone
  mapping, so the inks are the exact sRGB values the CSS uses for the frieze.

    figureMaterial({ curv, part, inflate })  the man: one flat ink + incised lines (form, crease); with part,
                                           the painter's head (head.js): the hair cap, the fillet, the eye
                                           and the beard's edge, and no interior lines on the masses
    boulderMaterial()                      the disk: added white with worn flecks, rolls with the rock
    hullOutline(mesh, { px, cut })         an inverted hull at a constant pixel width. The disk's is its
                                           painted contour. His is a cut: drawn after him with blending off
                                           and a transparent ink, it punches a thin hole wherever a nearer
                                           limb crosses something behind it (the rear leg, the torso, the
                                           disk), so the page's own clay shows through, exactly as the
                                           painter's incision shows the clay of the pot. Over empty clay
                                           it changes nothing, so there is no halo.
    setInks(mats, theme)                   switch black-figure and red-figure without a recompile

  Every colour is a uniform, so a theme switch is a uniform write.
*/
import * as THREE from 'three'
import { NOISE_GLSL } from './noise.js'

// The inks, sRGB, the same values as the palette in src/styles/tokens.css. No sheen on the light body:
// any gloss leaves grey satin highlights on the thigh, calf and forearm, and he reads rendered, not painted.
export const INKS = {
  light: { body: 0x17110d, line: 0xc47d45, shade: 0, gloss: 0, disk: 0xf4ead2, fleck: 0x3a2a20, contour: 0x2a1d15 },
  // dark: the disk is added white, aged (--aged), with clay flecks, so he no longer merges into it at the hands
  dark: { body: 0xc8773f, line: 0x141110, shade: 1, gloss: 0, disk: 0xc8b491, fleck: 0xc47d45, contour: 0x141110 },
}
const col = (h) => new THREE.Color(h)
// the form line (the iso-line of the key light) is the painter's incision: at 0.42 it ran a loop round the
// hip like a pair of shorts and seams down the thighs; at 0.72 only the strong turns draw (the shoulder,
// the back, the knees), and the cut between overlapping limbs does the rest
export const FORM = 0.72
// where the worn flecks fall on the disk (object space, so they roll with it): picked by eye so the
// poster frame reads as a worn stone, never as two eyes and a mouth
export const FLECK_SEED = [4.2, 1.9, 7.7]

// the painter's head (head.js): the hair cap (the skull above the hairline stands a little proud, so the
// hair reads as a mass) and the per-vertex inflate scale; shared by the figure and its cut hull so the two
// always match
const PART_VERT = /* glsl */ `
  attribute vec2 aPart; uniform vec4 uHair; uniform float uHeadY;
  #define HAIR_CAP (uHair.z * smoothstep(-0.0045, 0.0045, position.y - (uHair.x + uHair.y * position.z)) * step(uHeadY - 0.03, position.y) * step(0.75, aPart.y))
`

function common(m, u, key, vertexExtra = '') {
  m.toneMapped = false
  m.fog = false
  m.userData.u = u
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uInflate;
        varying float vCurv; varying vec3 vMP;
        #ifdef USE_CURV
        attribute float aCurv;
        #endif
        #ifdef USE_PART
        varying vec2 vPart;
        ${PART_VERT}
        #endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMP = position;
        #ifdef USE_CURV
        vCurv = aCurv;
        #else
        vCurv = 0.0;
        #endif
        #ifdef USE_PART
        vPart = aPart;
        #endif`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        #ifdef USE_PART
        transformed += normalize(objectNormal) * (uInflate * aPart.y + HAIR_CAP);
        #else
        transformed += normalize(objectNormal) * uInflate;
        #endif${vertexExtra}`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uInk, uLine, uKeyDir, uFleck, uFleckSeed; uniform float uHeadY; uniform float uContour, uForm, uCrease, uLines, uGloss, uWidth, uShade, uSpeck;
        varying float vCurv; varying vec3 vMP;
        #ifdef USE_PART
        varying vec2 vPart; uniform vec4 uHair, uEye, uBeard; uniform float uEyeOn;
        #endif
        ${NOISE_GLSL}
        float aaLine(float f, float c, float wpx){ float fw = max(fwidth(f), 1e-5); return 1.0 - smoothstep(wpx - 0.5, wpx + 0.5, abs(f - c) / fw); }`)
      .replace('#include <opaque_fragment>', `
        // a strict side view: the orthographic view direction is the same for every pixel
        vec3 V = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        vec3 N = normal;
        float ndv = dot(N, V), ndl = dot(N, normalize(uKeyDir));
        float l1 = aaLine(ndv, uContour, uWidth);
        float l2 = aaLine(ndl, uForm, uWidth) * step(0.12, ndv);
        float l3 = aaLine(vCurv, uCrease, uWidth) * step(0.2, ndv);
        // no interior lines on the head: at this size the eye sockets read as spectacles
        float head = smoothstep(uHeadY - 0.01, uHeadY + 0.01, vMP.y);
        #ifdef USE_PART
        // no interior lines on the hands and feet (they scribbled at the contacts), the beard or the hair
        float inner = max(l2, l3) * (1.0 - head) * (1.0 - vPart.x);
        // the painter's head: the fillet round the hair and the eye, incised, on the side we see
        float side = step(vMP.x, 0.0) * step(0.25, ndv) * step(0.5, vPart.y);
        float lf = aaLine(vMP.y - (uHair.x + uHair.y * vMP.z), uHair.w, uWidth) * head * side;
        vec2 eq = (vMP.zy - uEye.xy) / uEye.zw;
        eq.y *= 1.0 + 0.35 * abs(eq.x); // an almond: pinched at the corners
        float le = max(aaLine(length(eq), 1.0, uWidth), 1.0 - smoothstep(0.3, 0.42, length(eq - vec2(0.22, 0.05)))) * side * uEyeOn * step(length(eq), 1.6);
        // the beard's edge across the cheek
        vec2 ba = uBeard.xy, bv = uBeard.zw - uBeard.xy;
        float bt = dot(vMP.zy - ba, bv) / dot(bv, bv);
        float lb = aaLine(dot(vMP.zy - ba, normalize(vec2(-bv.y, bv.x))), 0.0, uWidth) * side * step(-0.05, bt) * step(bt, 1.0);
        float line = clamp(max(l1, max(inner, max(max(lf, lb), le))), 0.0, 1.0) * uLines;
        #else
        float line = clamp(max(l1, max(l2, l3) * (1.0 - head)), 0.0, 1.0) * uLines;
        #endif
        vec3 ink = uInk;
        // red-figure: the reserved clay keeps a faint wash of diluted glaze on the shadow side
        ink *= mix(1.0, 0.84 + 0.16 * smoothstep(-0.2, 0.6, ndl), uShade);
        // the black gloss fires to a semi-gloss: a soft sheen where the slip faces the key
        vec3 H = normalize(normalize(uKeyDir) + V);
        ink += vec3(0.20, 0.17, 0.14) * pow(max(dot(N, H), 0.0), 24.0) * uGloss;
        // the added white has worn off in flecks (the Munich amphora's boulder), in object space so they roll
        if (uSpeck > 0.0) {
          // (seeded so the poster frame shows no face in the worn spots)
          vec3 fp = vMP + uFleckSeed;
          float sp = smoothstep(0.9, 0.91, vnoise3(fp * 6.0)) + smoothstep(0.935, 0.945, vnoise3(fp * 19.0 + 3.0));
          float wear = smoothstep(0.55, 0.8, vnoise3(fp * 3.1 + 11.0)) * 0.05;
          ink = mix(ink, uFleck, clamp(sp, 0.0, 1.0) * uSpeck);
          ink = mix(ink, uFleck, wear * uSpeck);
        }
        gl_FragColor = vec4(mix(ink, uLine, line), 1.0);`)
  }
  m.customProgramCacheKey = () => key
}

function uniforms({ ink, line, contour = -2, form = 0.42, crease = -7, lines = 1, gloss = 0.35, width = 0.75, shade = 0, speck = 0, fleck = 0x000000, inflate = 0 }) {
  return {
    uInk: { value: col(ink) }, uLine: { value: col(line) }, uFleck: { value: col(fleck) },
    uKeyDir: { value: new THREE.Vector3(0.3, 0.8, 0.5) },
    uContour: { value: contour }, uForm: { value: form }, uCrease: { value: crease }, uLines: { value: lines },
    uGloss: { value: gloss }, uWidth: { value: width }, uShade: { value: shade }, uSpeck: { value: speck },
    uInflate: { value: inflate }, uHeadY: { value: 1e9 }, uFleckSeed: { value: new THREE.Vector3(...FLECK_SEED) },
    uHair: { value: new THREE.Vector4(9, 0, 0, 0) }, uEye: { value: new THREE.Vector4(0, 0, 1, 1) }, uBeard: { value: new THREE.Vector4() }, uEyeOn: { value: 1 },
  }
}

export function figureMaterial({ curv = false, part = false, inflate = 0, theme = 'light', form = FORM } = {}) {
  const k = INKS[theme]
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const u = uniforms({ ink: k.body, line: k.line, gloss: k.gloss, shade: k.shade, inflate, form })
  m.defines = {}
  if (curv) m.defines.USE_CURV = ''
  if (part) m.defines.USE_PART = ''
  common(m, u, 'vase-fig' + (curv ? 'c' : 'n') + (part ? 'p' : ''))
  m.userData.role = 'figure'
  return m
}

export function boulderMaterial({ theme = 'light' } = {}) {
  const k = INKS[theme]
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff })
  // no incised lines on the disk except the painted contour at the silhouette
  const u = uniforms({ ink: k.disk, line: k.contour, contour: 0.0, form: -2, crease: -99, gloss: 0, shade: 0, width: 1.0, speck: 0.85, fleck: k.fleck })
  common(m, u, 'vase-disk')
  m.userData.role = 'disk'
  return m
}

// an inverted hull: same geometry (and skeleton), back faces only, pushed out along the skinned normal by
// px pixels in clip space (a constant width at any scale), plus the same world inflate as the body
export function hullOutline(mesh, { px = 2.2, color = 0x141110, cut = false, inflate = 0, part = null, load = 0 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: col(cut ? 0x000000 : color), side: THREE.BackSide })
  if (cut) { mat.blending = THREE.NoBlending; mat.opacity = 0; mat.depthWrite = false }
  mat.toneMapped = false
  mat.fog = false
  // load: the painted contour is loaded toward the ground, as a brush is (thin at the top, heavier underneath),
  // so a disk with no shading still sits on the line instead of floating as a moon
  const u = { uPx: { value: px }, uRes: { value: new THREE.Vector2(1440, 900) }, uInflate: { value: inflate }, uLoad: { value: load } }
  // the figure's own hair and head uniforms (the same objects), so the cut follows the cap exactly
  if (part) { mat.defines = { USE_PART: '' }; u.uHair = part.uHair; u.uHeadY = part.uHeadY }
  mat.userData.u = u
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uPx; uniform float uInflate; uniform vec2 uRes; uniform float uLoad;
        #ifdef USE_PART
        ${PART_VERT}
        #endif`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        #if defined( USE_PART )
        transformed += normalize(objectNormal) * (uInflate * aPart.y + HAIR_CAP);
        #elif defined( USE_ENVMAP ) || defined( USE_SKINNING )
        transformed += normalize(objectNormal) * uInflate;
        #else
        transformed += normalize(normal) * uInflate;
        #endif`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          #if defined( USE_ENVMAP ) || defined( USE_SKINNING )
          vec3 hn = objectNormal;
          #else
          vec3 hn = normal;
          #endif
          vec3 nv = normalize(normalMatrix * hn);
          vec4 cn = projectionMatrix * vec4(nv, 0.0);
          vec2 d = normalize(cn.xy + 1e-6);
          float k = 1.0;
          #ifdef USE_PART
          // no cut inside the face: the side of the head we see (its bind normal faces his right) does not
          // extrude, so the brow, the cheek and the nose stop scratching three strokes into the face; the
          // profile (normals across the view), the ear and the beard and hair masses keep their cut
          float ear = 1.0 - smoothstep(0.022, 0.034, distance(position.zy, vec2(-0.0333, 0.851)));
          k = 1.0 - step(uHeadY, position.y) * step(0.75, aPart.y) * smoothstep(0.3, 0.65, -normal.x) * (1.0 - ear);
          // the hands and feet: a finer cut where he meets the rock and the ground
          k *= 1.0 - 0.45 * aPart.x * step(0.25, aPart.y);
          #endif
          k *= 1.0 - uLoad + uLoad * 2.0 * max(0.0, -nv.y);
          gl_Position.xy += d * uPx * k * 2.0 / uRes * gl_Position.w;
        }`)
  }
  mat.customProgramCacheKey = () => 'hull' + (mesh.isSkinnedMesh ? 's' : 'm') + (part ? 'p' : '')
  const hull = mesh.isSkinnedMesh ? new THREE.SkinnedMesh(mesh.geometry, mat) : new THREE.Mesh(mesh.geometry, mat)
  if (mesh.isSkinnedMesh) hull.bind(mesh.skeleton, mesh.bindMatrix)
  hull.frustumCulled = false
  return hull
}

// black-figure by day, red-figure by night: every ink is a uniform
export function setInks({ fig, disk, diskHull }, theme) {
  const k = INKS[theme] || INKS.light
  const f = fig.userData.u
  f.uInk.value.set(k.body); f.uLine.value.set(k.line); f.uShade.value = k.shade; f.uGloss.value = k.gloss
  const d = disk.userData.u
  d.uInk.value.set(k.disk); d.uLine.value.set(k.contour); d.uFleck.value.set(k.fleck)
  diskHull.material.color.set(k.contour)
}
