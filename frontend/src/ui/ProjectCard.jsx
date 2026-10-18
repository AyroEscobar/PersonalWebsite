import { ArrowOut } from './icons.jsx'

/*
  <ProjectCard>: a work plate. --panel, a 1 px --rule, square, padding 36/40/34: the name (EB Garamond
  26/500), the title (the label face), the headline in italic, the blurb in --ink-2, the domain link in
  the accent with the 10 px outward arrow. Exactly two instances, Esvo first.

  Hover or focus within: the link's underline and its arrow 2 px out, 160 ms; nothing else on the plate
  moves (the drafting tool's dimension line is gone: it was a screen's tell on a Greek vase). The plate
  turns into view as it enters (.turn, src/lib/reveal.js). `state` forces a look for the kit.
*/
export default function ProjectCard({ card, state, className = '' }) {
  const cls = ['card', 'turn', state === 'hover' && 'is-hover', state === 'focus' && 'is-focus-within', className].filter(Boolean).join(' ')
  return (
    <article id={card.id} className={cls} aria-labelledby={`${card.id}-name`}>
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
