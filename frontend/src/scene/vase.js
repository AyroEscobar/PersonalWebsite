/*
  The vase look (v5, the amphora), adapted from the v5 lab (research/three-lab/lib/vase.js) by way of
  prototype A.

  Attic black-figure by day: a black gloss silhouette on the clay, details incised through the black
  back to the clay, the boulder in added white with a painted contour. Red-figure by night: the same
  figure reserved in clay on a black ground, black relief lines. Flat colour, no lights, no tone
  mapping, so the inks are the exact sRGB values the CSS uses for the frieze.

    figureMaterial({ curv, inflate })      the man: one flat ink + incised lines (form, crease)
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
  dark: { body: 0xc8773f, line: 0x141110, shade: 1, gloss: 0, disk: 0xcd844b, fleck: 0x8a4a26, contour: 0x141110 },
}
const col = (h) => new THREE.Color(h)
// where the worn flecks fall on the disk (object space, so they roll with it): picked by eye so the
// poster frame reads as a worn stone, never as two eyes and a mouth
export const FLECK_SEED = [4.2, 1.9, 7.7]

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
        #endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMP = position;
        #ifdef USE_CURV
        vCurv = aCurv;
        #else
        vCurv = 0.0;
        #endif`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        transformed += normalize(objectNormal) * uInflate;${vertexExtra}`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uInk, uLine, uKeyDir, uFleck, uFleckSeed; uniform float uHeadY; uniform float uContour, uForm, uCrease, uLines, uGloss, uWidth, uShade, uSpeck;
        varying float vCurv; varying vec3 vMP;
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
        float line = clamp(max(l1, max(l2, l3) * (1.0 - head)), 0.0, 1.0) * uLines;
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
  }
}

export function figureMaterial({ curv = false, inflate = 0, theme = 'light' } = {}) {
  const k = INKS[theme]
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const u = uniforms({ ink: k.body, line: k.line, gloss: k.gloss, shade: k.shade, inflate })
  if (curv) m.defines = { USE_CURV: '' }
  common(m, u, 'vase-fig' + (curv ? 'c' : 'n'))
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
export function hullOutline(mesh, { px = 2.2, color = 0x141110, cut = false, inflate = 0 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: col(cut ? 0x000000 : color), side: THREE.BackSide })
  if (cut) { mat.blending = THREE.NoBlending; mat.opacity = 0; mat.depthWrite = false }
  mat.toneMapped = false
  mat.fog = false
  const u = { uPx: { value: px }, uRes: { value: new THREE.Vector2(1440, 900) }, uInflate: { value: inflate } }
  mat.userData.u = u
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uPx; uniform float uInflate; uniform vec2 uRes;')
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        #if defined( USE_ENVMAP ) || defined( USE_SKINNING )
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
          gl_Position.xy += d * uPx * 2.0 / uRes * gl_Position.w;
        }`)
  }
  mat.customProgramCacheKey = () => 'hull' + (mesh.isSkinnedMesh ? 's' : 'm')
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
