/*
  Routed specimen (PLAN.md 4.9): a route with four stops, food, an
  activity, a reservation, and a phone at the end for the voice AI that
  calls ahead. Static. Drawn in a 400 by 200 box that matches the frame's
  2:1 stage exactly, so the HTML labels sit in the same percent space.
*/

// dy places each label: below a dip, above a peak (the last stop clears the phone ring).
const STOPS = [
  { x: 52, y: 124, dy: 16 },
  { x: 150, y: 78, dy: -30 },
  { x: 250, y: 118, dy: 16 },
  { x: 348, y: 70, dy: -40 },
]
const PATH = 'M14 140C34 136 40 126 52 124S118 80 150 78S222 120 250 118S318 72 348 70'

export default function Route({ spec }) {
  const last = STOPS[STOPS.length - 1]
  return (
    <div className="spec-stage">
      <div className="ro" role="img" aria-label={spec.label.text}>
        <svg className="spec-svg" viewBox="0 0 400 200" aria-hidden="true">
          <defs>
            <radialGradient id="ro-glow">
              <stop offset="0" style={{ stopColor: 'var(--sodium)', stopOpacity: 0.4 }} />
              <stop offset="1" style={{ stopColor: 'var(--sodium)', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          <path d={PATH} fill="none" style={{ stroke: 'var(--sodium)' }} strokeOpacity="0.16" strokeWidth="9" strokeLinecap="round" />
          <path d={PATH} fill="none" style={{ stroke: 'var(--sodium)' }} strokeWidth="2" strokeLinecap="round" />
          <circle cx={last.x} cy={last.y} r="34" fill="url(#ro-glow)" />
          {STOPS.slice(0, -1).map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r="6" style={{ fill: 'var(--night)', stroke: 'var(--sodium)' }} strokeWidth="2" />
          ))}
          <circle cx={last.x} cy={last.y} r="14" style={{ fill: 'var(--night)', stroke: 'var(--sodium)' }} strokeWidth="2" />
          <path
            transform={`translate(${last.x - 7} ${last.y - 7}) scale(0.875)`}
            d="M3.6 1.5c.4-.4 1-.4 1.4 0l1.8 1.8c.4.4.4 1 0 1.4l-.9.9a8.5 8.5 0 0 0 4.5 4.5l.9-.9c.4-.4 1-.4 1.4 0l1.8 1.8c.4.4.4 1 0 1.4l-1 1c-.9.9-2.3 1.1-3.4.5A14.5 14.5 0 0 1 2.1 6.1c-.6-1.1-.4-2.5.5-3.4z"
            style={{ fill: 'var(--sodium)' }}
          />
        </svg>
        {STOPS.map((s, i) => (
          <span
            key={i}
            className="spec-label mono"
            style={{ left: `${(s.x / 400) * 100}%`, top: `${((s.y + s.dy) / 200) * 100}%` }}
            aria-hidden="true"
          >
            {spec.stops[i].text}
          </span>
        ))}
      </div>
    </div>
  )
}
