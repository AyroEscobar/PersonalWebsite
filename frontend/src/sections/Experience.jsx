import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import ExperienceList from '../ui/ExperienceList.jsx'
import { headingId, sectionById } from '../content/sections.js'

/* Experience (DESIGN.md 6.5): one 600 px panel with the six lines. */
export default function Experience() {
  const s = sectionById('experience')
  return (
    <Section id="experience" className="sec--exp">
      <Panel variant="exp">
        <h2 id={headingId('experience')} className="sec-title">
          {s.label.text}
        </h2>
        <ExperienceList />
      </Panel>
    </Section>
  )
}
