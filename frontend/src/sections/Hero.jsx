import Section from '../ui/Section.jsx'
import Panel from '../ui/Panel.jsx'
import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import { ArrowOut } from '../ui/icons.jsx'
import { HERO } from '../content/identity.js'

/** A result line with its figure set strong (the figure is a substring of the line). */
function Built({ text, strong }) {
  const i = strong ? text.indexOf(strong) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <strong>{strong}</strong>
      {text.slice(i + strong.length)}
    </>
  )
}

/*
  The hero: a 560 px plate (bottom left on phones) with who he is, in order: his name as the
  page's one h1, the intro (his age and his school), three short role lines, "A few things I've
  built" with three results, the coffee chat and email buttons, then LinkedIn and GitHub. On a
  phone the results follow the buttons, below the fold, so the first screen keeps the man, the
  whole rock, who he is and both buttons. The theme line sits once, 11 px, lower-left, never a
  heading.
*/
export default function Hero() {
  return (
    <Section id="top" labelledBy="name" className="sec--hero">
      {/* the first paint: never hidden behind a reveal that waits for JS (it is the LCP element) */}
      <Panel variant="hero" reveal={false}>
        <h1 id="name" className="name">
          {HERO.name.text}
        </h1>
        <p className="intro">{HERO.intro.text}</p>
        <ul className="roles">
          {HERO.roles.map((r) => (
            <li key={r.id}>{r.text}</li>
          ))}
        </ul>
        <div className="built">
          <Eyebrow id="built" className="built-label">
            {HERO.built.label.text}
          </Eyebrow>
          <ul className="built-list" aria-labelledby="built">
            {HERO.built.items.map((b) => (
              <li key={b.id}>
                <Built text={b.text} strong={b.strong} />
              </li>
            ))}
          </ul>
        </div>
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
