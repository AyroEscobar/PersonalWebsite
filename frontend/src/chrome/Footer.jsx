import { FOOTER } from '../content/meta.js'
import { FIGURE_CREDIT, REPO } from '../content/constants.js'
import BuildStamp from './BuildStamp.jsx'
import SceneControls from '../ui/SceneControls.jsx'

/*
  Footer (DESIGN.md 5.13): two rows. The plain row: name · place, "no cookies, no analytics.",
  "site source", "the kit", and the CC BY credit for the figure (mandatory in every tier,
  REFINE.md item 5). The mono row: the build line and the scene controls.
*/
export default function Footer({ className = '', kit = false, controls }) {
  return (
    <footer className={`footer ${className}`.trim()}>
      <div className="foot-row">
        <p className="ft-line">{FOOTER.line.text}</p>
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
      </div>
      <div className="foot-row foot-row--mono">
        <p className="build">
          <BuildStamp />
        </p>
        {controls ?? <SceneControls />}
      </div>
    </footer>
  )
}
