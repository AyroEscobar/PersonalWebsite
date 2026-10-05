import { HERO, ORIGIN } from '../content/identity.js'
import { headingId } from '../content/sections.js'
import Field from '../field/Field.jsx'
import Masthead from '../ui/Masthead.jsx'
import LensLine from '../ui/LensLine.jsx'
import Button from '../ui/Button.jsx'
import { ArrowDown, Mail } from '../ui/icons.jsx'

/*
  origin (DESIGN.md 6.1 to 6.3), interim composition from the kit: the
  masthead, his whole-map sentence with the lens resting on line 2, the
  lede and the proof line, two pills, the caption; then the origin body.
  The reading lens that moves line by line and morphs into the nav is the
  page stage's nav.js.

  The display is the first sentence of ORIGIN.pull, the caption the second;
  the third is not rendered here. Line breaks are hand-set at 1440 (five
  lines); the words are never changed.
*/
const LINE_WORDS = [7, 5, 5, 5] // the first four lines; the rest is line five

function pullParts(text) {
  const end = text.indexOf('along the way.') + 'along the way.'.length
  const first = text.slice(0, end)
  const rest = text.slice(end + 1)
  const caption = rest.slice(0, rest.indexOf('.') + 1)
  const words = first.split(' ')
  const lines = []
  let at = 0
  for (const n of LINE_WORDS) {
    lines.push(words.slice(at, at + n).join(' '))
    at += n
  }
  lines.push(words.slice(at).join(' '))
  return { lines, caption }
}

/** The deck with its one link (Viaere, to its build card). Same characters, same order. */
function Deck() {
  const { text, link } = HERO.deck
  const i = text.indexOf(link.phrase)
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <a href={link.href}>{link.phrase}</a>
      {text.slice(i + link.phrase.length)}
    </>
  )
}

export default function Origin() {
  const { lines, caption } = pullParts(ORIGIN.pull.text)
  const email = HERO.contact.find((c) => c.id === 'hero-contact-email')
  const work = HERO.contact.find((c) => c.id === 'hero-contact-work')
  return (
    <section id="origin" aria-labelledby={headingId('origin')} className="hero">
      <Field preset="hero" grid />
      <div className="page on-field hero-inner">
        <Masthead as="h1" href="#origin" />
        <p className="sentence hero-sentence">
          {lines.map((l, i) => (
            <span key={i}>
              {i > 0 && ' '}
              {i === 1 ? <LensLine>{l}</LensLine> : l}
              {i < lines.length - 1 && <br className="d" />}
            </span>
          ))}
        </p>
        <div className="hero-copy">
          <p className="hero-lede">
            <Deck />
          </p>
          <p className="hero-proof">{HERO.proof.text}</p>
          <div className="hero-cta">
            <div className="btn-group">
              <Button variant="primary" href={email.href} icon={Mail}>
                {email.label}
              </Button>
              <Button variant="glass" href={work.href} icon={ArrowDown}>
                {work.label}
              </Button>
            </div>
            <p className="hero-caption voice">{caption}</p>
          </div>
        </div>
      </div>

      <div className="page on-field origin-body">
        <h2 id={headingId('origin')} className="sr-only">
          origin
        </h2>
        <div className="origin-voice">
          <p className="voice">{ORIGIN.level.text}</p>
          <p className="voice">{HERO.lead.text}</p>
        </div>
        <div className="origin-side">
          <p className="origin-paragraph">{ORIGIN.paragraph.text}</p>
          <p className="origin-off">{ORIGIN.offHours.text}</p>
        </div>
        <p className="origin-closer voice">{ORIGIN.closer.text}</p>
      </div>
    </section>
  )
}
