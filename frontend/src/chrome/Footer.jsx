import { FOOTER } from '../content/meta.js'
import { FIGURE_CREDIT, FONT_CREDIT, REPO } from '../content/constants.js'
import BuildStamp from './BuildStamp.jsx'
import SceneControls from '../ui/SceneControls.jsx'

/*
  The foot: the black foot of the pot, with the meander as its top edge (gloss on the clay band; in dark,
  clay on the gloss). Three rows in the foot inks: the plain row (name · place, "no cookies, no
  analytics.", "site source", "the kit"); the credits row (the CC BY credit for the figure, mandatory in
  every tier and on every page, and the three faces under the SIL OFL); the controls row (the scene
  controls; the build line only on the kit page, the home page carries it as <meta name="build">).
*/
export default function Footer({ className = '', kit = false, controls }) {
  return (
    <footer className={`foot ${className}`.trim()}>
      <div className="meander meander--foot" aria-hidden="true" data-deco="" />
      <div className="wrap foot-row">
        <p className="foot-line">{FOOTER.line.text}</p>
        <p>{FOOTER.noTracking.text}</p>
        <p>
          <a href={REPO} rel="noopener">
            {FOOTER.source.text}
          </a>
        </p>
        {!kit && (
          <p>
            <a href="/kit">{FOOTER.kit.text}</a>
          </p>
        )}
      </div>
      <div className="wrap foot-row foot-credits">
        <p className="credit">
          {FOOTER.credit.text}{' '}
          <a href={FIGURE_CREDIT.modelHref} rel="noopener">
            {FIGURE_CREDIT.model}
          </a>{' '}
          {FOOTER.creditBy.text} {FIGURE_CREDIT.author},{' '}
          <a href={FIGURE_CREDIT.licenceHref} rel="noopener">
            {FIGURE_CREDIT.licence}
          </a>
        </p>
        <p className="credit">
          {FOOTER.fonts.text}{' '}
          <a href={FONT_CREDIT.licenceHref} rel="noopener">
            {FOOTER.fontsLicence.text}
          </a>
        </p>
      </div>
      <div className="wrap foot-row foot-controls">
        {kit && (
          <p className="build">
            <BuildStamp />
          </p>
        )}
        {controls ?? <SceneControls />}
      </div>
    </footer>
  )
}
