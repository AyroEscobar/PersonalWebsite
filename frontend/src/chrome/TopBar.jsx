import { useEffect, useRef } from 'react'
import './chrome.css'
import { HERO } from '../content/identity.js'
import { CHROME } from '../content/meta.js'
import ClockChip from './ClockChip.jsx'
import QuietToggle from './QuietToggle.jsx'
import SearchChip from './SearchChip.jsx'
import JumpHost from './JumpHost.jsx'
import NodeMark from './NodeMark.jsx'
import PrintMasthead from './PrintMasthead.jsx'
import { onStopClick } from './route.js'

/*
  TopBar (PLAN.md 3.1). Owned by B. The one <header>.

  Left, the name, led by the same lit node as the favicon. Its node sits
  exactly on the RouteRail's line, so on desktop the line reads as running
  down from the name. Right, the Plano clock, contact (a straight line to
  the signal stop, r1 T2), quiet (the visible pause control, WCAG 2.2.2) and
  search. Phones keep the name and the clock; the rest is in the bottom bar
  and the hero's contact row.

  Over the hero the bar is clear; it fills in over the first 96px of
  scroll (a scroll-driven opacity on a backing layer, where supported).
  Under 480px tall it slides away once the hero is gone (r2 U3).
  Focus order (QA step 10): name, clock, contact, quiet, search.
*/
export default function TopBar() {
  const bar = useRef(null)

  // Short screens only (chrome.css): once the hero has scrolled away, the bar
  // slides up out of the reader's way. It stays position: fixed throughout,
  // so turning a phone never resets the scroll (r2 U3).
  useEffect(() => {
    const el = bar.current
    const hero = document.querySelector('.hero')
    if (!el || !hero || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) delete el.dataset.away
      else el.dataset.away = ''
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  return (
    <header className="topbar" data-chrome="topbar" ref={bar}>
      <div className="topbar-row">
        <a href="#origin" className="tb-name" onClick={(e) => onStopClick(e, 'origin')}>
          <NodeMark className="tb-node" />
          <span>{HERO.name.text}</span>
        </a>
        <div className="tb-tools">
          <ClockChip />
          <a href="#signal" className="btn-text target-44 tb-wide tb-contact" onClick={(e) => onStopClick(e, 'signal')}>
            {CHROME.contact.text}
          </a>
          <QuietToggle className="tb-wide" />
          <SearchChip className="tb-wide" />
        </div>
      </div>
      <PrintMasthead />
      <JumpHost />
    </header>
  )
}
