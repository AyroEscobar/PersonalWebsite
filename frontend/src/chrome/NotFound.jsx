import { NOT_FOUND } from '../content/meta.js'
import { SKIP } from '../content/identity.js'
import Button from '../ui/Button.jsx'
import Panel from '../ui/Panel.jsx'
import Wordmark from '../ui/Wordmark.jsx'
import Footer from './Footer.jsx'
import Poster from '../hero/Poster.jsx'
import SceneControls from '../ui/SceneControls.jsx'

/*
  NotFound (DESIGN.md 5.13). Prerendered to dist/404.html and served with a real 404 for any
  unknown path: the still poster, "not found, Ayro Escobar", "nothing here.", "back home" as a
  primary button. No scene chunk, and the figure credit stays in the footer.
*/
export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <Poster />
      <header className="top">
        <Wordmark href="/" />
      </header>
      <main id="main" tabIndex={-1} className="nf">
        <Panel variant="nf" reveal={false}>
          <h1 className="sec-title">{NOT_FOUND.line.text}</h1>
          <p className="nf-actions">
            <Button variant="primary" href="/">
              {NOT_FOUND.home.text}
            </Button>
          </p>
        </Panel>
      </main>
      <Footer kit controls={<SceneControls tier="still" motion="on" />} />
    </>
  )
}
