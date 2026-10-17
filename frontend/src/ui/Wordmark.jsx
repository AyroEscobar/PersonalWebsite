import { HERO } from '../content/identity.js'

/*
  <Wordmark>: AYRO·ESCOBAR in Cinzel 15/500, tracking 0.08em, top left, a link to #top (home on a page
  with no #top). The DOM text is exactly "Ayro Escobar": the capitals are text-transform and the
  interpunct is generated content with empty alternative text, so a screen reader hears his name.
*/
export default function Wordmark({ className = '', href = '#top' }) {
  const [first, ...rest] = HERO.name.text.split(' ')
  return (
    <a className={`wordmark ${className}`.trim()} href={href}>
      <span className="wm-a">{first}</span>
      <span className="sr-only"> </span>
      <span>{rest.join(' ')}</span>
    </a>
  )
}
