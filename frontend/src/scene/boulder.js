/*
  The boulder scene: one lazy chunk, imported by src/hero/Stage.jsx after first paint, load and
  idle. Ported from v3/prototypes/a3/src/scene/boulder.js; the figure, rock, terrain, world, lights,
  post, camera and scroll live in their own modules (DESIGN.md 3.1).

    const scene = await import('../scene/boulder.js')
    scene.mount(canvas, { tier, onReady, onFrame, onError, onLost })
    scene.pause() / scene.play() / scene.unmount()

  tier       'full' | 'lite' (the still tier never imports this file)
  onReady()  after the first frame is on the canvas (the page fades it in)
  onFrame(f) once a frame: f.boulder = { x, y, r } in CSS px (for the scrim pool), f.prog, f.dawn
  frame()    the free room for the man and the rock at p 0, { x0, y0, x1, y1 } in CSS px, or null (camera.js)
  onLost(lost)  the WebGL context went (true) or came back (false)

  Two clocks: t is the scene's wall clock (the core's turn), tau is the gait clock, which
  freezes during the slip and ramps back, so the cycle never pops.

  Test hooks (src/scene/hooks.js): ?t=<s> freezes the clock, ?p=<0..1> forces progress, ?slip=<s>
  starts a slip that many seconds in; window.__ready, __stats, __bench(n), __frameAt(t, p), __bounds().
*/
import * as THREE from 'three'
import { loadFigure, makeFigure, figureMaterial } from './figure.js'
import { glassPresets, rockGeometry, rockSurface, neonCore, neonEnvironment, coreGlow, droplets } from './rock.js'
import { makeSlopeAsync, contourMaterial, makeReflection, makeContactShadow } from './terrain.js'
import { makeSky, makeRidge, makeStars, makeCity } from './world.js'
import { makeLights, LIGHT, FOG } from './lights.js'
import { makePost } from './post.js'
import { makeCamera, CAM } from './camera.js'
import { makeProgress, makeSpring } from './scroll.js'
import { installHooks, removeHooks, readQuery } from './hooks.js'

const DPR_CAP = { full: 2, lite: 1.5 }
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) }
const easeIn = (u) => u * u * u

const T0 = 2.3          // boot time: the poster is this frame
const SLOPE = 20
const R = 1.95
const X0 = -45          // start 45 m down the slope; the clock wraps before the terrain ends
const WRAP = 268
const SLIP_EVERY = 14
const SLIP = { dist: 0.9, slide: 0.45, plant: 0.3, hold: 0.12, resume: 0.6 }
const SPRING_W = 11     // rad/s: critically damped, settles in about 0.4 s, never overshoots
const HOLD_MS = 260     // the clock holds this long after the first frame, while the canvas fades in over the poster
// the city carpet (REFINE.md build item 1): a valley floor 200 m below the start, 500 to 1100 m out
// toward the lower left of every camera, with the far ridge moved out 2.5x (scaled about the hero camera,
// so its silhouette is a3's) so the floor runs far enough to be seen under his feet. The valley
// haze hides every light shallower than haze(p) degrees below the camera: the cloud thins as he climbs.
const CITY = {
  below: -200, near: 500, far: 1100, cx: -110, width: 1000, size: 3.6, ridgeScale: 2.5, ridgeOrigin: [-47.2, -11.8, 8.5],
  haze: [[0, 32], [0.45, 30], [0.56, 26], [0.7, 23], [0.8, 19.5], [0.9, 16], [1, 12.8]],
}
const hazeAt = (p) => {
  const H = CITY.haze
  let deg = H[H.length - 1][1]
  for (let i = 1; i < H.length; i++) if (p <= H[i][0]) { const [p0, d0] = H[i - 1], [p1, d1] = H[i]; deg = d0 + (d1 - d0) * clamp((p - p0) / (p1 - p0), 0, 1); break }
  return Math.pow(Math.LN2, 0.25) * Math.sin(THREE.MathUtils.degToRad(deg)) // transmittance 0.5 at that depression
}
const FIGURE_URL = new URL('../assets/figure/man.glb', import.meta.url).href

let S = null

