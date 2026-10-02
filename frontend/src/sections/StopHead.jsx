import { SECTIONS } from '../content/sections.js'
import { NODES } from '../content/places.js'
import { SectionHeading } from '../ui/Section.jsx'
import { NodeTag } from './slots.js'
import './sections.css'

/*
  The head of every content section: the stop number on a small exit tab,
  the road leaving it (lit as the stop arrives), then the h2 from the
  section contract. On phones the map does not follow you down the page, so
  A's NodeTag stands in for it here (PLAN.md 4.4).

  The number and road are decoration; the RouteRail carries the order.
*/
export default function StopHead({ id, children }) {
  const i = SECTIONS.findIndex((s) => s.id === id)
  const node = SECTIONS[i]?.focus.nodes[0]
  return (
    <div className="stop-head">
      <div className="stop-line" aria-hidden="true">
        <span className="stop-no mono">{String(i + 1).padStart(2, '0')}</span>
        <span className="stop-road" />
        {NodeTag && node && (
          <span className="stop-tag md:hidden">
            <NodeTag node={node} state={NODES[node]?.state} />
          </span>
        )}
      </div>
      <SectionHeading id={id} className="t-h2 lower stop-title" />
      {children}
    </div>
  )
}
