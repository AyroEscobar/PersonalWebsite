import { WORK } from '../content/work.js'

/*
  Status as a lamp and its word (PLAN.md 2.1, 4.8; r1 T9): no box. The word
  always carries the state; the light only repeats it.
    <StatusLamp status="active" />    LED
    <StatusLamp status="complete" />  sodium
  The site's one blinking light is the beacon over Plano on the map, so a
  status never blinks.
*/
const STATE = { active: 'state-now', complete: 'state-past' }

export default function StatusLamp({ status, className = '' }) {
  const word = WORK.statusWords[status]?.text ?? status
  return <span className={`lamp-word ${STATE[status] ?? ''} ${className}`.trim()}>{word}</span>
}
