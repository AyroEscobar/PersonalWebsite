/*
  The live frieze (v5, the amphora): one lazy chunk with three, imported by src/lib/frieze-host.js after
  load, the poster's decode and an idle moment; never in the still tier, under quiet or motion off.

    const scene = await import('../scene/frieze.js')
    scene.mount({ canvas, bands, theme, tier, onReady, onError, onLost })
    scene.setTheme('dark') / scene.pause() / scene.play() / scene.unmount()

  bands: [{ kind: 'hero' | 'pot' | 'contact', el, art, room, belly }]. el is the band, art the layer the
  canvas lives in, room the CSS box the composition is fitted into (the poster <img> fills the same box,
  contain and bottom aligned, so the canvas lands on the poster pixel for pixel). One canvas and one WebGL
  context: the hero keeps it until its meander passes under the neck, then it moves to whichever laid-out
  band shows the most of itself.

  The pot (pot.js) is the belly's: a turned amphora whose shoulder band carries the same frieze, drawn
  into a render target; the reader's scroll turns it (-70 degrees at the cut, facing 300 px later, +50 by
  the end of Stack) and lowers its sun, and on it he steps only while you read down. It renders on demand:
  only while the turn, the sun, his stride or the grit moves.

  The ground line is CSS (crisp, and there before the scene), so the camera follows him along the slope:
  the line never moves on screen, and scroll only changes how far up it he has got.

  Two clocks: t is the wall clock, tau the gait clock, which freezes during the catch and ramps back, so
  the cycle never pops. Flat colour, no lights, no fog, no post, no shadows: a theme switch is a uniform
  write (vase.js setInks), never a recompile.

  Query flags (tools only): ?t=<s> freezes the clock (a scroll renders one still), ?slip=<s> the catch
  period (and its first), ?effort=<0..1> a fixed effort,
  ?pot=<deg> holds the pot at a turn. Hooks (hooks.js): window.__ready, __stats, __bench(n), __frameAt(t), __measure(), __bounds(),
  __poster(opts).
*/
import * as THREE from 'three'
import { loadFigure, makeFigure } from './figure.js'
import { figureMaterial, boulderMaterial, hullOutline, setInks, fireInks, setFire, INKS, SKETCH } from './vase.js'
import { addCurvature } from './curvature.js'
import { addParts, headUniforms } from './head.js'
import { rockShape } from './rock.js'
import { makeDust } from './dust.js'
import { SLOPE_DEG, R, X0, T_POSTER, BOX } from './comp.js'
import { installHooks, removeHooks } from './hooks.js'
import { makePot } from './pot.js'

const FIGURE_URL = new URL('../assets/figure/man.glb', import.meta.url).href
const DPR_CAP = { full: 2, lite: 1.5 }
// a phone's band (390 x 388 CSS px is 0.15 MP) is cheap to draw: lite renders it at DPR 2, so on a 3x
// screen the silhouette and its incisions are as sharp as the CSS ground line and the text beside them
const SMALL_CANVAS = 5e5
const capFor = (tier, w, h) => Math.min(devicePixelRatio || 1, tier === 'lite' && w * h < SMALL_CANVAS ? 2 : DPR_CAP[tier] || 2)
// the catch: the rock gets away from him, he digs in, holds it, and goes on (seconds and metres); first
// 6.5 s after the scene goes live, then every 18 s
const CATCH = { give: 0.3, dig: 0.3, hold: 0.4, resume: 0.8, after: 0.4, dist: 0.55, first: 6.5, every: 18 }
const CATCH_LEN = CATCH.give + CATCH.dig + CATCH.hold + CATCH.resume + CATCH.after
const HOLD_MS = 260 // the clock holds the poster frame this long while the canvas fades in over it
const ADV_HERO = 0.9 // metres he climbs while the hero scrolls away (to the cut, the meander under the neck)
const ADV_CONTACT = [-0.9, 0] // and over the contact band as it comes into view: he arrives, never crests
const SPRING_W = 7
// effort: the reader's scroll velocity (CSS px/s) that counts as full effort; on the pot, the velocity that
// is one ordinary stride (a reader's pace is about 110 px/s), at most 2.2 strides
const V_FULL = 1200, V_STRIDE = 130, STRIDE_MAX = 2.2
// the pot's turn (degrees): round the left limb at the cut, facing over the first 300 px of the belly, then
// on round toward the far shoulder by the end of Stack; on the phone band, the same turn as it passes
const POT_TURN = { from: -70, face: 0, to: 50, inPx: 300 }
const INFLATE = 0.02 // metres: a little more body, closer to the vase painter's heavy silhouette
// metres: the soles stand this far off the slope, so the inflated toes sit on the painter's ground line
// instead of sinking into it (no dark puddle where the outline meets the 4 px line)
const SOLE = 0.018
export const GAIT = { speed: 0.3, period: 2.05 }
// the vase's long diagonal lunge: the hips high and the back leg long (at pelvisK 0.7 and 50 degrees both
// shins lay nearly flat for half the cycle and he read as kneeling; at 0.78 the swinging knee still fell to
// 0.31 m; at 0.84 with the joint-space swing it stays above 0.36 m and drives forward)
const POSE = { pelvisK: 0.84, leanDeg: 56 }
// the eye is incised only where his figure is drawn 200 CSS px tall or more (under that it is a speck)
const EYE_PX = 200
const WRAP = 240
// the painting at Contact, once a visit, from 60% of the band in view (seconds from its start; the ground
// lines were turned on the wheel by CSS at 20%): the sketch, the slip floods up from his feet, the incisions
// scratch in, the disk is filled with added white and its flecks worn in, then he moves
const PAINT = { sketch: [0, 0.3], slip: [0.3, 0.9], scratch: [0.9, 1.3], white: [1.3, 1.6], fleck: [1.6, 1.75], move: [1.75, 2.25] }
const PAINT_AT = 0.6
const KILN_S = 0.6 // the kiln, --dur-kiln
// the loop at Contact, once a visit, when the band has been 90% in view for a second after the painting:
// his push stalls (0.8 s), the rock gets away at 5/7 g sin 14 degrees (1.70 m/s2, a rolling ball) and rolls
// back past him and out of the picture; he straightens and watches it go (0.9 s from the get-away), turns
// (0.4) and walks down after it at a measured step (figure.js WALK), the camera letting him walk 1.1 m before
// it goes with him and, once the rock has left the picture, leading 0.9 m; he eases to a stop over the last
// 0.4 m, plants his hands on it (0.7) and pushes again (1.2)
const LOOP = { stall: 0.8, watchAt: 0.9, turn: 0.4, stop: 0.4, trail: 1.1, follow: 1.0, plant: 0.7, push: 1.2, a: 1.7, lead: 0.9, at: 0.9, wait: 1.0 }
const ph01 = (u, [a, b]) => clamp((u - a) / (b - a), 0, 1)
// where he holds on the pot when you stop reading: the push-off lunge (the poster's phase, either leg)
const HOLD_PHASES = [((T_POSTER / GAIT.period) % 1 + 1) % 1, (((T_POSTER / GAIT.period) + 0.5) % 1 + 1) % 1]
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) }
// the site's curves, solved: --ease-out and --ease-in-out (tokens.css)
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let s = x
    for (let i = 0; i < 6; i++) { const f = ((ax * s + bx) * s + cx) * s - x, d = (3 * ax * s + 2 * bx) * s + cx; if (Math.abs(d) < 1e-6) break; s -= f / d }
    return ((ay * s + by) * s + cy) * s
  }
}
const easeOut = bezier(0.215, 0.61, 0.355, 1), easeInOut = bezier(0.6, 0, 0.4, 1)

function query() {
  const q = new URLSearchParams(location.search)
  return {
    fixedT: q.has('t') ? Number(q.get('t')) : null,
    catchEvery: Number(q.get('slip')) || CATCH.every,
    catchFirst: Number(q.get('slip')) || CATCH.first,
    // tools only: a fixed effort (0..1, + is scrolling down) for stills; the pot held at a turn (degrees)
    effort: q.has('effort') ? Number(q.get('effort')) : null,
    potDeg: q.has('pot') ? Number(q.get('pot')) : null,
    // tools only: a moment of an event as a still, with ?t=: ?act=catch|paint|loop&u=<s into it>, or a loop
    // phase by name (stall, getaway, watch, turn, walk, plant, push) and how far into it
    act: q.get('act'),
    actU: q.has('u') ? Number(q.get('u')) : null,
  }
}

