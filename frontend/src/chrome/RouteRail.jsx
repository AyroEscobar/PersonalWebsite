import { useEffect, useRef } from 'react'
import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'
import { getState, on } from '../lib/store.js'
import { useReducedMotion } from '../lib/mode.js'
import { onStopClick, useRoute } from './route.js'
import BottomBar from './BottomBar.jsx'

/*
  RouteRail (PLAN.md 4.5). Owned by B. The navigation as a transit line: six
  stops in scroll order, so the line is earned.

  Desktop and tablet: a vertical line in the left margin, hanging from the
  name's node in the top bar. Stops you have passed are sodium (the past),
  the stop you are at is LED (the present), the rest are unlit rings. A
  sodium fill runs down the line continuously as you read and reaches each
  stop exactly when its section reaches the reading line. The current
  stop's name is always shown; the others appear when the rail is hovered
  or focused (always, on devices without hover). When the map's ping wave
  reaches a city, the stops that city belongs to flash once.

  Phones: the BottomBar (current stop, next stop, search) and the StopsSheet.

  A real <nav> with an <ol> of links in DOM order, aria-current on the
  current stop, labels always in the accessible name. Reduced motion: the
  fill snaps from stop to stop and nothing flashes.
*/
export default function RouteRail() {
  const { index, progress } = useRoute()
  const reduced = useReducedMotion()
  const stations = useRef([])
  const last = SECTIONS.length - 1
  const fill = reduced ? index / last : progress

  // The ping wave arriving at a node ticks every stop focused on that node.
  useEffect(
    () =>
      on('nodeReached', (node) => {
        if (getState().motion === 'reduced') return
        SECTIONS.forEach((s, i) => {
          const el = stations.current[i]
          if (!el || !s.focus.nodes.includes(node)) return
          el.animate?.(
            [
              { transform: 'scale(1)', opacity: 0.9 },
              { transform: 'scale(2.6)', opacity: 0 },
            ],
            { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          )
        })
      }),
    [],
  )

  return (
    <nav aria-label={CHROME.sectionsNav.text} className="routerail" data-chrome="rail">
      <div className="rail">
        <span className="rail-line" aria-hidden="true" />
        <div className="rail-body">
          <span className="rail-track" aria-hidden="true">
            <span className="rail-fill" style={{ transform: `scaleY(${fill})` }} />
          </span>
          <ol className="rail-stops">
            {SECTIONS.map((s, i) => {
              const state = i < index ? 'visited' : i === index ? 'current' : 'upcoming'
              return (
                <li key={s.id} data-state={state}>
                  <a
                    href={`#${s.id}`}
                    className="rail-stop"
                    aria-current={i === index ? 'true' : undefined}
                    onClick={(e) => onStopClick(e, s.id)}
                  >
                    <span className="rail-station" aria-hidden="true">
                      <span className="rail-ping" ref={(el) => (stations.current[i] = el)} />
                    </span>
                    <span className="rail-label">{s.label.text}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
      <BottomBar index={index} fill={fill} />
    </nav>
  )
}
