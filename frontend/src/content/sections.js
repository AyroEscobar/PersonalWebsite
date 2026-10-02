import { ui } from './item.js'

/*
  The six stops, in scroll order (PLAN.md 3). Section ids are stable: the
  RouteRail, the JumpList, deep links and the map camera all key off them.

  label          the stop's name in the rail, bars, sheet and search
  heading        the h2, when it differs from the label (signal, labeled contact)
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
    // Navigation says what is there; the section keeps its name (r1 T15).
    label: ui('stop-signal', 'contact'),
    heading: ui('stop-signal-heading', 'signal'),
    focus: { nodes: ['plano'], offgrid: [], frame: 'tight' },
  },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

// The filled tab on each stop head reads like a highway exit: exit 01 (r2 U6).
export const STOP_EXIT = ui('stop-exit', 'exit')

export const sectionById = (id) => SECTIONS.find((s) => s.id === id)

// Heading element id for a section: <h2 id={headingId(id)}>, aria-labelledby on the <section>.
export const headingId = (id) => `${id}-h`
