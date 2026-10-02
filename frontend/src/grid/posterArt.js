import { buildGraph, nearestVertex, pathBetween, shortestFrom } from './graph.js'
import { NODES } from '../content/places.js'

/*
  GridPoster's artwork as SVG markup (PLAN.md 4.1, 4.3). Owned by A.

  Runs only in the prerender (and in `vite dev`): GridPoster inlines the
  string into the served HTML, and the client bundle never carries the
  geometry. Everything that changes at runtime is driven from attributes on
  the NightGrid wrapper through CSS, so the markup itself never re-renders.

    posterArt(grid, { id })   markup for the inside of the camera group

  Layers, back to front:
    halo     wide, faint strokes under the lit bands (the glow, no filters)
    road     every road, in 24 bands of road distance from Plano; band 0 is
             the closest. The first paint lights them in order, and --k
             (1 near Plano, 0 far away) sets how much sodium each band holds.
    spine    US-75 between Richardson and Allen, the current chapter, in LED
    offgrid  the two lines that leave the map (OffGridLink)
    spur     a dotted leader from each Texas node to the road it meets
    node     dot, glow and label (labels counter-scaled to stay 12px)
*/

export const BANDS = 24

const r1 = (n) => Math.round(n * 10) / 10

/* "M x y l dx dy dx dy" with the implicit repeat of l and no space before a minus. */
function pathData(g, runs) {
  let d = ''
  for (const run of runs) {
    let x = g.x[run[0]]
    let y = g.y[run[0]]
    d += `M${x} ${y}l`
    let first = true
    for (let i = 1; i < run.length; i++) {
      const nx = g.x[run[i]]
      const ny = g.y[run[i]]
      d += `${first ? '' : ' '}${nx - x} ${ny - y}`
      first = false
      x = nx
      y = ny
    }
  }
  return d.replace(/ -/g, '-')
}

function kNearest(g, x, y, k) {
  const all = []
  for (let i = 0; i < g.n; i++) all.push([Math.hypot(g.x[i] - x, g.y[i] - y), i])
  return all.sort((a, b) => a[0] - b[0]).slice(0, k)
}

