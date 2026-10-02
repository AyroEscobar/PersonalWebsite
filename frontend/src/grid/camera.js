import META from '../data/dfw-nodes.json'
import { SECTIONS } from '../content/sections.js'

/*
  The map camera (PLAN.md 4.1). Owned by A.

  The poster's <svg> has no viewBox, so one user unit is one CSS px. The
  camera group maps map units (20 m each) to the screen:

    translate(anchor) scale(z * zk) translate(-center)

  anchor  where the framed point sits on screen, in % of the map viewport,
          per breakpoint (grid.css)
  z       px per map unit at a 1440 px desktop; zk steps it up on larger
          screens (grid.css) so the frame shows about the same ground
  center  the framed point, in map units

  Only desktop follows store.focus: on tablets and phones the map is the hero
  and nothing below it can see the map, so those frames never change and no
  transition ever runs off screen. NightGrid writes cameraVars(focus) on its
  wrapper; grid.css turns them into registered custom properties so the
  camera and the counter-scaled labels animate from the same numbers.
*/

const N = META.nodes
const mid = (...ids) => [
  ids.reduce((s, id) => s + N[id][0], 0) / ids.length,
  ids.reduce((s, id) => s + N[id][1], 0) / ids.length,
]

// Desktop frames, one per section (sections.js focus.frame). z at 1440 px.
export const FRAMES = {
  origin: { at: [N.plano[0] + 60, N.plano[1] + 40], z: 0.5 },
  now: { at: mid('allen', 'plano', 'richardson'), z: 0.82 },
  work: { at: [N.plano[0] + 260, N.plano[1] - 120], z: 0.48 },
  builds: { at: [N.plano[0] - 60, N.plano[1] + 640], z: 0.3 },
  crew: { at: [N.richardson[0] + 220, N.richardson[1] - 200], z: 0.5 },
  signal: { at: [N.plano[0] + 40, N.plano[1] + 20], z: 1.05 },
}

// Phones and tablets: the US-75 corridor as the spine, Allen to Richardson.
export const HERO_FRAMES = {
  phone: { at: [N.plano[0] + 125, N.plano[1]], z: 0.36 },
  tablet: { at: [N.plano[0] + 170, N.plano[1] + 90], z: 0.52 },
}

const px = (n) => `${-Math.round(n)}px`

/** Inline custom properties for the wrapper: the desktop frame for `focus`. */
export function cameraVars(focus) {
  const f = FRAMES[focus] ?? FRAMES.origin
  return {
    '--ng-cx-d': px(f.at[0]),
    '--ng-cy-d': px(f.at[1]),
    '--ng-z-d': f.z,
  }
}

/** The constant phone and tablet frames, as inline custom properties. */
export function heroVars() {
  const { phone: p, tablet: t } = HERO_FRAMES
  return {
    '--ng-cx-m': px(p.at[0]),
    '--ng-cy-m': px(p.at[1]),
    '--ng-z-m': p.z,
    '--ng-cx-t': px(t.at[0]),
    '--ng-cy-t': px(t.at[1]),
    '--ng-z-t': t.z,
  }
}

/** Nodes and off-grid links a section lights (sections.js focus). */
export function focusLights(focus) {
  const s = SECTIONS.find((x) => x.id === focus)
  return { nodes: s?.focus.nodes.join(' ') ?? '', offgrid: s?.focus.offgrid.join(' ') ?? '' }
}

/**
 * Screen point to map units, through the live camera (it may be mid-transition).
 * Returns null when the map is not in the document.
 */
export function clientToMap(clientX, clientY, variant = 'hero') {
  if (typeof document === 'undefined') return null
  const cam = document.querySelector(`.ng-cam[data-variant="${variant}"]`)
  const svg = cam?.ownerSVGElement
  const m = cam?.getScreenCTM?.()
  if (!svg || !m) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const p = pt.matrixTransform(m.inverse())
  return { x: p.x, y: p.y }
}

/** Map units to screen px, through the live camera. */
export function mapToClient(x, y, variant = 'hero') {
  if (typeof document === 'undefined') return null
  const cam = document.querySelector(`.ng-cam[data-variant="${variant}"]`)
  const svg = cam?.ownerSVGElement
  const m = cam?.getScreenCTM?.()
  if (!svg || !m) return null
  const pt = svg.createSVGPoint()
  pt.x = x
  pt.y = y
  const p = pt.matrixTransform(m)
  return { x: p.x, y: p.y }
}

/** The Texas node closest to a map point (for "pinged from ..."). */
export function nearestNode(x, y) {
  let best = 'plano'
  let bestD = Infinity
  for (const [id, [nx, ny]] of Object.entries(N)) {
    const d = (nx - x) ** 2 + (ny - y) ** 2
    if (d < bestD) {
      bestD = d
      best = id
    }
  }
  return best
}

export const MAP_META = META
