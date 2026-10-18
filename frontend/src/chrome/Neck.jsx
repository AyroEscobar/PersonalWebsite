import { useEffect, useId, useRef, useState } from 'react'
import Wordmark from '../ui/Wordmark.jsx'
import ThemeSwitch from '../ui/ThemeSwitch.jsx'
import QuietSwitch from '../ui/QuietSwitch.jsx'
import Button from '../ui/Button.jsx'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import { HERO } from '../content/identity.js'
import { useStore } from '../lib/store.js'

/*
  The neck (the header): fixed, 68 px, three columns. The wordmark left; the four section words in the
  middle with interpuncts between them (the current one underlined, aria-current); the theme switch,
  the quiet switch and an outlined small "Grab a coffee chat" right. Under it, while it sits on the clay,
  the tongue band: the black tongues at the top of an amphora's shoulder. After 80 px of scroll it is a
  ground bar with a 1 px rule and the tongues go (html.scrolled, src/lib/client.js).

  Under 960 px: the wordmark and a "menu" button (aria-expanded, aria-controls). The sheet lists the
  four words with their numerals, the coffee chat and the two switches; a word or Escape closes it and
  Escape returns focus to the button. `active`, `open` and `scrolled` force looks for the kit (inert);
  `hrefBase="/"` points the words at the home page (the 404 and the kit).
*/
export default function Neck({ active, open: forcedOpen, scrolled = false, fixed = true, wordmarkHref = '#top', hrefBase = '', className = '' }) {
  const focus = useStore((s) => s.focus)
  const [open, setOpen] = useState(false)
  const id = useId()
  const btn = useRef(null)
  const sheet = useRef(null)
  const kit = active !== undefined || forcedOpen !== undefined
  const current = kit ? active : focus
  const isOpen = kit ? !!forcedOpen : open

  useEffect(() => {
    if (!open) return undefined
    sheet.current?.querySelector('a, button')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = kit ? undefined : () => setOpen(false)
  // the theme from the sheet: the sheet closes (220 ms, focus back on the menu button), then the vase is
  // fired, so the switch happens on the painting, not behind the sheet; at once when nothing moves
  const closeThenFire = (flip) => {
    setOpen(false)
    btn.current?.focus()
    if (document.documentElement.dataset.tier === 'still') flip()
    else setTimeout(flip, 240)
  }
  const tab = kit ? -1 : undefined
  return (
    <header className={['neck', fixed && 'neck--fixed', isOpen && 'is-open', scrolled && 'is-scrolled', className].filter(Boolean).join(' ')}>
      <div className="neck-row">
        <Wordmark href={wordmarkHref} />
        <nav className="nav" aria-label={CHROME.sectionsNav.text}>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`${hrefBase}#${s.id}`} aria-current={current === s.id ? 'true' : undefined} tabIndex={tab}>
                  {s.label.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="neck-tools">
          <ThemeSwitch pressed={kit ? false : undefined} />
          <QuietSwitch pressed={kit ? false : undefined} />
          <Button variant="line" size="sm" href={HERO.coffee.href} rel="noopener" tabIndex={tab}>
            {HERO.coffee.label}
          </Button>
        </div>
        <button ref={btn} type="button" className="menu-btn" aria-expanded={isOpen} aria-controls={`${id}-sheet`} onClick={kit ? undefined : () => setOpen((o) => !o)} tabIndex={tab}>
          {isOpen ? CHROME.menuClose.text : CHROME.menuOpen.text}
        </button>
      </div>
      <div className="tongues" aria-hidden="true" data-deco="" />
      <div ref={sheet} id={`${id}-sheet`} className="sheet" hidden={!isOpen}>
        <nav aria-label={CHROME.sectionsNav.text}>
          <ul className="sheet-nav">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`${hrefBase}#${s.id}`} aria-current={current === s.id ? 'true' : undefined} onClick={close} tabIndex={tab}>
                  <span className="num" aria-hidden="true">
                    {s.numeral.text}
                  </span>
                  {s.label.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Button variant="fill" href={HERO.coffee.href} rel="noopener" onClick={close} tabIndex={tab}>
          {HERO.coffee.label}
        </Button>
        <div className="sheet-tools">
          <ThemeSwitch pressed={kit ? false : undefined} before={kit ? undefined : closeThenFire} />
          <QuietSwitch pressed={kit ? false : undefined} />
        </div>
      </div>
    </header>
  )
}
