import Glass from '../glass/Glass.jsx'
import Button from './Button.jsx'
import Eyebrow from './Eyebrow.jsx'

/*
  <ProjectCard> (DESIGN.md 5.5): 480 px (phones full width), padding 30/32, scrim .70; the lower
  rim darkens where the slope's glow runs under it. Eyebrow (the title), name 28/700, headline
  20/520 ink, blurb 16 ink-2, a small glass link pill. States: rest · hover (the spec follows the
  pointer, rim 1) · focus-within (the link's ring; the card itself is not a link) · entering.
  Exactly two instances, Esvo first.
*/
export default function ProjectCard({ card, state, reveal = true, className = '' }) {
  const cls = ['card', reveal && 'reveal', state === 'hover' && 'is-hover', state === 'focus' && 'is-focus-within', state === 'in' && 'in', className].filter(Boolean).join(' ')
  return (
    <Glass as="article" tier="thick" scrim spec radius="card" className={cls} aria-labelledby={`${card.id}-name`}>
      <Eyebrow>{card.title}</Eyebrow>
      <h3 id={`${card.id}-name`} className="card-name">
        {card.name}
      </h3>
      <p className="card-head">{card.headline}</p>
      <p className="card-body">{card.blurb}</p>
      <Button variant="glass" size="sm" icon="out" href={card.href} rel="noopener" state={state === 'focus' ? 'focus' : undefined}>
        {card.link}
      </Button>
    </Glass>
  )
}
