import { SIGNAL } from '../content/signal.js'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import ContactCard from '../ui/ContactCard.jsx'

/* signal (DESIGN.md 6.8): the head in the rail, the wide contact card, then "Onto what's next." exactly once. */
export default function Signal() {
  return (
    <Section id="signal" field="signal" rail>
      <SectionHead id="signal" rail />
      <div className="sec-body">
        <ContactCard wide />
        <p className="signal-closer voice">{SIGNAL.closer.text}</p>
      </div>
    </Section>
  )
}