async function build({ theme, figureUrl = FIGURE_URL }) {
  const scene = new THREE.Scene()
  const slope = new THREE.Group()
  slope.rotation.z = THREE.MathUtils.degToRad(SLOPE_DEG)
  scene.add(slope)
  const man = await loadFigure(figureUrl)
  const geo = man.mesh.geometry
  geo.computeBoundingBox()
  const objScale = 1.8 / (geo.boundingBox.max.y - geo.boundingBox.min.y)
  addCurvature(geo, { metres: objScale, smooth: 2 })
  const headY = geo.boundingBox.min.y + (1.56 / 1.8) * (geo.boundingBox.max.y - geo.boundingBox.min.y)
  // the painter's head: the beard and the nape mass merged in (head.js)
  addParts(geo, { scale: objScale })
  const fig = figureMaterial({ curv: true, part: true, inflate: INFLATE / objScale, theme })
  // the head starts at about 1.56 m of his 1.8 m (bind pose, model units): no interior lines above it
  fig.userData.u.uHeadY.value = headY
  const hu = headUniforms(objScale)
  fig.userData.u.uHair.value.copy(hu.uHair); fig.userData.u.uEye.value.copy(hu.uEye); fig.userData.u.uBeard.value.copy(hu.uBeard)
  const disk = boulderMaterial({ theme })
  // the kiln's front climbs the disk from its foot (object space, -R to R)
  disk.userData.u.uFireH.value.set(R, 1 / (2 * R))
  const rs = rockShape('polished', R)
  const f = makeFigure({ man, material: fig, boulderMaterial: disk, boulderGeometry: rs.geometry, R, x0: X0, sole: SOLE, surface: rs.surface, ...GAIT, ...POSE })
  f.glints.forEach((g) => { g.visible = false })
  slope.add(f.group)
  // draw order: the disk's painted contour, the disk, him, then the incised cut through whatever he overlaps
  // the disk's painted contour, loaded toward the ground: about 1 px at the top to 1.6 px underneath
  const diskHull = hullOutline(f.boulder, { px: 1.3, load: 0.25 }); diskHull.renderOrder = 0; f.boulder.add(diskHull)
  f.boulder.renderOrder = 1
  f.mesh.renderOrder = 2
  const gapHull = hullOutline(f.mesh, { px: 1.5, cut: true, inflate: INFLATE / objScale, part: fig.userData.u }); gapHull.renderOrder = 3; f.mesh.parent.add(gapHull)
  // the grit he kicks onto the line and the stones that lie on it (dust.js): one Points draw
  const dust = makeDust()
  slope.add(dust.points)
  const mats = { fig, disk, gapHull, diskHull }
  setInks(mats, theme)
  dust.setInk(INKS[theme].body)
  return { scene, slope, f, mats, hulls: [diskHull, gapHull], rs, dust }
}

// the incised lines are fwidth-wide in device pixels: scale them so they stay the same in CSS px at any dpr
function lineWidths(W, dpr) {
  W.mats.fig.userData.u.uWidth.value = 0.55 * dpr
  W.mats.disk.userData.u.uWidth.value = 1.0 * dpr
}

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false })
  r.setClearColor(0x000000, 0)
  r.outputColorSpace = THREE.SRGBColorSpace
  r.toneMapping = THREE.NoToneMapping
  return r
}

// the camera window for BOX fitted (contain, centred, bottom aligned) in a room inside a canvas
// (frustum planes relative to the camera, which sits over O, so view space stays near the origin)
export function windowFor(fit, out) {
  const { s, ox, oy, cw, ch } = fit
  out.left = BOX.l - ox / s
  out.right = out.left + cw / s
  out.top = BOX.t + oy / s
  out.bottom = out.top - ch / s
  return out
}
function aim(cam, O) { cam.position.set(O.x, O.y, 60); cam.lookAt(O.x, O.y, 0) }
export function fitIn(cw, ch, rx, ry, rw, rh) {
  const bw = BOX.r - BOX.l, bh = BOX.t - BOX.b
  const s = Math.min(rw / bw, rh / bh)
  return { s, ox: rx + (rw - bw * s) / 2, oy: ry + (rh - bh * s), cw, ch }
}

let S = null

// the painter's double line for the pot's band (the hero and contact bands have theirs in CSS): two quads
// in the slope frame, 4 and 2 px of the band's target, the same gap as the CSS lines
function makeGroundLines(ink) {
  const u = { uInk: { value: new THREE.Color(ink) } }
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uInk; void main(){ gl_FragColor = linearToOutputTexel(vec4(uInk, 1.0)); }',
  })
  const geo = new THREE.PlaneGeometry(40, 1)
  const a = new THREE.Mesh(geo, m), b = new THREE.Mesh(geo, m)
  a.renderOrder = b.renderOrder = -1
  a.scale.y = 0.036; a.position.y = -0.018
  b.scale.y = 0.018; b.position.y = -0.16
  const g = new THREE.Group()
  g.add(a, b)
  g.visible = false
  return { g, u, setInk: (c) => u.uInk.value.set(c) }
}

