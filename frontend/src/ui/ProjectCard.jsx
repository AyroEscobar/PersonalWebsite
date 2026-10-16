import Glass from '../glass/Glass.jsx'
import Button from './Button.jsx'
import Eyebrow from './Eyebrow.jsx'

/*
  <ProjectCard>: 480 px (phones full width), padding 32, scrim .78, a 1px hairline. Eyebrow (the
  title), name 24/700, headline 18/520 ink, blurb 16 ink-2, a small glass link pill. States: rest ·
  hover (the hairline brightens) · focus-within (the link's ring; the card itself is not a link) ·
  entering. Exactly two instances, Esvo first.
*/
export default function ProjectCard({ card, state, reveal = true, className = '' }) {
  const cls = ['card', reveal && 'reveal', state === 'hover' && 'is-hover', state === 'focus' && 'is-focus-within', state === 'in' && 'in', className].filter(Boolean).join(' ')
  return (
    <Glass as="article" scrim radius="card" className={cls} aria-labelledby={`${card.id}-name`}>
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
