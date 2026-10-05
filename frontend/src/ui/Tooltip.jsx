import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

/*
  <Tooltip label="copy ayro.escobar@gmail.com"><Button .../></Tooltip> (DESIGN.md 5.10)

  Solid ink, r-3, Inter 500 13. Never the only place a label lives: it adds
  to a control that already says what it does.
    - pointer: shown after 400 ms the first time; while another tooltip is
      open, or just closed, it shows at once with no animation
    - keyboard: shown on focus-visible, at once
    - Escape hides it (WCAG 1.4.13); leaving hides it in 100 ms
  `open` forces it shown (the kit). `below` places it under the anchor.
  Near a screen edge it aligns to the anchor's start or end instead of
  its centre, so it never leaves the viewport.
*/
let openCount = 0
let warmUntil = 0
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0)

export default function Tooltip({ label, children, open: forced = false, below = false }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [instant, setInstant] = useState(false)
  const timer = useRef(0)
  const tipRef = useRef(null)
  const [align, setAlign] = useState(null)
  const isOpen = forced || open

  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!isOpen || !tip) return
    const wrap = tip.parentElement.getBoundingClientRect()
    const w = tip.offsetWidth
    const mid = wrap.left + wrap.width / 2
    setAlign(mid - w / 2 < 8 ? 'start' : mid + w / 2 > window.innerWidth - 8 ? 'end' : null)
  }, [isOpen])

  useEffect(() => {
    if (!open) return
    openCount++
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => {
      openCount--
      warmUntil = now() + 300
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (immediate) => {
    window.clearTimeout(timer.current)
    const warm = openCount > 0 || now() < warmUntil
    if (immediate || warm) {
      setInstant(warm)
      setOpen(true)
    } else {
      setInstant(false)
      timer.current = window.setTimeout(() => setOpen(true), 400)
    }
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      className="tip-wrap"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(false)}
      onPointerLeave={hide}
      onFocus={(e) => e.target.matches?.(':focus-visible') && show(true)}
      onBlur={hide}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        role="tooltip"
        id={id}
        ref={tipRef}
        data-align={align ?? undefined}
        className={`tip ${below ? 'tip--below' : ''}`.trim()}
        data-open={isOpen ? '' : undefined}
        data-instant={instant && !forced ? '' : undefined}
      >
        {label}
      </span>
    </span>
  )
}
