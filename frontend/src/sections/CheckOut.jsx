import Section from '../ui/Section.jsx'
import ProjectCard from '../ui/ProjectCard.jsx'
import { PROJECTS } from '../content/projects.js'
import { headingId, sectionById } from '../content/sections.js'

/*
  Check out (DESIGN.md 6.4): the title, then the two cards stacked at the left, 480 px, 24 px gap,
  vertically centred in a 140vh section; the camera rides higher so the rock fills the right.
*/
export default function CheckOut() {
  const s = sectionById('check-out')
  return (
    <Section id="check-out" className="sec--work">
      <h2 id={headingId('check-out')} className="sec-title sec-title--bare reveal">
        {s.label.text}
      </h2>
      <div className="cards">
        {PROJECTS.map((c) => (
          <ProjectCard key={c.id} card={c} />
        ))}
      </div>
    </Section>
  )
}
