import { CHROME } from '../content/meta.js'
import { useSky } from './time.js'

/*
  SkyWord (PLAN.md 4.7). The sun over Plano right now, as a word: night,
  dawn, day, golden hour or dusk. Computed on the device from the solar
  elevation (src/lib/sun.js), never fetched, and never read as a claim about
  Ayro's day. The word always carries the state; the small sky mark beside
  it is decoration. Renders nothing until the clock is running.
*/
export default function SkyWord({ className = '', mark = true }) {
  const sky = useSky()
  if (!sky) return null
  return (
    <span className={`sky ${className}`.trim()} data-sky={sky}>
      {mark && <span className="sky-mark" aria-hidden="true" />}
      {CHROME.sky[sky].text}
    </span>
  )
}
