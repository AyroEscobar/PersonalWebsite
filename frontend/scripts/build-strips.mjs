#!/usr/bin/env node
/*
  The road strip under each stop head (r2 U6). Run by hand, output committed:

    node scripts/build-strips.mjs     writes src/data/stop-roads.json

  Each of the six stops gets a different stretch of real road from
  dfw-grid.json, unlabeled: the longest run of one chain that stays near the
  place the stop is about (Plano for origin, work and signal, the corridor
  between Richardson and Allen for now, an interchange for builds,
  Richardson for crew). Its vertices are written as they are in the grid, in absolute map
  units, so the strip is a true piece of the map (the QA run checks every
  strip against the chains). StopHead turns it level with a rotate() and
  draws it as a 1px line that ends in a sodium node.

  Every strip stays under 1 KB. No names are read or written.
*/
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodeChains } from '../src/grid/graph.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const grid = JSON.parse(readFileSync(path.join(ROOT, 'src/data/dfw-grid.json'), 'utf8'))
const chains = decodeChains(grid)
const N = grid.nodes
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// Where each stop's stretch comes from: a center, a reach in map units (20 m
// each), and how much road to keep at most.
const STOPS = {
  origin: { at: N.plano, reach: 520, max: 1400 },
  now: { at: mid(N.allen, N.richardson), reach: 460, max: 1600 },
  work: { at: [N.plano[0] + 260, N.plano[1] - 160], reach: 520, max: 1400 },
  builds: { at: grid.hubs[1], reach: 700, max: 1800 },
  crew: { at: N.richardson, reach: 480, max: 1400 },
  signal: { at: N.plano, reach: 300, max: 900 },
}

// No coordinate that reads like a recent year: the privacy scan keeps years
// away from employer names, and a strip should never trip it by accident.
const YEARISH = /(^|[^\d])20[2-3]\d([^\d]|$)/

const used = new Set()
const len = (pts) => {
  let s = 0
  for (let i = 2; i < pts.length; i += 2) s += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1])
  return s
}

function pick({ at, reach, max }) {
  let best = null
  chains.forEach((c, j) => {
    if (used.has(j)) return
    let run = []
    const consider = () => {
      if (run.length >= 12) {
        // Trim from the end until the stretch is no longer than `max`.
        let r = run
        while (r.length > 12 && len(r) > max) r = r.slice(0, -2)
        const L = len(r)
        const d = toD(r)
        if (YEARISH.test(d)) return
        if (!best || L > best.L) best = { j, pts: r, L }
      }
    }
    for (let i = 0; i < c.length; i += 2) {
      if (Math.hypot(c[i] - at[0], c[i + 1] - at[1]) <= reach) run.push(c[i], c[i + 1])
      else {
        consider()
        run = []
      }
    }
    consider()
  })
  if (!best) throw new Error('no stretch found')
  used.add(best.j)
  return best
}

const toD = (pts) => {
  let d = `M${pts[0]} ${pts[1]}L`
  for (let i = 2; i < pts.length; i += 2) d += `${i > 2 ? ' ' : ''}${pts[i]} ${pts[i + 1]}`
  return d
}
const r1 = (n) => Math.round(n * 10) / 10

const out = {}
for (const [id, spec] of Object.entries(STOPS)) {
  const { pts, L } = pick(spec)
  const n = pts.length
  // Level: the chord from the first to the last vertex runs left to right.
  const ang = Math.atan2(pts[n - 1] - pts[1], pts[n - 2] - pts[0])
  const deg = r1((-ang * 180) / Math.PI)
  const rad = (deg * Math.PI) / 180
  const xs = []
  const ys = []
  for (let i = 0; i < n; i += 2) {
    xs.push(pts[i] * Math.cos(rad) - pts[i + 1] * Math.sin(rad))
    ys.push(pts[i] * Math.sin(rad) + pts[i + 1] * Math.cos(rad))
  }
  const minx = Math.min(...xs)
  const w = Math.max(...xs) - minx
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  // Height: the road's own bend, but never so little that a straight road's
  // noise gets blown up (about one unit of height per 40 of length).
  const h = Math.max(Math.max(...ys) - Math.min(...ys), w / 40) * 1.3
  const d = toD(pts)
  const vb = `${r1(minx)} ${r1(cy - h / 2)} ${r1(w)} ${r1(h)}`
  if (YEARISH.test(d + vb)) throw new Error(`${id}: a strip carries a year-like number; pick another`)
  out[id] = { d, vb, deg }
  console.log(`build-strips: ${id.padEnd(7)} ${n / 2} vertices, ${Math.round(L * grid.unit)} m of road, ${d.length + vb.length} bytes`)
}
writeFileSync(path.join(ROOT, 'src/data/stop-roads.json'), JSON.stringify(out) + '\n')
console.log('build-strips: wrote src/data/stop-roads.json')
