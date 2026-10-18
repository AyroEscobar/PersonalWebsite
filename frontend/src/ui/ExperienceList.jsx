import { EXPERIENCE } from '../content/work.js'

/*
  <ExperienceList>: a hairline list, newest first. Each line: the org (EB Garamond 19/500), then the
  details with middle dots and the receipt in italic --ink-2, and from 960 px up the dates in their own
  right-aligned column in the label face (14 px, --ink-2). Under 960 the dates fold back onto the
  details line ("details · dates."), which is also what print shows.
*/
export default function ExperienceList({ lines = EXPERIENCE }) {
  return (
    <ul className="lines">
      {lines.map((l) => (
        <li key={l.id} id={l.id} data-id={l.id} className="turn">
          <p className="org">
            {l.org}
            <span className="sr-only"> · </span>
          </p>
          <div className="line-body">
            <p className="det">
              {l.details}
              {l.dates ? (
                <span className="det-date">
                  {' · '}
                  {l.dates}
                </span>
              ) : null}
              <span className="det-end">.</span>
            </p>
            {l.note && <p className="note">{l.note}</p>}
          </div>
          {l.dates ? (
            <p className="xp-date" aria-hidden="true">
              {l.dates}
            </p>
          ) : (
            <span className="xp-date" aria-hidden="true" />
          )}
        </li>
      ))}
    </ul>
  )
}
