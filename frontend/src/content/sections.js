import { ui } from './item.js'

/*
  The four sections with a nav entry, in scroll order (COPY.md 3.7, 6.6). The
  hero is #top and has no nav entry. Section ids are stable: the nav, deep
  links, the scroll anchors and the prerender contract all key off them.
  Each has a Roman numeral, written as letters (never the Unicode numeral code
  points), shown before its title and in the phone menu, and a hidden
  "Section n." so a screen reader hears the order the numeral shows.
*/
export const SECTIONS = [
  { id: 'check-out', label: ui('stop-check-out', 'work'), numeral: ui('sec-num-1', 'I'), sr: ui('sec-sr-1', 'Section 1.') },
  { id: 'experience', label: ui('stop-experience', 'experience'), numeral: ui('sec-num-2', 'II'), sr: ui('sec-sr-2', 'Section 2.') },
  { id: 'stack', label: ui('stop-stack', 'stack'), numeral: ui('sec-num-3', 'III'), sr: ui('sec-sr-3', 'Section 3.') },
  { id: 'contact', label: ui('stop-contact', 'contact'), numeral: ui('sec-num-4', 'IV'), sr: ui('sec-sr-4', 'Section 4.') },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

export const sectionById = (id) => SECTIONS.find((s) => s.id === id)

// Heading element id for a section: <h2 id={headingId(id)}>, aria-labelledby on the <section>.
export const headingId = (id) => `${id}-h`
