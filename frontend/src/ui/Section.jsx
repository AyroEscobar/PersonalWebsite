import { headingId } from '../content/sections.js'

/*
  The section contract: every one of the five renders
    <section id={id} aria-labelledby="{id}-h"> ... <h2 id="{id}-h"> ...
  (the hero is #top, labelled by its h1). The prerender, the scroll anchors and QA rely on it.
*/
export default function Section({ id, labelledBy, className = '', children, ...rest }) {
  return (
    <section id={id} aria-labelledby={labelledBy ?? headingId(id)} className={`sec ${className}`.trim()} {...rest}>
      {children}
    </section>
  )
}
