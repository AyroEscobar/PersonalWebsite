import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import { ArrowOut } from '../ui/icons.jsx'
import { HERO } from '../content/identity.js'

/*
  The hero: a 540 px plate (bottom left on phones) with who he is, in order: the eyebrow (a CS
  student at UT Dallas), his name as the page's one h1, three role lines, the one line (desktop
  only), the coffee chat and email buttons, then LinkedIn and GitHub. The theme line sits once,
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
        <ul className="roles">
          {HERO.roles.map((r) => (
            <li key={r.id}>{r.text}</li>
          ))}
        </ul>
        <p className="oneline oneline--desk">{HERO.line.text}</p>
        <div className="actions">
          <Button variant="primary" href={HERO.coffee.href} rel="noopener">
            {HERO.coffee.label}
          </Button>
          <Button variant="glass" href={HERO.email.href}>
            {HERO.email.label}
          </Button>
        </div>
        <p className="hero-links">
          {HERO.links.map((l, i) => (
            <span key={l.id} className="hero-link">
              {i > 0 && (
                <span className="hero-dot" aria-hidden="true">
                  ·
                </span>
              )}
              <a href={l.href} rel="me noopener">
                {l.label}
                <ArrowOut />
              </a>
            </span>
          ))}
        </p>
      </Panel>
      <p className="theme-line">{HERO.theme.text}</p>
    </Section>
  )
}
