import { useEffect, useRef } from 'react'
import { NOW } from '../content/now.js'
import { NODES } from '../content/places.js'
import { BUILD_DATE } from '../lib/build.js'
import { isStale, monthShort } from '../lib/format.js'
import LocalClock from './LocalClock.jsx'
import SkyWord from './SkyWord.jsx'
import { syncBeacons, usePlanoNow } from './time.js'

/*
  NowBoard (PLAN.md 3.4, 4.7). Owned by B. A live arrivals board for the
  present tense: Plano time and sky on top, the current lines from
  content/now.js as a <dl>, the mission in sodium, and the staleness stamp.

    <NowBoard />                      the full board ('section' is the same)
    <NowBoard variant="compact" />    org and role only, one line each ('hero' is the same)
    <NowBoard className="..." />      placement is the caller's; the board sizes to its box

  Honest by construction: if the build date is more than STALE_AFTER_DAYS
  past now.js `updated`, the stamp reads "last updated" and every lamp drops
  from LED to sodium, because then it is the past.

  The header carries the only live element (the beacon). It is a <p>, not a
  heading, so the board can sit under any h2 without breaking the outline.
*/
export default function NowBoard({ variant = 'full', className = '', ...rest }) {
  const ref = useRef(null)
  const stale = isStale(NOW.updated, BUILD_DATE)
  const compact = variant === 'compact' || variant === 'hero'
  const now = usePlanoNow()

  // Mounted later than the page (a popover, a lazy island): fall into phase.
  useEffect(() => {
    if (now && ref.current) syncBeacons(ref.current)
  }, [now])

  return (
    <div
      ref={ref}
      className={`nowboard plate ${stale ? 'state-past is-stale' : 'state-now'} ${compact ? 'is-compact' : ''} ${className}`.trim()}
      data-variant={variant}
      {...rest}
    >
      <p className="nb-head mono">
        <span className="beacon nb-beacon" aria-hidden="true" />
        <LocalClock place />
        <SkyWord className="nb-sky" />
      </p>

      <dl className="nb-lines">
        {NOW.lines.map((l) => (
          <div key={l.id} className="nb-row" data-node={l.node || undefined}>
            <dt className="nb-org">{l.org}</dt>
            <dd className="nb-role">{l.role}</dd>
            {!compact && (l.place || l.dates) && (
              <dd className="nb-meta mono">
                {l.node && NODES[l.node] ? <span className="nb-node">{NODES[l.node].text}</span> : null}
                {l.dates ? <span className="nb-dates">{l.dates}</span> : null}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <p className="nb-mission">
        <span className="nb-mission-mark" aria-hidden="true" />
        {NOW.mission.text}
      </p>

      <p className="nb-stamp mono">
        {(stale ? NOW.stalePrefix : NOW.freshPrefix).text} <time dateTime={NOW.updated}>{monthShort(NOW.updated)}</time>
      </p>
    </div>
  )
}
