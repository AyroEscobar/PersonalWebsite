import { useEffect, useId, useRef, useState } from 'react'
import QuietSwitch from './QuietSwitch.jsx'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import { useStore } from '../lib/store.js'
import { MenuLines } from './icons.jsx'

/*
  The nav (the file keeps its v3 name): top right, a plain row of words, 40 px tall, the active
  one in ink with a thin accent underline (aria-current), then the quiet switch. No glass: the
  camera frames the man and the rock under it, and after the hero the whole header gets a solid
  bar. Phones: a 44 px round button on a dark disc (aria-expanded, aria-controls) that opens a
  solid plate sheet of the four words and the switch, closing on a word or Escape with focus
  returned. `active`, `states` and `open` force looks for the kit.
*/
export default function NavPill({ active, states = {}, open: forcedOpen, fixed = true, className = '', ...rest }) {
  const focus = useStore((s) => s.focus)
  const [open, setOpen] = useState(false)
  const id = useId()
  const btn = useRef(null)
  const kit = active !== undefined || forcedOpen !== undefined
  const current = kit ? active : focus
  const isOpen = kit ? !!forcedOpen : open

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <nav aria-label={CHROME.sectionsNav.text} className={['nav', fixed && 'nav--fixed', isOpen && 'open', className].filter(Boolean).join(' ')} {...rest}>
      <button ref={btn} type="button" className="nav-toggle" aria-expanded={isOpen} aria-controls={`${id}-links`} aria-label={CHROME.sectionsNav.text} onClick={kit ? undefined : () => setOpen((o) => !o)}>
        <MenuLines />
      </button>
      <ul id={`${id}-links`} className="nav-links">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={current === s.id ? 'true' : undefined} className={states[s.id] ? `is-${states[s.id]}` : undefined} onClick={kit ? undefined : () => setOpen(false)} tabIndex={kit ? -1 : undefined}>
              {s.label.text}
            </a>
          </li>
        ))}
      </ul>
      <QuietSwitch pressed={kit ? !!states.quiet : undefined} />
    </nav>
  )
}
