import { useEffect, useRef } from 'react'
import { ArrowOut } from './icons.jsx'

/*
  <ProjectCard>: a work plate. --panel, a 1 px --rule, square, padding 36/40/34: the name (EB Garamond
  26/500), the title (the label face), the headline in italic, the blurb in --ink-2, the domain link in
  the accent with the 10 px outward arrow. Exactly two instances, Esvo first.

  The measured drawing: on hover or focus within, a 1 px dimension line with end ticks along the
  plate's top edge and the plate's width in px, like an architect's elevation (a ResizeObserver keeps
  the number true). Hidden on touch; no movement under reduced motion. `state` forces a look for the kit.
*/
export default function ProjectCard({ card, state, className = '' }) {
  const ref = useRef(null)
  const num = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver((es) => {
      for (const e of es) {
        const w = Math.round(e.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth)
        if (num.current) num.current.textContent = `${w} px`
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const cls = ['card', state === 'hover' && 'is-hover', state === 'focus' && 'is-focus-within', className].filter(Boolean).join(' ')
  return (
    <article ref={ref} id={card.id} className={cls} aria-labelledby={`${card.id}-name`}>
      <span className="ticks" aria-hidden="true" data-deco="">
        <span ref={num} className="ticks-n" />
      </span>
      <h3 id={`${card.id}-name`} className="card-name">
        {card.name}
      </h3>
      <p className="card-title">{card.title}</p>
      <p className="card-head">{card.headline}</p>
      <p className="card-body">{card.blurb}</p>
      <a className={['card-link', state === 'focus' && 'is-focus'].filter(Boolean).join(' ')} href={card.href} rel="noopener">
        {card.link}
        <ArrowOut />
      </a>
    </article>
  )
}