export async function mount({ canvas, bands, theme = 'light', tier = 'full', onReady, onError, onLost } = {}) {
  if (S) unmount()
  const { fixedT, catchEvery, catchFirst, effort: fixedEffort, potDeg, act, actU } = query()
  const r = makeRenderer(canvas)
  const a0 = bands[0]?.art.getBoundingClientRect()
  let cap = capFor(tier, a0?.width || 0, a0?.height || 0)
  r.setPixelRatio(cap)
  const me = (S = { r, canvas, dead: false })
  let lost = false, losses = 0
  const onCtxLost = (e) => { e.preventDefault(); lost = true; losses++; host?.el.classList.remove('is-live'); canvas.classList.remove('on'); onLost?.(true, losses); sync() }
  const onCtxRestored = () => { lost = false; onLost?.(false, losses); measureHost(); render(0, true); host?.el.classList.add('is-live'); canvas.classList.add('on'); sync() }
  canvas.addEventListener('webglcontextlost', onCtxLost, false)
  canvas.addEventListener('webglcontextrestored', onCtxRestored, false)
  Object.assign(me, { onCtxLost, onCtxRestored })

  let W
  try { W = await build({ theme }) } catch (e) { onError?.(e); return null }
  if (me.dead) return null
  const { scene, slope, f, mats, hulls, dust } = W
  const [diskHull, gapHull] = hulls
  // the pot, when the page has one (the home page's belly): its own scene, the frieze drawn into its band
  const pot = bands.some((b) => b.kind === 'pot') ? makePot({ tier, theme }) : null
  const lines = makeGroundLines(INKS[theme].body)
  slope.add(lines.g)
  W.pot = pot; W.lines = lines
  lineWidths(W, r.getPixelRatio())
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
  cam.position.set(0, 0, 60)
  cam.lookAt(0, 0, 0)
  const rtCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)

  const stats = (window.__stats = { frames: 0, renders: 0, ms: 0, dpr: r.getPixelRatio(), host: null, paused: true, tier })
  let host = null, fit = null, cssW = 1, cssH = 1
  let t = fixedT ?? T_POSTER, tau = t, rate = 1, last = performance.now()
  let catchStart = -1, nextCatch = Infinity, shiftBase = 0, camShift = 0
  const pose = { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0, lookUp: 0 }
  let adv = 0, advVel = 0, prevPush = 0
  // effort: the scroll velocity through the spring (px/s, signed: + is down the page)
  let vel = fixedEffort !== null ? fixedEffort * V_FULL : 0, velV = 0, lastY = scrollY
  let heroCut = 1 // px of scroll from the top of the page to the cut (the hero's meander under the neck)
  let NECK = 68
  // the pot: its turn and its sun, springs on the scroll position; his stride there; on-demand rendering
  let rot = potDeg ?? POT_TURN.from, rotV = 0, sun = 0, sunV = 0, holdTau = null, potDirty = true, rtTau = NaN, rtKey = '', potSeen = false
  let docVisible = !document.hidden, userPaused = false, first = true, holdUntil = 0, curTheme = theme
  const O = new THREE.Vector3(), win = {}
  // the painting: only where the reveals run (a live tier, not quiet); the still page shows it finished
  let paintStart = -1, painted = !document.documentElement.classList.contains('rv'), paintDoneAt = -1
  const fu = mats.fig.userData.u, du = mats.disk.userData.u
  const _c = new THREE.Vector3(), _skc = new THREE.Color(), _ctc = new THREE.Color()
  const shown = (el) => { const rc = el.getBoundingClientRect(); return (Math.min(rc.bottom, innerHeight) - Math.max(rc.top, 0)) / Math.max(1, rc.height) }
  const px = (name, d) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || d

  // line widths and pixel sizes per pass: the CSS bands in CSS px, the pot's band in its target's pixels
  function passWidths(kind) {
    const fu = mats.fig.userData.u, du = mats.disk.userData.u
    if (kind === 'pot') {
      const { width: w, height: h } = pot.rt
      fu.uWidth.value = 1.15; du.uWidth.value = 1.5; fu.uEyeOn.value = 0
      for (const hh of hulls) hh.material.userData.u.uRes.value.set(w, h)
      gapHull.material.userData.u.uPx.value = 1.7; diskHull.material.userData.u.uPx.value = 1.5
      dust.setScale(w / (pot.win.r - pot.win.l), 1)
    } else {
      lineWidths(W, r.getPixelRatio())
      for (const hh of hulls) hh.material.userData.u.uRes.value.set(cssW, cssH)
      gapHull.material.userData.u.uPx.value = 1.5; diskHull.material.userData.u.uPx.value = 1.3
      if (fit) { fu.uEyeOn.value = 1.8 * fit.s >= EYE_PX ? 1 : 0; dust.setScale(fit.s, r.getPixelRatio()) }
    }
  }
  function measureHost() {
    if (!host) return
    NECK = px('--neck-h', 68)
    const c = host.art.getBoundingClientRect(), rr = host.room.getBoundingClientRect()
    cssW = Math.max(1, Math.round(c.width)); cssH = Math.max(1, Math.round(c.height))
    // the cap follows the band's size (a phone turned to landscape is no longer a small canvas; the
    // adaptive step raises it again when it is)
    const c2 = capFor(tier, cssW, cssH)
    if (c2 !== cap) {
      cap = c2
      if (r.getPixelRatio() > cap) { r.setPixelRatio(cap); stats.dpr = cap }
    }
    r.setSize(cssW, cssH, false)
    const m = document.querySelector('.hero > .meander')
    if (m) heroCut = Math.max(1, m.getBoundingClientRect().bottom + scrollY - NECK)
    if (host.kind === 'pot') pot.frame(cssW, cssH)
    else fit = fitIn(cssW, cssH, rr.left - c.left, rr.top - c.top, rr.width, rr.height)
    passWidths(host.kind)
    potDirty = true
  }
  function setHost(b) {
    if (b === host) return
    host?.el.classList.remove('is-live')
    host = b
    stats.host = b ? b.kind : null
    if (!b) return
    canvas.classList.remove('on')
    b.art.appendChild(canvas)
    measureHost()
    // the first time he lands on the pot he is in the lunge, as its still shows him (the hero is under the
    // neck by then, so the step is never seen)
    if (b.kind === 'pot' && !potSeen) { potSeen = true; tau = T_POSTER + Math.round((tau - T_POSTER) / GAIT.period) * GAIT.period }
    // once the pot has been live its turned-away still never shows again (the snapshot stands in)
    if (b.kind === 'pot' && !first) b.el.classList.add('was-live')
    if (!first) {
      render(0, true)
      // the canvas fades in over the band's still (260 ms), then the still and any old snapshot step aside
      requestAnimationFrame(() => { if (host === b) { canvas.classList.add('on'); b.el.classList.add('is-live'); snaps.get(b)?.classList.remove('on') } })
    }
  }
  // leaving the pot: its last frame stays on it as a picture (an <img>, so there is only ever one canvas)
  // while the canvas goes on to the next band. The pot freezes, the frame is encoded off the main thread,
  // and the canvas moves once the picture is decoded and in place, so the pot is never empty.
  const snaps = new Map()
  let leaving = null
  function requestHost(b) {
    if (b === host) { if (leaving) leaving.cancel = true; return }
    if (leaving) return
    if (host?.kind !== 'pot' || first || lost || !canvas.toBlob) return setHost(b)
    const from = host
    leaving = { cancel: false }
    const done = () => { const l = leaving; leaving = null; if (!l.cancel) setHost(choose()); else if (host === from) snaps.get(from)?.classList.remove('on') }
    render(0, true, true)
    canvas.toBlob((blob) => {
      if (!blob || me.dead) return done()
      let img = snaps.get(from)
      if (!img) { img = new Image(); img.className = 'pot-snap'; img.alt = ''; img.setAttribute('aria-hidden', 'true'); img.decoding = 'async'; from.art.appendChild(img); snaps.set(from, img) }
      // a data: URL (the CSP allows data: images, not blob:), read off the main thread
      const fr = new FileReader()
      fr.onload = () => { img.src = fr.result; img.decode().catch(() => {}).then(() => { img.classList.add('on'); done() }) }
      fr.onerror = done
      fr.readAsDataURL(blob)
    }, 'image/png')
  }
  // the host: the hero keeps the canvas until its meander has passed under the neck (the cut); then
  // whichever laid-out band shows the most of itself (the pot, the contact band)
  function choose() {
    const vh = innerHeight
    let best = null, bestV = 0
    for (const b of bands) {
      if (!b.room.getClientRects().length) continue
      const rc = (b.kind === 'hero' ? b.art : b.el).getBoundingClientRect()
      if (rc.bottom <= 0 || rc.top >= vh) continue
      let v = Math.min(rc.bottom, vh) - Math.max(rc.top, 0)
      if (b.kind === 'hero') v = rc.bottom > NECK + 1 ? 1e6 : 0
      if (v > bestV) { bestV = v; best = b }
    }
    return best
  }
  function advTarget() {
    if (!host) return 0
    if (host.kind === 'hero') return ADV_HERO * clamp(scrollY / heroCut, 0, 1)
    if (host.kind === 'pot') return 0
    // a figure being painted holds his place on the line; he walks into it once he moves
    if (paintStart >= 0 && !painted && t - paintStart < PAINT.move[0]) return adv
    const rc = host.el.getBoundingClientRect()
    const p = clamp((innerHeight - rc.top) / Math.max(1, rc.height), 0, 1)
    return lerp(ADV_CONTACT[0], ADV_CONTACT[1], sstep(0, 1, p))
  }
  // the pot's turn (degrees) and its sun (0..1) from the scroll position
  function potTargets() {
    const b = host
    if (b.belly) {
      const rb = b.belly.getBoundingClientRect()
      const s = NECK - rb.top // px of the belly scrolled past the neck
      const span = Math.max(1, rb.height - innerHeight * 0.6 - POT_TURN.inPx)
      const turn = s < POT_TURN.inPx ? lerp(POT_TURN.from, POT_TURN.face, easeOut(clamp(s / POT_TURN.inPx, 0, 1))) : lerp(POT_TURN.face, POT_TURN.to, clamp((s - POT_TURN.inPx) / span, 0, 1))
      return [turn, clamp(s / (span + POT_TURN.inPx), 0, 1)]
    }
    // the phone's band above Contact: one turn as it passes through the screen
    const rc = b.el.getBoundingClientRect()
    const p = clamp((innerHeight - rc.top) / (innerHeight + rc.height), 0, 1)
    return [lerp(POT_TURN.from, POT_TURN.to, sstep(0.05, 0.95, p)), p]
  }

  // the catch, in scene time: writes the pose and returns the gait rate it allows
  function catchAt(now) {
    pose.shift = shiftBase; pose.leanAdd = 0; pose.crouch = 0; pose.lookUp = 0
    if (catchStart < 0) return 1
    const u = now - catchStart
    const { give, dig, hold, resume, dist } = CATCH
    if (u < give) {
      // the give: the rock gets 0.55 m on him, his feet skid back with it, his head comes up to it
      const k = (u / give) ** 3, e = sstep(0, 1, k)
      pose.shift = shiftBase + dist * k; pose.leanAdd = -8 * e; pose.crouch = 0.025 * k; pose.lookUp = 10 * e
      return 0
    }
    if (u < give + dig) {
      // the dig-in: the rear foot plants, the front knee drives, the lean goes past where it was
      const k = easeOut((u - give) / dig)
      pose.shift = shiftBase + dist; pose.leanAdd = lerp(-8, 6, k); pose.crouch = lerp(0.025, 0.035, k); pose.lookUp = lerp(10, 4, k)
      return 0
    }
    if (u < give + dig + hold) { pose.shift = shiftBase + dist; pose.leanAdd = 6; pose.crouch = 0.035; pose.lookUp = 4; return 0 }
    if (u < give + dig + hold + resume) {
      // the resume: he leans before he steps
      const k = (u - give - dig - hold) / resume, e = easeInOut(k)
      pose.shift = shiftBase + dist; pose.leanAdd = 6 * (1 - e); pose.crouch = 0.035 * (1 - e); pose.lookUp = 4 * (1 - e)
      return k * k
    }
    pose.shift = shiftBase + dist
    if (u >= CATCH_LEN) { shiftBase += dist; catchStart = -1; nextCatch = now + catchEvery - CATCH_LEN; pose.shift = shiftBase }
    return 1
  }
  // grit at the catch: from both feet as they skid, then one speck from where the rock meets the line
  let catchDust = 0
  function catchDustAt(now, o) {
    if (catchStart < 0) { catchDust = 0; return }
    const u = now - catchStart
    const sprayAt = [0.02, 0.12, 0.22]
    while (catchDust < sprayAt.length && u >= sprayAt[catchDust]) {
      for (let i = 0; i < 2; i++) dust.kick(o.balls[i].x, 0.03, 2, { vx: [0.25, 0.9], vy: [0.25, 0.5], t: now })
      catchDust++
    }
    if (catchDust === sprayAt.length && u >= CATCH.give + CATCH.dig + 0.15) { dust.kick(o.bx - 0.05, 0.08, 1, { vx: [-0.15, -0.05], vy: [0.05, 0.12], t: now, s: [2.6, 2.8] }); catchDust++ }
  }

  // the reader's effort: the scroll velocity through a critically damped spring (w 7, settled in 0.6 s)
  function effortAt(dt) {
    const y = scrollY
    if (fixedEffort !== null) { lastY = y; return }
    let v = dt > 0 ? (y - lastY) / dt : 0
    lastY = y
    v = clamp(v, -4000, 4000)
    if (dt > 0) { const w = SPRING_W, a = -w * w * (vel - v) - 2 * w * velV; velV += a * dt; vel += velV * dt }
    if (Math.abs(vel) < 0.5 && Math.abs(velV) < 0.5) { vel = 0; velV = 0 }
  }
  // on the pot he steps only while you read down; when you stop he finishes the step and holds in the
  // lunge (both feet planted, the rock still), so a still page is a still painting
  function strideRate() {
    const target = clamp(vel / V_STRIDE, 0, STRIDE_MAX)
    if (target > 0.12) { holdTau = null; return target }
    if (holdTau === null) {
      const T = GAIT.period, ph = ((tau / T) % 1 + 1) % 1
      let best = Infinity
      for (const h of HOLD_PHASES) { let d = h - ph; if (d < 0.02) d += 1; best = Math.min(best, d) }
      holdTau = tau + best * T
    }
    // ease into the hold, and land on it exactly (so the pot stops rendering)
    if (holdTau - tau < 0.003) { tau = holdTau; return target }
    return Math.max(target, clamp((holdTau - tau) * 3, 0.12, 1))
  }
  // grit kicked back from the rear toe at each push-off (never in a still or a held frame)
  function kickAt(o, dt) {
    if (dt > 0 && fixedT === null && rate > 0.05 && o.push > 0.6 && prevPush <= 0.6) {
      const b = o.balls[o.pushFoot]
      dust.kick(b.x - 0.04, 0.03, 4 + Math.round(2 * ((tau * 7.3) % 1)), { t })
    }
    prevPush = o.push
  }

  // the pot: two passes, the frieze into the band's target, then the pot. Only while something moves: the
  // turn or the sun on their springs, his stride, the grit; the frieze pass only when the painting changed
  function renderPot(dt, force) {
    const step = (x, v, target) => { const a = -SPRING_W * SPRING_W * (x - target) - 2 * SPRING_W * v; v += a * dt; return [x + v * dt, v] }
    const [rt, st] = potTargets()
    if (potDeg !== null) { rot = potDeg; rotV = 0 } else if (dt > 0) { ;[rot, rotV] = step(rot, rotV, rt) } else { rot = rt; rotV = 0 }
    if (dt > 0) { ;[sun, sunV] = step(sun, sunV, st) } else { sun = st; sunV = 0 }
    rate = fixedT === null ? strideRate() : 0
    const dustMoving = dust.update(t, dt) > 0
    // (a twentieth of a degree of turn is under a pixel at the pot's size)
    const moving = Math.abs(rotV) > 0.05 || Math.abs(rot - rt) > 0.05 || Math.abs(sunV) > 0.001 || rate > 0.002 || dustMoving
    if (!moving && !potDirty && !force) return false
    const key = `${curTheme}|${r.getPixelRatio()}`
    const rtDirty = force || potDirty || tau !== rtTau || dustMoving || key !== rtKey
    potDirty = false
    if (rtDirty) {
      rtTau = tau; rtKey = key
      pose.shift = shiftBase; pose.leanAdd = 0; pose.crouch = 0; pose.reachAdd = 0; pose.lookUp = 0
      scene.updateMatrixWorld()
      const o = f.update(tau, pose)
      kickAt(o, dt)
      // the frieze pass: the window round his foot point, drawn into the band's target
      const ox = o.x + pose.shift - camShift
      O.set(ox, 0, 0).applyMatrix4(slope.matrixWorld)
      const WN = pot.win
      aim(rtCam, O)
      rtCam.left = WN.l; rtCam.right = WN.r; rtCam.bottom = WN.b; rtCam.top = WN.t
      rtCam.updateProjectionMatrix()
      const cs = Math.cos(slope.rotation.z)
      dust.stones(ox + WN.l / cs - 0.3, ox + WN.r / cs + 0.3)
      lines.g.position.x = o.x
      lines.g.visible = true
      r.setRenderTarget(pot.rt)
      r.setClearColor(0x000000, 0)
      r.clear()
      r.render(scene, rtCam)
      r.setRenderTarget(null)
      lines.g.visible = false
    }
    pot.group.rotation.y = THREE.MathUtils.degToRad(rot)
    pot.setSun(sun)
    r.render(pot.scene, pot.cam)
    stats.rtSkips = (stats.rtSkips || 0) + (rtDirty ? 0 : 1)
    return true
  }

  function render(dt, force = false, snap = false) {
    if (!host || lost) return false
    effortAt(dt)
    // the pot holds still while its last frame is taken (and draws that frame once, for the snapshot)
    if (host.kind === 'pot') return leaving && !snap ? false : renderPot(dt, force)
    if (!fit) return false
    holdTau = null
    // the loop: it keeps its time if the band leaves (he is already pushing again when you come back)
    if (L.start >= 0 && host.kind !== 'contact') finishLoop()
    if (L.start < 0 && loopReady(dt)) startLoop()
    if (L.start >= 0) return renderLoop(dt)
    // the painting starts when the contact band is 60% in view (at 35% he was still below the fold)
    const painting = host.kind === 'contact' && !painted
    if (painting && paintStart < 0 && fixedT === null && shown(host.el) >= PAINT_AT) { paintStart = t; tau = T_POSTER }
    const e = painting ? 0 : clamp(Math.abs(vel) / V_FULL, 0, 1)
    // the catch: in the hero, only as a foot lands (both feet planted, the stance at its widest, so he can
    // dig in), and never while a scroll is moving him (it waits for the spring to settle)
    const ph = f.phase(tau)
    // the contact band keeps its one event for the loop: no catch there until the loop has run
    if (catchStart < 0 && fixedT === null && (host.kind === 'hero' || (host.kind === 'contact' && L.done)) && t >= nextCatch && e < 0.05 && ph % 0.5 < 0.05) catchStart = t
    rate = catchAt(t)
    // your scroll is his push: scrolling down he leans in and steps faster, scrolling up he braces (a
    // step back of 3 cm, recovered as you stop); never on top of the catch
    pose.reachAdd = 0
    if (catchStart < 0 && !painting) {
      if (vel >= 0) { rate *= 1 + 0.5 * e; pose.leanAdd += 3 * e; pose.reachAdd = 0.02 * e }
      else { rate *= 1 - 0.6 * e; pose.leanAdd += 2 * e; pose.shift += 0.03 * e }
    }
    // the scroll position of the frieze: a critically damped spring on how far up the line he is
    const target = advTarget()
    if (dt > 0) { const w = SPRING_W, a = -w * w * (adv - target) - 2 * w * advVel; advVel += a * dt; adv += advVel * dt } else { adv = target; advVel = 0 }
    camShift += (pose.shift - camShift) * (1 - Math.exp(-dt * (catchStart >= 0 ? 0.35 : 0.9)))
    // the camera never lags him by more than the catch the room was measured for (measure(): CATCH.dist *
    // 0.7), so the deepest give stays inside the room and clear of the plate however close the catches come
    camShift = Math.max(camShift, pose.shift - CATCH.dist * 0.7)
    scene.updateMatrixWorld()
    const o = f.update(tau, pose)
    lastRootX = o.x
    kickAt(o, dt)
    if (dt > 0) catchDustAt(t, o)
    dust.update(t, dt)
    // O, the foot point the CSS ground line passes through: his root minus the climb, minus the catch lag
    const ox = o.x + pose.shift - camShift - adv
    O.set(ox, 0, 0).applyMatrix4(slope.matrixWorld)
    windowFor(fit, win)
    // the stones across the whole canvas (the window is in world metres from O)
    const cs = Math.cos(slope.rotation.z)
    dust.stones(ox + win.left / cs - 0.3, ox + win.right / cs + 0.3)
    aim(cam, O)
    cam.left = win.left; cam.right = win.right; cam.top = win.top; cam.bottom = win.bottom
    cam.updateProjectionMatrix()
    if (painting) {
      // bare clay until the band is 60% in view, then the painting; he holds still until it is done
      if (paintStart < 0) {
        fu.uPaintOn.value = du.uPaintOn.value = 1; fu.uPaint.value = du.uPaint.value = -0.2; fu.uSketch.value = du.uSketch.value = 0
        gapHull.visible = false; diskHull.visible = false
        rate = 0
      } else rate = paintAt(t - paintStart)
    } else if (fu.uPaintOn.value) unpaint()
    r.render(scene, cam)
    return true
  }
  // ---- the loop (B's state machine): his pose for the frame, and the camera's foot point (slope x)
  const L = { start: -1, done: false, seen: 0, xm: 0, xr0: 0, tauHold: 0, shift0: 0, gone: -1, Rx: 0, xEnd: 0, D: 0, Xb: 0, shiftNew: 0, tTurn: 0, tWalk: 0, tPlant: 0, tPush: 0, camX: 0, dust: 0, phase: '' }
  const bufA = f.capture(), bufB = f.capture()
  const PL = { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0, lookUp: 0, rock: null, release: 0 }
  const rockL = { x: 0, z: 0 }
  let lastRootX = 0
  function mirror(on, xb = 0) { f.body.scale.x = on ? -1 : 1; f.body.position.x = on ? xb : 0; f.setMirror(on) }
  function loopReady(dt) {
    if (L.done || fixedT !== null || host?.kind !== 'contact' || !painted || catchStart >= 0 || paintDoneAt < 0) { L.seen = 0; return false }
    // the band in view and the reader settled (a scroll in progress never hides the beat)
    L.seen = shown(host.el) >= LOOP.at && Math.abs(vel) < 40 ? L.seen + dt : 0
    return L.seen >= LOOP.wait
  }
  function startLoop() {
    Object.assign(L, { start: t, gone: -1, dust: 0, shift0: shiftBase, camX: lastRootX, phase: 'stall' })
    stats.loop = 'stall'
  }
  function loopFrame(dt) {
    const u = t - L.start
    const cs = Math.cos(slope.rotation.z)
    const edge = win.left / cs // the canvas's left edge from the camera's foot point, metres along the slope
    const V = f.WALK.v
    if (u < LOOP.stall) {
      // the stall: his last push slows to a third and he leans into it
      const e = easeInOut(u / LOOP.stall)
      rate = lerp(1, 0.3, e)
      Object.assign(PL, { shift: L.shift0, leanAdd: 4 * e, crouch: 0.02 * e, reachAdd: 0, lookUp: 0, rock: null, release: 0 })
      const o = f.update(tau, PL)
      L.xr0 = o.bx; L.xm = o.x; L.tauHold = tau; L.camX = o.x
      L.tTurn = L.start + LOOP.stall + LOOP.watchAt; L.tWalk = L.tTurn + LOOP.turn; L.tPlant = Infinity; L.tPush = Infinity
      if (dt > 0 && L.dust < 2 && u > 0.3 + 0.3 * L.dust) { const b = o.balls[o.pushFoot]; dust.kick(b.x - 0.04, 0.03, 1, { t }); L.dust++ }
      L.phase = 'stall'
      return L.camX
    }
    rate = 0
    const ug = u - LOOP.stall
    // the rock on its own: rolling back down past him, behind him, until it has left the picture; then it
    // is at rest further down, where he will find it (the painter's licence: it stopped out of sight)
    if (L.gone < 0) {
      rockL.x = L.xr0 - 0.5 * LOOP.a * ug * ug
      rockL.z = -1.4 * sstep(0, 0.35, ug)
      if (dt > 0 && ug > 0.15 + 0.3 * (L.dust - 2) && L.dust < 14) { dust.kick(rockL.x + 0.05, 0.03, 3, { vx: [-0.5, 0.25], vy: [0.2, 0.45], t }); L.dust++ }
      if (rockL.x + R * 1.08 < L.camX + edge) {
        L.gone = t
        // where it rests, and so where he will stand to push it again, and how far he has to walk
        const o = f.update(L.tauHold, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0, lookUp: 0 })
        const off = o.bx - o.x
        L.Rx = L.camX + edge - R * 1.2
        L.xEnd = L.Rx - off
        L.D = L.xm - L.xEnd
        L.Xb = L.xm
        L.shiftNew = f.rootX(L.tauHold) - L.xEnd
        // the walk: up to speed in 0.4 s, on at V, and it eases to a stop over the last LOOP.stop m
        L.tPlant = L.tWalk + 0.2 + (L.D - LOOP.stop) / V + (2 * LOOP.stop) / V
        L.tPush = L.tPlant + LOOP.plant
      }
    }
    if (L.gone >= 0) { rockL.x = L.Rx; rockL.z = -1.4 }
    // the get-away and the watch: he straightens, his hands come off it and he looks down after it
    const getaway = () => {
      const k = easeOut(clamp(ug / 0.7, 0, 1))
      Object.assign(PL, { shift: L.shift0, leanAdd: lerp(4, -30, k), crouch: -0.07 * k, reachAdd: 0, lookUp: lerp(0, -16, easeOut(clamp(ug / 0.6, 0, 1))), rock: rockL, release: sstep(0.05, 0.6, ug) })
      return f.update(L.tauHold, PL)
    }
    if (t < L.tTurn) {
      mirror(false)
      getaway()
      L.phase = ug < 0.7 ? 'getaway' : 'watch'
      return L.camX
    }
    if (t < L.tWalk) {
      // the turn: into a standing pose, then (a cut, as a painter turns a figure) facing downhill
      const k = (t - L.tTurn) / LOOP.turn
      if (k < 0.5) {
        mirror(false)
        getaway(); f.capture(bufA)
        f.walk(L.xm, { amp: 0, lookDown: 10 }); f.capture(bufB)
        f.blend(bufA, bufB, easeInOut(k / 0.5))
      } else {
        mirror(true, L.xm)
        f.walk(0, { amp: 0, lookDown: 10 }); f.capture(bufA)
        f.walk(0.001, { amp: 1, lookDown: 8 }); f.capture(bufB)
        f.blend(bufA, bufB, easeInOut((k - 0.5) / 0.5))
      }
      f.placeRock(rockL.x, rockL.z)
      L.phase = 'turn'
      return L.camX
    }
    if (t < L.tPlant) {
      // the walk back down after it, a measured step; he follows the rock while it is still rolling out of
      // the picture, then on to where it lies (the longest still-looking stretch on the page, on purpose)
      const tw = t - L.tWalk
      let sd = tw < 0.4 ? (V * tw * tw) / 0.8 : V * (tw - 0.2)
      if (L.gone >= 0) {
        const t1 = 0.2 + (L.D - LOOP.stop) / V // where the stop begins
        if (tw > t1) { const td = Math.min(tw - t1, (2 * LOOP.stop) / V); sd = L.D - LOOP.stop + V * td - (V * V * td * td) / (4 * LOOP.stop) }
        sd = Math.min(sd, L.D)
      }
      mirror(true, L.xm)
      f.walk(Math.max(0.001, sd), { amp: 1, lookDown: 8 })
      f.placeRock(rockL.x, rockL.z)
      // the camera lets him walk a little way down toward where it went (never as far as the plate), goes
      // with him from there, and once the rock has left the picture eases into looking a little ahead down
      // the slope; it settles as he arrives
      const trail = L.xm - Math.max(0, sd - LOOP.trail)
      let target = trail
      if (L.gone >= 0) {
        const lead = LOOP.lead * (1 - sstep(L.D - 1.4, L.D - 0.2, sd))
        target = lerp(trail, L.xm - sd - lead, sstep(L.gone, L.gone + LOOP.follow, t))
      }
      L.camX += (target - L.camX) * (1 - Math.exp(-dt * 5))
      L.phase = 'walk'
      return L.camX
    }
    const push = (k) => { Object.assign(PL, { shift: L.shiftNew, leanAdd: 0, crouch: 0, reachAdd: 0, lookUp: 0, rock: k < 1 ? { x: L.Rx, z: 0 } : null, release: 0 }); return f.update(tau, PL) }
    if (t < L.tPush) {
      // the plant: he turns uphill and sets his palms on the real surface of the rock
      const k = (t - L.tPlant) / LOOP.plant
      if (k < 0.25) {
        mirror(true, L.xm)
        f.walk(L.D, { amp: 1, lookDown: 8 }); f.capture(bufA)
        f.walk(L.D, { amp: 0, lookDown: 4 }); f.capture(bufB)
        f.blend(bufA, bufB, easeInOut(k / 0.25))
      } else {
        mirror(false)
        f.walk(L.xEnd, { amp: 0, lookDown: 4 }); f.capture(bufA)
        push(0); f.capture(bufB)
        f.blend(bufA, bufB, easeOut((k - 0.25) / 0.75))
      }
      f.placeRock(L.Rx, 0)
      L.camX += (L.xEnd - L.camX) * (1 - Math.exp(-dt * 4))
      L.phase = 'plant'
      return L.camX
    }
    // the first push: he leans before he steps, then the rock turns again
    const k = (t - L.tPush) / LOOP.push
    mirror(false)
    rate = clamp(k, 0, 1) ** 2
    const o = push(1)
    L.camX += (o.x - L.camX) * (1 - Math.exp(-dt * 4))
    L.phase = 'push'
    if (k >= 1) {
      shiftBase = L.shiftNew; camShift = L.shiftNew
      L.done = true; L.start = -1; L.phase = 'done'
      nextCatch = t + catchEvery
    }
    return L.camX
  }
  // the band left mid-loop (a scroll back up): he is already pushing again where the loop would leave him
  function finishLoop() {
    if (L.start < 0) return
    mirror(false)
    if (L.gone >= 0) { tau = L.tauHold; shiftBase = L.shiftNew; camShift = L.shiftNew }
    L.done = true; L.start = -1; L.phase = 'done'
    nextCatch = t + catchEvery
  }
  function renderLoop(dt) {
    const target = advTarget()
    if (dt > 0) { const w = SPRING_W, a = -w * w * (adv - target) - 2 * w * advVel; advVel += a * dt; adv += advVel * dt } else { adv = target; advVel = 0 }
    windowFor(fit, win)
    scene.updateMatrixWorld()
    const cx = loopFrame(dt)
    scene.updateMatrixWorld()
    dust.update(t, dt)
    const ox = cx - adv
    O.set(ox, 0, 0).applyMatrix4(slope.matrixWorld)
    const cs = Math.cos(slope.rotation.z)
    dust.stones(ox + win.left / cs - 0.3, ox + win.right / cs + 0.3)
    aim(cam, O)
    cam.left = win.left; cam.right = win.right; cam.top = win.top; cam.bottom = win.bottom
    cam.updateProjectionMatrix()
    r.render(scene, cam)
    stats.loop = L.phase
    return true
  }

  function paintAt(u) {
    fu.uPaintOn.value = du.uPaintOn.value = 1
    fu.uSketch.value = du.uSketch.value = sstep(0, 1, ph01(u, PAINT.sketch))
    fu.uPaint.value = lerp(-0.12, 1.12, easeInOut(ph01(u, PAINT.slip)))
    fu.uScratch.value = ph01(u, PAINT.scratch)
    fu.uPaintY.value.set(0, 0)
    // the disk fills from its foot up, in the world (it rolls)
    const c = f.boulder.getWorldPosition(_c)
    du.uPaintY.value.set(c.y - R * 1.05, R * 2.1)
    du.uPaint.value = lerp(-0.12, 1.12, ph01(u, PAINT.white))
    du.uScratch.value = 1
    du.uSpeck.value = 0.85 * ph01(u, PAINT.fleck)
    diskHull.material.color.copy(_skc.set(SKETCH[curTheme] || SKETCH.light)).lerp(_ctc.set(INKS[curTheme].contour), sstep(0, 1, ph01(u, PAINT.white)))
    gapHull.visible = u >= PAINT.scratch[0]
    diskHull.visible = true
    if (u >= PAINT.move[0]) {
      painted = true
      paintDoneAt = t
      host?.el.classList.add('painted')
      unpaint()
    }
    // he leans before he steps
    return u < PAINT.move[0] ? 0 : ph01(u, PAINT.move) ** 2
  }
  function unpaint() {
    fu.uPaintOn.value = du.uPaintOn.value = 0
    du.uSpeck.value = 0.85
    gapHull.visible = true; diskHull.visible = true
    diskHull.material.color.set(INKS[curTheme].contour)
  }

  // adaptive resolution: drop 0.25 after 30 slow frames, raise after 240 fast ones
  let slow = 0, fast = 0
  function adapt(ms) {
    if (ms > 22) { if (++slow > 30 && r.getPixelRatio() > 0.75) { setDpr(r.getPixelRatio() - 0.25); slow = 0 } }
    else if (ms < 6) { if (++fast > 240 && r.getPixelRatio() < cap) { setDpr(Math.min(cap, r.getPixelRatio() + 0.25)); fast = 0 } }
    else { slow = 0; fast = 0 }
  }
  function setDpr(v) { r.setPixelRatio(v); measureHost(); stats.dpr = v }

  // the theme switch as a kiln (600 ms, the site's in-out curve): a heat front rises through the frieze and
  // up the pot and the inks cross to the other vase's table behind it; the hulls and the grit change at the
  // midpoint. Uniform writes only: the programs never change
  let kiln = null
  function finishTheme(th) {
    kiln = null
    setInks(mats, th); dust.setInk(INKS[th].body); lines.setInk(INKS[th].body)
    if (pot) { pot.fireAt(th, 1); pot.setTheme(th) }
    potDirty = true
    if (!host || still() || !stats.frames) render(0, true)
  }
  function kilnStep() {
    if (!kiln) return
    const k = clamp((t - kiln.t0) / KILN_S, 0, 1), e = easeInOut(k)
    setFire(mats, e)
    pot?.fireAt(kiln.to, e)
    if (!kiln.half && k >= 0.5) { kiln.half = true; diskHull.material.color.set(INKS[kiln.to].contour); dust.setInk(INKS[kiln.to].body); lines.setInk(INKS[kiln.to].body) }
    potDirty = true
    if (k >= 1) finishTheme(kiln.to)
  }

  function frame(now) {
    let dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (first) holdUntil = now + HOLD_MS
    if (now < holdUntil) dt = 0 // hold the poster frame while the canvas fades in over it
    const nb = choose()
    if (nb !== host || leaving) requestHost(nb)
    t += dt; tau += dt * rate
    if (t > WRAP) { t = tau = T_POSTER; shiftBase = 0; camShift = 0; catchStart = -1; nextCatch = t + catchEvery; dust.clear() }
    // nothing on screen to fire: the kiln finishes at once
    if (kiln && !host) finishTheme(kiln.to)
    kilnStep()
    const t0 = performance.now()
    const drew = render(dt)
    const ms = performance.now() - t0
    if (drew) { stats.renders++; stats.ms += (ms - stats.ms) * 0.1; adapt(stats.ms + (dt * 1000 > 40 ? 30 : 0)) }
    stats.frames++; stats.t = t; stats.slipping = catchStart >= 0; stats.looped = L.done; stats.loop = L.phase; stats.eff = +clamp(Math.abs(vel) / V_FULL, 0, 1).toFixed(3); stats.rate = +rate.toFixed(3); stats.rot = +rot.toFixed(1)
    if (first) live()
  }
  function live() {
    first = false
    // a catch starts only as a foot lands (every 1.025 s): from 0.7 s early, the first lands about 6.1 s
    // after the poster turns live (the clock holds 260 ms on the poster first)
    nextCatch = t + catchFirst - 0.7
    host?.el.classList.add('is-live')
    canvas.classList.add('on')
    window.__ready = true
    onReady?.()
  }
  // the loop runs while any band is near the screen (it picks the host itself each frame); none: it stops
  // never before every program is compiled and the hooks are in (an early observer callback used to start
  // the loop mid-compile: a stalled first frame)
  const near = new Set()
  let mounted = false
  function sync() {
    const run = mounted && docVisible && !userPaused && fixedT === null && !lost && (!!host || near.size > 0)
    stats.paused = !run
    last = performance.now()
    lastY = scrollY
    r.setAnimationLoop(run ? frame : null)
  }
  const io = new IntersectionObserver((es) => {
    for (const e of es) { const b = bands.find((x) => x.el === e.target); if (e.isIntersecting) near.add(b); else near.delete(b) }
    if (!near.size && host) requestHost(null)
    if (still()) requestHost(choose())
    sync()
  }, { rootMargin: '10% 0px 10% 0px' })
  bands.forEach((b) => io.observe(b.el))
  const still = () => userPaused || fixedT !== null
  let lastW = innerWidth, lastH = innerHeight
  // phones change innerHeight as the URL bar moves; ignore small height-only changes
  const onResize = () => { if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return; lastW = innerWidth; lastH = innerHeight; measureHost(); if (still()) render(0, true) }
  const ro = new ResizeObserver(() => { measureHost(); if (still() && !first) render(0, true) })
  bands.forEach((b) => { ro.observe(b.room); ro.observe(b.art) })
  const onVis = () => { docVisible = !document.hidden; sync() }
  // with a fixed clock (?t=) or paused, a scroll renders one still at the scrolled climb (and turn)
  const onScroll = () => { if (still() && !first) { requestHost(choose()); render(0, true); actWhenThere() } }
  addEventListener('resize', onResize)
  addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onVis)

  // compile every program before the first frame (the pot's too), so no frame ever stalls on a shader
  scene.updateMatrixWorld()
  f.update(T_POSTER, pose)
  dust.kick(0, 0.05, 1, { t: 0 }); dust.update(0, 0) // the grit's program compiles with the rest
  try {
    await r.compileAsync(scene, cam)
    if (pot) {
      lines.g.visible = true; await r.compileAsync(scene, rtCam); lines.g.visible = false
      pot.frame(300, 450); await r.compileAsync(pot.scene, pot.cam)
      // warm the pot before it is ever on screen: allocate the band's target and upload the pot, and draw it
      // once into the canvas (still invisible), so the hand-off from the hero is one ordinary frame (it cost
      // 40 to 80 ms the first time)
      const warm = new THREE.WebGLRenderTarget(32, 48)
      rtCam.left = pot.win.l; rtCam.right = pot.win.r; rtCam.bottom = pot.win.b; rtCam.top = pot.win.t; rtCam.position.set(0, 0, 60); rtCam.updateProjectionMatrix()
      r.setRenderTarget(pot.rt); r.render(scene, rtCam)
      r.setRenderTarget(warm); r.render(pot.scene, pot.cam)
      r.setRenderTarget(null); warm.dispose()
      r.render(pot.scene, pot.cam)
      r.clear()
    }
  } catch { /* the first frame compiles instead */ }
  dust.clear()
  if (me.dead) return null
  NECK = px('--neck-h', 68)
  setHost(choose() || bands[0])

  // tools: a moment of an event as a still (with ?t=): the catch or the painting u seconds in, the loop u
  // seconds in, or u seconds into one of its phases. The loop is stepped at 60 fps from its start, so every
  // phase is the one the visitor sees
  const PHASES = ['stall', 'getaway', 'watch', 'turn', 'walk', 'plant', 'push']
  function actAt(name, u = 0) {
    if (name === 'catch') { catchStart = t - u; render(0, true); return { act: name, u } }
    if (name === 'paint') { painted = false; paintStart = t - u; render(0, true); return { act: name, u } }
    if (name !== 'loop' && !PHASES.includes(name)) return null
    painted = true; paintDoneAt = t - 2; unpaint()
    if (L.start < 0) { L.done = false; startLoop() }
    let n = 0, inPhase = 0
    while (n++ < 4000) {
      t += 1 / 60; tau += rate / 60; renderLoop(1 / 60)
      if (L.start < 0) break
      if (name === 'loop' ? t - L.start >= u : L.phase === name && (inPhase += 1 / 60) >= u) break
      if (name !== 'loop' && inPhase > 0 && L.phase !== name) break
    }
    return { act: name, phase: L.phase, u: +(t - L.start).toFixed(2) }
  }
  let actPending = act
  function actWhenThere() {
    if (!actPending || fixedT === null) return
    if (host?.kind !== (actPending === 'catch' ? 'hero' : 'contact')) return
    const a = actPending
    actPending = null
    actAt(a, actU ?? 0)
  }

  // tools: the pot's still, rendered from the scene at a turn (scripts/poster.mjs --pot): w x h device px,
  // the man in the lunge at T_POSTER, the sun as the turn's spring would set it
  function potShot({ rot: deg = 0, sun: k = 0, w = 560, h = 860 } = {}) {
    if (!pot) return null
    const dpr = r.getPixelRatio()
    r.setPixelRatio(1); r.setSize(w, h, false)
    pot.frame(w, h); passWidths('pot')
    pose.shift = shiftBase; pose.leanAdd = 0; pose.crouch = 0; pose.reachAdd = 0; pose.lookUp = 0
    scene.updateMatrixWorld()
    const o = f.update(T_POSTER, pose)
    O.set(o.x + pose.shift - camShift, 0, 0).applyMatrix4(slope.matrixWorld)
    aim(rtCam, O)
    rtCam.left = pot.win.l; rtCam.right = pot.win.r; rtCam.bottom = pot.win.b; rtCam.top = pot.win.t; rtCam.updateProjectionMatrix()
    const cs = Math.cos(slope.rotation.z)
    dust.clear()
    dust.stones(o.x + pose.shift - camShift + pot.win.l / cs - 0.3, o.x + pose.shift - camShift + pot.win.r / cs + 0.3)
    lines.g.position.x = o.x; lines.g.visible = true
    r.setRenderTarget(pot.rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, rtCam); r.setRenderTarget(null)
    lines.g.visible = false
    pot.group.rotation.y = THREE.MathUtils.degToRad(deg); pot.setSun(k)
    r.clear(); r.render(pot.scene, pot.cam)
    const url = canvas.toDataURL('image/png')
    r.setPixelRatio(dpr); measureHost(); rtTau = NaN; render(0, true)
    return { url, w, h }
  }

  installHooks({
    potShot,
    inflate: INFLATE,
    act: (name, u) => actAt(name, u),
    loop: () => ({ phase: L.phase, start: L.start, done: L.done, t }),
    r, cam, scene, slope, f, R, canvas, fit: () => fit, host: () => host, W,
    render: (tt) => { t = tau = tt; render(0, true) },
    step: (dt) => { t += dt; tau += dt * rate; render(dt, true) },
    measure: () => measure(W),
    poster: (o) => poster(o),
  })

  mounted = true
  if (fixedT !== null) { render(0, true); live(); actWhenThere() } else sync()

  Object.assign(me, {
    io, ro, onResize, onVis, onScroll, W,
    pause: () => { userPaused = true; sync() },
    play: () => { userPaused = false; sync() },
    setTheme: (th) => {
      if (th === curTheme) return
      curTheme = th
      // the kiln: animated while the scene runs (never during the painting); otherwise the instant swap
      if (host && !still() && stats.frames && !lost && !(host.kind === 'contact' && !painted) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        kiln = { to: th, t0: t, half: false }
        fireInks(mats, th)
        potDirty = true
        return
      }
      finishTheme(th)
    },
    paused: () => userPaused,
    remeasure: () => { measureHost(); if (still()) render(0, true) },
  })
  return me
}

