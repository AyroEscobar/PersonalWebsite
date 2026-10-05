import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import Chip from '../ui/Chip.jsx'
import { STACK } from '../content/stack.js'
import { headingId, sectionById } from '../content/sections.js'

/*
  Stack (DESIGN.md 6.6): one 660 px panel, the chip rows, and the one sr-only sentence for
  screen readers (the chips are aria-hidden).
*/
export default function Stack() {
  const s = sectionById('stack')
  return (
    <Section id="stack" className="sec--stack">
      <Panel variant="stack">
        <h2 id={headingId('stack')} className="sec-title">
          {s.label.text}
        </h2>
        <p className="sr-only">{STACK.sentence.text}</p>
        <div className="chips" aria-hidden="true">
          {STACK.rows.map((row) => (
            <ul key={row.id} className="chip-row">
              {row.chips.map((c) => (
                <li key={c}>
                  <Chip>{c}</Chip>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </Panel>
    </Section>
  )
}