/** Road distance from Plano, entering the network at its three nearest vertices. */
export function lightField(g, grid) {
  const [px, py] = grid.nodes.plano
  const dist = shortestFrom(
    g,
    kNearest(g, px, py, 3).map(([d, v]) => [v, d]),
  )
  const finite = Array.from(dist).filter(Number.isFinite).sort((a, b) => a - b)
  const maxD = finite[Math.floor(finite.length * 0.97)] || 1
  return { dist, maxD }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// Label placement around each dot, in screen px (the label group is counter-scaled).
const LABEL = {
  plano: { x: 12, y: 4, anchor: 'start' },
  richardson: { x: 12, y: 4, anchor: 'start' },
  allen: { x: 12, y: 4, anchor: 'start' },
  dallas: { x: 12, y: 4, anchor: 'start' },
}

// How far along its bearing each off-grid label sits, in map units (km x 50).
const OFF_LABEL_AT = { nyc: 700, waterloo: 640 }
const OFF_LENGTH = 6000

export function posterArt(grid, { id = 'hero' } = {}) {
  const g = buildGraph(grid)
  const { dist, maxD } = lightField(g, grid)
  const band = (d) => (Number.isFinite(d) ? Math.min(BANDS - 1, Math.floor((d / maxD) * BANDS)) : BANDS - 1)

  // Runs of consecutive edges that share a band.
  const runs = Array.from({ length: BANDS }, () => [])
  for (const chain of g.chains) {
    let cur = -1
    let run = null
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1]
      const b = chain[i]
      const k = band(Math.min(dist[a], dist[b]))
      if (k !== cur || !run) {
        run = [a]
        runs[k].push(run)
        cur = k
      }
      run.push(b)
    }
  }

  const near = {}
  for (const [node, [x, y]] of Object.entries(grid.nodes)) near[node] = nearestVertex(g, x, y)
  const spine = pathBetween(g, near.richardson, near.allen)

  const p = `ng-${id}`
  // Light per band: 1 at Plano, 0 at the far edge. --p is the sodium share of
  // the road color as a plain percentage (no calc inside color-mix: Chrome
  // mis-scales it while animating).
  const kOf = (i) => Math.pow(1 - i / BANDS, 1.7)
  const k = (i) => Math.round(kOf(i) * 100) / 100
  const defs = []
  const halos = []
  const roads = []
  for (let i = 0; i < BANDS; i++) {
    if (!runs[i].length) continue
    defs.push(`<path id="${p}-b${i}" d="${pathData(g, runs[i])}" vector-effect="non-scaling-stroke"/>`)
    const style = `--b:${i};--k:${k(i)};--p:${Math.round(kOf(i) * 92)}%`
    halos.push(`<use href="#${p}-b${i}" style="${style}"/>`)
    roads.push(`<use href="#${p}-b${i}" style="${style}"/>`)
  }
  if (spine.length > 1) defs.push(`<path id="${p}-spine" d="${pathData(g, [spine])}" vector-effect="non-scaling-stroke"/>`)

  // Off-grid links: a line out along the real bearing, a chevron and the city name.
  const off = Object.entries(grid.offgrid).map(([node, { from, deg }]) => {
    const [x0, y0] = grid.nodes[from]
    const rad = (deg * Math.PI) / 180
    const ux = Math.sin(rad)
    const uy = -Math.cos(rad)
    const at = OFF_LABEL_AT[node] ?? 800
    const lx = r1(x0 + ux * at)
    const ly = r1(y0 + uy * at)
    const label = NODES[node]
    return (
      `<g class="ng-off" data-node="${node}" data-from="${from}" data-state="${label.state}">` +
      `<title>${esc(label.a11y)}</title>` +
      `<path class="ng-off-line" d="M${x0} ${y0}L${r1(x0 + ux * OFF_LENGTH)} ${r1(y0 + uy * OFF_LENGTH)}" vector-effect="non-scaling-stroke"/>` +
      // Chevron and name ride the line, like a route label, reading toward the city.
      `<g transform="translate(${lx} ${ly})"><g class="ng-fix"><g transform="rotate(${r1(deg - 90)})">` +
      `<path class="ng-off-head" d="M-5 -4L0 0L-5 4" vector-effect="non-scaling-stroke"/>` +
      `<text class="ng-label" x="-12" y="-6" text-anchor="end">${esc(label.text)}</text>` +
      `</g></g></g></g>`
    )
  })

  const spurs = []
  const nodes = []
  for (const [node, [x, y]] of Object.entries(grid.nodes)) {
    const info = NODES[node]
    if (!info || info.kind !== 'node') continue
    const v = near[node]
    if (Math.hypot(g.x[v] - x, g.y[v] - y) > 12)
      spurs.push(
        `<path class="ng-spur" data-node="${node}" d="M${x} ${y}L${g.x[v]} ${g.y[v]}" vector-effect="non-scaling-stroke"/>`,
      )
    const l = LABEL[node] ?? LABEL.plano
    nodes.push(
      `<g class="ng-node" data-node="${node}" data-state="${info.state}" style="--b:${band(dist[v])}" transform="translate(${x} ${y})">` +
        `<g class="ng-fix">` +
        `<circle class="ng-glow" r="28" fill="url(#${p}-glow-${info.state === 'dim' ? 'dim' : 'led'})"/>` +
        `<circle class="ng-ring" r="7"/>` +
        `<circle class="ng-dot" r="3.5"/>` +
        `<text class="ng-label" x="${l.x}" y="${l.y}" text-anchor="${l.anchor}">${esc(info.text)}</text>` +
        `</g></g>`,
    )
  }

  const glow = (name) =>
    `<radialGradient id="${p}-glow-${name}">` +
    `<stop offset="0" class="ng-stop-${name}" stop-opacity=".5"/>` +
    `<stop offset=".3" class="ng-stop-${name}" stop-opacity=".16"/>` +
    `<stop offset="1" class="ng-stop-${name}" stop-opacity="0"/>` +
    `</radialGradient>`

  return (
    `<defs>${glow('led')}${glow('dim')}${defs.join('')}</defs>` +
    `<g class="ng-halo">${halos.join('')}</g>` +
    `<g class="ng-road">${roads.join('')}</g>` +
    (spine.length > 1
      ? `<g class="ng-spine" style="--b:${band(dist[spine[0]])}"><use class="ng-spine-glow" href="#${p}-spine"/><use class="ng-spine-core" href="#${p}-spine"/></g>`
      : '') +
    `<g class="ng-offgrid">${off.join('')}</g>` +
    `<g class="ng-spurs">${spurs.join('')}</g>` +
    `<g class="ng-nodes">${nodes.join('')}</g>`
  )
}
