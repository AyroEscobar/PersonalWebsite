import { STALE_AFTER_DAYS } from '../content/constants.js'

/*
  Formatting helpers. Every range uses the word "to", never a dash.

    monthYear('2026-05')            'May 2026'
    monthLong('2026-05')            'May'
    monthShort('2026-10-01')        'Oct 2026'
    dateShort('2026-10-02')         'Oct 2, 2026'
    monthRange('2026-06','2026-08') 'June to August 2026'
    monthRange('2026-05', null)     'May 2026 to present'
    monthsBetween('2025-01','2026-10')  21
    isStale('2026-10-01', '2026-12-01')  true after STALE_AFTER_DAYS
    kb(188416)                      '184 KB'
    secs(612)                       '0.6 s'
*/

const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parts = (iso) => {
  const [y, m = '1', d = '1'] = String(iso).split('-')
  return { y: Number(y), m: Number(m), d: Number(d) }
}

export const monthLong = (iso) => LONG[parts(iso).m - 1]
export const monthYear = (iso) => `${LONG[parts(iso).m - 1]} ${parts(iso).y}`
export const monthShort = (iso) => `${SHORT[parts(iso).m - 1]} ${parts(iso).y}`
export const dateShort = (iso) => {
  const { y, m, d } = parts(iso)
  return `${SHORT[m - 1]} ${d}, ${y}`
}

export function monthRange(start, end) {
  if (!end) return `${monthYear(start)} to present`
  const a = parts(start)
  const b = parts(end)
  if (a.y === b.y) return `${LONG[a.m - 1]} to ${LONG[b.m - 1]} ${b.y}`
  return `${monthYear(start)} to ${monthYear(end)}`
}

export function monthsBetween(from, to) {
  const a = parts(from)
  const b = parts(to)
  return (b.y - a.y) * 12 + (b.m - a.m)
}

export function daysBetween(fromIso, toIso) {
  const a = Date.UTC(...isoToUtcArgs(fromIso))
  const b = Date.UTC(...isoToUtcArgs(toIso))
  return Math.round((b - a) / 864e5)
}

const isoToUtcArgs = (iso) => {
  const { y, m, d } = parts(iso)
  return [y, m - 1, d]
}

export function isStale(updatedIso, buildIso, days = STALE_AFTER_DAYS) {
  return daysBetween(updatedIso, buildIso) > days
}

export const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`
export const secs = (ms) => `${(ms / 1000).toFixed(1)} s`

/** "a · b · c" with the site's separator, skipping empty parts. */
export const dotJoin = (...xs) => xs.filter(Boolean).join(' · ')
