/*
  The live frieze (v5, the amphora): one lazy chunk with three, imported by src/lib/frieze-host.js after
  load, the poster's decode and an idle moment; never in the still tier, under quiet or motion off.

    const scene = await import('../scene/frieze.js')
    scene.mount({ canvas, bands, theme, tier, onReady, onError, onLost })
    scene.setTheme('dark') / scene.pause() / scene.play() / scene.unmount()

  bands: [{ kind: 'hero' | 'contact', el, art, room }]. el is the clay band, art the layer the canvas lives
  in, room the CSS box the composition is fitted into (the poster <img> fills the same box, contain and
  bottom aligned, so the canvas lands on the poster pixel for pixel). One canvas and one WebGL context:
  the canvas moves into whichever band is most on screen.

  The ground line is CSS (crisp, and there before the scene), so the camera follows him along the slope:
  the line never moves on screen, and scroll only changes how far up it he has got.

  Two clocks: t is the wall clock, tau the gait clock, which freezes during the catch and ramps back, so
  the cycle never pops. Flat colour, no lights, no fog, no post, no shadows: a theme switch is a uniform
  write (vase.js setInks), never a recompile.

  Query flags (tools only): ?t=<s> freezes the clock (a scroll renders one still), ?slip=<s> the catch
  period (and its first), ?effort=<0..1> a fixed effort. Hooks (hooks.js): window.__ready, __stats, __bench(n), __frameAt(t), __measure(), __bounds(),
  __poster(opts).
*/
import * as THREE from 'three'
import { loadFigure, makeFigure } from './figure.js'
import { figureMaterial, boulderMaterial, hullOutline, setInks, INKS } from './vase.js'
import { addCurvature } from './curvature.js'
import { addParts, headUniforms } from './head.js'
import { rockShape } from './rock.js'
import { makeDust } from './dust.js'
import { SLOPE_DEG, R, X0, T_POSTER, BOX } from './comp.js'
import { installHooks, removeHooks } from './hooks.js'

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
// effort: the reader's scroll velocity (CSS px/s) that counts as full effort
const V_FULL = 1200
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
    // tools only: a fixed effort (0..1, + is scrolling down) for stills
    effort: q.has('effort') ? Number(q.get('effort')) : null,
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

