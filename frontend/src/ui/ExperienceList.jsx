import { EXPERIENCE } from '../content/work.js'

/*
  <ExperienceList> (DESIGN.md 5.6): a <ul> inside the experience panel; each <li> is one line
  from COPY.md 3.4: the org in 17/650 wdth 106 ink on its own line, then the details in 15.5
  ink-2 with middle dots, then the receipt line. Hairline --rule between items. No states beyond
  rest; the strong org name is the only emphasis.
*/
export default function ExperienceList({ lines = EXPERIENCE }) {
  return (
    <ul className="exp">
      {lines.map((l) => (
        <li key={l.id} data-id={l.id}>
          <span className="exp-top">
            <strong>{l.org}</strong>
            <span className="sr-only"> · </span>
            {l.details}
          </span>
          {l.note && <span className="exp-note">{l.note}</span>}
        </li>
      ))}
    </ul>
  )
}
