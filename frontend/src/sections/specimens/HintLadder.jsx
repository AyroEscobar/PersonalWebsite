import { useState } from 'react'

/*
  neetcode-coach specimen (PLAN.md 4.9): a ladder of hint levels. "hint"
  climbs one rung; the top rung is the solution, drawn dashed, and it never
  lights. After the last level the button offers to start over. The level
  names stay generic on purpose: the fact says it escalates in levels, not
  what each level says.
*/

const LEVELS = 4

export default function HintLadder({ spec }) {
  const [level, setLevel] = useState(0)
  const atTop = level === LEVELS
  // Rows from the top: the solution, then level 4 down to level 1.
  const rows = [
    { top: true, text: spec.top.text },
    ...[4, 3, 2, 1].map((n) => ({ n, text: spec.levels[n - 1].text })),
  ]
  const rowOf = (n) => rows.length - n // level 1 sits in the last row
  const p = level === 0 ? 1 : (rowOf(level) + 0.5) / rows.length
  const on = (r) => (!r.top && r.n <= level ? '' : undefined)
  const state = level === 0 ? spec.idle.text : atTop ? `${spec.levels[LEVELS - 1].text} · ${spec.top.text}` : spec.levels[level - 1].text

  return (
    <>
      <div className="spec-stage">
        <div className="hl" role="img" aria-label={spec.label.text}>
          <div className="hl-ladder">
            <span className="hl-rail" style={{ left: 10 }} />
            <span className="hl-rail" style={{ right: 10 }} />
            <div className="hl-rungs">
              {rows.map((r, i) => (
                <span key={i} className="hl-rung" data-top={r.top ? '' : undefined} data-on={on(r)} />
              ))}
            </div>
            <div className="hl-climb" style={{ '--p': p }}>
              <span className="hl-climber" data-idle={level === 0 ? '' : undefined} />
            </div>
          </div>
          <div className="hl-labels">
            {rows.map((r, i) => (
              <span key={i} className="hl-label mono" data-top={r.top ? '' : undefined} data-on={on(r)}>
                {r.text}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="spec-bar">
        <p className="spec-state mono" aria-live="polite">
          {state}
        </p>
        <button type="button" className="btn-text spec-btn mono" onClick={() => setLevel((l) => (l === LEVELS ? 0 : l + 1))}>
          {atTop ? spec.again.text : spec.hint.text}
        </button>
      </div>
    </>
  )
}
