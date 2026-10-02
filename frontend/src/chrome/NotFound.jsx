import { NOT_FOUND } from '../content/meta.js'
import { SKIP } from '../content/identity.js'
import Announcer from '../ui/Announcer.jsx'

/*
  PLACEHOLDER by FOUNDATION. Owned by B (PLAN.md 3.10). Replace this file.

  Contract: default export NotFound, no props. Prerendered to dist/404.html,
  served with HTTP 404 for any unknown path. Needs an h1, a link home and a
  <main> landmark (axe runs on it).
*/
export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <main id="main" tabIndex={-1} className="page grid min-h-svh place-items-center outline-none">
        <div className="text-center">
          <h1 className="t-h2 lower">{NOT_FOUND.heading.text}</h1>
          <p className="mono mt-4 text-dim">{NOT_FOUND.line.text}</p>
          <p className="mt-8">
            <a href="/">{NOT_FOUND.home.text}</a>
          </p>
        </div>
      </main>
      <Announcer />
    </>
  )
}
