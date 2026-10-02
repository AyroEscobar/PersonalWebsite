import { useEffect, useId, useRef, useState } from 'react'
import { SECTIONS } from '../content/sections.js'
import LocalClock from './LocalClock.jsx'
import NowBoard from './NowBoard.jsx'
import { syncBeacons } from './time.js'

/*
  The top bar's clock chip (PLAN.md 3.1, 4.7). "plano · 10:41 pm cdt" with
  a steady red dot: the obstruction light itself blinks once on the site,
  over Plano on the map (r1 M4). Pressing
  it opens the NowBoard as a popover under the bar: the present tense from
  anywhere on the page, and on phones the board's only home above the fold.

  Popover API (top layer, light dismiss, Esc) where supported; a plain
  toggled panel elsewhere. The panel is a non-modal dialog: it takes focus
  when it opens so a screen reader reads it, Esc or a click outside closes
  it, and focus goes back to the chip. Tabbing out of it closes it too.
*/
const supportsPopover = () => typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover')

const NOW_LABEL = SECTIONS.find((s) => s.id === 'now')?.label.text

export default function ClockChip({ className = '' }) {
  const id = `nowpop-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const btn = useRef(null)
  const pop = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = pop.current
    if (!el || !supportsPopover()) return
    const onToggle = (e) => setOpen(e.newState === 'open')
    el.addEventListener('toggle', onToggle)
    return () => el.removeEventListener('toggle', onToggle)
  }, [])

  // Opening: focus the panel so it is read, and phase-lock its beacon.
  useEffect(() => {
    if (!open) return
    pop.current?.focus({ preventScroll: true })
    syncBeacons()
    const onKey = (e) => {
      if (e.key === 'Escape' && !supportsPopover()) close(true)
    }
    const onDown = (e) => {
      if (!supportsPopover() && !pop.current?.contains(e.target) && !btn.current?.contains(e.target)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  function close(returnFocus) {
    const el = pop.current
    if (supportsPopover()) {
      try {
        el?.hidePopover()
      } catch {
        /* already closed */
      }
    } else setOpen(false)
    if (returnFocus) btn.current?.focus({ preventScroll: true })
  }

  // With the Popover API the chip is a declarative invoker (popovertarget):
  // the browser toggles, keeps the chip out of light dismiss, and returns
  // focus to it on close. The click handler is only the fallback.
  const onClick = () => {
    if (!supportsPopover()) setOpen((o) => !o)
  }

  // The fallback panel has no native Esc.
  const onPanelKey = (e) => {
    if (e.key === 'Escape' && !supportsPopover()) {
      e.preventDefault()
      close(true)
    }
  }

  // Tabbing away from the panel and the chip closes the panel.
  const onPanelBlur = (e) => {
    const next = e.relatedTarget
    if (next && !pop.current?.contains(next) && next !== btn.current) close(false)
  }

  return (
    <div className={`clockchip ${className}`.trim()}>
      <button
        ref={btn}
        type="button"
        className="clock-btn target-44"
        aria-expanded={open}
        aria-controls={id}
        popovertarget={id}
        onClick={onClick}
        data-chrome="clock"
      >
        <span className="clock-beacon" aria-hidden="true" />
        <LocalClock place />
      </button>
      <div
        ref={pop}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={NOW_LABEL}
        tabIndex={-1}
        className="nowpop"
        data-open={open ? '' : undefined}
        onKeyDown={onPanelKey}
        onBlur={onPanelBlur}
      >
        <NowBoard variant="compact" className="nowpop-board" />
      </div>
    </div>
  )
}