// the box: his skinned vertices and the disk over two push cycles (and, separately, the catch poses with
// the camera lag), relative to O; and the frame of greatest stretch (the push-off peak)
function measure(W) {
  const { scene, slope, f } = W
  const v = new THREE.Vector3(), O = new THREE.Vector3()
  const pos = f.mesh.geometry.attributes.position
  const box = () => ({ l: 1e9, r: -1e9, b: 1e9, t: -1e9 })
  const rest = box(), slip = box(), man = box()
  const add = (bb, o, lag, onlyMan = null) => {
    scene.updateMatrixWorld(true)
    O.set(o.x + lag, 0, 0).applyMatrix4(slope.matrixWorld)
    for (let k = 0; k < pos.count; k += 2) {
      v.fromBufferAttribute(pos, k); f.mesh.applyBoneTransform(k, v); v.applyMatrix4(f.mesh.matrixWorld)
      for (const b of onlyMan ? [bb, onlyMan] : [bb]) { b.l = Math.min(b.l, v.x - O.x); b.r = Math.max(b.r, v.x - O.x); b.b = Math.min(b.b, v.y - O.y); b.t = Math.max(b.t, v.y - O.y) }
    }
    const c = new THREE.Vector3(o.bx, R, 0).applyMatrix4(slope.matrixWorld)
    const k = R * 1.035
    bb.l = Math.min(bb.l, c.x - k - O.x); bb.r = Math.max(bb.r, c.x + k - O.x); bb.b = Math.min(bb.b, c.y - k - O.y); bb.t = Math.max(bb.t, c.y + k - O.y)
  }
  let pushMax = -1, tPush = 0
  for (let i = 0; i < 64; i++) {
    const tt = T_POSTER + (i / 64) * 2 * GAIT.period
    scene.updateMatrixWorld()
    add(rest, f.update(tt, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 }), 0, man)
  }
  for (let i = 0; i < 400; i++) {
    const tt = 2 + (i / 400) * GAIT.period
    const o = f.update(tt, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 })
    if (o.push > pushMax) { pushMax = o.push; tPush = tt }
  }
  // the catch: the rock gets CATCH.dist on him, the camera (camShift) has barely moved yet; and the effort
  // poses (leaning in 3 degrees, reaching 2 cm)
  for (const p of [{ leanAdd: -8, crouch: 0.025, lookUp: 10 }, { leanAdd: 6, crouch: 0.035, lookUp: 4 }, { leanAdd: 3, crouch: 0, reachAdd: 0.02 }]) for (let i = 0; i < 16; i++) {
    const tt = T_POSTER + (i / 16) * GAIT.period
    scene.updateMatrixWorld()
    const sh = p.reachAdd ? 0 : CATCH.dist
    add(slip, f.update(tt, { shift: sh, reachAdd: 0, ...p }), sh * 0.7)
  }
  return { rest, slip, man, tPush, pushMax, R, BOX }
}

