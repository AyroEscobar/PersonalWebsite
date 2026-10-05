import { STACK, WORK } from '../content/work.js'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import WorkPlate from '../ui/WorkPlate.jsx'
import Stack from '../ui/Stack.jsx'

/* work (DESIGN.md 6.5): the head in the rail; four plates by start date, newest first, then the stack. */
const byStart = [...WORK.plates].sort((a, b) => b.start.localeCompare(a.start))

export default function Work() {
  return (
    <Section id="work" field="work" rail>
      <SectionHead id="work" line={WORK.intro.text} rail />
      <div className="sec-body">
        <div className="plates">
          {byStart.map((p) => (
            <WorkPlate key={p.id} plate={p} />
          ))}
        </div>
        <h3 className="sub-head voice">{STACK.heading.text}</h3>
        <Stack />
      </div>
    </Section>
  )
}
