import { ui } from './item.js'

/*
  The six stops, in scroll order (PLAN.md 3). Section ids are stable: the
  RouteRail, the JumpList, deep links and the map camera all key off them.

  focus.nodes    grid nodes lit or framed when the section is in view
  focus.offgrid  off-grid links brightened (nyc, waterloo)
  focus.frame    camera framing: 'wide' | 'tight' | 'corridor' | 'all'
*/
export const SECTIONS = [
  {
    id: 'origin',
    label: ui('stop-origin', 'origin'),
    focus: { nodes: ['plano'], offgrid: [], frame: 'wide' },
  },
  {
    id: 'now',
    label: ui('stop-now', 'now'),
    focus: { nodes: ['allen', 'plano', 'richardson'], offgrid: [], frame: 'corridor' },
  },
  {
    id: 'work',
    label: ui('stop-work', 'work'),
    focus: { nodes: ['plano'], offgrid: ['nyc'], frame: 'wide' },
  },
  {
    id: 'builds',
    label: ui('stop-builds', 'builds'),
    focus: { nodes: [], offgrid: [], frame: 'all' },
  },
  {
    id: 'crew',
    label: ui('stop-crew', 'crew'),
    focus: { nodes: ['richardson'], offgrid: ['waterloo'], frame: 'wide' },
  },
  {
    id: 'signal',
    label: ui('stop-signal', 'signal'),
    focus: { nodes: ['plano'], offgrid: [], frame: 'tight' },
  },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

export const sectionById = (id) => SECTIONS.find((s) => s.id === id)

// Heading element id for a section: <h2 id={headingId(id)}>, aria-labelledby on the <section>.
export const headingId = (id) => `${id}-h`
