import { headingId } from '../content/sections.js'
import Field from '../field/Field.jsx'

/*
  The section contract: every one of the six renders
    <section id={id} aria-labelledby="{id}-h"> ... <h2 id="{id}-h"> ...
  with its own light field behind it. The prerender and QA rely on it.

    <Section id="work" field="work">...</Section>

    rail   from 1100px up: a <SectionHead rail> in a left column, everything
           else in a right column (wrap it in one element)
*/
export default function Section({ id, field, rail = false, className = '', children, ...rest }) {
  return (
    <section id={id} aria-labelledby={headingId(id)} className={`section ${className}`.trim()} {...rest}>
      {field && <Field preset={field} />}
      <div className={`page on-field ${rail ? 'sec-split' : ''}`.trim()}>{children}</div>
    </section>
  )
}
