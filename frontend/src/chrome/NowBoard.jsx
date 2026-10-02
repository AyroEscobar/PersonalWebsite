import { useRef } from 'react'
import { NOW } from '../content/now.js'
import { NODES } from '../content/places.js'
import { BUILD_DATE } from '../lib/build.js'
import { isStale, monthShort } from '../lib/format.js'
import SkyWord from './SkyWord.jsx'

/*
  NowBoard (PLAN.md 3.4, 4.7). Owned by B. An arrivals board for the
  present tense: the sky over Plano on top (the time is in the top bar's
  chip, and the one live light blinks over Plano on the map, r1 M4), the
  current lines from content/now.js as a <dl> in one shape (org; role and
  place; the date where it is public, r1 M12), the mission in sodium, and
  the staleness stamp.

    <NowBoard />                      the full board ('section' is the same)
    <NowBoard variant="compact" />    org and role only, one line each ('hero' is the same)
    <NowBoard className="..." />      placement is the caller's; the board sizes to its box

  Honest by construction: if the build date is more than STALE_AFTER_DAYS
  past now.js `updated`, the stamp reads "last updated" and every lamp drops
  from LED to sodium, because then it is the past.

  The header is a <p>, not a heading, so the board can sit under any h2
  without breaking the outline.
*/
export default function NowBoard({ variant = 'full', className = '', ...rest }) {
  const ref = useRef(null)
  const stale = isStale(NOW.updated, BUILD_DATE)
  const compact = variant === 'compact' || variant === 'hero'

  return (
    <div
      ref={ref}
      className={`nowboard plate ${stale ? 'state-past is-stale' : 'state-now'} ${compact ? 'is-compact' : ''} ${className}`.trim()}
      data-variant={variant}
      {...rest}
    >
      <p className="nb-head mono">
        <span className="nb-place">{NOW.boardPlace.text}</span>
        <SkyWord className="nb-sky" />
      </p>

      <dl className="nb-lines">
        {NOW.lines.map((l) => (
          <div key={l.id} className="nb-row" data-node={l.node || undefined}>
            <dt className="nb-org">{l.org}</dt>
            <dd className="nb-role">
              {l.role}
              {!compact && l.node && NODES[l.node] ? <span className="nb-node"> · {NODES[l.node].text}</span> : null}
            </dd>
            {!compact && l.dates ? <dd className="nb-dates mono">{l.dates}</dd> : null}
          </div>
        ))}
      </dl>

      <p className="nb-mission">
        <span className="nb-mission-mark" aria-hidden="true" />
        {NOW.mission.text}
      </p>

      <p className="nb-stamp">
        {(stale ? NOW.stalePrefix : NOW.freshPrefix).text}{' '}
        <time className="mono" dateTime={NOW.updated}>
          {monthShort(NOW.updated)}
        </time>
      </p>
    </div>
  )
}
