import Section from '../ui/Section.jsx'
import { STACK } from '../content/stack.js'

/* III · Stack: one paragraph, the same words for every reader. */
export default function Stack() {
  return (
    <Section id="stack" className="sec--stack">
      <p className="stack-p turn">{STACK.sentence.text}</p>
    </Section>
  )
}
