import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import { STACK } from '../content/stack.js'
import { headingId, sectionById } from '../content/sections.js'

/* Stack: one 620 px plate and one paragraph, the same words for every reader. */
export default function Stack() {
  const s = sectionById('stack')
  return (
    <Section id="stack" className="sec--stack">
      <Panel variant="stack">
        <h2 id={headingId('stack')} className="sec-title">
          {s.label.text}
        </h2>
        <p className="stack-p">{STACK.sentence.text}</p>
      </Panel>
    </Section>
  )
}
