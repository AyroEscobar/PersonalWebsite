import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GridPoster from './GridPoster.jsx'
import DeferredMount from '../ui/DeferredMount.jsx'
import { NODES } from '../content/places.js'
import { emit, endPing, getState, on, setTier, useStore } from '../lib/store.js'
import { detectTier, markWebGLUnavailable } from '../lib/tier.js'
import { MAP_META, cameraVars, focusLights, heroVars, mapToClient, nearestNode } from './camera.js'
import { bearingVec, exitInsets, exitOf } from './exits.js'
import { live, pulseNode } from './live.js'
import './grid.css'

const EXIT_HOLD = 1500 // ms an exit sign stays lit after the spark reaches the edge
const CAMERA_MS = 860 // the camera pan (800 ms) plus a frame or two
// An exit sign's box: 12px mono at 0.06em is 8.1 px a character, plus padding and the arrow.
const SIGN_CH = 8.1
const SIGN_PAD = 30
const SIGN_H = 19

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

  Off-grid exits (r1 M15): New York City and Waterloo are drawn only where
  their lines leave the frame, as level exit signs at the edge (exits.js).
  They are placed after layout, after every camera move and on resize, and
  sit out the camera's pan rather than chase it (no second rAF loop). When a
  ping's spark reaches the edge, that sign holds lit for 1.5 s. On phones
  the canvas mounts only once the map is near the screen (r1 M18).
