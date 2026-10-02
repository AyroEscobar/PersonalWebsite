import { headingId, sectionById } from '../content/sections.js'

/*
  The section contract (PLAN.md 4.0). Every one of the six stops renders:
    <section id={id} aria-labelledby="{id}-h" data-focus-node="...">
      <h2 id="{id}-h">...</h2>
  RouteRail, the map camera and the QA keyboard check rely on it.

    <Section id="work" className="...">
      <SectionHeading id="work" />            renders the stop label ('work')
      ...
    </Section>
*/
export function Section({ id, className = '', children, ...rest }) {
  const s = sectionById(id)
  return (
    <section
      id={id}
      aria-labelledby={headingId(id)}
      data-focus-node={s ? s.focus.nodes.join(' ') : undefined}
      className={`section ${className}`.trim()}
      {...rest}
    >
      {children}
    </section>
  )
}

export function SectionHeading({ id, className = 't-h2 lower', children }) {
  const s = sectionById(id)
  return (
    <h2 id={headingId(id)} className={className}>
      {children ?? s?.label.text ?? id}
    </h2>
  )
}

export default Section
