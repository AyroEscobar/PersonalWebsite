import { HERO, ORIGIN } from '../content/identity.js'
import { headingId, sectionById } from '../content/sections.js'
import Field from '../field/Field.jsx'
import Masthead from '../ui/Masthead.jsx'
import ReadingSentence from '../ui/ReadingSentence.jsx'
import ProfileCard from '../ui/ProfileCard.jsx'
import Button from '../ui/Button.jsx'
import { ArrowDown, Mail } from '../ui/icons.jsx'

/*
  origin (DESIGN.md 6.1 to 6.3). The hero: the masthead (name, role, place,
  the quiet switch), his whole-map sentence with the lens on line 2, the
  lede, the proof line, two pills and the caption. So a reader can name him,
  his role, his city and one receipt without scrolling. Then the body: his
  two pull paragraphs in the italic serif beside the origin card, and the
  closer.

  The display is the first sentence of ORIGIN.pull, the caption the second;
  the third is not rendered here. Line breaks are hand-set (five lines from
  820px, six on phones); the words are never changed.
*/
const D_BREAKS = [6, 11, 16, 21] // I am trying to build a life / where my family never has / to worry about money, and / ship a few things that / outlast me along the way.
const M_BREAKS = [4, 9, 13, 17, 21] // I am trying to build / a life where my family / never has to worry / about money, and ship / a few things that / outlast me along the way.

function pullParts(text) {
  const end = text.indexOf('along the way.') + 'along the way.'.length
  const rest = text.slice(end + 1)
  return { first: text.slice(0, end), caption: rest.slice(0, rest.indexOf('.') + 1) }
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
  const { first, caption } = pullParts(ORIGIN.pull.text)
  const email = HERO.contact.find((c) => c.id === 'hero-contact-email')
  const work = HERO.contact.find((c) => c.id === 'hero-contact-work')
  return (
    <section id="origin" aria-labelledby={headingId('origin')} className="hero">
      <div className="hero-stage">
        <Field preset="hero" />
        <div className="page on-field hero-inner">
          <Masthead as="h1" href="#origin" />
          <div className="hero-col">
            <ReadingSentence id="sentence" className="hero-sentence" text={first} d={D_BREAKS} m={M_BREAKS} />
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
        </div>
      </div>

      <div className="origin-rest">
        <Field preset="origin" />
        <div className="page on-field origin-body">
          <h2 id={headingId('origin')} className="sr-only">
            {sectionById('origin').label.text}
          </h2>
          <div className="origin-voice">
            <p className="voice">{HERO.lead.text}</p>
            <p className="voice">{ORIGIN.level.text}</p>
            <p className="origin-closer voice">{ORIGIN.closer.text}</p>
          </div>
          <ProfileCard className="origin-card" />
        </div>
      </div>
    </section>
  )
}
