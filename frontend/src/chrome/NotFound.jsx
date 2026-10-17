import { NOT_FOUND } from '../content/meta.js'
import { SKIP } from '../content/identity.js'
import Button from '../ui/Button.jsx'
import Neck from './Neck.jsx'
import Footer from './Footer.jsx'
import Poster from '../hero/Poster.jsx'
import SceneControls from '../ui/SceneControls.jsx'

/*
  The 404. Prerendered to dist/404.html and served with a real 404 for any unknown path: the slip
  ground, a small clay band with the poster (no scene chunk), "nothing here." and "back home" as the
  fill button. The figure credit stays in the footer.
*/
export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <Neck wordmarkHref="/" hrefBase="/" className="neck--plain" />
      <main id="main" tabIndex={-1} className="nf">
        <Poster className="nf-band" />
        <div className="wrap nf-body">
          <h1 className="nf-line">{NOT_FOUND.line.text}</h1>
          <p className="nf-actions">
            <Button variant="fill" href="/">
              {NOT_FOUND.home.text}
            </Button>
          </p>
        </div>
      </main>
      <Footer kit controls={<SceneControls tier="still" motion="on" />} />
    </>
  )
}
