import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Frieze, { Room } from '../hero/Frieze.jsx'
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
  The hero: the shoulder frieze. The plate (slip on the clay, a 1 px ink rule, square, no shadow) says
  who he is, in order: his name as the page's one h1 (AYRO· / ESCOBAR in Cinzel; the DOM text is
  exactly "Ayro Escobar"), the intro (his age and his school), three role lines between hairlines, "A
  few things I've built" with three results, the coffee chat and email buttons, then LinkedIn · GitHub.
  The room holds the man and the boulder on the ground line to the right of it.

  Under 960 px the frieze is the top of the page and the plate runs full width under it, no border; the
  results move after the buttons by CSS order (the DOM order stays, QA reads it), so the first screen
  keeps the man, the boulder (on a phone it may run off the right edge), who he is and both buttons. The theme line sits once, 14 px, on the
  clay: lower left at 1440, lower right inside the frieze on a phone.
*/
export default function Hero() {
  const [first, ...rest] = HERO.name.text.split(' ')
  return (
    <Frieze band="hero" as="section" id="top" aria-labelledby="name" className="hero">
      <div className="hero-inner">
        <div className="plate hero-plate">
          <h1 id="name" className="name">
            <span className="name-a">{first}</span> <span>{rest.join(' ')}</span>
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
          <div className="acts">
            <Button variant="fill" href={HERO.coffee.href} rel="noopener">
              {HERO.coffee.label}
            </Button>
            <Button variant="line" href={HERO.email.href}>
              {HERO.email.label}
            </Button>
          </div>
          <p className="links">
            {HERO.links.map((l, i) => (
              <span key={l.id}>
                {i > 0 && (
                  <span className="ip" aria-hidden="true">
                    ·
                  </span>
                )}
                <a href={l.href} rel="me noopener">
                  {l.label}
                </a>
              </span>
            ))}
          </p>
        </div>
        <Room alt={HERO.sceneAlt.text} priority />
      </div>
      <p className="theme-line">{HERO.theme.text}</p>
    </Frieze>
  )
}
