import { useEffect, useState } from 'react'
import { PLANO } from '../content/constants.js'
import { useHydrated } from './hydrated.js'

/*
  Plano local time (PLAN.md 4.7). One clock for the whole site.

    planoTime(date)   { text: '10:41 pm cdt', datetime: '2026-10-01T22:41-05:00', hour, minute, period, tz }
    useMinute()       a Date that updates on each minute boundary, or null on the
                      server and during hydration (render CHROME.clockPlaceholder then)

  One setTimeout aligned to the next minute, never a 1 s interval. It resyncs
  when the tab becomes visible again. Never aria-live.
*/

const fmt =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: PLANO.tz,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

const offsetFmt =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: PLANO.tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZoneName: 'longOffset',
      })
    : null

export function planoTime(date = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]))
  const o = Object.fromEntries(offsetFmt.formatToParts(date).map((x) => [x.type, x.value]))
  const period = (p.dayPeriod || '').toLowerCase()
  const tz = (p.timeZoneName || '').toLowerCase()
  const offset = (o.timeZoneName || 'GMT').replace('GMT', '') || '+00:00'
  return {
    text: `${p.hour}:${p.minute} ${period} ${tz}`.trim(),
    datetime: `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}${offset}`,
    hour: Number(p.hour),
    minute: Number(p.minute),
    period,
    tz,
  }
}

export function msToNextMinute(date = new Date()) {
  return 60000 - (date.getSeconds() * 1000 + date.getMilliseconds()) + 25
}

export function useMinute() {
  const hydrated = useHydrated()
  const [now, setNow] = useState(null)
  useEffect(() => {
    if (!hydrated) return
    let timer = 0
    const tick = () => {
      const d = new Date()
      setNow(d)
      timer = window.setTimeout(tick, msToNextMinute(d))
    }
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timer)
      tick()
    }
    tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [hydrated])
  return now
}
