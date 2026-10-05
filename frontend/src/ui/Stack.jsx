import Glass from '../glass/Glass.jsx'
import { STACK } from '../content/work.js'

/* The stack (DESIGN.md 5.7): a two-column <dl> on a glass sheet, terms in ink-2, values in Inter 500. */
export default function Stack({ rows = STACK.rows }) {
  return (
    <Glass tier="sheet" className="stack">
      <dl className="stack-dl" aria-label={STACK.heading.text}>
        {rows.map((r) => (
          <div key={r.id} className="stack-row">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Glass>
  )
}
