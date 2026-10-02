import { buildGraph, nearestVertex, pathBetween, shortestFrom } from './graph.js'
import { bearingVec } from './exits.js'
import { live } from './live.js'

/*
  PingWave (PLAN.md 4.2, 5, 6.9). Owned by A. The signature, in raw WebGL2.

  A ping runs Dijkstra from the road vertices nearest the tap (or nearest the
  node, for the `ping` button) and writes the road distance into a per-edge
  attribute. Every road edge is one instanced quad; the fragment shader lights
  it where |distance - front| is small. The front moves at a constant speed,
  so the crest reaches the farthest visible road in 1.35 s (r1 T5):

    crest       a sodium halo with an LED white-hot core, like a tracer; the
                halo is 14 to 28 px long (3.5% of the frame's short side),
                round at both ends of every piece of road and drawn with MAX
                blending so pieces never stack into beads; only the narrow
                core adds up (r2 U5)
    afterglow   every road the crest has passed holds about 35% of its light
                and cools over 2.5 s: sodium down to the night, except US-75,
                which cools back to its own LED; the last road is dark by
                about 3.9 s, then the loop stops
    arrivals    when the front passes a node, `nodeReached` fires (RouteRail
                ticks, the poster's ring pulses and its label flares to ink)
                and a 300 ms LED flare opens on the node
    exits       when it passes the node an off-grid line leaves from, a spark
                runs the line's last stretch to the frame edge (exits.js) and
                `onExit` fires, so that city's sign holds lit for 1.5 s

  Ambient traffic (tier full only): light trails on real shortest paths over
  the freeways and tollways, 12 to 24 px long like a long exposure, LED one
  way and dim sodium the other, only while the hero is on screen and only
  until 20 s pass without any input.

  One rAF loop, on demand: it runs while a wave, a spark or the traffic needs
  a frame and stops otherwise. It never runs with the tab hidden.

    const engine = await createEngine(canvas, { gridUrl, cam, tier, onReached, onExit, onDone, isHeroVisible })
    engine.ping({ x, y } | { node }, id)   start a wave (3 at most, the oldest drops)
    engine.setHeroVisible(bool)
    engine.resize()
    engine.destroy()
*/

const SLOTS = 3
const WAVE_REACH = 1.35 // s for the crest to reach the farthest visible road
const AFTERGLOW = 2.5 // s for a passed road to cool from 35% sodium to night
const WAVE_END = WAVE_REACH + AFTERGLOW + 0.1 // s, everything dark: inside 4 s
const FLARE = 0.3 // s, a node's arrival flare
const SPARK_RUN = 0.45 // s, the spark along an exit's last stretch
const FAR = 1e9
const IDLE_AFTER = 20000 // ms without input before the traffic rests
const LITE_FRAME = 1000 / 30 - 2
const CARS = 16
const TRAIL_MIN = 12 // px
const TRAIL_MAX = 24 // px

// ---------- shaders ----------

