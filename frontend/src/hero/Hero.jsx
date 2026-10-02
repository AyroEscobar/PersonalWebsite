import { useRef } from 'react'
import { HERO } from '../content/identity.js'
import { MAP, NODES } from '../content/places.js'
import { ping } from '../lib/store.js'
import { announce } from '../lib/announce.js'
import { clientToMap, nearestNode } from '../grid/camera.js'
import './hero.css'

/*
  Hero (PLAN.md 3.2, 4.2). Owned by A. Rendered first inside #origin. Holds
  the only h1; it is never hidden and paints before any script runs.

    phones, tablets  the map block on top (NightGrid), the name set at its
                     foot, the deck and his two paragraphs below on night
    desktop          the map full bleed behind; name and copy in the reading
                     column; the ping control in the lower right, under the
                     lit part of the map. (The NowBoard is not repeated here:
                     on a 900 px screen its plate covered Richardson, and the
                     top bar already carries the live clock. It opens the now
                     section one stop down.)

  The stage is the tap surface over the map. A tap or click that moves less
  than 8 px pings the grid at that point; a swipe scrolls (touch-action pan-y)
  and never pings. The `ping` button is the keyboard path: it pings from
  Plano, and either way a polite status says where the ping left from.
*/
export default function Hero() {
  const down = useRef(null)

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    down.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onPointerUp = (e) => {
    const d = down.current
    down.current = null
    if (!d || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return
    const p = clientToMap(e.clientX, e.clientY)
    if (!p) return
    ping({ x: p.x, y: p.y, source: 'pointer' })
    announce(`${MAP.pingedFrom.text} ${NODES[nearestNode(p.x, p.y)].text}`, { debounce: 1000 })
  }
  const onPointerCancel = () => {
    down.current = null
  }
  const onPing = () => {
    ping({ node: 'plano', source: 'button' })
    announce(MAP.pinged.text, { debounce: 1000 })
  }

  return (
    <div className="hero">
      <div
        className="hero-stage"
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      <div className="page hero-top">
        <div className="page-grid">
          <div className="hero-id">
            <p className="mono hero-eyebrow">{HERO.eyebrow.text}</p>
            <h1 className="t-display hero-name">{HERO.name.text}</h1>
          </div>
        </div>
      </div>

      <div className="page hero-bottom">
        <div className="page-grid">
          <div className="hero-copy">
            <p className="mono hero-deck">{HERO.deck.text}</p>
            <p className="t-lead measure hero-lead">{HERO.lead.text}</p>
            <p className="t-lead measure hero-lead">{HERO.level.text}</p>
          </div>
          <div className="hero-side">
            <p className="hero-ping">
              <span className="mono hero-hint">{MAP.hint.text}</span>
              <button type="button" className="btn-text hero-ping-btn" onClick={onPing}>
                <span className="hero-ping-dot" aria-hidden="true" />
                {MAP.ping.text}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
