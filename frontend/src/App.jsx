import { useEffect } from 'react'
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
import { startReader } from './hero/nav.js'
import { SKIP } from './content/identity.js'

/*
  The home page (DESIGN.md 6). Landmark and focus order: skip link, the
  lens nav, <main> with the six sections in scroll order (the masthead and
  the page's one <h1> open #origin), <footer>.

  The nav is one element (DESIGN.md 5.1). Prerendered it is a pinned pill
  (a dock on phones), which is also the page without JavaScript and the
  reduced-motion composition. After hydration and the fonts, the reader
  (src/hero/nav.js) makes it the lens on his sentence, moves it line by line
  as the page scrolls, and morphs it into the nav. App renders once: the
  reader owns the nav's look and aria-current from then on.
*/
function useReader() {
  useEffect(() => {
    let stop = () => {}
    let alive = true
    const nav = document.getElementById('nav')
    const sentence = document.getElementById('sentence')
    if (!nav || !sentence) return undefined
    const fonts = document.fonts?.ready ?? Promise.resolve()
    Promise.all([fonts, import('./glass/lens.js')])
      .then(([, lens]) => {
        if (alive) stop = startReader({ nav, sentence, lens })
      })
      .catch(() => {
        // no lens chunk: the prerendered pinned nav and the stand-in lens stay
        nav.classList.add('is-ready')
      })
    return () => {
      alive = false
      stop()
    }
  }, [])
}

export default function App() {
  useReader()
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <LensNav id="nav" state="pill" fixed auto reader />
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
