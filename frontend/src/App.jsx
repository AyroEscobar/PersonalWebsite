import { useEffect } from 'react'
import Neck from './chrome/Neck.jsx'
import Hero from './sections/Hero.jsx'
import CheckOut from './sections/CheckOut.jsx'
import Experience from './sections/Experience.jsx'
import Stack from './sections/Stack.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './chrome/Footer.jsx'
import Announcer from './ui/Announcer.jsx'
import PotStage from './hero/Pot.jsx'
import { SKIP } from './content/identity.js'
import { startFriezeHost } from './lib/frieze-host.js'

/*
  The home page: side A of a neck amphora. Landmark and focus order: the skip link, the neck (wordmark,
  the four words, the theme and quiet switches, the coffee chat), <main> with the hero (the shoulder
  frieze and the plate that says who he is, the page's one <h1>), the belly with I Work, II Experience and
  III Stack, IV Contact (with the second frieze band), then the foot. The belly carries the pot (the
  amphora the page is painted on, turned by the reader's scroll): from 1100 px in a sticky rail in its left
  column, under 1100 px in a band of its own above Contact; both are aria-hidden decoration and the frieze
  host uses whichever is laid out. The frieze host mounts the one canvas after hydration, load and idle.
*/
export default function App() {
  useEffect(() => startFriezeHost(), [])
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <Neck />
      <main id="main" tabIndex={-1}>
        <Hero />
        <div className="belly">
          <div className="pot-rail" aria-hidden="true">
            <PotStage />
          </div>
          <CheckOut />
          <Experience />
          <Stack />
        </div>
        <div className="pot-band" aria-hidden="true">
          <PotStage />
        </div>
        <Contact />
      </main>
      <Footer />
      <Announcer />
    </>
  )
}
