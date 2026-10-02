import { SECTIONS } from '../content/sections.js'
import { SectionHeading } from '../ui/Section.jsx'
import './sections.css'

/*
  The head of every content section: the stop number on a small exit tab,
  the road leaving it (lit as the stop arrives), then the h2 from the
  section contract.

  The number and road are decoration; the RouteRail carries the order. A
  stop whose navigation label differs from its heading (signal is labeled
  contact) shows the label beside the number: 06 · contact.
*/
export default function StopHead({ id, children }) {
  const i = SECTIONS.findIndex((s) => s.id === id)
  return (
    <div className="stop-head">
      <div className="stop-line" aria-hidden="true">
        <span className="stop-no mono">{String(i + 1).padStart(2, '0')}</span>
        {SECTIONS[i]?.heading && <span className="stop-alias mono">{SECTIONS[i].label.text}</span>}
        <span className="stop-road" />
      </div>
      <SectionHeading id={id} className="t-h2 lower stop-title" />
      {children}
    </div>
  )
}
