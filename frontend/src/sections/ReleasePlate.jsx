import StatusLamp from '../ui/StatusChip.jsx'
import DeskBranch from './DeskBranch.jsx'
import { Figures, MonthSpan } from './text.jsx'

/*
  ReleasePlate (PLAN.md 4.8): one role, dated like a release. The dates sit
  on their own line beside the station dot, above the plate, so they read
  first and line up down the spine. That visual copy is aria-hidden and the
  same dates are read inside the plate, right after the heading, so heading
  navigation never skips them.

  The station dot and the plate's rule take the role's light: LED while
  active, sodium once complete (from the state class on the list item). The
  status is a lamp and its word, never a box (r1 T9).

  A role with nothing public to say beyond its title (JPMorgan, for now:
  questions.md #42) is a compact one-line row, org, role, place, dates and
  lamp, so the gap reads as deliberate, not as an empty plate (r1 T18). One
  public sentence in content/work.js makes it a full plate again.

  The article carries the plate id (plate-md7 ...) so B's JumpList can land
  on it.
*/
export default function ReleasePlate({ plate: p, desksLabel }) {
  const h = `${p.id}-h`
  const when = <MonthSpan start={p.start} end={p.end} text={p.dates} />
  const compact = !p.debrief.length && !p.desks && !p.origin

  if (compact) {
    return (
      <article id={p.id} aria-labelledby={h} className="rp rp--row">
        <p className="rp-when mono" aria-hidden="true">
          {p.dates}
        </p>
        <span className="rp-dot" aria-hidden="true" />
        <div className="rp-line rule-l is-lit">
          <h3 id={h} className="rp-org">
            {p.org}
          </h3>
          <p className="sr-only">{when}</p>
          <p className="rp-role">{p.role}</p>
          <p className="rp-where mono">{p.place}</p>
          <StatusLamp status={p.status} />
        </div>
      </article>
    )
  }

  return (
    <article id={p.id} aria-labelledby={h} className="rp">
      <p className="rp-when mono" aria-hidden="true">
        {p.dates}
      </p>
      <span className="rp-dot" aria-hidden="true" />
      <div className="rp-card plate rule-l is-lit">
        <div className="rp-head">
          <h3 id={h} className="rp-org">
            {p.org}
          </h3>
          <StatusLamp status={p.status} />
        </div>
        <p className="sr-only">{when}</p>
        <p className="rp-role">{p.role}</p>
        <p className="rp-where mono">{p.place}</p>
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
            <ExitArrow />
            <span>{p.origin.text}</span>
          </p>
        )}
        {p.desks && <DeskBranch desks={p.desks} label={desksLabel} />}
      </div>
    </article>
  )
}

/* The map's exit arrow, at Waterloo's bearing from Richardson: where the door opened (r1 M10). */
function ExitArrow() {
  return (
    <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">
      <path d="M-6 0H5M1 -4L5 0L1 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-44.3)" />
    </svg>
  )
}
