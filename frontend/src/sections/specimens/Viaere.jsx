import { useState } from 'react'
import { BUILDS } from '../../content/builds.js'

/*
  Viaere specimen (PLAN.md 4.9, r1 T10, r2 N2): status lamps over a 100-hour
  window. Three abstract aircraft start bunched, all due at once, and one has
  run past its window, so the red lamp lights. Rebalance spreads them evenly,
  the job of the spacing engine: green, green, green, and red goes out.

  The lamps carry only the tier words viaere.com uses (green, amber, red) and
  light in the color their word says: green in LED, amber in sodium, red in
  the beacon, as a 10px light (the one named exception to the beacon being
  reserved for live status, PLAN 13.23). viaere.com does not name its fourth
  tier or say where it sits, so its lamp is drawn dim, unlabeled and set
  apart, and nothing ever lights it. Captioned as an illustration: no
  counts, no tail numbers, no thresholds printed.

  Only the markers move (transform, 700ms ease-out, staggered 40ms).
*/

const BUNCHED = [0.86, 0.92, 1.03]
const SPREAD = [1 / 6, 3 / 6, 5 / 6]
const LAMPS = ['green', 'amber', 'red']
const tierOf = (x) => (x > 1 ? 'red' : x >= 0.85 ? 'amber' : 'green')

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
          <div className="via-lamps">
            <ol className="via-named">
              {LAMPS.map((k) => (
                <li key={k} className="via-lamp" data-lit={lit.has(k) ? '' : undefined}>
                  <i className="lamp" data-tier={k} />
                  <span>{spec.lamps[k].text}</span>
                </li>
              ))}
            </ol>
            <span className="via-lamp via-unnamed" aria-hidden="true">
              <i className="lamp" />
            </span>
          </div>
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
