#!/usr/bin/env node
/*
  build-grid (PLAN.md 4.1). Owned by A. Run by hand; the output is committed,
  so neither Vercel nor `npm run build` ever downloads anything.

    node scripts/build-grid.mjs            build src/data/dfw-grid.json and dfw-nodes.json
    node scripts/build-grid.mjs --stats    also print vertex, chain and size numbers

  Source
    US Census Bureau TIGER/Line 2024, primary and secondary roads, Texas
    (tl_2024_48_prisecroads.zip, public domain). City points come from the
    Census 2024 Gazetteer place file for Texas (internal points). Both are
    downloaded into the scratch dir (tools/local.json scratchDir, or
    GRID_SCRATCH), never into the repo.

  What survives
    Only geometry. Every limited-access road (MTFCC S1100) and every
    secondary road (S1200) that carries an interstate, US or state route
    number, clipped to lon -97.05 to -96.45, lat 32.65 to 33.25, simplified
    with Visvalingam. No names, no route numbers, no feature classes. City
    points are rounded to 2 decimals before they are projected.

  Output (all coordinates in UNIT meter steps, origin at the bbox's north-west
  corner, y pointing south)
    dfw-grid.json      { v, src, unit, size, bbox, nodes, offgrid, chains }
                       chains: delta-encoded polylines (see encodeChains) that
                       meet at shared integer vertices, so the road graph can be
                       rebuilt by exact coordinate match (src/grid/graph.js).
                       offgrid: { from, deg } the Texas node a line leaves
                       from and its bearing to the city, in degrees.
    dfw-nodes.json     { unit, size, nodes, offgrid, tags } the small file the
                       page imports: node points, bearings, and for NodeTag one
                       48 x 20 px crop of the limited-access roads around each
                       node as SVG path data (coordinates x10).

  Privacy check (fails the script): any string other than the known keys and
  node ids, any MTFCC outside S1100 and S1200, any city coordinate with more
  than 2 decimals.
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STATS = process.argv.includes('--stats')

const ROADS_URL = 'https://www2.census.gov/geo/tiger/TIGER2024/PRISECROADS/tl_2024_48_prisecroads.zip'
const GAZ_URL = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_48.txt'

const BBOX = [-97.05, 32.65, -96.45, 33.25] // west, south, east, north
const UNIT = 20 // meters per coordinate step
const SIMPLIFY = '10%' // Visvalingam, share of removable vertices kept
// NodeTag sprites (PLAN.md 4.4): 48 x 20 px, about 24 km across.
const TAG_W = 48
const TAG_H = 20
const TAG_SCALE = 25 // map units per sprite px
const TAG_TOLERANCE = 15 // units (300 m), Douglas-Peucker before cropping

// Gazetteer names for the four Texas nodes (PLAN.md 3.2).
const PLACES = { plano: 'Plano city', richardson: 'Richardson city', allen: 'Allen city', dallas: 'Dallas city' }
// Off-grid cities, city level (2 decimals), only used for a bearing out of a
// Texas node: RBC's New York leaves from home (Plano), Hack the North's
// Waterloo from school (Richardson, where the HackUTD team is).
const OFFGRID = {
  nyc: { at: [40.71, -74.01], from: 'plano' },
  waterloo: { at: [43.46, -80.52], from: 'richardson' },
}

// ---------- scratch and downloads ----------

function scratchDir() {
  if (process.env.GRID_SCRATCH) return process.env.GRID_SCRATCH
  try {
    const local = JSON.parse(readFileSync(path.join(ROOT, 'tools/local.json'), 'utf8'))
    if (local.scratchDir) return path.join(local.scratchDir, 'grid')
  } catch {}
  return path.join(os.tmpdir(), 'ae-grid')
}

function download(url, file) {
  if (existsSync(file)) return
  console.log(`build-grid: downloading ${url}`)
  execFileSync('curl', ['-sSfL', '--retry', '2', '-o', file, url], { stdio: 'inherit' })
}

// ---------- projection ----------

const LAT_MID = (BBOX[1] + BBOX[3]) / 2
const M_PER_DEG_LAT = 110946
const M_PER_DEG_LON = 111320 * Math.cos((LAT_MID * Math.PI) / 180)
const KX = M_PER_DEG_LON / UNIT
const KY = M_PER_DEG_LAT / UNIT
const project = (lon, lat) => [(lon - BBOX[0]) * KX, (BBOX[3] - lat) * KY]
const SIZE = [Math.round((BBOX[2] - BBOX[0]) * KX), Math.round((BBOX[3] - BBOX[1]) * KY)]

function bearing([lat1, lon1], [lat2, lon2]) {
  const r = Math.PI / 180
  const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r)
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r)
  return (Math.atan2(y, x) / r + 360) % 360
}

const round2 = (n) => Math.round(n * 100) / 100
const decimals = (n) => (String(n).split('.')[1] || '').length

// ---------- geometry helpers ----------

const key = (x, y) => `${x},${y}`

function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const r1 = bx - ax
  const r2 = by - ay
  const s1 = dx - cx
  const s2 = dy - cy
  const den = r1 * s2 - r2 * s1
  if (den === 0) return null
  const t = ((cx - ax) * s2 - (cy - ay) * s1) / den
  const u = ((cx - ax) * r2 - (cy - ay) * r1) / den
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null
  return [ax + t * r1, ay + t * r2, t, u]
}

function douglasPeucker(pts, tol) {
  if (pts.length < 3) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = pts[a]
    const [bx, by] = pts[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let best = -1
    let bestD = tol
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len
      if (d > bestD) {
        bestD = d
        best = i
      }
    }
    if (best > 0) {
      keep[best] = 1
      stack.push([a, best], [best, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

/*
  Turn a list of polylines (integer coordinates) into a clean planar graph:
  split every crossing so roads that cross share a vertex, drop duplicate
  edges, drop tiny islands, then walk maximal chains between junctions.
*/
function buildChains(lines, { minIsland = 60 } = {}) {
  // 1. Segments.
  const segs = []
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1]
      const [bx, by] = line[i]
      if (ax === bx && ay === by) continue
      segs.push({ ax, ay, bx, by, cuts: [] })
    }
  }

  // 2. Crossings, through a uniform grid hash.
  const CELL = 120
  const grid = new Map()
  segs.forEach((s, i) => {
    const x0 = Math.floor(Math.min(s.ax, s.bx) / CELL)
    const x1 = Math.floor(Math.max(s.ax, s.bx) / CELL)
    const y0 = Math.floor(Math.min(s.ay, s.by) / CELL)
    const y1 = Math.floor(Math.max(s.ay, s.by) / CELL)
    for (let gx = x0; gx <= x1; gx++)
      for (let gy = y0; gy <= y1; gy++) {
        const k = `${gx}:${gy}`
        if (!grid.has(k)) grid.set(k, [])
        grid.get(k).push(i)
      }
  })
  const tested = new Set()
  for (const ids of grid.values()) {
    for (let p = 0; p < ids.length; p++)
      for (let q = p + 1; q < ids.length; q++) {
        const i = ids[p]
        const j = ids[q]
        const pk = i < j ? `${i}:${j}` : `${j}:${i}`
        if (tested.has(pk)) continue
        tested.add(pk)
        const s = segs[i]
        const t = segs[j]
        const hit = segIntersect(s.ax, s.ay, s.bx, s.by, t.ax, t.ay, t.bx, t.by)
        if (!hit) continue
        const x = Math.round(hit[0])
        const y = Math.round(hit[1])
        s.cuts.push([hit[2], x, y])
        t.cuts.push([hit[3], x, y])
      }
  }

  // 3. Split, dedupe edges.
  const vid = new Map()
  const vx = []
  const vy = []
  const vertex = (x, y) => {
    const k = key(x, y)
    let id = vid.get(k)
    if (id === undefined) {
      id = vx.length
      vid.set(k, id)
      vx.push(x)
      vy.push(y)
    }
    return id
  }
  const edgeSet = new Set()
  const edges = []
  const addEdge = (a, b) => {
    if (a === b) return
    const k = a < b ? `${a}:${b}` : `${b}:${a}`
    if (edgeSet.has(k)) return
    edgeSet.add(k)
    edges.push([a, b])
  }
  for (const s of segs) {
    const pts = [[0, s.ax, s.ay], ...s.cuts.sort((m, n) => m[0] - n[0]), [1, s.bx, s.by]]
    for (let i = 1; i < pts.length; i++) addEdge(vertex(pts[i - 1][1], pts[i - 1][2]), vertex(pts[i][1], pts[i][2]))
  }

  // 4. Adjacency and islands.
  const adj = vx.map(() => [])
  for (const [a, b] of edges) {
    adj[a].push(b)
    adj[b].push(a)
  }
  const comp = new Int32Array(vx.length).fill(-1)
  const compLen = []
  for (let s = 0; s < vx.length; s++) {
    if (comp[s] !== -1) continue
    const c = compLen.length
    let len = 0
    const stack = [s]
    comp[s] = c
    while (stack.length) {
      const v = stack.pop()
      for (const w of adj[v]) {
        if (w > v) len += Math.hypot(vx[w] - vx[v], vy[w] - vy[v])
        if (comp[w] === -1) {
          comp[w] = c
          stack.push(w)
        }
      }
    }
    compLen.push(len)
  }
  const alive = (v) => compLen[comp[v]] >= minIsland

  // 5. Long polylines. The graph is rebuilt from shared coordinates, so a
  //    chain may run straight through a junction: at each vertex keep going
  //    along the unused edge that turns least. Start from odd-degree vertices
  //    so the walk needs as few chains as possible.
  const used = new Set()
  const ek = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`)
  const free = (v) => adj[v].filter((w) => !used.has(ek(v, w)))
  const chains = []
  const walk = (start) => {
    const chain = [start]
    let prev = -1
    let cur = start
    for (;;) {
      const options = free(cur)
      if (!options.length) break
      let next = options[0]
      if (prev >= 0 && options.length > 1) {
        const hx = vx[cur] - vx[prev]
        const hy = vy[cur] - vy[prev]
        const hl = Math.hypot(hx, hy) || 1
        let best = -2
        for (const w of options) {
          const dx = vx[w] - vx[cur]
          const dy = vy[w] - vy[cur]
          const cos = (hx * dx + hy * dy) / (hl * (Math.hypot(dx, dy) || 1))
          if (cos > best) {
            best = cos
            next = w
          }
        }
      }
      used.add(ek(cur, next))
      chain.push(next)
      prev = cur
      cur = next
    }
    return chain
  }
  for (let v = 0; v < vx.length; v++) if (alive(v) && adj[v].length % 2 === 1) while (free(v).length) chains.push(walk(v))
  for (let v = 0; v < vx.length; v++) if (alive(v)) while (free(v).length) chains.push(walk(v))

  const islands = compLen.filter((l) => l < minIsland).length
  return { chains: chains.map((c) => c.map((v) => [vx[v], vy[v]])), vertices: vx.length, edges: edges.length, islands }
}

/*
  Every number is a delta: a chain starts relative to where the previous chain
  ended (the first one relative to 0,0), so the file is mostly one and two
  digit numbers and gzips well. decodeChains() in src/grid/graph.js reverses it.
*/
function encodeChains(chains) {
  let px = 0
  let py = 0
  return chains.map((pts) => {
    const out = []
    for (const [x, y] of pts) {
      out.push(x - px, y - py)
      px = x
      py = y
    }
    return out
  })
}

// ---------- main ----------

const scratch = scratchDir()
mkdirSync(scratch, { recursive: true })
const zip = path.join(scratch, 'tl_2024_48_prisecroads.zip')
const shp = path.join(scratch, 'tl_2024_48_prisecroads.shp')
const gaz = path.join(scratch, '2024_gaz_place_48.txt')
download(ROADS_URL, zip)
if (!existsSync(shp)) execFileSync('unzip', ['-o', '-q', zip, '-d', scratch])
download(GAZ_URL, gaz)

let mapshaper
try {
  mapshaper = (await import('../tools/mapshaper.mjs')).default
} catch {
  console.error('build-grid: mapshaper is missing. Run `npm run tools` first.')
  process.exit(1)
}

// Roads: filter, clip, simplify. Only MTFCC is kept, for the privacy check below.
const KEEP = "MTFCC == 'S1100' || (MTFCC == 'S1200' && (RTTYP == 'I' || RTTYP == 'U' || RTTYP == 'S'))"
const cmd = [
  `-i "${shp}"`,
  `-filter "${KEEP}"`,
  `-clip bbox=${BBOX.join(',')}`,
  `-simplify visvalingam ${SIMPLIFY} keep-shapes`,
  '-filter-fields MTFCC',
  '-o format=geojson precision=0.000001 roads.json',
].join(' ')
const out = await mapshaper.applyCommands(cmd)
const roads = JSON.parse(out['roads.json'])

const fail = (msg) => {
  console.error(`build-grid: privacy check failed: ${msg}`)
  process.exit(1)
}

const lines = []
const primary = []
for (const f of roads.features) {
  const cls = f.properties?.MTFCC
  if (cls !== 'S1100' && cls !== 'S1200') fail(`feature class ${cls} is below secondary road`)
  const g = f.geometry
  if (!g) continue
  const parts = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
  for (const part of parts) {
    const pts = []
    for (const [lon, lat] of part) {
      const [x, y] = project(lon, lat)
      const p = [Math.round(x), Math.round(y)]
      const last = pts[pts.length - 1]
      if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p)
    }
    if (pts.length > 1) {
      lines.push(pts)
      if (cls === 'S1100') primary.push(pts)
    }
  }
}

const graph = buildChains(lines)

// Places: Census Gazetteer internal points, rounded to city level.
const gazRows = readFileSync(gaz, 'utf8').split('\n').map((l) => l.split('\t').map((s) => s.trim()))
const header = gazRows[0]
const iName = header.indexOf('NAME')
const iLat = header.indexOf('INTPTLAT')
const iLon = header.indexOf('INTPTLONG')
const nodes = {}
const nodeLatLon = {}
for (const [id, name] of Object.entries(PLACES)) {
  const row = gazRows.find((r) => r[iName] === name)
  if (!row) fail(`place "${name}" not found in the gazetteer`)
  const lat = round2(Number(row[iLat]))
  const lon = round2(Number(row[iLon]))
  if (decimals(lat) > 2 || decimals(lon) > 2) fail(`${id} has more than 2 decimals`)
  nodeLatLon[id] = [lat, lon]
  nodes[id] = project(lon, lat).map((n) => Math.round(n))
}
const offgrid = {}
for (const [id, { at, from }] of Object.entries(OFFGRID)) {
  if (at.some((n) => decimals(n) > 2)) fail(`${id} has more than 2 decimals`)
  offgrid[id] = { from, deg: Math.round(bearing(nodeLatLon[from], at) * 10) / 10 }
}

const SRC = 'US Census Bureau TIGER/Line 2024 primary and secondary roads, Texas. Public domain.'
const gridJson = {
  v: 1,
  src: SRC,
  unit: UNIT,
  size: SIZE,
  bbox: BBOX,
  nodes,
  offgrid,
  chains: encodeChains(graph.chains),
}

// NodeTag sprites: one tiny crop of the limited-access roads per node, already
// in sprite coordinates (TAG_W x TAG_H, times 10), so NodeTag ships strings only.
const tagWindow = (cx, cy) => {
  const w = TAG_W * TAG_SCALE
  const h = TAG_H * TAG_SCALE
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
}
function clipSegment(x0, y0, x1, y1, [xmin, ymin, xmax, ymax]) {
  let t0 = 0
  let t1 = 1
  const dx = x1 - x0
  const dy = y1 - y0
  for (const [p, q] of [[-dx, x0 - xmin], [dx, xmax - x0], [-dy, y0 - ymin], [dy, ymax - y0]]) {
    if (p === 0) {
      if (q < 0) return null
    } else {
      const r = q / p
      if (p < 0) t0 = Math.max(t0, r)
      else t1 = Math.min(t1, r)
      if (t0 > t1) return null
    }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy]
}
const coarse = primary.map((pts) => douglasPeucker(pts, TAG_TOLERANCE))
function tagPath(win) {
  const toTag = (x, y) => [Math.round(((x - win[0]) / TAG_SCALE) * 10), Math.round(((y - win[1]) / TAG_SCALE) * 10)]
  let d = ''
  let pen = null
  // Divided highways are two carriageways a few meters apart; at this size they are one line.
  const seen = []
  const near = (p, q) => Math.abs(p[0] - q[0]) <= 8 && Math.abs(p[1] - q[1]) <= 8
  const dup = (a, b) => seen.some(([p, q]) => (near(a, p) && near(b, q)) || (near(a, q) && near(b, p)))
  for (const pts of coarse) {
    for (let i = 1; i < pts.length; i++) {
      const c = clipSegment(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], win)
      if (!c) {
        pen = null
        continue
      }
      const a = toTag(c[0], c[1])
      const b = toTag(c[2], c[3])
      if (dup(a, b)) {
        pen = null
        continue
      }
      seen.push([a, b])
      if (!pen || pen[0] !== a[0] || pen[1] !== a[1]) d += `M${a[0]} ${a[1]}`
      if (a[0] !== b[0] || a[1] !== b[1]) d += `l${b[0] - a[0]} ${b[1] - a[1]}`
      pen = b
    }
    pen = null
  }
  return d.replace(/ -/g, '-')
}
const tags = { w: TAG_W, h: TAG_H, scale: TAG_SCALE, paths: {} }
for (const id of [...Object.keys(PLACES), ...Object.keys(OFFGRID)]) {
  // Off-grid tags are framed on the node their line leaves from; NodeTag draws the exit.
  const [cx, cy] = nodes[id] || nodes[OFFGRID[id].from]
  tags.paths[id] = tagPath(tagWindow(cx, cy))
}
// The small file the page itself imports: node points, bearings and the tags.
const nodesJson = { unit: UNIT, size: SIZE, nodes, offgrid, tags }

// Privacy: the only strings allowed are the known keys, node ids and the source line.
const ALLOWED = new Set(['v', 'src', 'unit', 'size', 'bbox', 'nodes', 'offgrid', 'chains', 'tags', 'w', 'h', 'scale', 'paths', 'from', 'deg', ...Object.keys(PLACES), ...Object.keys(OFFGRID), SRC])
const strings = (o, acc = []) => {
  if (typeof o === 'string') acc.push(o)
  else if (Array.isArray(o)) o.forEach((x) => strings(x, acc))
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) acc.push(k), strings(v, acc)
  return acc
}
for (const json of [gridJson, { ...nodesJson, tags: { ...tags, paths: Object.keys(tags.paths) } }]) {
  for (const s of strings(json)) if (!ALLOWED.has(s)) fail(`unexpected string "${s.slice(0, 40)}"`)
}

const gridText = JSON.stringify(gridJson)
const tagText = JSON.stringify(nodesJson)
mkdirSync(path.join(ROOT, 'src/data'), { recursive: true })
writeFileSync(path.join(ROOT, 'src/data/dfw-grid.json'), gridText + '\n')
writeFileSync(path.join(ROOT, 'src/data/dfw-nodes.json'), tagText + '\n')

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const vcount = gridJson.chains.reduce((s, c) => s + c.length / 2, 0)
console.log(
  `build-grid: ${gridJson.chains.length} chains, ${vcount} vertices, ${graph.islands} islands dropped; ` +
    `dfw-grid.json ${kb(gridText.length)} raw, ${kb(gzipSync(gridText, { level: 9 }).length)} gz; ` +
    `dfw-nodes.json ${kb(tagText.length)} raw, ${kb(gzipSync(tagText, { level: 9 }).length)} gz`,
)
if (STATS) {
  console.log(`  size ${SIZE.join(' x ')} units of ${UNIT} m, nodes ${JSON.stringify(nodes)}, offgrid ${JSON.stringify(offgrid)}`)
  console.log(`  graph: ${graph.vertices} vertices, ${graph.edges} edges before chaining`)
}
