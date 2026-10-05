import { useLayoutEffect, useRef } from 'react'
import Glass from '../glass/Glass.jsx'
import Chip from './Chip.jsx'
import Receipt from './Receipt.jsx'

/*
  A build card (DESIGN.md 5.5, 12.1): a glass sheet at r-4, padding 24.
  Title Inter 600 18 (a link), one italic serif line in his words when the
  card has one (Viaere's tagline), the body in Inter 14, plain chips from the
  card's meta, and a foot with the receipt (only where facts.json holds the
  number) and the link words.

  Hover (fine pointers) lifts it 2px and slides a ruler of the lens material
  over the title, magnifying it 1.12x from its left edge (less when a long
  title would not fit, useRulerFit); focus inside takes the same look. The
  card is glass, so it is the ruler's backdrop root and its backdrop is not
  opaque: the ruler draws its magnification as a scaled copy of the title
  (aria-hidden) while the original fades out, in every browser.
  `state` forces 'hover' or 'focus' (focus inside) for the kit; `base` renders the hairline card the
  page does not use, for comparison.
*/
const VOICE_IDS = new Set(['viaere-tagline'])
const MAG = 1.12

/*
  The ruler's magnification for this card: 1.12, or less when the magnified
  title would reach past the card's content box (a long title on a narrow
  card), so the ruler and its focus ring stay inside the padding. Sets
  --ruler-s on the card; components.css reads it.
*/
function useRulerFit(ref) {
  useLayoutEffect(() => {
    const card = ref.current
    const a = card?.querySelector('.card-title a')
    if (!a) return undefined
    const fit = () => {
      const cs = getComputedStyle(card)
      const cw = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const w = a.offsetWidth
      if (!w || !cw) return
      card.style.setProperty('--ruler-s', Math.max(1, Math.min(MAG, cw / w)).toFixed(3))
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(card)
    document.fonts?.ready.then(fit)
    return () => ro?.disconnect()
  }, [ref])
}

export default function BuildCard({ card, state, base = false, children, className = '' }) {
  const ref = useRef(null)
  useRulerFit(ref)
  const voice = card.body.find((b) => VOICE_IDS.has(b.id))
  const body = card.body.filter((b) => !VOICE_IDS.has(b.id))
  const main = card.links[0]
  const chips = card.meta ? card.meta.split(' · ') : []
  const look = state === 'focus' ? 'hover' : state
  const cls = ['card', look && `is-${look}`, className].filter(Boolean).join(' ')
  const content = (
    <>
      {children}
      <h3 className="card-title">
        {main ? (
          <a href={main.href} className={state === 'focus' ? 'is-focus' : undefined}>
            <span className="card-title-text">{card.title}</span>
            {!base && (
              <Glass as="span" tier="clear" className="ruler is-loupe" aria-hidden="true">
                <span className="ruler-text">{card.title}</span>
              </Glass>
            )}
          </a>
        ) : (
          card.title
        )}
      </h3>
      {voice && <p className="card-voice">{voice.text}</p>}
      {body.map((b) => (
        <p key={b.id} className="card-body">
          {b.text}
        </p>
      ))}
      {chips.length > 0 && (
        <ul className="chips" aria-label={card.title}>
          {chips.map((c) => (
            <li key={c}>
              <Chip>{c}</Chip>
            </li>
          ))}
        </ul>
      )}
      {(card.receipt || card.links.length > 0) && (
        <div className="card-foot">
          {card.receipt && <Receipt inline value={card.receipt.value} label={card.receipt.label} facts={card.facts} />}
          {card.links.length > 0 && (
            <p className="card-links">
              {card.links.map((l) => (
                <a key={l.href} href={l.href} aria-label={`${card.title}, ${l.label}`}>
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
    </>
  )
  if (base) return <article className={`${cls} card--base`}>{content}</article>
  return (
    <Glass as="article" ref={ref} tier="sheet" spec className={cls} id={card.id}>
      {content}
    </Glass>
  )
}
