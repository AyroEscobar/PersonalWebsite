import './chrome.css'
import { NOT_FOUND, CHROME } from '../content/meta.js'
import { SKIP } from '../content/identity.js'
import { SECTIONS } from '../content/sections.js'
import Announcer from '../ui/Announcer.jsx'
import ClientOnly from '../ui/ClientOnly.jsx'
import GridPoster from '../grid/GridPoster.jsx'
import JumpHost from './JumpHost.jsx'
import SearchChip from './SearchChip.jsx'

/*
  NotFound (PLAN.md 3.10). Owned by B. Prerendered to dist/404.html and
  served with a real 404 for any unknown path.

  The grid goes dark. Behind the words, A's poster of the Dallas roads
  (its standalone 404 copy, framed on Plano) with every road unlit and every
  city gone except Plano, the one light left. Along the bottom, the site's
  line of stops: the last of the signal fades out of the left edge, the line
  breaks, and every stop past the break is unlit. The stops are real links
  back into the page, and each one relights under the pointer or focus. On
  phones the map sits above the words and the line turns vertical.

  The path that was asked for is shown as data (client only, never part of
  the prerender). Search opens the same JumpList as the home page, with
  every result pointing back at "/#stop".
*/
function Path() {
  const p = window.location.pathname
  return p && p !== '/404' ? <span>{decodeURIComponentSafe(p)}</span> : null
}

function decodeURIComponentSafe(s) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <main id="main" tabIndex={-1} className="nf">
        <div className="nf-sky" aria-hidden="true" />
        <div className="nf-map" aria-hidden="true">
          <GridPoster variant="404" frame="signal" className="nf-poster" />
        </div>
        <div className="nf-copy">
          <p className="nf-path mono" aria-hidden="true">
            <ClientOnly>
              <Path />
            </ClientOnly>
          </p>
          <h1 className="nf-h1 t-display lower">{NOT_FOUND.heading.text}</h1>
          <p className="nf-line t-lead">{NOT_FOUND.line.text}</p>
          <p className="nf-actions">
            <a href="/" className="nf-home">
              <span className="nf-home-node" aria-hidden="true" />
              {NOT_FOUND.home.text}
            </a>
            <SearchChip className="nf-search js-only" />
          </p>
        </div>

        <nav aria-label={CHROME.sectionsNav.text} className="nf-route">
          <span className="nf-lit" aria-hidden="true" />
          <span className="nf-break" aria-hidden="true" />
          <ol className="nf-stops">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`/#${s.id}`} className="nf-stop">
                  <span className="nf-station" aria-hidden="true" />
                  <span className="nf-label">{s.label.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </main>
      <JumpHost base="/" />
      <Announcer />
    </>
  )
}
