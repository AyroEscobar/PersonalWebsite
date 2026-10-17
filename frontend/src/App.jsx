import { useEffect } from 'react'
import Neck from './chrome/Neck.jsx'
import Hero from './sections/Hero.jsx'
import CheckOut from './sections/CheckOut.jsx'
import Experience from './sections/Experience.jsx'
import Stack from './sections/Stack.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './chrome/Footer.jsx'
import Announcer from './ui/Announcer.jsx'
import { SKIP } from './content/identity.js'
import { startFriezeHost } from './lib/frieze-host.js'

/*
  The home page: side A of a neck amphora. Landmark and focus order: the skip link, the neck (wordmark,
  the four words, the theme and quiet switches, the coffee chat), <main> with the hero (the shoulder
  frieze and the plate that says who he is, the page's one <h1>), I Work, II Experience, III Stack,
  IV Contact (with the second frieze band), then the foot. The frieze host mounts the one canvas after
  hydration, load and idle.
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
        <CheckOut />
        <Experience />
        <Stack />
        <Contact />
      </main>
      <Footer />
      <Announcer />
    </>
  )
}