const SEG_VS = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSeg;
layout(location=2) in vec3 aDA;
layout(location=3) in vec3 aDB;
layout(location=4) in float aRest;
uniform mat3 uM;
uniform vec2 uRes;
uniform float uHalf;
out float vS;
out float vSide;
out vec3 vDA;
out vec3 vDB;
out float vLen;
out float vPx;
out float vRest;
void main() {
  vec2 pa = (uM * vec3(aSeg.xy, 1.0)).xy;
  vec2 pb = (uM * vec3(aSeg.zw, 1.0)).xy;
  vec2 d = pb - pa;
  float l = length(d);
  vec2 dir = l > 1e-4 ? d / l : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float ext = aCorner.x * 2.0 - 1.0;
  vec2 p = mix(pa, pb, aCorner.x) + dir * ext * uHalf + nrm * aCorner.y * uHalf;
  vS = aCorner.x + ext * uHalf / max(l, 1e-4);
  vSide = aCorner.y;
  vDA = aDA;
  vDB = aDB;
  vLen = length(aSeg.zw - aSeg.xy);
  vPx = l;
  vRest = aRest;
  vec2 c = p / uRes * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
}`

const SEG_FS = `#version 300 es
precision highp float;
in float vS;
in float vSide;
in vec3 vDA;
in vec3 vDB;
in float vLen;
in float vPx;
in float vRest;
uniform vec3 uFront;
uniform vec3 uFade;
uniform vec3 uSpeed;
uniform float uBand;
uniform float uCoreBand;
uniform float uAfter;
uniform float uHalf;
uniform vec3 uHot;
uniform vec3 uCore;
uniform vec3 uCool;
uniform vec3 uLed;
uniform float uGlow;
out vec4 o;
float most(vec3 v) { return clamp(max(max(v.x, v.y), v.z), 0.0, 1.0); }
void main() {
  float s = clamp(vS, 0.0, 1.0);
  vec3 d = min(vDA + s * vLen, vDB + (1.0 - s) * vLen);
  vec3 x = d - uFront;
  // The crest: a sodium halo with a narrow white-hot core.
  float h = most(exp(-(x * x) / (uBand * uBand)) * uFade);
  float c = most(exp(-(x * x) / (uCoreBand * uCoreBand)) * uFade);
  // Afterglow: seconds since the crest passed, cooling over uAfter.
  vec3 since = max(-x, 0.0) / uSpeed;
  float g = most((1.0 - smoothstep(0.0, uAfter, since)) * step(x, vec3(0.0)) * step(d, vec3(1e8)) * uFade);
  float light = max(h, g * 0.35);
  // Each road cools to its own rest light: US-75 back to LED, the rest to the trace.
  vec3 rest = mix(uCool, uLed, vRest);
  vec3 after = mix(rest, uHot, g * (1.0 - vRest));
  vec3 col = mix(after, uHot, clamp(h * 1.4, 0.0, 1.0));
  if (uGlow < 0.5) col = mix(col, uCore, c * 0.9);
  // Distance to the segment itself, past both end caps too, so every piece
  // of road ends round and the pieces join into one smooth tube.
  float along = (vS - s) * vPx;
  float r = length(vec2(along, vSide * uHalf)) / uHalf;
  float edge = uGlow > 0.5 ? exp(-r * r * 2.8) * (0.16 + 0.48 * h) : smoothstep(1.0, 0.4, r);
  float a = clamp(light * edge, 0.0, 1.0);
  o = vec4(col * a, a);
}`

const PT_VS = `#version 300 es
layout(location=0) in vec2 aPos;
layout(location=1) in vec4 aCol;
layout(location=2) in vec2 aSize;
uniform mat3 uM;
uniform vec2 uRes;
uniform float uDpr;
uniform float uMaxPt;
out vec4 vCol;
out float vKind;
void main() {
  vec2 p = (uM * vec3(aPos, 1.0)).xy;
  vec2 c = p / uRes * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  gl_PointSize = min(aSize.x * uDpr, uMaxPt);
  vCol = aCol;
  vKind = aSize.y;
}`

const PT_FS = `#version 300 es
precision mediump float;
in vec4 vCol;
in float vKind;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = length(q);
  if (r > 1.0) discard;
  float a = vKind < 0.5 ? exp(-r * r * 5.0) : smoothstep(0.14, 0.0, abs(r - 0.8)) * (1.0 - r * 0.3);
  a *= vCol.a;
  o = vec4(vCol.rgb * a, a);
}`

// ---------- color ----------

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
}
// sRGB to Display P3 (same transfer curve, wider primaries).
function srgbToP3([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear)
  return [
    0.8224621 * lr + 0.177538 * lg,
    0.0331941 * lr + 0.9668058 * lg,
    0.0170827 * lr + 0.0723974 * lg + 0.9105199 * lb,
  ].map((c) => linearToSrgb(Math.min(1, Math.max(0, c))))
}

/* A token from :root as rgb in 0..1, in the canvas's color space. */
function tokenColor(name, p3) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const m = raw.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (m) {
    const c = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (p3) return c
  }
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const srgb = [r / 255, g / 255, b / 255]
  return p3 ? srgbToP3(srgb) : srgb
}

// ---------- gl helpers ----------

function compile(gl, vs, fs) {
  const prog = gl.createProgram()
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ]) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`pingwave: shader: ${gl.getShaderInfoLog(sh)}`)
    gl.attachShader(prog, sh)
  }
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`pingwave: link: ${gl.getProgramInfoLog(prog)}`)
  const u = {}
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i)
    u[info.name] = gl.getUniformLocation(prog, info.name)
  }
  return { prog, u }
}

// ---------- engine ----------

export async function createEngine(canvas, opts) {
  const { gridUrl, cam, tier, dprFor, onReached, onExit, onDone, onFail, heroInView = () => true } = opts
  const p3 = typeof matchMedia === 'function' && matchMedia('(color-gamut: p3)').matches
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  })
  if (!gl) throw new Error('pingwave: no webgl2')
  const wideGamut = p3 && 'drawingBufferColorSpace' in gl
  if (wideGamut) gl.drawingBufferColorSpace = 'display-p3'

  const res = await fetch(gridUrl)
  if (!res.ok) throw new Error(`pingwave: grid ${res.status}`)
  const grid = await res.json()
  const g = buildGraph(grid)

  // Node entry points into the network, and where each off-grid line leaves.
  const nodeVerts = {}
  for (const [id, [x, y]] of Object.entries(grid.nodes)) nodeVerts[id] = nearestVertex(g, x, y)
  const offLines = Object.entries(grid.offgrid).map(([id, { from, deg }]) => {
    const [ux, uy] = bearingVec(deg)
    return { id, from, x: grid.nodes[from][0], y: grid.nodes[from][1], ux, uy }
  })

  // Static instance data: one quad per road edge.
  const E = g.edges.length / 2
  const seg = new Float32Array(E * 4)
  for (let e = 0; e < E; e++) {
    const a = g.edges[2 * e]
    const b = g.edges[2 * e + 1]
    seg.set([g.x[a], g.y[a], g.x[b], g.y[b]], 4 * e)
  }
  const distA = new Float32Array(E * 3).fill(FAR)
  const distB = new Float32Array(E * 3).fill(FAR)
  const spinePath = pathBetween(g, nodeVerts.richardson, nodeVerts.allen)
  const onSpine = new Set()
  for (let i = 1; i < spinePath.length; i++) {
    const a = spinePath[i - 1]
    const b = spinePath[i]
    onSpine.add(a < b ? a * 1e6 + b : b * 1e6 + a)
  }
  const restOf = new Float32Array(E)
  for (let e = 0; e < E; e++) {
    const a = g.edges[2 * e]
    const b = g.edges[2 * e + 1]
    restOf[e] = onSpine.has(a < b ? a * 1e6 + b : b * 1e6 + a) ? 1 : 0
  }

  const segProg = compile(gl, SEG_VS, SEG_FS)
  const ptProg = compile(gl, PT_VS, PT_FS)
  const maxPt = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64

  const segVao = gl.createVertexArray()
  gl.bindVertexArray(segVao)
  const cornerBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const segBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, segBuf)
  gl.bufferData(gl.ARRAY_BUFFER, seg, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(1, 1)
  const daBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, daBuf)
  gl.bufferData(gl.ARRAY_BUFFER, distA, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(2, 1)
  const dbBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, dbBuf)
  gl.bufferData(gl.ARRAY_BUFFER, distB, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(3)
  gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(3, 1)
  // Rest light per edge: 1 on US-75 between Richardson and Allen (the LED spine), 0 elsewhere.
  const restBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, restBuf)
  gl.bufferData(gl.ARRAY_BUFFER, restOf, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(4)
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0)
  gl.vertexAttribDivisor(4, 1)

  const MAX_PTS = 768
  const pts = new Float32Array(MAX_PTS * 8)
  const ptVao = gl.createVertexArray()
  gl.bindVertexArray(ptVao)
  const ptBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf)
  gl.bufferData(gl.ARRAY_BUFFER, pts.byteLength, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 8)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24)
  gl.bindVertexArray(null)

  const HOT = tokenColor('--sodium', wideGamut)
  const LED = tokenColor('--led', wideGamut)
  const COOL = tokenColor('--trace-lit', wideGamut)
  // The crest's core: LED pushed toward white, the hottest light on the map.
  const CORE = LED.map((c) => c + (1 - c) * 0.55)
  // Ambient trails the other way: sodium, dimmed.
  const DIM_SODIUM = HOT.map((c) => c * 0.7)

  // ---------- state ----------

  let alive = true
  let raf = 0
  let last = 0
  let cssW = 1
  let cssH = 1
  let dpr = 1
  let heroVisible = heroInView()
  let lastInput = performance.now()
  const waves = new Array(SLOTS).fill(null)
  let nextSlot = 0
  const sparks = []
  const flares = []
  const traffic = tier === 'full' ? makeTraffic() : []

  // Map units to canvas css px, through the live camera (it may be mid-transition).
  const M = new Float32Array(9)
  let scale = 1
  function readCamera() {
    const m = cam.getScreenCTM?.()
    if (!m) return false
    const r = canvas.getBoundingClientRect()
    M.set([m.a, m.b, 0, m.c, m.d, 0, m.e - r.left, m.f - r.top, 1])
    scale = Math.hypot(m.a, m.b) || 1
    return true
  }
  const toScreen = (x, y) => [M[0] * x + M[3] * y + M[6], M[1] * x + M[4] * y + M[7]]

  function resize() {
    const r = canvas.getBoundingClientRect()
    cssW = Math.max(1, r.width)
    cssH = Math.max(1, r.height)
    dpr = dprFor()
    const w = Math.max(1, Math.round(cssW * dpr))
    const h = Math.max(1, Math.round(cssH * dpr))
    // Resizing clears the canvas; only ask for a frame if something is lit.
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    kick()
  }

  // Wipe the canvas without a frame (WebGL may draw outside rAF).
  function clearNow() {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  // ---------- waves ----------

  function ping(p, id) {
    if (!readCamera()) return
    let sources
    let origin
    if (p.node && grid.nodes[p.node]) {
      const [x, y] = grid.nodes[p.node]
      origin = [x, y]
      sources = nearestK(x, y, 3)
    } else {
      origin = [p.x, p.y]
      sources = nearestK(p.x, p.y, 1)
    }
    const dist = shortestFrom(g, sources)

    // Speed: reach the farthest road on screen in WAVE_REACH seconds.
    let far = 0
    for (let v = 0; v < g.n; v++) {
      if (!Number.isFinite(dist[v])) continue
      const [sx, sy] = toScreen(g.x[v], g.y[v])
      if (sx >= -40 && sy >= -40 && sx <= cssW + 40 && sy <= cssH + 40 && dist[v] > far) far = dist[v]
    }
    const speed = Math.max(far, 200) / WAVE_REACH

    const slot = nextSlot
    nextSlot = (nextSlot + 1) % SLOTS
    if (waves[slot]) onDone?.(waves[slot].id)
    for (let e = 0; e < E; e++) {
      const a = dist[g.edges[2 * e]]
      const b = dist[g.edges[2 * e + 1]]
      distA[3 * e + slot] = Number.isFinite(a) ? a : FAR
      distB[3 * e + slot] = Number.isFinite(b) ? b : FAR
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, daBuf)
    gl.bufferData(gl.ARRAY_BUFFER, distA, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, dbBuf)
    gl.bufferData(gl.ARRAY_BUFFER, distB, gl.DYNAMIC_DRAW)

    const nodes = Object.entries(nodeVerts)
      .map(([node, v]) => ({ node, d: dist[v] }))
      .filter((n) => Number.isFinite(n.d))
      .sort((a, b) => a.d - b.d)
    waves[slot] = { id, t0: performance.now(), speed, origin, nodes, far }
    lastInput = performance.now()
    kick()
  }

  function nearestK(x, y, k) {
    const best = []
    for (let i = 0; i < g.n; i++) {
      const d = Math.hypot(g.x[i] - x, g.y[i] - y)
      if (best.length < k || d < best[best.length - 1][1]) {
        best.push([i, d])
        best.sort((a, b) => a[1] - b[1])
        if (best.length > k) best.pop()
      }
    }
    return best
  }

  // ---------- traffic ----------

  function makeTraffic() {
    const [px, py] = grid.nodes.plano
    // Trails run where the light is: vertices on freeways and tollways near home.
    const fast = new Uint8Array(g.n)
    for (let e = 0; e < g.edgeCls.length; e++) {
      if (g.edgeCls[e] > 2) continue
      fast[g.edges[2 * e]] = 1
      fast[g.edges[2 * e + 1]] = 1
    }
    const local = []
    for (let v = 0; v < g.n; v++) if (fast[v] && Math.hypot(g.x[v] - px, g.y[v] - py) < 1600) local.push(v)
    if (local.length < 2) return []
    const spine = spinePath
    const routeOf = (path) => {
      const xs = path.map((v) => g.x[v])
      const ys = path.map((v) => g.y[v])
      const cum = [0]
      for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]))
      // Headed north reads LED, headed south reads sodium: two directions, two lights.
      return { xs, ys, cum, len: cum[cum.length - 1], north: ys[ys.length - 1] < ys[0] }
    }
    const pick = () => local[(Math.random() * local.length) | 0]
    const fresh = (onSpine, north) => {
      if (onSpine && spine.length > 1) {
        const r = routeOf(spine)
        return r.north === north ? r : routeOf([...spine].reverse())
      }
      for (let tries = 0; tries < 8; tries++) {
        const path = pathBetween(g, pick(), pick())
        if (path.length > 4) {
          const r = routeOf(path)
          if (r.len > 500) return r
        }
      }
      return null
    }
    const list = []
    for (let i = 0; i < CARS; i++) {
      const onSpine = i < 4
      const north = i % 2 === 0
      const route = fresh(onSpine, north)
      if (route)
        list.push({
          route,
          s: Math.random() * route.len,
          v: 170 + Math.random() * 110,
          trail: TRAIL_MIN + Math.random() * (TRAIL_MAX - TRAIL_MIN),
          fresh: () => fresh(onSpine, Math.random() < 0.5),
        })
    }
    return list
  }

  function along(route, s) {
    const { cum, xs, ys } = route
    let lo = 0
    let hi = cum.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (cum[mid] <= s) lo = mid
      else hi = mid
    }
    const f = cum[hi] > cum[lo] ? (s - cum[lo]) / (cum[hi] - cum[lo]) : 0
    return [xs[lo] + (xs[hi] - xs[lo]) * f, ys[lo] + (ys[hi] - ys[lo]) * f]
  }

  const trafficOn = () => traffic.length && heroVisible && !document.hidden && performance.now() - lastInput < IDLE_AFTER

  // ---------- frame ----------

  const needsFrame = () => waves.some(Boolean) || sparks.length > 0 || flares.length > 0 || trafficOn() || traffic.some((c) => (c.a ?? 0) > 0.01)

  function kick() {
    if (!alive || raf || document.hidden || !needsFrame()) return
    raf = requestAnimationFrame(frame)
  }

  let n = 0
  function pushPt(x, y, rgb, a, size, kind) {
    if (n >= MAX_PTS) return
    pts.set([x, y, rgb[0], rgb[1], rgb[2], a, size, kind], n * 8)
    n++
  }

  function frame(now) {
    raf = 0
    if (!alive) return
    if (tier === 'lite' && now - last < LITE_FRAME) {
      raf = requestAnimationFrame(frame)
      return
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
    last = now
    if (!readCamera()) return

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendEquation(gl.FUNC_ADD)
    gl.blendFunc(gl.ONE, gl.ONE)

    // Waves.
    const front = [-FAR, -FAR, -FAR]
    const fade = [0, 0, 0]
    const speeds = [1, 1, 1]
    let anyWave = false
    n = 0
    for (let k = 0; k < SLOTS; k++) {
      const w = waves[k]
      if (!w) continue
      const t = (now - w.t0) / 1000
      if (t >= WAVE_END) {
        waves[k] = null
        onDone?.(w.id)
        continue
      }
      anyWave = true
      front[k] = t * w.speed
      speeds[k] = w.speed
      fade[k] = 1 - smooth(WAVE_END - 0.3, WAVE_END, t)
      while (w.nodes.length && w.nodes[0].d <= front[k]) {
        const { node } = w.nodes.shift()
        onReached?.(node)
        const [nx, ny] = grid.nodes[node]
        flares.push({ x: nx, y: ny, t0: now })
        for (const line of offLines) if (line.from === node) launchSpark(line, now, w.speed * scale)
      }
      // The tap itself: a ring that opens where the wave begins.
      if (t < 0.7) {
        const e = t / 0.7
        pushPt(w.origin[0], w.origin[1], HOT, (1 - e) * 0.9, 10 + 70 * (1 - (1 - e) ** 3), 1)
        pushPt(w.origin[0], w.origin[1], CORE, (1 - e) * 0.8, 16, 0)
      }
    }

    if (anyWave) {
      gl.useProgram(segProg.prog)
      const u = segProg.u
      gl.uniformMatrix3fv(u.uM, false, M)
      gl.uniform2f(u.uRes, cssW, cssH)
      gl.uniform3fv(u.uFront, front)
      gl.uniform3fv(u.uFade, fade)
      gl.uniform3fv(u.uSpeed, speeds)
      // The crest's half-length along the road scales with the frame: 14px on
      // a phone, 28px on a laptop, never a fixed 56 (r2 U5).
      gl.uniform1f(u.uBand, Math.min(28, Math.max(14, Math.min(cssW, cssH) * 0.035)) / scale)
      gl.uniform1f(u.uCoreBand, 9 / scale)
      gl.uniform1f(u.uAfter, AFTERGLOW)
      gl.uniform3fv(u.uHot, HOT)
      gl.uniform3fv(u.uCore, CORE)
      gl.uniform3fv(u.uCool, COOL)
      gl.uniform3fv(u.uLed, LED)
      gl.bindVertexArray(segVao)
      // The halo: MAX blending, so where pieces of road overlap on a curve
      // the light does not stack into beads.
      gl.blendEquation(gl.MAX)
      gl.uniform1f(u.uGlow, 1)
      gl.uniform1f(u.uHalf, tier === 'lite' ? 7 : 9)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, E)
      // The core: narrow and additive, so it reads white-hot where it is brightest.
      gl.blendEquation(gl.FUNC_ADD)
      gl.uniform1f(u.uGlow, 0)
      gl.uniform1f(u.uHalf, 1.6)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, E)
    }

    // Arrival flares: 300 ms of LED light opening on the node.
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i]
      const e = (now - f.t0) / 1000 / FLARE
      if (e >= 1) {
        flares.splice(i, 1)
        continue
      }
      pushPt(f.x, f.y, CORE, (1 - e) * 0.95, 30 + 46 * e, 0)
      pushPt(f.x, f.y, LED, (1 - e) * 0.7, 14 + 40 * e, 1)
    }

    // Sparks along each exit's last stretch, then the sign lights.
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i]
      const t = (now - sp.t0) / 1000
      if (t < 0) continue
      if (t >= SPARK_RUN && !sp.done) {
        sp.done = true
        onExit?.(sp.line.id)
      }
      if (t > SPARK_RUN + 0.25) {
        sparks.splice(i, 1)
        continue
      }
      const f = Math.min(1, t / SPARK_RUN)
      const head = sp.from + sp.run * f
      const fadeOut = t > SPARK_RUN ? 1 - (t - SPARK_RUN) / 0.25 : 1
      for (let j = 0; j < 8 && !sp.unseen; j++) {
        const d = head - (j * 5) / scale
        if (d < sp.from) break
        pushPt(sp.line.x + sp.line.ux * d, sp.line.y + sp.line.uy * d, j ? HOT : CORE, fadeOut * (1 - j / 8), j ? 6 : 10, 0)
      }
    }

    // Traffic: light trails, LED headed north, dim sodium headed south.
    const moving = trafficOn()
    if (traffic.length) {
      const fadeIn = moving ? 1 : 0
      for (const car of traffic) {
        car.a = (car.a ?? 0) + (fadeIn - (car.a ?? 0)) * Math.min(1, dt * 3)
        if (moving) {
          car.s += car.v * dt
          if (car.s >= car.route.len) {
            const r = car.fresh()
            if (r) car.route = r
            car.s = 0
          }
        }
        if (car.a < 0.01) continue
        const rgb = car.route.north ? LED : DIM_SODIUM
        const edgeFade = Math.min(1, car.s / 120, (car.route.len - car.s) / 120)
        const steps = Math.max(6, Math.round(car.trail / 2))
        for (let j = 0; j < steps; j++) {
          const s = car.s - (j * car.trail) / steps / scale
          if (s < 0) break
          const [x, y] = along(car.route, s)
          const k = 1 - j / steps
          pushPt(x, y, rgb, car.a * edgeFade * (j ? 0.75 * k * k : 1), j ? 3.2 : 4.4, 0)
        }
      }
    }

    if (n) {
      gl.useProgram(ptProg.prog)
      const u = ptProg.u
      gl.uniformMatrix3fv(u.uM, false, M)
      gl.uniform2f(u.uRes, cssW, cssH)
      gl.uniform1f(u.uDpr, dpr)
      gl.uniform1f(u.uMaxPt, maxPt)
      gl.bindVertexArray(ptVao)
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pts, 0, n * 8)
      gl.drawArrays(gl.POINTS, 0, n)
    }
    gl.bindVertexArray(null)

    const fading = traffic.some((c) => (c.a ?? 0) > 0.01)
    if (anyWave || sparks.length || flares.length || moving || fading) raf = requestAnimationFrame(frame)
    else last = 0
  }

  // The spark leaves when the wave reaches the node, crosses the unseen part
  // of the line at the wave's own speed, then runs the stretch NightGrid drew
  // (live.exits, in px along the ray from the node). Where no line is drawn
  // (a phone's row of signs), nothing runs, and the sign still lights when
  // the light would have reached the edge.
  function launchSpark(line, now, pxPerSec) {
    const ex = live.exits?.[line.id]
    if (!ex) return
    const [a, b] = ex.run ?? [ex.edge, ex.edge]
    const delay = Math.max(0, a) / Math.max(pxPerSec, 400)
    sparks.push({ line, t0: now + delay * 1000, from: a / scale, run: Math.max(0, b - a) / scale, unseen: !ex.run, done: false })
  }

  const smooth = (a, b, t) => {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
    return x * x * (3 - 2 * x)
  }

  // ---------- lifecycle ----------

  const onInput = () => {
    const idle = performance.now() - lastInput >= IDLE_AFTER
    lastInput = performance.now()
    if (idle && traffic.length) kick()
  }
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    } else kick()
  }
  const onLost = (e) => {
    e.preventDefault()
    destroy()
    onFail?.(new Error('pingwave: context lost'))
  }
  const INPUTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']
  for (const t of INPUTS) window.addEventListener(t, onInput, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onLost)

  function destroy() {
    if (!alive) return
    alive = false
    cancelAnimationFrame(raf)
    raf = 0
    for (const t of INPUTS) window.removeEventListener(t, onInput)
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onLost)
    for (const w of waves) if (w) onDone?.(w.id)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  resize()
  return {
    ping,
    resize,
    destroy,
    /** A lone arrival flare on a node (r2 U6: a plate reached the reading line). */
    flare(node) {
      if (!grid.nodes[node] || !readCamera()) return
      const [x, y] = grid.nodes[node]
      flares.push({ x, y, t0: performance.now() })
      kick()
    },
    setHeroVisible(v) {
      heroVisible = v
      if (v) return kick()
      // Scrolled away: the traffic goes out at once, so the loop stops at once.
      for (const car of traffic) car.a = 0
      if (!waves.some(Boolean) && !sparks.length && !flares.length) {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
        clearNow()
      }
    },
  }
}
