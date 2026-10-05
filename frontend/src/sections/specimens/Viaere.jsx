import { useState } from 'react'
import { BUILDS } from '../../content/builds.js'
import Button from '../../ui/Button.jsx'

/*
  Viaere specimen (DESIGN.md 6.6; r1 T10, r2 N2): status lamps over a
  100-hour window. Three abstract aircraft start bunched, all due at once,
  and one has run past its window, so the red lamp lights. Rebalance spreads
  them evenly, the job of the spacing engine: green, green, green, and red
  goes out.

  The lamps carry only the tier words viaere.com uses (green, amber, red)
  and light in the colour their word says. viaere.com does not name its
  fourth tier or say where it sits, so its lamp is drawn hollow, unlabeled
  and set apart, and nothing ever lights it. Captioned as an illustration:
  no counts, no tail numbers, no thresholds printed.

  Only the markers move (transform, motion.css, staggered 40ms).
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
    <div className="spec">
      <div className="spec-stage via" role="img" aria-label={spec.label.text}>
        <span className="spec-tag">{BUILDS.illustration.text}</span>
        <div className="via-lamps">
          {LAMPS.map((k) => (
            <span key={k} className="via-lamp" data-tier={k} data-lit={lit.has(k) ? '' : undefined}>
              <i />
              {spec.lamps[k].text}
            </span>
          ))}
          <span className="via-lamp via-lamp--unnamed">
            <i />
          </span>
        </div>
        <div className="via-window">
          <span className="via-track" />
          <span className="via-over" />
          <span className="via-end" data-at="start">
            {spec.start.text}
          </span>
          <span className="via-end" data-at="end">
            {spec.end.text}
          </span>
          {xs.map((x, i) => (
            <span key={i} className="via-mark" data-tier={tiers[i]} style={{ '--x': x, '--i': i }}>
              <b>{spec.marks[i].text}</b>
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">{spec.words.text}</p>
      <div className="spec-bar">
        <p className="spec-state" aria-live="polite">
          {spread ? spec.spread.text : spec.bunched.text}
        </p>
        <Button variant="ghost" onClick={() => setSpread((s) => !s)}>
          {spread ? spec.reset.text : spec.rebalance.text}
        </Button>
      </div>
    </div>
  )
}
