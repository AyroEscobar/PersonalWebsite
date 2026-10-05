import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import { HERO } from '../content/identity.js'

/*
  The hero (DESIGN.md 6.2, 6.3; COPY.md 3.2): the 520 px panel with the scene visible through
  its upper third, the name as the page's one h1, two calls to action, and the theme line once,
  11 px, lower-left, never a heading.
*/
export default function Hero() {
  return (
    <Section id="top" labelledBy="name" className="sec--hero">
      {/* the first paint: never hidden behind a reveal that waits for JS (it is the LCP element) */}
      <Panel variant="hero" reveal={false}>
        <Eyebrow>{HERO.eyebrow.text}</Eyebrow>
        <h1 id="name" className="name">
          {HERO.name.text}
        </h1>
        <p className="role">{HERO.role.text}</p>
        <p className="oneline">{HERO.line.text}</p>
        <div className="actions">
          <Button variant="primary" href={HERO.email.href}>
            {HERO.email.label}
          </Button>
          <Button variant="glass" icon="down" href={HERO.work.href}>
            {HERO.work.text}
          </Button>
        </div>
      </Panel>
      <p className="theme-line">{HERO.theme.text}</p>
    </Section>
  )
}
