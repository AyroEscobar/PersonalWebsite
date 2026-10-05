import Glass from '../glass/Glass.jsx'
import Chip from './Chip.jsx'
import { NOW } from '../content/now.js'
import { BUILD_DATE } from '../lib/build.js'
import { isStale, monthShort } from '../lib/format.js'

/*
  The now list (DESIGN.md 5.6): one glass sheet, a single column of rows
  (from prototype c). Each row: a status chip, the org in Inter 600 16, the
  role in Inter 14, dates in tabular Inter 13 on the right. The sheet ends
  with "updated <Mon YYYY>", or "last updated" once NOW.updated is more than
  45 days older than the build. Static; no live region.
*/
export default function NowList({ lines = NOW.lines }) {
  const stale = isStale(NOW.updated, BUILD_DATE)
  return (
    <Glass tier="sheet" className="now-sheet">
      <ul className="now-rows">
        {lines.map((l) => (
          <li key={l.id} className="now-row">
            <Chip status={l.state === 'now' ? 'now' : 'past'} />
            <span className="now-org">{l.org}</span>
            <span className="now-role">{l.role}</span>
            {l.dates && <span className="now-when">{l.dates}</span>}
            {l.note && <span className="now-note">{l.note}</span>}
          </li>
        ))}
      </ul>
      <p className="now-updated">
        {stale ? NOW.stalePrefix.text : NOW.freshPrefix.text} <time dateTime={NOW.updated}>{monthShort(NOW.updated)}</time>
      </p>
    </Glass>
  )
}
