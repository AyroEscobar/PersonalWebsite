import { useEffect, useRef, useState } from 'react'
import { PROGRAM } from '../content/now.js'
import { BUILD_DATE } from '../lib/build.js'
import { monthLong, monthYear, monthsBetween } from '../lib/format.js'
import { W } from './words.js'

/*
  ProgramStrip (PLAN.md 3.4, 4.10): what ran at the same time, January 2025
  to the build month, four lanes. Static.

  Drawn as a CSS grid (one column per month) so every label stays a real
  12px or larger at any width. Ended blocks carry a sodium rule, running
  ones an LED rule and run into the now line; an edge whose month is not
  public is dotted and never printed. The picture is aria-hidden and a
  table says the same thing to screen readers.

  On phones the lanes scroll sideways inside their own box, which opens
  scrolled to now. The lane names stay pinned on the left and each block's
  name slides along inside its block, so a long block scrolled half out of
  view still says what it is. The box only becomes a tab stop when it
  actually scrolls.
*/

const FROM = PROGRAM.from
const BUILD_MONTH = BUILD_DATE.slice(0, 7)
const N = Math.max(1, monthsBetween(FROM, BUILD_MONTH) + 1)
const col = (iso) => monthsBetween(FROM, iso)

function monthAt(i) {
  const [y, m] = FROM.split('-').map(Number)
  const t = y * 12 + (m - 1) + i
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

const MONTHS = Array.from({ length: N }, (_, i) => monthAt(i))
const FIRST_ROW = 3 // row 1 years, row 2 month initials

/** Pack each lane's blocks into as few sub-rows as overlap allows, in content order. */
function layout() {
  let row = FIRST_ROW
  const lanes = PROGRAM.lanes.map((lane) => {
    const lastEnd = []
    const blocks = PROGRAM.blocks
      .filter((b) => b.lane === lane.id && col(b.start) < N)
      .map((b) => {
        const a = Math.max(0, col(b.start))
        const z = b.end ? Math.min(N - 1, col(b.end)) : N - 1
        let sub = lastEnd.findIndex((e) => e < a)
        if (sub < 0) {
          sub = lastEnd.length
          lastEnd.push(-1)
        }
        lastEnd[sub] = z
        return { ...b, a, z, sub }
      })
    const out = { ...lane, blocks, row, span: Math.max(1, lastEnd.length) }
    row += out.span
    return out
  })
  return { lanes, rows: row - FIRST_ROW }
}

const { lanes: LANES, rows: LANE_ROWS } = layout()

const YEARS = MONTHS.map((iso, i) => ({ iso, i }))
  .filter(({ iso, i }) => i === 0 || iso.endsWith('-01'))
  .map(({ iso, i }, k, all) => ({ year: iso.slice(0, 4), i, span: (all[k + 1]?.i ?? N) - i }))

const edgeText = (iso, exact) => (exact ? monthYear(iso) : W.notPublic.text)

export default function ProgramStrip({ className = '' }) {
  const ref = useRef(null)
  const [scrolls, setScrolls] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let first = true
    const measure = () => {
      const can = el.scrollWidth > el.clientWidth + 1
      setScrolls(can)
      // Open at now, once: the present is the part people look for first.
      if (can && first) el.scrollLeft = el.scrollWidth
      first = false
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const grid = {
    gridTemplateColumns: `var(--lane-w) repeat(${N}, minmax(0, 1fr))`,
    gridTemplateRows: `auto auto repeat(${LANE_ROWS}, minmax(42px, auto))`,
    '--n': N,
  }

  return (
    <figure className={`ps ${className}`.trim()}>
      <div className="plate ps-plate">
        <div
          ref={ref}
          className="ps-scroll"
          {...(scrolls ? { tabIndex: 0, role: 'group', 'aria-label': W.stripScroll.text } : {})}
        >
          <div className="ps-chart" style={grid} aria-hidden="true">
            <span className="ps-gridlines" style={{ gridColumn: '2 / -1', gridRow: '2 / -1' }} />
            {YEARS.filter((y) => y.i > 0).map((y) => (
              <span key={`jan-${y.year}`} className="ps-jan" style={{ gridColumn: y.i + 2, gridRow: '2 / -1' }} />
            ))}

            {YEARS.map((y) => (
              <span key={y.year} className="ps-year mono" style={{ gridColumn: `${y.i + 2} / span ${y.span}`, gridRow: 1 }}>
                {y.year}
              </span>
            ))}
            <span className="ps-now-label mono" style={{ gridColumn: N + 1, gridRow: 1 }}>
              {W.now.text}
            </span>

            <span className="ps-corner" style={{ gridColumn: 1, gridRow: '1 / 3' }} />
            <span className="ps-months-rule" style={{ gridColumn: '1 / -1', gridRow: 2 }} />
            {MONTHS.map((iso, i) => (
              <span key={iso} className="ps-month mono" style={{ gridColumn: i + 2, gridRow: 2 }}>
                {monthLong(iso).charAt(0)}
              </span>
            ))}

            {LANES.map((lane) => (
              <LaneCells key={lane.id} lane={lane} />
            ))}

            <span className="ps-now" style={{ gridColumn: N + 1, gridRow: '2 / -1' }} />
          </div>

          <table className="sr-only">
            <caption>{PROGRAM.tableCaption.text}</caption>
            <thead>
              <tr>
                <th scope="col">{W.lane.text}</th>
                <th scope="col">{W.item.text}</th>
                <th scope="col">{W.from.text}</th>
                <th scope="col">{W.until.text}</th>
              </tr>
            </thead>
            <tbody>
              {LANES.flatMap((lane) =>
                lane.blocks.map((b) => (
                  <tr key={b.id}>
                    <td>{lane.label.text}</td>
                    <td>{b.label}</td>
                    <td>{edgeText(b.start, b.startExact)}</td>
                    <td>{b.end ? edgeText(b.end, b.endExact) : W.present.text}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="ps-caption mono">{PROGRAM.caption.text}</figcaption>
    </figure>
  )
}

function LaneCells({ lane }) {
  return (
    <>
      <span className="ps-lane-rule" style={{ gridColumn: '1 / -1', gridRow: lane.row }} />
      <span className="ps-lane-label mono" style={{ gridColumn: 1, gridRow: `${lane.row} / span ${lane.span}` }}>
        {lane.label.text}
      </span>
      {lane.blocks.map((b) => (
        <span
          key={b.id}
          className={`ps-block state-${b.state}`}
          data-open-start={b.startExact ? undefined : ''}
          data-open-end={b.end && !b.endExact ? '' : undefined}
          data-live={b.end ? undefined : ''}
          style={{ gridColumn: `${b.a + 2} / ${b.z + 3}`, gridRow: lane.row + b.sub }}
        >
          <span className="ps-text">{b.label}</span>
        </span>
      ))}
    </>
  )
}
