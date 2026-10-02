import { useState } from 'react'

/*
  Pool Tournament Scheduler specimen (PLAN.md 4.9): the circle method on
  eight players. A to G sit on a ring, H is fixed in the center. Round r
  pairs H with the player at step r and the rest along the three chords
  that cross that line. Every round is the same pattern turned one step,
  so "next round" literally rotates the pattern (transform only).

  The check is computed, not asserted: the seven rounds are built below,
  every pair is counted, and the "every pair met exactly once" line only
  appears when all 28 pairs of K8 have been seen with no repeats.
*/

const RING = 7
const HUB = 7 // index of H
const STEP = 360 / RING

const at = (i, r = 38) => {
  const a = ((-90 + i * STEP) * Math.PI) / 180
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }
}

const pairsOf = (round) => {
  const ps = [[HUB, round]]
  for (let k = 1; k <= 3; k++) ps.push([(round + k) % RING, (round - k + RING) % RING])
  return ps
}
const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)
const ROUNDS = Array.from({ length: RING }, (_, r) => pairsOf(r))

// A one-factorization of K8: 7 rounds of 4 pairs, all 28 pairs, none twice.
const ALL = new Map()
let repeats = 0
ROUNDS.forEach((ps) => ps.forEach(([a, b]) => (ALL.has(key(a, b)) ? repeats++ : ALL.set(key(a, b), true))))
const IS_FACTORIZATION = repeats === 0 && ALL.size === 28

// Round 0's pattern; the group rotates to show every other round.
const P0 = pairsOf(0).map(([a, b]) => [a === HUB ? { x: 50, y: 50 } : at(a), at(b)])

export default function CircleMethod({ spec }) {
  const [turn, setTurn] = useState(0)
  const round = turn % RING
  const name = (i) => spec.players[i].text
  const pairs = ROUNDS[round]
  const hot = new Set(pairs.map(([a, b]) => key(a, b)))
  const met = new Set()
  for (let r = 0; r <= round; r++) ROUNDS[r].forEach(([a, b]) => met.add(key(a, b)))
  const done = round === RING - 1 && IS_FACTORIZATION && met.size === 28
  const pairText = pairs.map(([a, b]) => `${name(a)} ${spec.vs.text} ${name(b)}`)
  const roundText = `${spec.round.text} ${round + 1} ${spec.of.text} ${RING}`
  const metText = `${spec.met.text} ${met.size} ${spec.of.text} 28`

  return (
    <>
      <div className="spec-stage">
        <div className="cm">
          <div className="cm-ring" role="img" aria-label={spec.label.text}>
            <svg className="spec-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" style={{ stroke: 'var(--trace)' }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <g className="cm-pattern" style={{ transform: `rotate(${turn * STEP}deg)` }}>
                {P0.map(([p, q], i) => (
                  <g key={i}>
                    <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} style={{ stroke: 'var(--sodium)' }} strokeOpacity="0.16" strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} style={{ stroke: 'var(--sodium)' }} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
              </g>
              {Array.from({ length: RING }, (_, i) => {
                const p = at(i)
                return <circle key={i} cx={p.x} cy={p.y} r="2.4" style={{ fill: 'var(--night)', stroke: 'var(--ink)' }} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              })}
              <circle cx="50" cy="50" r="5.5" style={{ fill: 'var(--led)' }} />
            </svg>
            {Array.from({ length: RING }, (_, i) => {
              const p = at(i, 47.5)
              return (
                <span key={i} className="spec-label mono" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
                  {name(i)}
                </span>
              )
            })}
            <span className="spec-label mono cm-hub" style={{ left: '50%', top: '50%' }} aria-hidden="true">
              {name(HUB)}
            </span>
          </div>
          <div className="cm-side">
            <p className="cm-pairs mono">
              {pairText.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </p>
            <div className="cm-matrix" aria-hidden="true">
              {Array.from({ length: RING * RING }, (_, n) => {
                const row = Math.floor(n / RING) + 1 // B..H
                const c = n % RING // A..G
                if (c >= row) return <span key={n} className="cm-cell" data-void="" />
                const k = key(row, c)
                return <span key={n} className="cm-cell" data-met={met.has(k) ? '' : undefined} data-hot={hot.has(k) ? '' : undefined} />
              })}
            </div>
            {done ? (
              <p className="cm-met cm-ok mono">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                {spec.allMet.text}
              </p>
            ) : (
              <p className="cm-met mono">{metText}</p>
            )}
          </div>
        </div>
      </div>
      <div className="spec-bar">
        <p className="spec-state mono" aria-live="polite">
          {roundText}
          <span className="sr-only">
            {`: ${pairText.join(', ')}. ${done ? spec.allMet.text : metText}.`}
          </span>
        </p>
        <button type="button" className="btn-text spec-btn mono" onClick={() => setTurn((t) => t + 1)}>
          {round === RING - 1 ? spec.again.text : spec.next.text}
        </button>
      </div>
    </>
  )
}
