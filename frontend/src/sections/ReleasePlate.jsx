import StatusChip from '../ui/StatusChip.jsx'
import DeskBranch from './DeskBranch.jsx'
import { NodeTag } from './slots.js'
import { Figures, MonthSpan } from './text.jsx'

/*
  ReleasePlate (PLAN.md 4.8): one role, dated like a release. The dates sit
  on their own line beside the station dot, above the plate, so they read
  first and line up down the spine ("the dates do the talking"). That
  visual copy is aria-hidden and the same dates are read inside the plate,
  right after the heading, so heading navigation never skips them.

  The station dot and the plate's rule take the role's light: LED while
  active, sodium once complete (from the state class on the list item).

  A's NodeTag sits before the place as a picture of where it was; the place
  itself is the words, so the tag's own name is hidden here and the tag is
  aria-hidden (one reading of "Allen, Texas", not two). The tag takes the
  plate's light, so Plano reads sodium on the JPMorgan plate. The article
  carries the plate id (plate-md7 ...) so B's JumpList can land on it.
*/
export default function ReleasePlate({ plate: p, desksLabel }) {
  const h = `${p.id}-h`
  const when = <MonthSpan start={p.start} end={p.end} text={p.dates} />
  return (
    <article id={p.id} aria-labelledby={h} className="rp">
      <p className="rp-when mono" aria-hidden="true">
        {when}
      </p>
      <span className="rp-dot" aria-hidden="true" />
      <div className="rp-card plate rule-l is-lit">
        <div className="rp-head">
          <h3 id={h} className="rp-org">
            {p.org}
          </h3>
          <StatusChip status={p.status} />
        </div>
        <p className="sr-only">{when}</p>
        <p className="rp-role">{p.role}</p>
        <p className="rp-where mono">
          {NodeTag && p.node && (
            <span className="rp-tag" aria-hidden="true">
              <NodeTag node={p.node} state={p.state === 'past' ? 'lit-past' : 'lit-now'} />
            </span>
          )}
          <span>{p.place}</span>
        </p>
        {p.debrief.length > 0 && (
          <div className="rp-debrief">
            {p.debrief.map((d) => (
              <p key={d.id}>
                <Figures text={d.text} />
              </p>
            ))}
          </div>
        )}
        {p.origin && (
          <p className="rp-origin">
            <OffGrid />
            <span>{p.origin.text}</span>
          </p>
        )}
        {p.desks && <DeskBranch desks={p.desks} label={desksLabel} />}
      </div>
    </article>
  )
}

/* The off-grid link glyph from the map: a dotted line leaving north, lit at the head. */
function OffGrid() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
      <path d="M6 15V4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2.5" />
      <path d="M2 5.5 6 1.5l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
