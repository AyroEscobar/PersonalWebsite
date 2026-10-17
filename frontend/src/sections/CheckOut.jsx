import Section from '../ui/Section.jsx'
import ProjectCard from '../ui/ProjectCard.jsx'
import { PROJECTS } from '../content/projects.js'

/* I · Work (the section id stays #check-out): the two work plates, Esvo first, two columns from 960 px. */
export default function CheckOut() {
  return (
    <Section id="check-out" className="sec--work">
      <div className="cards">
        {PROJECTS.map((c) => (
          <ProjectCard key={c.id} card={c} />
        ))}
      </div>
    </Section>
  )
}
