import { HERO } from '../content/identity.js'
import { MAP } from '../content/places.js'
import { ping } from '../lib/store.js'
import { announce } from '../lib/announce.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by A (PLAN.md 3.2). Replace this file.

  Contract: default export Hero, no props. Rendered inside <Origin id="origin">
  before the origin body. Holds the only h1 on the page. The h1 is never
  hidden, never at opacity 0, and paints before any script runs.
*/
export default function Hero() {
  const onPing = () => {
    ping({ node: 'plano', source: 'button' })
    announce(MAP.pinged.text, { debounce: 1000 })
  }
  return (
    <div className="page pt-[calc(var(--topbar-h)+64px)] pb-16">
      <div className="page-grid">
        <div className="text-col">
          <p className="mono text-dim">{HERO.eyebrow.text}</p>
          <h1 className="t-display mt-4">{HERO.name.text}</h1>
          <p className="mono mt-6 text-led">{HERO.deck.text}</p>
          <p className="t-lead measure mt-8">{HERO.lead.text}</p>
          <p className="t-lead measure mt-4">{HERO.level.text}</p>
          <p className="mt-8 flex items-center gap-3">
            <span className="mono text-dim">{MAP.hint.text}</span>
            <button type="button" className="btn-text" onClick={onPing}>
              {MAP.ping.text}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
