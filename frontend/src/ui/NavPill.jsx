import { useEffect, useId, useRef, useState } from 'react'
import Glass from '../glass/Glass.jsx'
import QuietSwitch from './QuietSwitch.jsx'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import { useStore } from '../lib/store.js'
import { MenuLines } from './icons.jsx'

/*
  <NavPill> (DESIGN.md 5.7): top right, a clear glass pill 44 px tall with the four links, the
  active one cyan (aria-current), then the quiet switch after an inset divider. Phones: a 44 px
  round glass button (aria-expanded, aria-controls) that opens a glass sheet of the four links
  under it, closing on a link click or Escape with focus returned.
  `active`, `states` and `open` force looks for the kit.
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
    <Glass as="nav" tier="clear" pill aria-label={CHROME.sectionsNav.text} className={['nav', fixed && 'nav--fixed', isOpen && 'open', className].filter(Boolean).join(' ')} {...rest}>
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
    </Glass>
  )
}
