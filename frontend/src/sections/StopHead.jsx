import { SECTIONS, STOP_EXIT } from '../content/sections.js'
import ROADS from '../data/stop-roads.json'
import { SectionHeading } from '../ui/Section.jsx'
import './sections.css'

/*
  The head of every content section (r2 U6): a filled exit tab (exit 01),
  then a strip of real road, a different stretch of the map for each stop
  (src/data/stop-roads.json, from scripts/build-strips.mjs), turned level and
  drawn as a 1px line that ends in a sodium node. Sodium spills along it
  from the tab as the stop arrives. Then the h2 from the section contract.

  The tab, the strip and the node are decoration (aria-hidden); the RouteRail
  carries the order. A stop whose navigation label differs from its heading
  (signal is labeled contact) shows the label beside the tab, and says it to
  screen readers too: the h2 reads "contact: signal", so a reader who chose
  contact lands on a heading that says so.
*/
export default function StopHead({ id, children }) {
  const i = SECTIONS.findIndex((s) => s.id === id)
  const s = SECTIONS[i]
  const road = ROADS[id]
  const ref = `sr-${id}`
  return (
    <div className="stop-head">
      <div className="stop-line" aria-hidden="true">
        <span className="stop-no mono">
          {STOP_EXIT.text} {String(i + 1).padStart(2, '0')}
        </span>
        {s?.heading && <span className="stop-alias mono">{s.label.text}</span>}
        {road && (
          <span className="stop-road">
            <svg className="stop-road-svg" viewBox={road.vb} preserveAspectRatio="none" focusable="false">
              <path id={ref} d={road.d} transform={`rotate(${road.deg})`} vectorEffect="non-scaling-stroke" />
            </svg>
            <svg className="stop-road-svg stop-road-lit" viewBox={road.vb} preserveAspectRatio="none" focusable="false">
              <use href={`#${ref}`} />
            </svg>
          </span>
        )}
        <span className="stop-node" />
      </div>
      <SectionHeading id={id} className="t-h2 lower stop-title">
        {s?.heading ? (
          <>
            <span className="sr-only">{s.label.text}: </span>
            {s.heading.text}
          </>
        ) : undefined}
      </SectionHeading>
      {children}
    </div>
  )
}
