import { buildGraph, nearestVertex, pathBetween, shortestFrom } from './graph.js'

/*
  PingWave (PLAN.md 4.2, 5, 6.9). Owned by A. The signature, in raw WebGL2.

  A ping runs Dijkstra from the road vertices nearest the tap (or nearest the
  node, for the `ping` button) and writes the road distance into a per-edge
  attribute. Every road edge is one instanced quad; the fragment shader lights
  it where |distance - front| is small (sodium at the crest) and lets it cool
  to --trace-lit behind. The front moves at a constant speed, so the wave
  reaches the farthest visible road in about 1.35 s and is gone by 1.8 s.
  When the front passes a node, `nodeReached` fires (RouteRail ticks, the
  poster's ring pulses); when it passes the node an off-grid line leaves from,
  a spark runs out along that line toward New York or Waterloo.

  Ambient traffic (tier full only): a few lights moving along real shortest
  paths, sodium beads on the LED US-75 spine and LED beads on the sodium roads
  (each reads against its road), only while the hero is on screen and only
  until 20 s pass without any input.

  One rAF loop, on demand: it runs while a wave, a spark or the traffic needs
  a frame and stops otherwise. It never runs with the tab hidden.

    const engine = await createEngine(canvas, { gridUrl, cam, tier, onReached, onDone, isHeroVisible })
    engine.ping({ x, y } | { node }, id)   start a wave (3 at most, the oldest drops)
    engine.setHeroVisible(bool)
    engine.resize()
    engine.destroy()
*/

const SLOTS = 3
const WAVE_REACH = 1.35 // s for the front to reach the farthest visible road
const WAVE_END = 1.8 // s, fully faded
const FAR = 1e9
const IDLE_AFTER = 20000 // ms without input before the traffic rests
const LITE_FRAME = 1000 / 30 - 2

// ---------- shaders ----------

