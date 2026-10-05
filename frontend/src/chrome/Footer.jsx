import { useEffect } from 'react'
import { FOOTER } from '../content/meta.js'
import { REPO } from '../content/constants.js'
import BuildStamp from './BuildStamp.jsx'
import VisitStamp from './VisitStamp.jsx'

/*
  Footer (DESIGN.md 5.14): base, a hairline on top, Inter 13. His line on
  the left; the build stamp and this visit's numbers on the right; the
  no-tracking promise and the site source. Links only.

  Printing opens every folded <details> in the work section (the RBC desks)
  before the print dialog and folds them again after.
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

export default function Footer({ className = '' }) {
  usePrintOpensDetails()
  return (
    <footer className={`footer ${className}`.trim()}>
      <div className="page ft-inner">
        <p className="ft-line">{FOOTER.line.text}</p>
        <p>{FOOTER.noTracking.text}</p>
        <a className="ft-link" href={REPO}>
          {FOOTER.source.text}
        </a>
        <div className="ft-stamps">
          <BuildStamp />
          <VisitStamp />
        </div>
      </div>
    </footer>
  )
}
