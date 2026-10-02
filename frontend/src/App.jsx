import NightGrid from './grid/NightGrid.jsx'
import Hero from './hero/Hero.jsx'
import TopBar from './chrome/TopBar.jsx'
import RouteRail from './chrome/RouteRail.jsx'
import Footer from './chrome/Footer.jsx'
import Origin from './sections/Origin.jsx'
import Now from './sections/Now.jsx'
import Work from './sections/Work.jsx'
import Builds from './sections/Builds.jsx'
import Crew from './sections/Crew.jsx'
import Signal from './sections/Signal.jsx'
import Announcer from './ui/Announcer.jsx'
import { SKIP } from './content/identity.js'

/*
  The page (PLAN.md 3, 8, 11). Owned by FOUNDATION; builders own the slots.

  Landmark and focus order: skip link, <header> (TopBar), <nav> (RouteRail),
  <main> (NightGrid first, then the six sections in scroll order), <footer>.
  The hero lives inside #origin, before the origin body.

  Slot contract: each import path above is fixed and default-exports a
  component. Sections take { id }. Origin also takes children (the hero).
*/
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <TopBar />
      <RouteRail />
      <main id="main" tabIndex={-1} className="relative outline-none">
        <NightGrid />
        <Origin id="origin">
          <Hero />
        </Origin>
        <Now id="now" />
        <Work id="work" />
        <Builds id="builds" />
        <Crew id="crew" />
        <Signal id="signal" />
      </main>
      <Footer />
      <Announcer />
    </>
  )
}