const SEG_VS = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSeg;
layout(location=2) in vec3 aDA;
layout(location=3) in vec3 aDB;
uniform mat3 uM;
uniform vec2 uRes;
uniform float uHalf;
out float vS;
out float vSide;
out vec3 vDA;
out vec3 vDB;
out float vLen;
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
uniform vec3 uFront;
uniform vec3 uFade;
uniform float uBand;
uniform float uTail;
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uGlow;
out vec4 o;
void main() {
  float s = clamp(vS, 0.0, 1.0);
  vec3 d = min(vDA + s * vLen, vDB + (1.0 - s) * vLen);
  vec3 x = d - uFront;
  vec3 crest = exp(-(x * x) / (uBand * uBand)) * uFade;
  vec3 tail = exp(min(x, 0.0) / uTail) * step(x, vec3(0.0)) * uFade;
  vec3 near = exp(min(x, 0.0) / (uTail * 0.3)) * step(x, vec3(0.0)) * uFade;
  float h = clamp(crest.x + crest.y + crest.z, 0.0, 1.0);
  float t = clamp(tail.x + tail.y + tail.z, 0.0, 1.0);
  float w = clamp(near.x + near.y + near.z, 0.0, 1.0);
  float light = max(h, t * 0.34);
  float edge = uGlow > 0.5 ? exp(-vSide * vSide * 2.8) * (0.16 + 0.48 * h) : smoothstep(1.0, 0.4, abs(vSide));
  vec3 col = mix(uCool, uHot, clamp(max(h * 1.4, w * 0.85), 0.0, 1.0));
  float a = light * edge;
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
  const { gridUrl, cam, tier, dprFor, onReached, onDone, onFail } = opts
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
    const rad = (deg * Math.PI) / 180
    return { id, from, x: grid.nodes[from][0], y: grid.nodes[from][1], ux: Math.sin(rad), uy: -Math.cos(rad) }
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

  const MAX_PTS = 512
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

  // ---------- state ----------

  let alive = true
  let raf = 0
  let last = 0
  let cssW = 1
  let cssH = 1
  let dpr = 1
  let heroVisible = true
  let lastInput = performance.now()
  const waves = new Array(SLOTS).fill(null)
  let nextSlot = 0
  const sparks = []
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
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    kick()
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
    const local = []
    for (let v = 0; v < g.n; v++) if (Math.hypot(g.x[v] - px, g.y[v] - py) < 1300) local.push(v)
    if (local.length < 2) return []
    const spine = pathBetween(g, nodeVerts.richardson, nodeVerts.allen)
    const routeOf = (path) => {
      const xs = path.map((v) => g.x[v])
      const ys = path.map((v) => g.y[v])
      const cum = [0]
      for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]))
      return { xs, ys, cum, len: cum[cum.length - 1] }
    }
    const pick = () => local[(Math.random() * local.length) | 0]
    const fresh = (onSpine) => {
      if (onSpine && spine.length > 1) {
        const path = Math.random() < 0.5 ? spine : [...spine].reverse()
        return routeOf(path)
      }
      for (let tries = 0; tries < 6; tries++) {
        const path = pathBetween(g, pick(), pick())
        if (path.length > 4) {
          const r = routeOf(path)
          if (r.len > 500) return r
        }
      }
      return null
    }
    const list = []
    for (let i = 0; i < 9; i++) {
      const onSpine = i < 3
      const route = fresh(onSpine)
      if (route) list.push({ route, s: Math.random() * route.len, v: 170 + Math.random() * 90, led: onSpine, fresh: () => fresh(onSpine) })
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

  function kick() {
    if (!alive || raf || document.hidden) return
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
    gl.blendFunc(gl.ONE, gl.ONE)

    // Waves.
    const front = [-FAR, -FAR, -FAR]
    const fade = [0, 0, 0]
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
      fade[k] = 1 - smooth(1.15, WAVE_END, t)
      while (w.nodes.length && w.nodes[0].d <= front[k]) {
        const { node } = w.nodes.shift()
        onReached?.(node)
        for (const line of offLines) if (line.from === node) sparks.push({ line, t0: now })
      }
      // The tap itself: a ring that opens where the wave begins.
      if (t < 0.7) {
        const e = t / 0.7
        pushPt(w.origin[0], w.origin[1], HOT, (1 - e) * 0.9, 10 + 70 * (1 - (1 - e) ** 3), 1)
        pushPt(w.origin[0], w.origin[1], HOT, (1 - e) * 0.8, 16, 0)
      }
    }

    if (anyWave) {
      gl.useProgram(segProg.prog)
      const u = segProg.u
      gl.uniformMatrix3fv(u.uM, false, M)
      gl.uniform2f(u.uRes, cssW, cssH)
      gl.uniform3fv(u.uFront, front)
      gl.uniform3fv(u.uFade, fade)
      gl.uniform1f(u.uBand, (tier === 'lite' ? 24 : 28) / scale)
      gl.uniform1f(u.uTail, 170 / scale)
      gl.uniform3fv(u.uHot, HOT)
      gl.uniform3fv(u.uCool, COOL)
      gl.bindVertexArray(segVao)
      gl.uniform1f(u.uGlow, 1)
      gl.uniform1f(u.uHalf, tier === 'lite' ? 6 : 7.5)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, E)
      gl.uniform1f(u.uGlow, 0)
      gl.uniform1f(u.uHalf, 1.4)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, E)
    }

    // Sparks out along the off-grid lines.
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i]
      const t = (now - sp.t0) / 1000
      if (t > 1.1) {
        sparks.splice(i, 1)
        continue
      }
      const head = (t * 1100) / scale
      for (let j = 0; j < 7; j++) {
        const d = head - (j * 9) / scale
        if (d < 0) break
        const a = (1 - t / 1.1) * (1 - j / 7)
        pushPt(sp.line.x + sp.line.ux * d, sp.line.y + sp.line.uy * d, HOT, a, j ? 6 : 9, 0)
      }
    }

    // Traffic.
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
        const rgb = car.led ? HOT : LED
        const edgeFade = Math.min(1, car.s / 120, (car.route.len - car.s) / 120)
        for (let j = 0; j < 5; j++) {
          const s = car.s - (j * 5) / scale
          if (s < 0) break
          const [x, y] = along(car.route, s)
          pushPt(x, y, rgb, car.a * edgeFade * (j ? 0.5 / j : 1), j ? 6 : 10, 0)
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
    if (anyWave || sparks.length || moving || fading) raf = requestAnimationFrame(frame)
    else last = 0
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
    setHeroVisible(v) {
      heroVisible = v
      if (v) kick()
    },
  }
}
