import LensNav from './ui/LensNav.jsx'
import ToastRegion from './ui/Toast.jsx'
import Footer from './chrome/Footer.jsx'
import PrintMasthead from './chrome/PrintMasthead.jsx'
import Origin from './sections/Origin.jsx'
import Now from './sections/Now.jsx'
import Work from './sections/Work.jsx'
import Builds from './sections/Builds.jsx'
import Crew from './sections/Crew.jsx'
import Signal from './sections/Signal.jsx'
import { useActiveSection } from './ui/useActiveSection.js'
import { SKIP } from './content/identity.js'

/*
  The home page (DESIGN.md 6). Landmark and focus order: skip link, the
  lens nav, <main> with the six sections in scroll order (the masthead and
  the page's one <h1> open #origin), <footer>.

  Interim (kit stage): the nav is a separate pinned pill from the start (the
  reduced-motion composition); the page stage adds the reading lens and the
  morph.
*/
export default function App() {
  const active = useActiveSection()
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <LensNav state="pill" fixed auto active={active} over={active !== 'origin'} />
      <main id="main" tabIndex={-1}>
        <PrintMasthead />
        <Origin />
        <Now />
        <Work />
        <Builds />
        <Crew />
        <Signal />
      </main>
      <Footer />
      <ToastRegion />
    </>
  )
}
