/*
  The road graph (PLAN.md 4.1, 4.2). Owned by A. Plain functions, no DOM, so
  the prerender (GridPoster) and the lazy WebGL layer (PingWave) share it.

    decodeChains(grid)            absolute polylines [[x, y, x, y, ...], ...]
    buildGraph(grid)              { n, x, y, start, nbr, w, edges, edgeCls, chains, chainCls }
                                  CSR adjacency; chains hold vertex ids;
                                  edgeCls is each edge's road class (1 freeway,
                                  2 tollway, 3 state road), chainCls the same
                                  per chain step (grid.cls, from build-grid)
    nearestVertex(g, x, y)        the closest vertex id, by straight distance
    shortestFrom(g, sources)      Float64Array of road distances (Infinity if unreachable)
                                  sources: [[vertex, startDistance], ...]
    pathBetween(g, a, b)          vertex ids along the shortest road path a to b

  Coordinates are integer map units (dfw-grid.json `unit` meters each).
  Chains share vertices by exact coordinates, which is how build-grid.mjs
  wrote them, so two roads that cross meet at one vertex.
*/

export function decodeChains(grid) {
  let px = 0
  let py = 0
  return grid.chains.map((c) => {
    const out = new Array(c.length)
    for (let i = 0; i < c.length; i += 2) {
      px += c[i]
      py += c[i + 1]
      out[i] = px
      out[i + 1] = py
    }
    return out
  })
}

export function buildGraph(grid) {
  const polylines = decodeChains(grid)
  const ids = new Map()
  const xs = []
  const ys = []
  const vertex = (x, y) => {
    const k = x * 65536 + y
    let id = ids.get(k)
    if (id === undefined) {
      id = xs.length
      ids.set(k, id)
      xs.push(x)
      ys.push(y)
    }
    return id
  }
  const chains = polylines.map((p) => {
    const c = new Array(p.length / 2)
    for (let i = 0; i < p.length; i += 2) c[i / 2] = vertex(p[i], p[i + 1])
    return c
  })

  const chainCls = chains.map((c, j) => {
    const str = grid.cls?.[j] ?? ''
    const out = new Uint8Array(Math.max(0, c.length - 1))
    for (let i = 0; i < out.length; i++) out[i] = Number(str[i]) || 1
    return out
  })

  const seen = new Set()
  const edges = []
  const ecls = []
  chains.forEach((c, j) => {
    for (let i = 1; i < c.length; i++) {
      const a = c[i - 1]
      const b = c[i]
      if (a === b) continue
      const k = a < b ? a * 1e6 + b : b * 1e6 + a
      if (seen.has(k)) continue
      seen.add(k)
      edges.push(a, b)
      ecls.push(chainCls[j][i - 1])
    }
  })

  const n = xs.length
  const deg = new Int32Array(n + 1)
  for (let i = 0; i < edges.length; i++) deg[edges[i] + 1]++
  for (let i = 1; i <= n; i++) deg[i] += deg[i - 1]
  const start = deg
  const fill = start.slice(0, n)
  const nbr = new Int32Array(edges.length)
  const w = new Float32Array(edges.length)
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i]
    const b = edges[i + 1]
    const len = Math.hypot(xs[b] - xs[a], ys[b] - ys[a])
    nbr[fill[a]] = b
    w[fill[a]++] = len
    nbr[fill[b]] = a
    w[fill[b]++] = len
  }

  return {
    n,
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    start,
    nbr,
    w,
    edges: Int32Array.from(edges),
    edgeCls: Uint8Array.from(ecls),
    chains,
    chainCls,
  }
}

export function nearestVertex(g, x, y) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < g.n; i++) {
    const dx = g.x[i] - x
    const dy = g.y[i] - y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/* Dijkstra with a binary heap of (distance, vertex) pairs. A few thousand vertices: well under 5 ms. */
export function shortestFrom(g, sources, { prev = null } = {}) {
  const dist = new Float64Array(g.n).fill(Infinity)
  const heapD = []
  const heapV = []
  const push = (d, v) => {
    let i = heapD.length
    heapD.push(d)
    heapV.push(v)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heapD[p] <= d) break
      heapD[i] = heapD[p]
      heapV[i] = heapV[p]
      i = p
    }
    heapD[i] = d
    heapV[i] = v
  }
  const pop = () => {
    const d = heapD[0]
    const v = heapV[0]
    const lastD = heapD.pop()
    const lastV = heapV.pop()
    if (heapD.length) {
      let i = 0
      const len = heapD.length
      for (;;) {
        const l = 2 * i + 1
        if (l >= len) break
        const r = l + 1
        const c = r < len && heapD[r] < heapD[l] ? r : l
        if (heapD[c] >= lastD) break
        heapD[i] = heapD[c]
        heapV[i] = heapV[c]
        i = c
      }
      heapD[i] = lastD
      heapV[i] = lastV
    }
    return [d, v]
  }

  for (const [v, d0] of sources) {
    if (d0 < dist[v]) {
      dist[v] = d0
      if (prev) prev[v] = -1
      push(d0, v)
    }
  }
  while (heapD.length) {
    const [d, v] = pop()
    if (d > dist[v]) continue
    for (let e = g.start[v]; e < g.start[v + 1]; e++) {
      const u = g.nbr[e]
      const nd = d + g.w[e]
      if (nd < dist[u]) {
        dist[u] = nd
        if (prev) prev[u] = v
        push(nd, u)
      }
    }
  }
  return dist
}

export function pathBetween(g, a, b) {
  const prev = new Int32Array(g.n).fill(-1)
  const dist = shortestFrom(g, [[a, 0]], { prev })
  if (!Number.isFinite(dist[b])) return []
  const out = []
  for (let v = b; v !== -1; v = prev[v]) {
    out.push(v)
    if (v === a) break
  }
  return out.reverse()
}
