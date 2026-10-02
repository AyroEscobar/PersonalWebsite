import { Section } from '../ui/Section.jsx'
import { WORK } from '../content/work.js'
import StopHead from './StopHead.jsx'
import ReleasePlate from './ReleasePlate.jsx'
import StackPlate from './StackPlate.jsx'

/*
  work (PLAN.md 3.5): release plates on one spine, newest first, the RBC
  plate branching into its six desks, then the stack plate.
*/
export default function Work({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id}>
            <p className="mono c-intro">{WORK.intro.text}</p>
          </StopHead>
          <ol reversed className="releases">
            {WORK.plates.map((p) => (
              <li key={p.id} className={`release state-${p.state}`}>
                <ReleasePlate plate={p} desksLabel={WORK.desksLabel.text} />
              </li>
            ))}
          </ol>
          <StackPlate />
        </div>
      </div>
    </Section>
  )
}
