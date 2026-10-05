import { useLayoutEffect, useRef } from 'react'
import Glass from '../glass/Glass.jsx'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'

/*
  The lens nav (DESIGN.md 5.1): one <nav> element that is the reading lens
  first and the navigation after the morph. Six words: origin, now, work,
  builds, crew, contact. Each link holds the upright Inter word and the
  italic serif word; the current one shows the italic (aria-current). The
  bead (a soft lens on the current word with a 2px line under it) moves by
  translateX and scaleX.

    state   'lens' | 'pill' | 'dock'   the look (the page's nav.js drives the morph)
    fixed   pinned: a pill at the top on wide screens, a dock on phones (auto)
    active  the current section id
    states  kit only: { [sectionId]: 'hover' | 'focus' | 'active' }
    over    content is scrolling under it (.over-content)
*/
export default function LensNav({ state = 'pill', fixed = false, auto = false, active = 'origin', states = {}, over = false, className = '', ref, ...rest }) {
  const listRef = useRef(null)
  const beadRef = useRef(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const bead = beadRef.current
    if (!list || !bead || state === 'lens') return
    const place = () => {
      const a = list.querySelector('[aria-current]')
      if (!a) return
      const lr = list.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      if (!lr.width) return
      bead.style.transform = `translateX(${ar.left - lr.left}px) scaleX(${ar.width / 100})`
      bead.dataset.placed = ''
    }
    place()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    ro?.observe(list)
    document.fonts?.ready.then(place)
    return () => ro?.disconnect()
  }, [active, state])

  const cls = ['lens-nav', `is-${state}`, fixed && 'is-fixed', auto && 'is-auto', over && 'over-content', className].filter(Boolean).join(' ')
  return (
    <Glass as="nav" ref={ref} tier="clear" spec lens={state} className={cls} aria-label={CHROME.sectionsNav.text} {...rest}>
      <span className="caustic" aria-hidden="true" />
      <span className="loupe" aria-hidden="true" />
      <ul className="nav-list" ref={listRef}>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              className={`nav-a ${states[s.id] ? `is-${states[s.id]}` : ''}`.trim()}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'true' : undefined}
              tabIndex={state === 'lens' ? -1 : undefined}
            >
              <span className="nav-sans">{s.label.text}</span>
              <span className="nav-it" aria-hidden="true">
                {s.label.text}
              </span>
            </a>
          </li>
        ))}
        <li className="bead" aria-hidden="true" ref={beadRef} />
      </ul>
    </Glass>
  )
}
