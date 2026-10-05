import { HERO } from '../content/identity.js'
import QuietSwitch from './QuietSwitch.jsx'

/*
  The masthead (DESIGN.md 5.2, 6.1): base, not glass. The name in Inter 600
  22 (the page's <h1> on home), the role line under it, the quiet switch on
  the right on every viewport.
*/
export default function Masthead({ as: As = 'p', className = '', href = '/', quiet = true }) {
  return (
    <header className={`masthead ${className}`.trim()}>
      <div className="mh-id">
        <As className="mh-name">
          <a href={href}>{HERO.name.text}</a>
        </As>
        <p className="mh-role">{HERO.eyebrow.text}</p>
      </div>
      {quiet && <QuietSwitch />}
    </header>
  )
}
