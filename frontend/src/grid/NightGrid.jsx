import { useEffect, useMemo, useRef, useState } from 'react'
import GridPoster from './GridPoster.jsx'
import DeferredMount from '../ui/DeferredMount.jsx'
import { NODES } from '../content/places.js'
import { emit, endPing, getState, on, setTier, useStore } from '../lib/store.js'
import { detectTier, markWebGLUnavailable } from '../lib/tier.js'
import { cameraVars, focusLights, heroVars, nearestNode } from './camera.js'
import { live, pulseNode } from './live.js'
import './grid.css'

/*
  NightGrid (PLAN.md 4.1). Owned by A. The map behind the page.

    phones and tablets   the hero: a 70svh (64svh) block at the top of <main>,
                         US-75 as the spine; it scrolls away with the hero
    desktop (1100+)      full bleed in the hero, then a dimmed sticky layer
                         on the right while you read; the camera follows
                         store.focus (written by B's route.js)

  Layers: the SVG poster (always, prerendered), the WebGL canvas for the ping
  wave and ambient traffic (tiers full and lite, after load), a horizon band
  tinted by the sky over Plano (--horizon, from B's SkyWord), and a scrim
  that keeps the reading column on plain night.

  Pings come from the hero (A) and the JumpList (B) through store.ping().
  With the canvas up, GridCanvas runs the wave. Otherwise (reduced motion,
  quiet mode, no WebGL2, or before load) the nearest node lights for 600 ms.
*/
export default function NightGrid() {
  const focus = useStore((s) => s.focus)
  const [hl, setHl] = useState('')
  const timer = useRef(0)

  const style = useMemo(() => ({ ...heroVars(), ...cameraVars(focus) }), [focus])
  const lights = focusLights(focus)

  useEffect(() => {
    const off1 = on('ping', (p) => {
      if (live.canvas) return
      const node = p.node ?? (p.x != null ? nearestNode(p.x, p.y) : 'plano')
      setHl(node)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setHl('')
        endPing(p.id)
      }, 600)
      emit('nodeReached', node)
    })
    const off2 = on('nodeReached', (node) => pulseNode(node, { motion: getState().motion !== 'reduced' }))
    return () => {
      off1()
      off2()
      window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <div
      className="ng"
      data-focus={focus}
      data-lit={lights.nodes || undefined}
      data-off={lights.offgrid || undefined}
      data-hl={hl || undefined}
      style={style}
    >
      <div className="ng-view">
        <div className="ng-layers">
          <div className="ng-horizon" aria-hidden="true" data-deco="" />
          <GridPoster variant="hero" />
          <DeferredMount
            load={() => import('./GridCanvas.jsx')}
            tiers={['full', 'lite']}
            className="ng-canvas"
            aria-hidden="true"
            data-deco=""
            onError={() => {
              live.canvas = false
              markWebGLUnavailable()
              setTier(detectTier())
            }}
          />
        </div>
        <div className="ng-scrim" aria-hidden="true" data-deco="" />
      </div>
      <ul className="sr-only">
        {Object.entries(NODES).map(([id, n]) => (
          <li key={id}>{n.a11y}</li>
        ))}
      </ul>
    </div>
  )
}
