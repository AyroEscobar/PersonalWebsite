import { STACK } from '../content/work.js'

/*
  StackPlate (PLAN.md 3.5, 4.8): one plate, five rows, no bars, no
  percentages, no years, no animation. A parenthetical in a value, like
  "(strongest)", takes the sodium so the one judgment in the list is the
  thing you notice.
*/
export default function StackPlate() {
  return (
    <div className="plate stack">
      <h3 className="t-h3 lower">{STACK.heading.text}</h3>
      <dl className="stack-rows">
        {STACK.rows.map((r) => (
          <div key={r.id} className="stack-row">
            <dt className="label">{r.label}</dt>
            <dd>
              <Paren text={r.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Paren({ text }) {
  const m = text.match(/\([^)]*\)/)
  if (!m) return text
  return (
    <>
      {text.slice(0, m.index)}
      <span className="paren">{m[0]}</span>
      {text.slice(m.index + m[0].length)}
    </>
  )
}
