import DeferredMount from './DeferredMount.jsx'
import { SPEC } from '../content/sections-ui.js'
import { BUILDS } from '../content/builds.js'

/*
  <Specimen kind="viaere" /> (DESIGN.md 5.5, 6.6): the small working drawing
  above the title of a wide build card. Each one is its own lazy chunk
  (src/sections/specimens/*, under 2 KB), mounted at the first idle moment
  after load, so it is there before a reader (or a keyboard) reaches it.
  Until then a poster holds exactly its box (the same stage and bar), with
  the illustration's summary as its accessible name, so nothing shifts when
  it arrives and nothing is lost if it never does.
*/
const LOAD = {
  viaere: () => import('../sections/specimens/Viaere.jsx'),
  'circle-method': () => import('../sections/specimens/CircleMethod.jsx'),
}

function Poster({ spec }) {
  return (
    <div className="spec spec--poster">
      <div className="spec-stage" role="img" aria-label={spec.label.text}>
        <span className="spec-tag">{BUILDS.illustration.text}</span>
      </div>
      <div className="spec-bar">
        <p className="spec-state">{' '}</p>
        <span className="spec-bar-hold" aria-hidden="true" />
      </div>
    </div>
  )
}

export default function Specimen({ kind, className = '' }) {
  const spec = SPEC[kind]
  const load = LOAD[kind]
  if (!spec || !load) return null
  return (
    <DeferredMount load={load} when="load" fallback={<Poster spec={spec} />} props={{ spec }} className={`spec-wrap spec-wrap--${kind} ${className}`.trim()} />
  )
}
