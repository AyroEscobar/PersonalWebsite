import { CHROME } from '../content/meta.js'
import { planoTime } from '../lib/clock.js'
import { usePlanoNow } from './time.js'

/*
  LocalClock (PLAN.md 4.7). Plano time at minute precision, lowercased:
  "10:41 pm cdt". Prerendered as "--:-- ct" so hydration matches, then the
  shared minute clock (time.js) fills it in. A <time datetime>, never a live
  region: nobody needs the minute announced.

    <LocalClock />            the time only
    <LocalClock place />      "plano · 10:41 pm cdt"
*/
export default function LocalClock({ place = false, className = '' }) {
  const now = usePlanoNow()
  const t = now ? planoTime(now) : null
  return (
    <span className={`clock ${className}`.trim()}>
      {place && (
        <>
          <span className="clock-place">{CHROME.clockPlace.text} </span>
          <span className="clock-sep" aria-hidden="true">
            {'· '}
          </span>
        </>
      )}
      {t ? (
        <time dateTime={t.datetime} className="clock-time">
          {t.text}
        </time>
      ) : (
        <span className="clock-time">{CHROME.clockPlaceholder.text}</span>
      )}
    </span>
  )
}