export function mount(canvas, opts = {}) {
  if (S) unmount()
  const tier = opts.tier === 'lite' ? 'lite' : 'full'
  const full = tier === 'full'
  const { fixedT, forcedP, forcedSlip } = readQuery()

  const r = new THREE.WebGLRenderer({ canvas, antialias: !full, alpha: false, powerPreference: 'high-performance', stencil: false })
  const cap = DPR_CAP[tier]
  r.setPixelRatio(Math.min(devicePixelRatio || 1, cap))
  r.setSize(innerWidth, innerHeight, false)
  r.outputColorSpace = THREE.SRGBColorSpace
  r.toneMapping = THREE.ACESFilmicToneMapping
  r.toneMappingExposure = LIGHT.exposure[0]
  r.shadowMap.enabled = full
  r.shadowMap.type = THREE.PCFSoftShadowMap
  let losses = 0
  const onLost = (e) => { e.preventDefault(); losses++; document.documentElement.dataset.gl = 'lost'; opts.onLost?.(true, losses); sync() }
  const onRestored = () => { document.documentElement.dataset.gl = 'ok'; opts.onLost?.(false, losses); sync() }
  canvas.addEventListener('webglcontextlost', onLost, false)
  canvas.addEventListener('webglcontextrestored', onRestored, false)

  const scene = new THREE.Scene()
  const F0 = full ? FOG.full : FOG.lite
  scene.fog = new THREE.FogExp2(F0[0], F0[1])
  const fogBase = new THREE.Color(F0[0]), fogPale = new THREE.Color(FOG.pale)
  const sky = makeSky(); scene.add(sky)
  const stars = makeStars(); sky.add(stars)
  const ridge = makeRidge({ skyUniforms: sky.material.uniforms, scale: CITY.ridgeScale, origin: CITY.ridgeOrigin }); scene.add(ridge)
  const { cam, place } = makeCamera()

  // the slope frame carries the mountain and the figure; +x climbs
  const slope = new THREE.Group(); slope.rotation.z = THREE.MathUtils.degToRad(SLOPE); scene.add(slope)
  const ground = contourMaterial({ strength: full ? 0.6 : 0.5, wet: 0.45 })
  const city = makeCity({ count: full ? 1600 : 900, ...CITY, skyUniforms: sky.material.uniforms, ridge }); scene.add(city)
  city.userData.setHaze(hazeAt(0))

  const glass = full ? glassPresets.premium2(R, tier) : glassPresets.lite(R)
  const figMat = figureMaterial({ lite: !full })
  let rockGeo = null // built a task later (the mount never runs as one long task)
  let fig = null
  const core = neonCore(R, { halo: !full }); scene.add(core)
  const glow = full ? null : coreGlow(R, 0.9)
  if (glow) scene.add(glow)
  const pool = makeReflection(); slope.add(pool)
  const shFeet = [makeContactShadow(0.55, 0.5), makeContactShadow(0.55, 0.5)], shRock = makeContactShadow(2.4 * R, 0.4)
  slope.add(shFeet[0], shFeet[1], shRock)

  const lights = makeLights(scene, { full, R })
  const coreMats = []
  core.traverse((o) => { if (o.material && !o.material.transparent) coreMats.push([o.material, o.material.color.clone()]) })

  let post = null

  // ---- state ----
  const sp = makeProgress()
  const spring = makeSpring(SPRING_W)
  let target = forcedP ?? 0
  spring.set(forcedP ?? 0)
  let t = fixedT ?? T0, tau = fixedT ?? T0, rate = 1
  let last = performance.now()
  let visible = !document.hidden, onScreen = true, userPaused = false
  let slipStart = -1, slipArmed = forcedSlip !== null ? (fixedT ?? T0) + forcedSlip : -1
  let lastSlipEnd = fixedT ?? T0
  let shiftBase = 0, camShift = 0
  const ptr = { x: 0, y: 0 }, ptrT = { x: 0, y: 0 }
  const fine = matchMedia('(pointer: fine)').matches
  const stats = (window.__stats = { tier, frames: 0, ms: 0, dpr: r.getPixelRatio(), paused: false })

  const F = new THREE.Vector3(), B = new THREE.Vector3(), Bcam = new THREE.Vector3(), tmp = new THREE.Vector3(), proj = new THREE.Vector3(), anchor = new THREE.Vector3()
  const boulderInfo = { x: 0, y: 0, r: 0 }
  const pose = { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 }
  const frameInfo = { boulder: boulderInfo, prog: 0, dawn: 0 }

  // the slip and catch: the rock gets 0.9 m on him over 450 ms, his planted feet skid with it, he
  // plants for 300 ms, holds 120 ms, and the push resumes over 600 ms. tau freezes while he holds.
  function slipAt(now) {
    rate = 1
    pose.shift = shiftBase; pose.leanAdd = 0; pose.crouch = 0
    if (slipStart < 0) return
    const u = now - slipStart
    const { dist, slide, plant, hold, resume } = SLIP
    if (u < slide) {
      const k = easeIn(u / slide)
      pose.shift = shiftBase + dist * k; pose.leanAdd = -8 * sstep(0, 1, k); pose.crouch = 0.05 * k; rate = 0
    } else if (u < slide + plant) {
      const k = sstep(0, 1, (u - slide) / plant)
      pose.shift = shiftBase + dist; pose.leanAdd = lerp(-8, 5, k); pose.crouch = lerp(0.05, 0.07, k); rate = 0
    } else if (u < slide + plant + hold) {
      pose.shift = shiftBase + dist; pose.leanAdd = 5; pose.crouch = 0.07; rate = 0
    } else if (u < slide + plant + hold + resume) {
      const k = sstep(0, 1, (u - slide - plant - hold) / resume)
      pose.shift = shiftBase + dist; pose.leanAdd = 5 * (1 - k); pose.crouch = 0.07 * (1 - k); rate = k
    } else {
      shiftBase += dist; slipStart = -1; lastSlipEnd = now; pose.shift = shiftBase
    }
  }

  function render(now, dt) {
    // scroll: a critically damped spring on the progress, exact per-frame step
    const prog = forcedP !== null ? (spring.set(forcedP), forcedP) : spring.step(target, dt)
    ptr.x += (ptrT.x - ptr.x) * (1 - Math.exp(-dt * 3)); ptr.y += (ptrT.y - ptr.y) * (1 - Math.exp(-dt * 3))
    // the ending: once the wide has settled, every 14 s, at the next double support, the rock slips
    if (slipStart < 0 && fig) {
      const settled = prog > 0.9 && Math.abs(target - prog) < 0.003 && now - lastSlipEnd > SLIP_EVERY
      if ((settled || (slipArmed >= 0 && now >= slipArmed)) && Math.abs(fig.phase(tau) - 0.6) < 0.03) { slipStart = now; slipArmed = -1 }
    }
    slipAt(now)
    scene.updateMatrixWorld()
    const o = fig.update(tau, pose)
    const { x, bx } = o
    // the camera re-centres on him slowly after a slip, so the slip itself reads in frame
    camShift += (pose.shift - camShift) * (1 - Math.exp(-dt * (slipStart >= 0 ? 0.35 : 0.9)))
    const fx = x + pose.shift - camShift
    B.set(bx, R, 0).applyMatrix4(slope.matrixWorld)
    core.position.copy(B); core.rotation.y = now * 0.08
    glow?.position.copy(B)
    Bcam.set(bx + pose.shift - camShift, R, 0).applyMatrix4(slope.matrixWorld)
    F.set(fx, 0, 0).applyMatrix4(slope.matrixWorld)
    place(prog, F, Bcam, ptr, [innerWidth, innerHeight], opts.frame?.() ?? null)
    // the reflection sits under the rock and points at the camera along the ground
    { tmp.copy(cam.position); slope.worldToLocal(tmp); const ang = Math.atan2(tmp.z, tmp.x - bx); pool.rotation.z = -ang; pool.position.set(bx + Math.cos(ang) * 0.3 * R, 0.02, Math.sin(ang) * 0.3 * R); pool.scale.set(2 * R, 1.4 * R, 1) }
    pool.material.uniforms.uI.value = lerp(0.28, 0.2, sstep(0.5, 1, prog))
    // contact shadows under the feet and the rock
    for (let i = 0; i < 2; i++) { shFeet[i].position.set(o.balls[i].x - 0.06, 0.012, o.balls[i].z); shFeet[i].material.opacity = 0.5 * (o.stance[i] ? 1 : 0.55 - 0.5 * Math.min(1, o.balls[i].y / 0.1)) }
    shRock.position.set(bx, 0.014, 0)
    // lights follow him; the rim spots and the core pulse with the push-off
    anchor.set(x - 0.2, 1.0, 0).applyMatrix4(slope.matrixWorld); anchor.y += 0.5
    const dawn = 0.35 * sstep(0.85, 1, prog)
    lights.update({ B, anchor, F, push: o.push, up: cam.up, dawn })
    for (const [m, c] of coreMats) m.color.copy(c).multiplyScalar(1 + 0.05 * o.push)
    // the contours bunch around him
    ground.userData.u.uFigure.value.copy(F)
    ground.userData.u.uRock.value.copy(B)
    // clearing air as he climbs; above the weather for the last 15%
    scene.fog.density = lerp(F0[1], F0[2], prog)
    scene.fog.color.copy(fogBase).lerp(fogPale, dawn / 0.35)
    sky.material.uniforms.uGlowAMix.value = 1 - 0.2 * prog
    city.userData.setHaze(hazeAt(prog))
    sky.material.uniforms.uDawn.value = dawn
    stars.material.opacity = 0.5 * (1 - dawn / 0.35 * 0.6)
    ground.userData.u.uDawn.value = dawn
    r.toneMappingExposure = lerp(LIGHT.exposure[0], LIGHT.exposure[1], dawn / 0.35)
    if (post) post.passes.grade.uniforms.uLift.value = 0.008 * (1 - dawn / 0.35)
    sky.position.copy(cam.position)
    post ? post.render() : r.render(scene, cam)
    // the boulder's screen position, for the panels' rims
    proj.copy(B).project(cam)
    const edge = tmp.copy(B).addScaledVector(cam.up, R).project(cam)
    boulderInfo.x = (proj.x * 0.5 + 0.5) * innerWidth
    boulderInfo.y = (-proj.y * 0.5 + 0.5) * innerHeight
    boulderInfo.r = Math.abs(edge.y - proj.y) * 0.5 * innerHeight
    frameInfo.prog = prog; frameInfo.dawn = dawn
    opts.onFrame?.(frameInfo)
  }

  // adaptive resolution: drop 0.25 after 30 slow frames, raise after 240 fast ones
  let slow = 0, fast = 0
  function adapt(ms) {
    if (ms > 22) { if (++slow > 30 && r.getPixelRatio() > 0.75) { setDpr(r.getPixelRatio() - 0.25); slow = 0 } }
    else if (ms < 9) { if (++fast > 240 && r.getPixelRatio() < Math.min(cap, devicePixelRatio || 1)) { setDpr(r.getPixelRatio() + 0.25); fast = 0 } }
    else { slow = 0; fast = 0 }
  }
  function setDpr(v) { r.setPixelRatio(v); resize(); stats.dpr = v }

  let first = true, holdUntil = 0, live = false // live: the figure is in and the shaders are compiled
  function frame(nowMs) {
    let dt = Math.min(0.05, (nowMs - last) / 1000); last = nowMs
    if (first) holdUntil = nowMs + HOLD_MS
    if (nowMs < holdUntil) dt = 0 // the poster fade: the scene holds its boot frame, so nothing ghosts
    t += dt
    tau += dt * rate
    if (t > WRAP) { t = T0; tau = T0; shiftBase = 0; camShift = 0; slipStart = -1; lastSlipEnd = t }
    const t0 = performance.now()
    render(t, dt)
    const ms = performance.now() - t0 + (dt * 1000 > 40 ? 30 : 0)
    stats.frames++; stats.ms += (ms - stats.ms) * 0.1; stats.t = t; stats.tau = tau; stats.hold = nowMs < holdUntil
    adapt(stats.ms)
    if (first) { first = false; window.__ready = true; opts.onReady?.() }
  }
  function sync() {
    const run = live && visible && onScreen && !userPaused && fixedT === null && document.documentElement.dataset.gl !== 'lost'
    stats.paused = !run
    last = performance.now()
    r.setAnimationLoop(run ? frame : null)
  }
  function resize() {
    r.setSize(innerWidth, innerHeight, false)
    const v = r.getDrawingBufferSize(new THREE.Vector2())
    post?.setSize(innerWidth, innerHeight)
    post?.passes.grade?.uniforms.uRes.value.set(v.x, v.y)
    if (fig && (fixedT !== null || userPaused)) render(t, 0)
  }
  // with a fixed clock (?t=) the loop is stopped, so a scroll renders one still at the scrolled progress
  const onScroll = () => { target = sp.progress(); if (fixedT !== null && fig && forcedP === null) { spring.set(target); render(t, 0) } }
  const onVis = () => { visible = !document.hidden; sync() }
  const onPtr = (e) => { if (!fine) return; ptrT.x = (e.clientX / innerWidth - 0.5) * 2; ptrT.y = (e.clientY / innerHeight - 0.5) * 2 }
  let lastW = innerWidth, lastH = innerHeight
  const onResize = () => {
    // phones change innerHeight as the URL bar moves; ignore small height-only changes
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return
    lastW = innerWidth; lastH = innerHeight; resize()
  }
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync() }, { threshold: 0 })
  io.observe(canvas)
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onResize)
  addEventListener('pointermove', onPtr, { passive: true })
  document.addEventListener('visibilitychange', onVis)
  onScroll()
  if (forcedP === null) spring.set(target)

  // ---- the man: fetched after the renderer is up; the poster holds the frame until he is ready ----
  S = { r, scene, post: null, io, canvas, onLost, onRestored, onScroll, onResize, onPtr, onVis, sp, dead: false,
    pause: () => { userPaused = true; sync() }, play: () => { userPaused = false; sync() } }
  const me = S
  // the mount is split across tasks (DESIGN.md 9: no long task after load on a slow phone): the renderer,
  // the world and the materials now; the slope in slices, the rock, the neon PMREM and the composer each
  // in a task of their own; the figure when its fetch lands; the shaders compiled off the main thread
  // (compileAsync) before the first frame, so the first frame never stalls on a compile
  const next = () => new Promise((res) => (globalThis.scheduler?.yield ? globalThis.scheduler.yield().then(res) : setTimeout(res, 0)))
  const built = (async () => {
    await next(); if (me.dead) return
    slope.add(await makeSlopeAsync({ material: ground }, next)); if (me.dead) return
    await next(); if (me.dead) return
    rockGeo = rockGeometry(R)
    await next(); if (me.dead) return
    scene.environment = neonEnvironment(r, { intensity: 0.7 })
    await next(); if (me.dead) return
    post = full ? makePost(r, scene, cam, { tier }) : null
    me.post = post
  })()
  Promise.all([loadFigure(FIGURE_URL), built]).then(async ([man]) => {
    if (me.dead) return
    fig = makeFigure({ man, material: figMat, boulderMaterial: glass, boulderGeometry: rockGeo, R, x0: X0, surface: rockSurface })
    slope.add(fig.group)
    fig.boulder.add(droplets(R, full ? 60 : 24, { lite: !full }))
    installHooks({
      r, cam, canvas, scene, slope, fig, city, R, tier, render, CAM, LIGHT, CITY,
      objs: { city, ridge, pool, hemi: lights.hemi, key: lights.key, sky, ground, stars, fig, r, post, scene, cam },
      state: {
        prog: () => spring.pos, target: () => target, vel: () => spring.vel, t: () => t, tau: () => tau, rate: () => rate,
        pose: () => pose, B: () => B, slipping: () => slipStart >= 0,
        force: (p) => { target = p; spring.set(p) },
        advance: (d) => { t += d; tau += d * rate },
      },
    })
    await next(); if (me.dead) return
    scene.updateMatrixWorld()
    try { await r.compileAsync(scene, cam) } catch { /* the first frame compiles instead */ }
    if (me.dead) return
    live = true
    if (fixedT !== null) { render(fixedT, 0); window.__ready = true; opts.onReady?.() } else sync()
  }).catch((err) => { console.error(err); opts.onError?.(err) })
  return S
}

export function pause() { S?.pause() }
export function play() { S?.play() }
export function mounted() { return !!S }

export function unmount() {
  if (!S) return
  const { r, scene, post, io, canvas, sp } = S
  S.dead = true
  r.setAnimationLoop(null)
  io.disconnect()
  sp.dispose()
  removeEventListener('scroll', S.onScroll); removeEventListener('resize', S.onResize); removeEventListener('pointermove', S.onPtr)
  document.removeEventListener('visibilitychange', S.onVis)
  canvas.removeEventListener('webglcontextlost', S.onLost); canvas.removeEventListener('webglcontextrestored', S.onRestored)
  scene.traverse((o) => { o.geometry?.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose()) })
  scene.environment?.dispose()
  post?.composer.dispose()
  r.dispose()
  removeHooks()
  S = null
}
