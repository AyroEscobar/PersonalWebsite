import { ui } from './item.js'

/*
  The four sections with a nav entry, in scroll order (COPY.md 3.7, 6.6). The
  hero is #top and has no nav entry. Section ids are stable: the nav, deep
  links, the scroll anchors and the prerender contract all key off them.
*/
export const SECTIONS = [
  { id: 'check-out', label: ui('stop-check-out', 'work') },
  { id: 'experience', label: ui('stop-experience', 'experience') },
  { id: 'stack', label: ui('stop-stack', 'stack') },
  { id: 'contact', label: ui('stop-contact', 'contact') },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

export const sectionById = (id) => SECTIONS.find((s) => s.id === id)

// Heading element id for a section: <h2 id={headingId(id)}>, aria-labelledby on the <section>.
export const headingId = (id) => `${id}-h`
