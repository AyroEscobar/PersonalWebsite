import { useEffect, useState } from 'react'
import { Figures } from './text.jsx'

/*
  DeskBranch (PLAN.md 4.8): the six RBC desks as a branch line that leaves
  the RBC plate's rule and runs through six stations, in rotation order.

  One native <details>, open from the first paint on every width, so the
  desks are in the prerendered HTML and nothing shifts while you scroll.
  On tablets and up the summary is hidden and the branch always shows; on
  phones the summary ("six desks") folds it, with a height transition where
  the browser can animate to auto.
*/
export default function DeskBranch({ desks, label }) {
  const [open, setOpen] = useState(true)

  // Folded on a phone, then rotated to a wider screen: the summary is gone there, so reopen.
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 720px)')
    if (!mq) return
    const sync = () => mq.matches && setOpen(true)
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  return (
    <details className="desks" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {label}
      </summary>
      <ol className="desk-line">
        {desks.map((d) => (
          <li key={d.id} className="desk">
            <span className="desk-dot" aria-hidden="true" />
            <h4 className="desk-name">{d.name}</h4>
            <p className="desk-text">
              <Figures text={d.text} />
            </p>
          </li>
        ))}
      </ol>
    </details>
  )
}
