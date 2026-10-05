import { HERO } from '../content/identity.js'

/*
  <Wordmark> (DESIGN.md 5.8): "Ayro Escobar" top-left, plain text 17/650 wdth 110 ink with a
  soft void text-shadow, a link to #top, hidden with a 200 ms fade once the hero has scrolled by
  (html.scrolled). No mark, no logo.
*/
export default function Wordmark({ className = '' }) {
  return (
    <a className={`wordmark ${className}`.trim()} href="#top">
      {HERO.name.text}
    </a>
  )
}
