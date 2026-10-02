import { useEffect, useState } from 'react'
import { FOOTER } from '../content/meta.js'
import { kb, secs } from '../lib/format.js'
import { afterLoad } from '../lib/idle.js'

/*
  VisitStamp (PLAN.md 4.14). "this visit: 184 KB, first paint 1.2 s on your
  device", or "first paint 640 ms" under a second. Measured on this visit by
  this browser: the transfer size of the document and every resource it
  pulled, and the first-contentful-paint entry. It keeps counting what the visit loads later (opening search pulls
  a small chunk), at most once a second. If either number is unavailable
  (no Resource Timing sizes, no Paint Timing, everything served from cache)
  the line is simply not there. Never a live region.

  The <p> always renders so the footer does not shift when the text lands.
*/
function measure() {
  const nav = performance.getEntriesByType?.('navigation')?.[0]
  const res = performance.getEntriesByType?.('resource') || []
  const fcp = performance.getEntriesByType?.('paint')?.find((p) => p.name === 'first-contentful-paint')
  if (!nav || !fcp || typeof nav.transferSize !== 'number') return null
  const bytes = res.reduce((s, r) => s + (r.transferSize || 0), nav.transferSize || 0)
  if (!bytes) return null
  return { bytes, fcp: fcp.startTime }
}

// Under a second, milliseconds read better than "0.0 s".
const paint = (ms) => (ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : secs(ms))

export default function VisitStamp({ className = '' }) {
  const [m, setM] = useState(null)

  useEffect(() => {
    if (typeof performance === 'undefined') return
    let po
    let t = 0
    let stopped = false
    const take = () => {
      t = 0
      if (!stopped) setM(measure())
    }
    afterLoad().then(() => {
      if (stopped) return
      take()
      if (typeof PerformanceObserver === 'undefined') return
      try {
        po = new PerformanceObserver(() => {
          if (!t) t = window.setTimeout(take, 1000)
        })
        po.observe({ type: 'resource', buffered: false })
      } catch {
        po = null
      }
    })
    return () => {
      stopped = true
      window.clearTimeout(t)
      po?.disconnect()
    }
  }, [])

  return (
    <p className={`stamp visit-stamp ${className}`.trim()}>
      {m && (
        <>
          <span className="stamp-key">{FOOTER.visitPrefix.text}</span> {kb(m.bytes)}, {FOOTER.visitPaint.text} {paint(m.fcp)}{' '}
          {FOOTER.visitSuffix.text}
        </>
      )}
    </p>
  )
}
