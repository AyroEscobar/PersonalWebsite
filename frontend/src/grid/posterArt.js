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
    city     one pre-blurred glow per Texas node, the size of the real city
             (a circle with its land area): LED over the places that are now,
             sodium over Dallas, the old light the city is being re-lit from
    halo     wide, faint strokes under the freeways and tollways (no filters)
    road     every road, in 24 bands of road distance from Plano (band 0 is
             the closest) times 3 road classes. The first paint lights the
             bands in order. Freeways burn brightest, tollways at about 80%,
             state roads at about 45%, and the light falls off away from Plano.
    hub      four interchange hot spots (US-75 by I-635 and by the Bush
             Turnpike, the Tollway by the Bush Turnpike and by I-635), unlabeled
    spine    US-75 between Richardson and Allen, the current chapter, in LED
    (the two lines that leave the map are NightGrid's exit signs, exits.js)
    spur     a dotted leader from each Texas node to the road it meets
    node     dot, glow and label (labels counter-scaled to stay 12px); Plano,
             home, carries the site's one live light, the obstruction beacon
             (a 5 px core in an 18 px pre-blurred halo, r2 N13)
*/

export const BANDS = 24

// Road classes (build-grid.mjs): light share, stroke width, and the sodium
// floor a class keeps however far it runs from Plano.
const CLASS = {
  1: { o: 1, w: 1.6, floor: 0.5, halo: 1, hw: 12 },
  2: { o: 0.8, w: 1.3, floor: 0.4, halo: 0.7, hw: 9 },
  3: { o: 0.45, w: 0.9, floor: 0, halo: 0, hw: 0 },
}

// City glows: how strong each place burns, and in which light.
const CITY = {
  plano: { a: 1, light: 'led' },
  richardson: { a: 0.8, light: 'led' },
  allen: { a: 0.8, light: 'led' },
  dallas: { a: 0.9, light: 'sodium' },
}
// The glow reaches a little past the city line, the way light spills.
const CITY_SPILL = 1.3
const HUB_HALO = 150
const HUB_CORE = 40

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


export function posterArt(grid, { id = 'hero' } = {}) {
  const g = buildGraph(grid)
  const { dist, maxD } = lightField(g, grid)
  const band = (d) => (Number.isFinite(d) ? Math.min(BANDS - 1, Math.floor((d / maxD) * BANDS)) : BANDS - 1)

  // Runs of consecutive edges that share a band and a road class.
  const runs = Array.from({ length: BANDS * 3 }, () => [])
  g.chains.forEach((chain, j) => {
    let cur = -1
    let run = null
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1]
      const b = chain[i]
      const key = band(Math.min(dist[a], dist[b])) * 3 + (g.chainCls[j][i - 1] - 1)
      if (key !== cur || !run) {
        run = [a]
        runs[key].push(run)
        cur = key
      }
      run.push(b)
    }
  })

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
  const r2 = (n) => Math.round(n * 100) / 100
  for (let key = 0; key < BANDS * 3; key++) {
    if (!runs[key].length) continue
    const i = Math.floor(key / 3)
    const c = CLASS[(key % 3) + 1]
    const lit = Math.max(kOf(i), c.floor)
    defs.push(`<path id="${p}-b${key}" d="${pathData(g, runs[key])}" vector-effect="non-scaling-stroke"/>`)
    const style = `--b:${i};--k:${k(i)};--p:${Math.round(lit * 92)}%;--o:${r2((0.3 + lit * 0.7) * c.o)};--w:${r2((1 + kOf(i) * 0.45) * c.w)}px`
    if (c.halo) halos.push(`<use href="#${p}-b${key}" style="${style};--ho:${r2((0.07 + kOf(i) * kOf(i) * 0.22) * c.halo)};--hw:${c.hw}px"/>`)
    roads.push(`<use href="#${p}-b${key}" style="${style}"/>`)
  }

  // City glows and interchange hot spots, in map units: they grow with the zoom like real light.
  const cities = Object.entries(CITY)
    .filter(([node]) => grid.nodes[node] && grid.extent?.[node])
    .map(([node, c]) => {
      const [x, y] = grid.nodes[node]
      return `<circle class="ng-city-glow" data-node="${node}" cx="${x}" cy="${y}" r="${Math.round(grid.extent[node] * CITY_SPILL)}" fill="url(#${p}-city-${c.light})" style="--a:${c.a}"/>`
    })
  const hubs = (grid.hubs ?? []).map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="${HUB_HALO}" fill="url(#${p}-hub-halo)"/><circle cx="${x}" cy="${y}" r="${HUB_CORE}" fill="url(#${p}-hub-core)"/>`,
  )
  if (spine.length > 1) defs.push(`<path id="${p}-spine" d="${pathData(g, [spine])}" vector-effect="non-scaling-stroke"/>`)

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
    const home = node === 'plano'
    nodes.push(
      `<g class="ng-node" data-node="${node}" data-state="${info.state}" style="--b:${band(dist[v])}" transform="translate(${x} ${y})">` +
        `<g class="ng-fix">` +
        `<circle class="ng-glow" r="${home ? 44 : 28}" fill="url(#${p}-glow-${info.state === 'dim' ? 'dim' : 'led'})"/>` +
        (home ? `<circle class="ng-beacon-glow beacon" cx="0" cy="-13" r="9" fill="url(#${p}-beacon-halo)"/><circle class="ng-beacon beacon" cx="0" cy="-13" r="2.5"/>` : '') +
        `<circle class="ng-ring" r="7"/>` +
        `<circle class="ng-dot" r="3.5"/>` +
        `<text class="ng-label" x="${l.x}" y="${l.y}" text-anchor="${l.anchor}">${esc(info.text)}</text>` +
        `<text class="ng-label ng-label-hot" x="${l.x}" y="${l.y}" text-anchor="${l.anchor}" aria-hidden="true">${esc(info.text)}</text>` +
        `</g></g>`,
    )
  }

  const glow = (name) =>
    `<radialGradient id="${p}-glow-${name}">` +
    `<stop offset="0" class="ng-stop-${name}" stop-opacity=".5"/>` +
    `<stop offset=".3" class="ng-stop-${name}" stop-opacity=".16"/>` +
    `<stop offset="1" class="ng-stop-${name}" stop-opacity="0"/>` +
    `</radialGradient>`
  // A soft falloff, close to a gaussian: light from altitude has no edge.
  const haze = (id, name, peak) =>
    `<radialGradient id="${p}-${id}">` +
    [
      [0, 1],
      [0.18, 0.78],
      [0.38, 0.42],
      [0.6, 0.16],
      [0.8, 0.04],
      [1, 0],
    ]
      .map(([o, f]) => `<stop offset="${o}" class="ng-stop-${name}" stop-opacity="${r2(peak * f)}"/>`)
      .join('') +
    `</radialGradient>`

  return (
    `<defs>${glow('led')}${glow('dim')}${haze('beacon-halo', 'beacon', 0.85)}${haze('city-led', 'led', 0.34)}${haze('city-sodium', 'sodium', 0.28)}${haze('hub-halo', 'sodium', 0.38)}${haze('hub-core', 'ink', 0.6)}${defs.join('')}</defs>` +
    `<g class="ng-city">${cities.join('')}</g>` +
    `<g class="ng-halo">${halos.join('')}</g>` +
    `<g class="ng-road">${roads.join('')}</g>` +
    `<g class="ng-hubs">${hubs.join('')}</g>` +
    (spine.length > 1
      ? `<g class="ng-spine" style="--b:${band(dist[spine[0]])}"><use class="ng-spine-glow" href="#${p}-spine"/><use class="ng-spine-core" href="#${p}-spine"/></g>`
      : '') +
    `<g class="ng-spurs">${spurs.join('')}</g>` +
    `<g class="ng-nodes">${nodes.join('')}</g>`
  )
}

/*
  The closing band (r2 U6): the same roads again, unlit, as <use> references
  to the hero poster's paths, so the page ends on the city for a few hundred
  bytes. Prerender only, like posterArt; PosterBand reads it back.
*/
export function bandArt(grid, { id = 'hero' } = {}) {
  const g = buildGraph(grid)
  const { dist, maxD } = lightField(g, grid)
  const band = (d) => (Number.isFinite(d) ? Math.min(BANDS - 1, Math.floor((d / maxD) * BANDS)) : BANDS - 1)
  const keys = new Set()
  g.chains.forEach((chain, j) => {
    for (let i = 1; i < chain.length; i++) keys.add(band(Math.min(dist[chain[i - 1]], dist[chain[i]])) * 3 + (g.chainCls[j][i - 1] - 1))
  })
  return [...keys]
    .sort((a, b) => a - b)
    .map((k) => `<use href="#ng-${id}-b${k}" class="cb-c${(k % 3) + 1}"/>`)
    .join('')
}
