import Glass from '../glass/Glass.jsx'
import Chip from './Chip.jsx'
import Receipt from './Receipt.jsx'
import { ChevronDown } from './icons.jsx'
import { WORK } from '../content/work.js'
import { MonthSpan } from './text.jsx'

/*
  A timeline plate (DESIGN.md 5.7): one role as a glass sheet. Org, status
  chip, role, place and dates (tabular), the debrief lines (his own sentence
  in italic serif, everything else upright), RBC's origin line in italic,
  and RBC's six desks folded in a <details> whose summary looks like a
  ghost button. Each desk shows its receipt where facts.json holds one.
  `open` opens the desks (the kit).
*/
export default function WorkPlate({ plate, open = false }) {
  return (
    <Glass as="article" tier="sheet" className="plate" id={plate.id}>
      <header className="plate-head">
        <h3 className="plate-org">{plate.org}</h3>
        <Chip status={plate.state === 'now' ? 'now' : 'past'} />
      </header>
      <p className="plate-role">{plate.role}</p>
      <p className="plate-meta">
        {plate.place}, <MonthSpan start={plate.start} end={plate.end} text={plate.dates} />
      </p>
      {plate.debrief.map((d) => (
        <p key={d.id} className={d.verbatim ? 'plate-voice' : 'plate-text'}>
          {d.text}
        </p>
      ))}
      {plate.origin && <p className="plate-voice">{plate.origin.text}</p>}
      {plate.receipt && !plate.desks && <Receipt value={plate.receipt.value} label={plate.receipt.label} facts={plate.facts} />}
      {plate.desks && (
        <details className="desks" open={open || undefined}>
          <summary className="btn btn--ghost btn--trailing">
            <span className="btn-label">
              <span className="idle">{WORK.desksLabel.text}</span>
            </span>
            <ChevronDown />
          </summary>
          <ul className="desk-list">
            {plate.desks.map((d) => (
              <li key={d.id} className="desk">
                <span className="desk-name">{d.name}</span>
                <span className="desk-text">{d.text}</span>
                {d.receipt && <Receipt value={d.receipt.value} label={d.receipt.label} facts={d.facts} />}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Glass>
  )
}
