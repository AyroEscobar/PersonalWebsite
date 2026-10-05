import Wordmark from './ui/Wordmark.jsx'
import NavPill from './ui/NavPill.jsx'
import Stage from './hero/Stage.jsx'
import Hero from './sections/Hero.jsx'
import CheckOut from './sections/CheckOut.jsx'
import Experience from './sections/Experience.jsx'
import Stack from './sections/Stack.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './chrome/Footer.jsx'
import Announcer from './ui/Announcer.jsx'
import { SKIP } from './content/identity.js'

/*
  The home page (DESIGN.md 6). Landmark and focus order: skip link, wordmark, nav, <main> with
  the five sections in scroll order (the hero holds the page's one <h1>), <footer>. The stage
  (poster and canvas) is fixed behind everything; every section is a glass panel floating in
  that world.
*/
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <Stage />
      <header className="top">
        <Wordmark />
        <NavPill />
      </header>
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
