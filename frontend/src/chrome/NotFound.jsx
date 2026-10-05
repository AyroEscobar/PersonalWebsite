import { NOT_FOUND } from '../content/meta.js'
import { ORIGIN, SKIP } from '../content/identity.js'
import Field from '../field/Field.jsx'
import Masthead from '../ui/Masthead.jsx'
import LensLine from '../ui/LensLine.jsx'
import Button from '../ui/Button.jsx'

/*
  NotFound (DESIGN.md 6.9). Prerendered to dist/404.html and served with a
  real 404 for any unknown path. The last line of his sentence with the lens
  resting on it, then "nothing here." and the way home. The line is the same
  characters as in ORIGIN.pull.
*/
const LAST = 'outlast me along the way.'

export default function NotFound() {
  const line = ORIGIN.pull.text.includes(LAST) ? LAST : null
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <main id="main" tabIndex={-1} className="hero nf">
        <Field preset="hero" grid />
        <div className="page on-field nf-inner">
          <Masthead />
          {line && (
            <p className="sentence nf-line" aria-hidden="true">
              <LensLine>{line}</LensLine>
            </p>
          )}
          <h1 className="nf-h1">{NOT_FOUND.line.text}</h1>
          <p className="nf-actions">
            <Button variant="primary" href="/">
              {NOT_FOUND.home.text}
            </Button>
          </p>
        </div>
      </main>
    </>
  )
}
