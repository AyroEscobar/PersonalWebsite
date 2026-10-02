import { useEffect } from 'react'
import { FOOTER } from '../content/meta.js'
import { MAP } from '../content/places.js'
import { HOST, REPO } from '../content/constants.js'
import BuildStamp from './BuildStamp.jsx'
import VisitStamp from './VisitStamp.jsx'
import QuietToggle from './QuietToggle.jsx'
import NodeMark from './NodeMark.jsx'

/*
  Footer (PLAN.md 3.9, 4.14). Owned by B. The end of the line: who and
  where, two real numbers (the build, and what this visit cost your device),
  where the road data comes from, the no-tracking promise, and the three
  controls that change how the page behaves (quiet mode, print, source).

  Printing: every folded <details> in the work section (the RBC desks on a
  phone) opens before the print dialog appears and folds again after, so
  the desks are on paper. Specimen text equivalents stay folded.
*/
function usePrintOpensDetails() {
  useEffect(() => {
    let opened = []
    const before = () => {
      opened = [...document.querySelectorAll('#work details:not([open])')]
      opened.forEach((d) => d.setAttribute('open', ''))
    }
    const after = () => {
      opened.forEach((d) => d.removeAttribute('open'))
      opened = []
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])
}

export default function Footer() {
  usePrintOpensDetails()
  return (
    <footer className="footer" data-chrome="footer">
      <div className="ft-inner">
        <div className="ft-id">
          <p className="ft-name">
            <NodeMark className="ft-node" />
            <span>{FOOTER.line.text}</span>
          </p>
          <p className="ft-promise mono">{FOOTER.noTracking.text}</p>
        </div>
        <div className="ft-data mono">
          <BuildStamp />
          <VisitStamp />
          <p className="ft-attrib">{MAP.attribution.text}</p>
        </div>
        <ul className="ft-controls mono">
          <li className="js-only">
            <QuietToggle variant="link" />
          </li>
          <li className="js-only">
            <button type="button" className="ft-link" onClick={() => window.print()}>
              {FOOTER.print.text}
            </button>
          </li>
          <li>
            <a className="ft-link" href={REPO}>
              {FOOTER.source.text}
            </a>
          </li>
        </ul>
        <p className="ft-host print-only">{HOST}</p>
      </div>
    </footer>
  )
}
