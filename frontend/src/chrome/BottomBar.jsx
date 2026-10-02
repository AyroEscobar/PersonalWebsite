import { useRef } from 'react'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import SearchChip from './SearchChip.jsx'
import StopsSheet from './StopsSheet.jsx'
import { onStopClick } from './route.js'

/*
  BottomBar (PLAN.md 4.5, phones under 720px). The rail turned sideways:
  a thin sodium fill along the top edge shows how far down the line you
  are; below it, the stop you are at (opens every stop in a sheet), the next
  stop as a link, and search. 56px tall plus the home indicator's safe
  area. Hidden while any dialog is open. The last stop's "next" is the
  first stop, with an up arrow, standing in for back-to-top.
*/
function Chevron({ dir = 'right' }) {
  const d = dir === 'up' ? 'M4 10l4-4 4 4' : 'M6 4l4 4-4 4'
  return (
    <svg className="bb-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

export default function BottomBar({ index, fill }) {
  const sheet = useRef(null)
  const btn = useRef(null)
  const cur = SECTIONS[index]
  const next = SECTIONS[index + 1]
  const wrap = !next

  return (
    <div className="bottombar" data-chrome="bottombar">
      <span className="bb-track" aria-hidden="true">
        <span className="bb-fill" style={{ transform: `scaleX(${fill})` }} />
      </span>
      <div className="bb-row">
        <button
          ref={btn}
          type="button"
          className="bb-stop"
          aria-haspopup="dialog"
          aria-label={`${cur.label.text}, ${CHROME.stopsSheet.text}`}
          onClick={() => sheet.current?.open(btn.current)}
        >
          <span className="bb-station" aria-hidden="true" />
          <span className="bb-current">{cur.label.text}</span>
          <Chevron dir="up" />
        </button>
        <a
          className="bb-next"
          href={`#${wrap ? SECTIONS[0].id : next.id}`}
          onClick={(e) => onStopClick(e, wrap ? SECTIONS[0].id : next.id)}
        >
          {!wrap && <span className="bb-next-word">{CHROME.next.text}</span>}
          <span className="bb-next-label">{wrap ? SECTIONS[0].label.text : next.label.text}</span>
          <Chevron dir={wrap ? 'up' : 'right'} />
        </a>
        <SearchChip bare className="bb-search" />
      </div>
      <StopsSheet ref={sheet} index={index} />
    </div>
  )
}
