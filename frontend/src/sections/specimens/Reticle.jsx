import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../lib/mode.js'

/*
  ReQuest specimen (PLAN.md 4.9): a camera's focus ring over an item. "scan"
  sweeps a sodium line down the view (linear, 640ms, transform only), then
  resolves to the next of four routes: recycle, sell, donate, dispose.
  Reduced motion: no sweep, the route changes at once.
*/

const SWEEP_MS = 640

export default function Reticle({ spec }) {
  const [phase, setPhase] = useState('idle') // idle | scanning | result
  const [idx, setIdx] = useState(-1)
  const reduced = useReducedMotion()
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const scan = () => {
    if (phase === 'scanning') return
    const next = (i) => (i + 1) % spec.routes.length
    if (reduced) {
      setIdx(next)
      setPhase('result')
      return
    }
    setPhase('scanning')
    timer.current = window.setTimeout(() => {
      setIdx(next)
      setPhase('result')
    }, SWEEP_MS)
  }

  const state =
    phase === 'scanning'
      ? spec.scanning.text
      : phase === 'result' && idx >= 0
        ? `${spec.result.text} ${spec.routes[idx].text}`
        : spec.idle.text

  return (
    <>
      <div className="spec-stage">
        <div className="rt" data-phase={phase} role="img" aria-label={spec.label.text}>
          <div className="rt-view">
            <svg className="spec-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" style={{ stroke: 'var(--trace-lit)' }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <circle cx="50" cy="50" r="30" fill="none" style={{ stroke: 'var(--trace)' }} strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              <path
                d="M50 4v8M50 88v8M4 50h8M88 50h8"
                fill="none"
                style={{ stroke: 'var(--ink)' }}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* the item: a bottle, drawn plain */}
              <path
                d="M46 30h8v6c0 2 5 4 5 9v19c0 3-2 5-5 5h-8c-3 0-5-2-5-5V45c0-5 5-7 5-9z"
                fill="none"
                style={{ stroke: phase === 'result' ? 'var(--sodium)' : 'var(--dim)' }}
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
              />
              <path d="M44 52h12" style={{ stroke: 'var(--trace-lit)' }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="rt-sweep-wrap" aria-hidden="true">
              <span className="rt-sweep" />
            </span>
          </div>
          <ul className="rt-routes">
            {spec.routes.map((r, i) => (
              <li key={r.id} className="rt-route mono" data-on={phase === 'result' && i === idx ? '' : undefined}>
                <i />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="spec-bar">
        <p className="spec-state" aria-live="polite">
          {state}
        </p>
        <button type="button" className="btn-fill spec-btn" onClick={scan}>
          {spec.scan.text}
        </button>
      </div>
    </>
  )
}
