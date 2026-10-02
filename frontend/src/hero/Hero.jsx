import { useEffect, useRef } from 'react'
import { HERO } from '../content/identity.js'
import { MAP, NODES } from '../content/places.js'
import { ping } from '../lib/store.js'
import { announce } from '../lib/announce.js'
import { clientToMap, nearestNode } from '../grid/camera.js'
import { onStopClick } from '../chrome/route.js'
import './hero.css'

/*
  Hero (PLAN.md 3.2, 4.2; r1 T2, T4 to T7, T12, T14, T16). Owned by A.
  Rendered first inside #origin. Holds the only h1; it is never hidden and
  paints before any script runs.

    phones, tablets  the map block on top (NightGrid); the eyebrow and name
                     sit over its lower half, where the scrim has already
                     put the roads to sleep, so the first screen reads
                     eyebrow, name, deck, proof, contact. The ping control
                     and the map key follow as one row, then his words.
    desktop          the map full bleed behind; name and copy in the reading
                     column; the map key, the hint and `ping` along the map's
                     lower edge, under the lit part of the city.

  Reading order (and tab order): name, deck (viaere links to its card),
  proof line, contact row (email first), the ping control, his paragraph.

  The stage is the tap surface over the map. A tap or click that moves less
  than 8 px pings the grid at that point; a swipe scrolls and a pinch zooms
  (touch-action pan-y pinch-zoom; a pinch cancels the pointer) and neither
  pings. A press that closed the clock's popover never pings either. The
  `ping` button is the keyboard path: it pings from Plano, and either way a
  polite status says where the ping left from.
*/

/** The deck with its one link: same words, same order. */
function Deck({ text, link }) {
  const i = link ? text.indexOf(link.phrase) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <a href={link.href} onClick={(e) => onStopClick(e, link.href.slice(1))}>
        {link.phrase}
      </a>
      {text.slice(i + link.phrase.length)}
    </>
  )
}

/** The name, one word per line from 1100 px up, whichever font painted it (r1 T12). */
function Name({ text }) {
  const words = text.split(' ')
  return words.map((w, i) => (
    <span key={i} className="hero-name-word">
      {i > 0 ? ' ' : ''}
      {w}
    </span>
  ))
}

export default function Hero() {
  const down = useRef(null)
  const side = useRef(null)

  // Desktop: the map stays put while the hero scrolls, so the key and the
  // ping would slide up across the sticky city's labels. Once they rise into
  // the upper half of the screen they step out of the way (r2 U1); hero.css
  // applies it from 1100 px only.
  useEffect(() => {
    const el = side.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    // Two observers, one on the top half and one on the whole screen, so a
    // jump straight back to the top (Home, a rail stop) is seen too.
    const update = () => {
      const up = el.getBoundingClientRect().top < window.innerHeight * 0.52
      if (up) el.dataset.away = ''
      else delete el.dataset.away
    }
    const half = new IntersectionObserver(update, { rootMargin: '0px 0px -48% 0px' })
    const screen = new IntersectionObserver(update)
    half.observe(el)
    screen.observe(el)
    return () => {
      half.disconnect()
      screen.disconnect()
    }
  }, [])

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    // The press that light-dismisses an open popover is not a ping (r1 M7).
    const popover = typeof document !== 'undefined' && !!document.querySelector(':popover-open')
    down.current = { x: e.clientX, y: e.clientY, id: e.pointerId, popover }
  }
  const onPointerUp = (e) => {
    const d = down.current
    down.current = null
    if (!d || d.popover || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return
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
            <h1 className="t-display hero-name">
              <Name text={HERO.name.text} />
            </h1>
          </div>
        </div>
      </div>

      <div className="page hero-bottom">
        <div className="page-grid hero-grid">
          <div className="hero-copy">
            <p className="hero-deck">
              <Deck text={HERO.deck.text} link={HERO.deck.link} />
            </p>
            <p className="hero-proof">{HERO.proof.text}</p>
            <ul className="hero-contact" aria-label={HERO.contactLabel.text}>
              {HERO.contact.map((c) => (
                <li key={c.id}>
                  <a
                    href={c.href}
                    onClick={c.href.startsWith('#') ? (e) => onStopClick(e, c.href.slice(1)) : undefined}
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-side" ref={side}>
            <ul className="hero-key mono" aria-label={MAP.legend.text}>
              <li data-light="then">
                <span className="hero-key-swatch" aria-hidden="true" />
                {MAP.then.text}
              </li>
              <li data-light="now">
                <span className="hero-key-swatch" aria-hidden="true" />
                {MAP.now.text}
              </li>
            </ul>
            <p className="hero-ping js-only">
              <button type="button" className="btn-fill hero-ping-btn" onClick={onPing}>
                <span className="hero-ping-dot" aria-hidden="true" />
                {MAP.ping.text}
              </button>
              <span className="hero-hint">{MAP.hint.text}</span>
            </p>
          </div>

          <p className="t-lead measure hero-lead">{HERO.lead.text}</p>
        </div>
      </div>
    </div>
  )
}
