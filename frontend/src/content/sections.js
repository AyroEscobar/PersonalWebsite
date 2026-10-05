import { ui } from './item.js'

/*
  The six sections, in scroll order (DESIGN.md 6). Section ids are stable:
  the lens nav, deep links and the prerender contract all key off them.

  label    the word in the lens nav
  heading  the h2, when it differs from the label (signal, labeled contact)
*/
export const SECTIONS = [
  {
    id: 'origin',
    label: ui('stop-origin', 'origin'),
  },
  {
    id: 'now',
    label: ui('stop-now', 'now'),
  },
  {
    id: 'work',
    label: ui('stop-work', 'work'),
  },
  {
    id: 'builds',
    label: ui('stop-builds', 'builds'),
  },
  {
    id: 'crew',
    label: ui('stop-crew', 'crew'),
  },
  {
    id: 'signal',
    // Navigation says what is there; the section keeps its name (r1 T15).
    label: ui('stop-signal', 'contact'),
    heading: ui('stop-signal-heading', 'signal'),
  },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

export const sectionById = (id) => SECTIONS.find((s) => s.id === id)

// Heading element id for a section: <h2 id={headingId(id)}>, aria-labelledby on the <section>.
export const headingId = (id) => `${id}-h`