export async function mount({ canvas, bands, theme = 'light', tier = 'full', onReady, onError, onLost } = {}) {
  if (S) unmount()
  const { fixedT, catchEvery, catchFirst, effort: fixedEffort } = query()
  const r = makeRenderer(canvas)
  const a0 = bands[0]?.art.getBoundingClientRect()
  let cap = capFor(tier, a0?.width || 0, a0?.height || 0)
  r.setPixelRatio(cap)
  const me = (S = { r, canvas, dead: false })
  let lost = false, losses = 0
  const onCtxLost = (e) => { e.preventDefault(); lost = true; losses++; host?.el.classList.remove('is-live'); canvas.classList.remove('on'); onLost?.(true, losses); sync() }
  const onCtxRestored = () => { lost = false; onLost?.(false, losses); measureHost(); render(0); host?.el.classList.add('is-live'); canvas.classList.add('on'); sync() }
  canvas.addEventListener('webglcontextlost', onCtxLost, false)
  canvas.addEventListener('webglcontextrestored', onCtxRestored, false)
  Object.assign(me, { onCtxLost, onCtxRestored })

  let W
  try { W = await build({ theme }) } catch (e) { onError?.(e); return null }
  if (me.dead) return null
  const { scene, slope, f, mats, hulls, dust } = W
  lineWidths(W, r.getPixelRatio())
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
  cam.position.set(0, 0, 60)
  cam.lookAt(0, 0, 0)

  const stats = (window.__stats = { frames: 0, ms: 0, dpr: r.getPixelRatio(), host: null, paused: true, tier })
  let host = null, fit = null, cssW = 1, cssH = 1
  const vis = new Map()
  let t = fixedT ?? T_POSTER, tau = t, rate = 1, last = performance.now()
  let catchStart = -1, nextCatch = Infinity, shiftBase = 0, camShift = 0
  const pose = { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0, lookUp: 0 }
  let adv = 0, advVel = 0, prevPush = 0
  // effort: the scroll velocity through the spring (px/s, signed: + is down the page)
  let vel = fixedEffort !== null ? fixedEffort * V_FULL : 0, velV = 0, lastY = scrollY
  let heroCut = 1 // px of scroll from the top of the page to the cut (the hero's meander under the neck)
  let docVisible = !document.hidden, userPaused = false, first = true, holdUntil = 0, curTheme = theme
  const O = new THREE.Vector3(), win = {}

  function measureHost() {
    if (!host) return
    const c = host.art.getBoundingClientRect(), rr = host.room.getBoundingClientRect()
    cssW = Math.max(1, Math.round(c.width)); cssH = Math.max(1, Math.round(c.height))
    // the cap follows the band's size (a phone turned to landscape is no longer a small canvas; the
    // adaptive step raises it again when it is)
    const c2 = capFor(tier, cssW, cssH)
    if (c2 !== cap) {
      cap = c2
      if (r.getPixelRatio() > cap) { r.setPixelRatio(cap); lineWidths(W, cap); stats.dpr = cap }
    }
    r.setSize(cssW, cssH, false)
    const m = document.querySelector('.hero > .meander')
    const neck = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--neck-h')) || 68
    if (m) heroCut = Math.max(1, m.getBoundingClientRect().bottom + scrollY - neck)
    fit = fitIn(cssW, cssH, rr.left - c.left, rr.top - c.top, rr.width, rr.height)
    for (const h of hulls) h.material.userData.u.uRes.value.set(cssW, cssH)
    mats.fig.userData.u.uEyeOn.value = 1.8 * fit.s >= EYE_PX ? 1 : 0
    dust.setScale(fit.s, r.getPixelRatio())
  }
  function setHost(b) {
    if (b === host) return
    host?.el.classList.remove('is-live')
    host = b
    stats.host = b ? b.kind : null
    if (!b) return
    b.art.appendChild(canvas)
    measureHost()
    if (!first) { render(0); b.el.classList.add('is-live') }
  }
  function advTarget() {
    if (!host) return 0
    const rc = host.el.getBoundingClientRect()
    if (host.kind === 'hero') return ADV_HERO * clamp(scrollY / heroCut, 0, 1)
    const p = clamp((innerHeight - rc.top) / Math.max(1, rc.height), 0, 1)
    return lerp(ADV_CONTACT[0], ADV_CONTACT[1], sstep(0, 1, p))
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

  function render(dt) {
    if (!fit || lost) return
    effortAt(dt)
    const e = clamp(Math.abs(vel) / V_FULL, 0, 1)
    // the catch: in the hero, only as a foot lands (both feet planted, the stance at its widest, so he can
    // dig in), and never while a scroll is moving him (it waits for the spring to settle)
    const ph = f.phase(tau)
    if (catchStart < 0 && fixedT === null && host?.kind === 'hero' && t >= nextCatch && e < 0.05 && ph % 0.5 < 0.05) catchStart = t
    rate = catchAt(t)
    // your scroll is his push: scrolling down he leans in and steps faster, scrolling up he braces (a
    // step back of 3 cm, recovered as you stop); never on top of the catch
    pose.reachAdd = 0
    if (catchStart < 0) {
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
    // grit kicked back from the rear toe at each push-off (never in a still or a held frame)
    if (dt > 0 && fixedT === null && rate > 0.05 && o.push > 0.6 && prevPush <= 0.6) {
      const b = o.balls[o.pushFoot]
      dust.kick(b.x - 0.04, 0.03, 4 + Math.round(2 * ((tau * 7.3) % 1)), { t })
    }
    prevPush = o.push
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
    r.render(scene, cam)
  }

  // adaptive resolution: drop 0.25 after 30 slow frames, raise after 240 fast ones
  let slow = 0, fast = 0
  function adapt(ms) {
    if (ms > 22) { if (++slow > 30 && r.getPixelRatio() > 0.75) { setDpr(r.getPixelRatio() - 0.25); slow = 0 } }
    else if (ms < 6) { if (++fast > 240 && r.getPixelRatio() < cap) { setDpr(Math.min(cap, r.getPixelRatio() + 0.25)); fast = 0 } }
    else { slow = 0; fast = 0 }
  }
  function setDpr(v) { r.setPixelRatio(v); lineWidths(W, v); measureHost(); stats.dpr = v }

  function frame(now) {
    let dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (first) holdUntil = now + HOLD_MS
    if (now < holdUntil) dt = 0 // hold the poster frame while the canvas fades in over it
    t += dt; tau += dt * rate
    if (t > WRAP) { t = tau = T_POSTER; shiftBase = 0; camShift = 0; catchStart = -1; nextCatch = t + catchEvery; dust.clear() }
    const t0 = performance.now()
    render(dt)
    const ms = performance.now() - t0 + (dt * 1000 > 40 ? 30 : 0)
    stats.frames++; stats.ms += (ms - stats.ms) * 0.1; stats.t = t; stats.slipping = catchStart >= 0; stats.eff = +clamp(Math.abs(vel) / V_FULL, 0, 1).toFixed(3); stats.rate = +rate.toFixed(3)
    adapt(stats.ms)
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
  function sync() {
    const run = !!host && docVisible && !userPaused && fixedT === null && !lost
    stats.paused = !run
    last = performance.now()
    lastY = scrollY
    r.setAnimationLoop(run ? frame : null)
  }
  function pick() {
    let best = null, bestR = 0
    for (const b of bands) { const v = vis.get(b) || 0; if (v > bestR) { best = b; bestR = v } }
    setHost(best)
    sync()
  }
  const io = new IntersectionObserver((es) => { for (const e of es) vis.set(bands.find((b) => b.el === e.target), e.isIntersecting ? e.intersectionRatio + 1e-3 : 0); pick() }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] })
  bands.forEach((b) => io.observe(b.el))
  const still = () => userPaused || fixedT !== null
  let lastW = innerWidth, lastH = innerHeight
  // phones change innerHeight as the URL bar moves; ignore small height-only changes
  const onResize = () => { if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return; lastW = innerWidth; lastH = innerHeight; measureHost(); if (still()) render(0) }
  const ro = new ResizeObserver(() => { measureHost(); if (still() && !first) render(0) })
  bands.forEach((b) => { ro.observe(b.room); ro.observe(b.art) })
  const onVis = () => { docVisible = !document.hidden; sync() }
  // with a fixed clock (?t=) or paused, a scroll renders one still at the scrolled climb
  const onScroll = () => { if (still() && !first) render(0) }
  addEventListener('resize', onResize)
  addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onVis)

  // compile off the critical path before the first frame, so the first frame never stalls
  scene.updateMatrixWorld()
  f.update(T_POSTER, pose)
  dust.kick(0, 0.05, 1, { t: 0 }); dust.update(0, 0) // the grit's program compiles with the rest
  try { await r.compileAsync(scene, cam) } catch { /* the first frame compiles instead */ }
  dust.clear()
  if (me.dead) return null
  // start in the hero if nothing has reported yet (the observer fires on the next frame)
  if (!host) setHost(bands[0])

  installHooks({
    r, cam, scene, slope, f, R, canvas, fit: () => fit, host: () => host, W,
    render: (tt) => { t = tau = tt; render(0) },
    step: (dt) => { t += dt; tau += dt * rate; render(dt) },
    measure: () => measure(W),
    poster: (o) => poster(o),
  })

  if (fixedT !== null) { render(0); live() } else sync()

  Object.assign(me, {
    io, ro, onResize, onVis, onScroll, W,
    pause: () => { userPaused = true; sync() },
    play: () => { userPaused = false; sync() },
    setTheme: (th) => { if (th === curTheme) return; curTheme = th; setInks(mats, th); dust.setInk(INKS[th].body); if (!host || still() || !stats.frames) render(0) },
    paused: () => userPaused,
    remeasure: () => { measureHost(); if (still()) render(0) },
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
