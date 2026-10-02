import { useState } from 'react'
import { BUILDS } from '../../content/builds.js'

/*
  Viaere specimen (PLAN.md 4.9, r1 T10): four-tier status lamps over a
  100-hour window. Three abstract aircraft start bunched, all due at once,
  and one has run past its window, so red lights, the hottest tier, in full
  sodium (never the beacon red, which is the site's live light). Rebalance
  spreads them evenly, the job of the spacing engine, and red goes out.
  Lamps carry only the tier words viaere.com uses (green, amber, red); the
  fourth tier is not named publicly, so its lamp has no label. Captioned as
  an illustration: no counts, no tail numbers, no thresholds printed.

  Only the markers move (transform, 700ms ease-out, staggered 40ms).
*/

const BUNCHED = [0.86, 0.92, 1.03]
const SPREAD = [1 / 6, 3 / 6, 5 / 6]
const LAMPS = ['green', 'fourth', 'amber', 'red']
const tierOf = (x) => (x > 1 ? 'red' : x >= 0.85 ? 'amber' : x >= 0.6 ? 'fourth' : 'green')

export default function Viaere({ spec }) {
  const [spread, setSpread] = useState(false)
  const xs = spread ? SPREAD : BUNCHED
  const tiers = xs.map(tierOf)
  const lit = new Set(tiers)

  return (
    <>
      <div className="spec-stage">
        <div className="via" role="img" aria-label={spec.label.text}>
          <span className="spec-tag">{BUILDS.illustration.text}</span>
          <ol className="via-lamps">
            {LAMPS.map((k) => (
              <li key={k} className="via-lamp" data-lit={lit.has(k) ? '' : undefined}>
                <i className="lamp" data-tier={k} />
                <span>{spec.lamps[k]?.text ?? ''}</span>
              </li>
            ))}
          </ol>
          <div className="via-window">
            <div className="via-track" />
            <span className="via-overdue" />
            <span className="via-end mono" data-at="start">
              {spec.start.text}
            </span>
            <span className="via-end mono" data-at="end">
              {spec.end.text}
            </span>
            {xs.map((x, i) => (
              <span key={i} className="via-mark" data-tier={tiers[i]} style={{ '--x': x }}>
                <span>
                  <span className="mono">{spec.marks[i].text}</span>
                  <i />
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="spec-bar">
        <p className="spec-state" aria-live="polite">
          {spread ? spec.spread.text : spec.bunched.text}
        </p>
        <button type="button" className="btn-fill spec-btn" onClick={() => setSpread((s) => !s)}>
          {spread ? spec.reset.text : spec.rebalance.text}
        </button>
      </div>
    </>
  )
}