*/
export default function NightGrid() {
  const focus = useStore((s) => s.focus)
  const tier = useStore((s) => s.tier)
  const motion = useStore((s) => s.motion)
  const [hl, setHl] = useState('')
  const [heroOut, setHeroOut] = useState(false)
  const [exits, setExits] = useState(null)
  const [moving, setMoving] = useState(false)
  const [lit, setLit] = useState({})
  const timer = useRef(0)
  const view = useRef(null)

  // Desktop reading: the hero frame holds only while the hero is on screen.
  // Once the origin body takes over the viewport, the map steps right and the
  // reading column goes to plain night, the same as every later stop.
  const frame = focus === 'origin' && heroOut ? 'origin-read' : focus
  const reading = frame !== 'origin'
  const style = useMemo(() => ({ ...heroVars(), ...cameraVars(frame) }), [frame])
  const lights = focusLights(focus)

  useEffect(() => {
    const hero = document.querySelector('.hero')
    if (!hero || typeof IntersectionObserver === 'undefined') return undefined
    // Out once the hero's bottom edge rises above 45% of the viewport (the root is the lower 55%).
    const io = new IntersectionObserver((es) => setHeroOut(!es.some((e) => e.isIntersecting)), { rootMargin: '-45% 0px 0px 0px' })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // Exit signs: where each off-grid line meets the frame, in .ng-view px.
  // Each sign sits just inside the edge it leaves through, its corner on the
  // line's end; two signs that would touch step apart along their edge.
  const measure = useCallback(() => {
    const v = view.current
    if (!v) return
    const r = v.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return
    const inset = exitInsets()
    const out = []
    for (const [id, { from, deg }] of Object.entries(MAP_META.offgrid)) {
      const n = MAP_META.nodes[from]
      const p = n && mapToClient(n[0], n[1])
      if (!p) continue
      const [ux, uy] = bearingVec(deg)
      const e = exitOf(p.x - r.left, p.y - r.top, ux, uy, r.width, r.height, inset)
      if (!e) continue
      const w = NODES[id].text.length * SIGN_CH + SIGN_PAD
      const box =
        e.side === 'left'
          ? { l: e.x - 4, t: e.y - 6 - SIGN_H }
          : e.side === 'top'
            ? { l: e.x - w + 8, t: e.y - 2 - SIGN_H }
            : e.side === 'bottom'
              ? { l: e.x - w + 4, t: e.y - 10 - SIGN_H }
              : { l: e.x - w + 4, t: e.y - 6 - SIGN_H }
      out.push({ id, deg, ...e, w, ...box })
    }
    const along = (s) => s.side === 'top' || s.side === 'bottom'
    out.sort((a, b) => (along(a) ? b.l - a.l : a.t - b.t))
    for (let i = 1; i < out.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = out[j]
        const b = out[i]
        const hit = a.l < b.l + b.w + 10 && b.l < a.l + a.w + 10 && a.t < b.t + SIGN_H + 8 && b.t < a.t + SIGN_H + 8
        if (!hit) continue
        if (along(b)) b.l = a.l - b.w - 10
        else b.t = a.t + SIGN_H + 8
      }
    }
    for (const s of out) {
      s.l = Math.max(inset.left, Math.min(r.width - inset.right - s.w, s.l))
      s.t = Math.max(0, Math.min(r.height - SIGN_H, s.t))
    }
    setExits(out)
  }, [])

  useEffect(() => {
    const v = view.current
    if (!v) return undefined
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => measure())
    ro.observe(v)
    return () => ro.disconnect()
  }, [measure])

  // The camera moved: hide the signs for the pan, then place them again.
  const firstFrame = useRef(true)
  useEffect(() => {
    if (firstFrame.current) {
      firstFrame.current = false
      return undefined
    }
    const still = motion === 'reduced'
    if (!still) setMoving(true)
    const t = window.setTimeout(() => {
      measure()
      setMoving(false)
    }, still ? 0 : CAMERA_MS)
    return () => window.clearTimeout(t)
  }, [frame, measure, motion])

  useEffect(() => {
    const timers = {}
    const off = on('offgridReached', (id) => {
      setLit((l) => ({ ...l, [id]: true }))
      window.clearTimeout(timers[id])
      timers[id] = window.setTimeout(() => setLit((l) => ({ ...l, [id]: false })), EXIT_HOLD)
    })
    return () => {
      off()
      Object.values(timers).forEach((t) => window.clearTimeout(t))
    }
  }, [])

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
      data-reading={reading ? '' : undefined}
      data-lit={lights.nodes || undefined}
      data-off={lights.offgrid || undefined}
      data-hl={hl || undefined}
      style={style}
    >
      <div className="ng-view" ref={view}>
        <div className="ng-layers">
          <div className="ng-horizon" aria-hidden="true" data-deco="" />
          <GridPoster variant="hero" />
          <DeferredMount
            load={() => import('./GridCanvas.jsx')}
            tiers={['full', 'lite']}
            when={tier === 'lite' ? 'visible' : 'load'}
            rootMargin="0px"
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
        <div className="ng-exits" aria-hidden="true" data-moving={moving || !exits ? '' : undefined}>
          {exits && (
            <svg className="ng-exit-roads" focusable="false">
              {exits.map((e) => (
                <line key={e.id} className="ng-exit-road" data-node={e.id} data-lit={lit[e.id] ? '' : undefined} x1={e.sx} y1={e.sy} x2={e.x} y2={e.y} />
              ))}
            </svg>
          )}
          {exits?.map((e) => (
            <span
              key={e.id}
              className="ng-exit"
              data-node={e.id}
              data-side={e.side}
              data-lit={lit[e.id] ? '' : undefined}
              style={{ '--x': `${Math.round(e.l)}px`, '--y': `${Math.round(e.t)}px` }}
            >
              <span className="ng-exit-name">{NODES[e.id].text}</span>
              <span className="ng-exit-name ng-exit-hot">{NODES[e.id].text}</span>
              <svg className="ng-exit-chev" viewBox="-8 -8 16 16" focusable="false" style={{ '--deg': `${e.deg - 90}deg` }}>
                <path d="M-6 0H5M1 -4L5 0L1 4" />
              </svg>
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {Object.entries(NODES).map(([id, n]) => (
          <li key={id}>{n.a11y}</li>
        ))}
      </ul>
    </div>
  )
}
