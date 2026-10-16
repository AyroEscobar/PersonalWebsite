import { HERO } from '../content/identity.js'

/*
  <Wordmark>: "Ayro Escobar" top-left, plain text 17/650 wdth 110 ink with a soft void
  text-shadow, a link to #top, always visible (after the hero it sits on the header's solid bar).
  No mark, no logo. On a page with no #top (the 404) it links home.
*/
export default function Wordmark({ className = '', href = '#top' }) {
  return (
    <a className={`wordmark ${className}`.trim()} href={href}>
      {HERO.name.text}
    </a>
  )
}
