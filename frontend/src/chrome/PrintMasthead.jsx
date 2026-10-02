import { HERO } from '../content/identity.js'
import { EMAIL, GITHUB, HOST, LINKEDIN } from '../content/constants.js'

/*
  The top of the printed page (PLAN.md 4.13). Never shown on screen and
  hidden from assistive tech (the h1 and the signal section already say all
  of it). On paper it replaces the hero: name, the deck line, and every way
  to reach him written out in full, because paper has no links.
*/
const bare = (href) => href.replace(/^https?:\/\/(www\.)?/, '')

export default function PrintMasthead() {
  return (
    <div className="print-only print-masthead" aria-hidden="true">
      <p className="pm-name">{HERO.name.text}</p>
      <p className="pm-deck">{HERO.deck.text}</p>
      <p className="pm-contact">
        <span>{EMAIL}</span>
        <span>{HOST}</span>
        <span>{bare(GITHUB)}</span>
        <span>{bare(LINKEDIN)}</span>
      </p>
    </div>
  )
}
