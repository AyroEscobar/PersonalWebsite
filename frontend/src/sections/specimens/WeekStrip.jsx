/*
  "A system that runs my days" specimen (PLAN.md 4.9): seven dim dots on one
  line, a week. Static, all dim, no schedule claims: nothing here says when
  it runs or how often.
*/
export default function WeekStrip({ spec }) {
  return (
    <div className="spec-stage">
      <div className="wk" role="img" aria-label={spec.label.text}>
        <ol aria-hidden="true">
          {spec.days.map((d) => (
            <li key={d.id} className="mono">
              <i />
              {d.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
