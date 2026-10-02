import { PLANO } from '../content/constants.js'

/*
  The sun over Plano (PLAN.md 4.7 SkyWord, 2.4 horizon band). Computed on the
  device, nothing fetched. Formula from research components.md C5, checked
  Oct 1 2026: about -1 deg at 12:20 UTC (sunrise), 53.6 deg at solar noon.

    sunElevation(date)  degrees above the horizon
    skyState(date)      'night' | 'dawn' | 'day' | 'golden' | 'dusk'
                        (CHROME.sky[state] is the visible word, 'golden' reads 'golden hour')
    HORIZON[state]      the --horizon value for the map's top band

  Buckets: above 10 deg day; 0 to 10 golden (falling) or dawn (rising);
  -4 to 0 dusk (falling) or dawn (rising); below -4 night.
  Never infer anything about Ayro from this. It is the sky, not his schedule.
*/

export function sunElevation(d = new Date(), lat = PLANO.lat, lon = PLANO.lon) {
  const r = Math.PI / 180
  const n = d.getTime() / 864e5 - 10957.5
  const g = (357.529 + 0.98560028 * n) * r
  const q = 280.459 + 0.98564736 * n
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r
  const e = (23.439 - 3.6e-7 * n) * r
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))
  const dec = Math.asin(Math.sin(e) * Math.sin(L))
  const ha = (((18.697374558 + 24.06570982441908 * n) % 24) * 15 * r) + lon * r - ra
  return Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(ha)) / r
}

export function skyState(d = new Date()) {
  const el = sunElevation(d)
  if (el > 10) return 'day'
  if (el < -4) return 'night'
  const rising = sunElevation(new Date(d.getTime() + 10 * 60000)) > el
  if (el >= 0) return rising ? 'dawn' : 'golden'
  return rising ? 'dawn' : 'dusk'
}

// Thin tints only. The site must look like night at Plano noon too.
export const HORIZON = {
  night: 'color-mix(in oklab, var(--led) 4%, transparent)',
  dawn: 'color-mix(in oklab, var(--sodium) 7%, transparent)',
  day: 'color-mix(in oklab, var(--led) 10%, transparent)',
  golden: 'color-mix(in oklab, var(--sodium) 12%, transparent)',
  dusk: 'color-mix(in oklab, var(--beacon) 6%, transparent)',
}
