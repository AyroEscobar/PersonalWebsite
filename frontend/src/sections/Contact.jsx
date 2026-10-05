import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import CopyEmail from '../ui/CopyEmail.jsx'
import LinkRow from '../ui/LinkRow.jsx'
import { SIGNAL } from '../content/signal.js'
import { headingId, sectionById } from '../content/sections.js'

/*
  Contact (DESIGN.md 6.7): the wide. A 240vh section whose 520 px panel sticks bottom-left while
  the scene pulls out behind it; the paragraph, the email row, "elsewhere", and the closer once.
*/
export default function Contact() {
  const s = sectionById('contact')
  return (
    <Section id="contact" className="sec--contact">
      <Panel variant="contact">
        <h2 id={headingId('contact')} className="sec-title">
          {s.label.text}
        </h2>
        <p className="contact-p">{SIGNAL.paragraph.text}</p>
        <CopyEmail />
        <LinkRow />
        <p className="closer">{SIGNAL.closer.text}</p>
      </Panel>
    </Section>
  )
}
