import { useEffect, useId, useImperativeHandle, useRef } from 'react'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import { NODES } from '../content/places.js'
import QuietToggle from './QuietToggle.jsx'
import { goTo } from './route.js'

/*
  StopsSheet (PLAN.md 4.5, phones). Every stop on the line in a native
  <dialog> sheet from the bottom edge: 48px rows, the current one marked,
  and beside each stop the cities its part of the story happened in (the
  same nodes the map lights for it). Quiet mode lives here on phones.

  showModal() gives the focus trap, Esc and the inert page; a tap on the
  dimmed page closes it (closedby="any", plus a backdrop fallback). Choosing
  a stop closes the sheet, then scrolls and lands focus on that heading.
  Slides up 220ms on the drawer curve; reduced motion fades instead.
*/
export default function StopsSheet({ ref, index }) {
  const dialog = useRef(null)
  const opener = useRef(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  useImperativeHandle(ref, () => ({
    open(from) {
      const d = dialog.current
      if (!d || d.open) return
      opener.current = from || null
      try {
        d.showModal()
      } catch {
        d.setAttribute('open', '')
      }
      document.documentElement.dataset.dialog = 'stops'
    },
  }))

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    const onClose = () => {
      if (document.documentElement.dataset.dialog === 'stops') delete document.documentElement.dataset.dialog
      opener.current = null
    }
    d.addEventListener('close', onClose)
    return () => d.removeEventListener('close', onClose)
  }, [])

  const close = () => dialog.current?.open && dialog.current.close()

  const choose = (e, id) => {
    e.preventDefault()
    close()
    goTo(id)
  }

  return (
    <dialog
      ref={dialog}
      className="stops-sheet"
      aria-labelledby={`${uid}-h`}
      closedby="any"
      onClick={(e) => e.target === dialog.current && close()}
    >
      <div className="ss-panel">
        <div className="ss-head">
          <p id={`${uid}-h`} className="label">
            {CHROME.stopsSheet.text}
          </p>
          <button type="button" className="btn-text target-44 ss-close" onClick={close}>
            {CHROME.close.text}
          </button>
        </div>
        <div className="ss-route">
          <span className="ss-fill" aria-hidden="true" style={{ transform: `scaleY(${index / (SECTIONS.length - 1)})` }} />
          <ol className="ss-stops">
            {SECTIONS.map((s, i) => {
              const state = i < index ? 'visited' : i === index ? 'current' : 'upcoming'
              const places = [...s.focus.nodes, ...s.focus.offgrid].map((n) => NODES[n]?.text).filter(Boolean)
              return (
                <li key={s.id} data-state={state}>
                  <a href={`#${s.id}`} className="ss-stop" aria-current={i === index ? 'true' : undefined} onClick={(e) => choose(e, s.id)}>
                    <span className="ss-station" aria-hidden="true" />
                    <span className="ss-label">{s.label.text}</span>
                    {places.length > 0 && <span className="ss-places mono">{places.join(' · ')}</span>}
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="ss-foot">
          <QuietToggle variant="row" />
        </div>
      </div>
    </dialog>
  )
}
