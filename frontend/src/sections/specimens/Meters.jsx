/*
  Interview-Lens specimen (PLAN.md 4.9): a still waveform of a spoken answer
  and three meters, pace, filler words and structure, with no numbers on
  them. Static. The bar heights come from a fixed formula, so the drawing is
  the same on every visit and claims nothing.
*/

const BARS = 56
const HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  const pause = i % 14 === 0 || i % 14 === 13
  const v = Math.abs(Math.sin(i * 1.9) * Math.sin(i * 0.37 + 0.8))
  return pause ? 0.05 : 0.12 + 0.8 * v
})
const LEVELS = [0.62, 0.3, 0.76]

export default function Meters({ spec }) {
  return (
    <div className="spec-stage">
      <div className="mt" role="img" aria-label={spec.label.text}>
        <svg className="mt-wave" viewBox={`0 0 ${BARS * 8} 100`} preserveAspectRatio="none" aria-hidden="true">
          {HEIGHTS.map((h, i) => (
            <rect
              key={i}
              x={i * 8 + 1.5}
              y={50 - h * 46}
              width="5"
              height={h * 92}
              style={{ fill: 'color-mix(in oklab, var(--led) 55%, transparent)' }}
            />
          ))}
        </svg>
        <div className="mt-rows" aria-hidden="true">
          {spec.meters.map((m, i) => (
            <div key={m.id} className="mt-row mono">
              <span>{m.text}</span>
              <span className="mt-track">
                <span className="mt-fill" style={{ '--v': LEVELS[i] }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