// the poster: the composition box alone, transparent, at the poster frame, as the live canvas draws it
// for a room cssWidth wide at this dpr (line and contour widths are in pixels); returns a PNG data URL
export async function poster({ theme = 'light', cssWidth = 800, dpr = 2, figureUrl = FIGURE_URL, t = T_POSTER } = {}) {
  const bw = BOX.r - BOX.l, bh = BOX.t - BOX.b
  const ch = Math.round(cssWidth * bh / bw)
  const canvas = document.createElement('canvas')
  const r = makeRenderer(canvas)
  r.setPixelRatio(dpr)
  r.setSize(cssWidth, ch, false)
  const W = await build({ theme, figureUrl })
  lineWidths(W, dpr)
  for (const hh of W.hulls) hh.material.userData.u.uRes.value.set(cssWidth, ch)
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
  cam.position.set(0, 0, 60); cam.lookAt(0, 0, 0)
  W.scene.updateMatrixWorld()
  const o = W.f.update(t, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 })
  const O = new THREE.Vector3(o.x, 0, 0).applyMatrix4(W.slope.matrixWorld)
  const fit0 = fitIn(cssWidth, ch, 0, 0, cssWidth, ch)
  W.mats.fig.userData.u.uEyeOn.value = 1.8 * fit0.s >= EYE_PX ? 1 : 0
  const win = windowFor(fit0, {})
  aim(cam, O)
  Object.assign(cam, win); cam.updateProjectionMatrix()
  // the stones on the line are part of the picture (the first live frame draws them where they lie)
  W.dust.setScale(fit0.s, dpr)
  const cs = Math.cos(W.slope.rotation.z)
  W.dust.stones(o.x + win.left / cs - 0.3, o.x + win.right / cs + 0.3)
  await r.compileAsync(W.scene, cam).catch(() => {})
  r.render(W.scene, cam)
  const url = canvas.toDataURL('image/png')
  W.scene.traverse((ob) => { ob.geometry?.dispose(); const m = ob.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose()) })
  r.dispose()
  return { url, width: canvas.width, height: canvas.height }
}

export function pause() { S?.pause?.() }
export function play() { S?.play?.() }
export function setTheme(th) { S?.setTheme?.(th) }
export function isPaused() { return S?.paused?.() ?? false }
export function remeasure() { S?.remeasure?.() }

export function unmount() {
  if (!S) return
  const s = S
  S = null
  s.dead = true
  s.r.setAnimationLoop(null)
  s.io?.disconnect(); s.ro?.disconnect()
  if (s.onResize) removeEventListener('resize', s.onResize)
  if (s.onScroll) removeEventListener('scroll', s.onScroll)
  if (s.onVis) document.removeEventListener('visibilitychange', s.onVis)
  s.canvas.removeEventListener('webglcontextlost', s.onCtxLost)
  s.canvas.removeEventListener('webglcontextrestored', s.onCtxRestored)
  s.W?.scene.traverse((o) => { o.geometry?.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose()) })
  s.r.dispose()
  removeHooks()
}
