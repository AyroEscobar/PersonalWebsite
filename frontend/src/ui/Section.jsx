import { headingId } from '../content/sections.js'
import Field from '../field/Field.jsx'

/*
  The section contract: every one of the six renders
    <section id={id} aria-labelledby="{id}-h"> ... <h2 id="{id}-h"> ...
  with its own light field behind it. The prerender and QA rely on it.

    <Section id="work" field="work">...</Section>
*/
export default function Section({ id, field, className = '', children, ...rest }) {
  return (
    <section id={id} aria-labelledby={headingId(id)} className={`section ${className}`.trim()} {...rest}>
      {field && <Field preset={field} />}
      <div className="page on-field">{children}</div>
    </section>
  )
}
