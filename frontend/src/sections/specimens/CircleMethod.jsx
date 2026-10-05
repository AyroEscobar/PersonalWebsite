import { useState } from 'react'
import Button from '../../ui/Button.jsx'

/*
  Pool Tournament Scheduler specimen (DESIGN.md 6.6): the circle method on
  eight players. A to G sit on a ring, H is fixed in the centre. Round r
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
    <div className="spec">
      <div className="spec-stage cm">
        <div className="cm-ring" role="img" aria-label={spec.label.text}>
          <svg className="spec-svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="cm-orbit" cx="50" cy="50" r="38" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <g className="cm-pattern" style={{ transform: `rotate(${turn * STEP}deg)` }}>
              {P0.map(([p, q], i) => (
                <g key={i}>
                  <line className="cm-chord-glow" x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line className="cm-chord" x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </g>
            {Array.from({ length: RING }, (_, i) => {
              const p = at(i)
              return <circle key={i} className="cm-node" cx={p.x} cy={p.y} r="3" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            })}
            <circle className="cm-hub" cx="50" cy="50" r="6.5" />
          </svg>
          {Array.from({ length: RING }, (_, i) => {
            const p = at(i, 49)
            return (
              <span key={i} className="cm-player" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
                {name(i)}
              </span>
            )
          })}
          <span className="cm-player cm-player--hub" style={{ left: '50%', top: '50%' }} aria-hidden="true">
            {name(HUB)}
          </span>
        </div>
        <div className="cm-side" aria-hidden="true">
          <p className="cm-pairs">
            {pairText.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
          <div className="cm-matrix">
            {Array.from({ length: RING * RING }, (_, n) => {
              const row = Math.floor(n / RING) + 1 // B..H
              const c = n % RING // A..G
              if (c >= row) return <span key={n} className="cm-cell" data-void="" />
              const k = key(row, c)
              return <span key={n} className="cm-cell" data-met={met.has(k) ? '' : undefined} data-hot={hot.has(k) ? '' : undefined} />
            })}
          </div>
          {done ? (
            <p className="cm-met cm-ok">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {spec.allMet.text}
            </p>
          ) : (
            <p className="cm-met">{metText}</p>
          )}
        </div>
      </div>
      <p className="sr-only">{spec.words.text}</p>
      <div className="spec-bar">
        <p className="spec-state" aria-live="polite">
          {roundText}
          <span className="sr-only">{`: ${pairText.join(', ')}. ${done ? spec.allMet.text : metText}.`}</span>
        </p>
        <Button variant="ghost" onClick={() => setTurn((t) => t + 1)}>
          {round === RING - 1 ? spec.again.text : spec.next.text}
        </Button>
      </div>
    </div>
  )
}
