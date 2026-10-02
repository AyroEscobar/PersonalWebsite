import { WORK } from '../content/work.js'

/*
  Status word chip (PLAN.md 2.1, 4.8). The word always carries the state;
  color never does it alone.
    <StatusChip status="active" />    LED
    <StatusChip status="complete" />  sodium
    <StatusChip status="active" live />  adds the beacon dot (the only use of --beacon)
*/
const STATE = { active: 'state-now', complete: 'state-past' }

export default function StatusChip({ status, live = false, className = '' }) {
  const word = WORK.statusWords[status]?.text ?? status
  return (
    <span className={`chip ${live ? 'state-live' : STATE[status] ?? ''} ${className}`.trim()}>
      {live && <span aria-hidden="true" className="beacon inline-block h-1.5 w-1.5 rounded-full bg-beacon" />}
      {word}
    </span>
  )
}
