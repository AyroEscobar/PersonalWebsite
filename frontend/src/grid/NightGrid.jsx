import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GridPoster from './GridPoster.jsx'
import DeferredMount from '../ui/DeferredMount.jsx'
import { NODES } from '../content/places.js'
import { emit, endPing, getState, on, setTier, useStore } from '../lib/store.js'
import { detectTier, markWebGLUnavailable } from '../lib/tier.js'
import { MAP_META, cameraVars, focusLights, heroVars, mapToClient, nearestNode } from './camera.js'
import { ROW_BELOW, bearingVec, crossAt, exitInsets, exitOf, lineHitsBox, stretchFor } from './exits.js'
import { live, pulseNode } from './live.js'
import './grid.css'

const EXIT_HOLD = 1500 // ms an exit sign stays lit after the spark reaches the edge
const CAMERA_MS = 860 // the camera pan (800 ms) plus a frame or two
const GAP = 8 // px between two signs, and between a sign and what it steps off
const PASSES = 8 // placement passes before giving up on a perfect fit
const ARROW = 16 // px from a sign's right edge to the middle of its arrow
const OFFGRID = Object.keys(MAP_META.offgrid)

/* US-75 between Richardson and Allen (the LED spine), as view px [x, y, ...]. */
function spinePoints(v, r) {
  const path = v.querySelector('[id$="-spine"]')
  if (!path?.getTotalLength) return []
  const len = path.getTotalLength()
  const out = []
  for (let i = 0; i <= 48; i++) {
    const q = path.getPointAtLength((len * i) / 48)
    const c = mapToClient(q.x, q.y)
    if (c) out.push(c.x - r.left, c.y - r.top)
  }
  return out
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

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

  // Exit signs (r2 U2): where each off-grid line meets the frame, in .ng-view
  // px. Each sign is measured as rendered (text spacing changes its width).
  // Its arrow sits at the line's end on the frame edge with the name just
  // inside; under 480px wide there are no lines and the two signs share one
  // row along the map's top edge. Then, until nothing moves (8 passes at
  // most): keep inside the frame, step off city dots, names and US-75, and
  // step apart from each other (a second top-edge sign that cannot fit drops
  // one row). A line that would cross US-75 starts past it instead.
  const measure = useCallback(() => {
    const v = view.current
    if (!v) return
    const r = v.getBoundingClientRect()
    const W = r.width
    const H = r.height
    if (W < 1 || H < 1) return
    const inset = exitInsets(W)
    const bar = inset.top - 22
    const row = W < ROW_BELOW
    const size = {}
    for (const el of v.querySelectorAll('.ng-exit')) size[el.dataset.node] = { w: el.offsetWidth, h: el.offsetHeight }
    const spine = spinePoints(v, r)

    // City labels near the right edge read to the left of their dot (r2 N14).
    for (const node of v.querySelectorAll('.ng-cam[data-variant="hero"] .ng-node')) {
      const dot = node.querySelector('.ng-dot')?.getBoundingClientRect()
      const label = node.querySelector('.ng-label:not(.ng-label-hot)')?.getBoundingClientRect()
      if (!dot || !label || !dot.width) continue
      const flip = dot.right + 9 + label.width > r.right - 8 && dot.left - 9 - label.width > r.left + 8
      if (flip) node.dataset.flip = ''
      else delete node.dataset.flip
    }

    const avoid = [...v.querySelectorAll('.ng-cam[data-variant="hero"] .ng-node')].map((node) => {
      const parts = [...node.querySelectorAll('.ng-dot, .ng-label:not(.ng-label-hot)')].map((e) => e.getBoundingClientRect())
      return {
        l: Math.min(...parts.map((b) => b.left)) - r.left - 6,
        t: Math.min(...parts.map((b) => b.top)) - r.top - 6,
        r: Math.max(...parts.map((b) => b.right)) - r.left + 6,
        b: Math.max(...parts.map((b) => b.bottom)) - r.top + 6,
      }
    })

    const out = []
    for (const id of OFFGRID) {
      const { from, deg } = MAP_META.offgrid[id]
      const n = MAP_META.nodes[from]
      const p = n && mapToClient(n[0], n[1])
      if (!p) continue
      const px0 = p.x - r.left
      const py0 = p.y - r.top
      const [ux, uy] = bearingVec(deg)
      const e = exitOf(px0, py0, ux, uy, W, H, inset, stretchFor(W))
      if (!e) continue
      const { w, h } = size[id] ?? { w: 120, h: 19 }
      let line = null
      if (!row) {
        line = { sx: e.sx, sy: e.sy, x: e.x, y: e.y }
        let cut = -1
        for (let i = 0; i + 3 < spine.length; i += 2) cut = Math.max(cut, crossAt(line.sx, line.sy, line.x, line.y, spine[i], spine[i + 1], spine[i + 2], spine[i + 3]))
        if (cut >= 0) {
          const len = Math.hypot(line.x - line.sx, line.y - line.sy)
          const k = Math.min(1, cut + 12 / Math.max(len, 1))
          line.sx += (line.x - line.sx) * k
          line.sy += (line.y - line.sy) * k
          if (Math.hypot(line.x - line.sx, line.y - line.sy) < 24) line = null
        }
      }
      const left = e.side === 'left'
      out.push({
        id,
        deg,
        side: e.side,
        line,
        w,
        h,
        ex: e.x,
        // The ray's distance from its node to the drawn stretch, for the spark (PingWave).
        run: line ? [Math.hypot(line.sx - px0, line.sy - py0), Math.hypot(line.x - px0, line.y - py0)] : null,
        edge: e.t,
        l: left ? e.x - ARROW + 6 : e.x - w + ARROW,
        t: e.y - h / 2,
      })
    }

    // Candidates for each sign, best first: its arrow on the line's end, then
    // a step at a time along the edge, then one row in from the edge. The
    // first candidate inside the frame and clear of the city dots and names,
    // of US-75 and of the signs already placed wins. Under 480px wide the
    // signs share one row under the bar instead (no lines).
    const touches = (a, b, pad) => a.l < b.l + b.w + pad && b.l < a.l + a.w + pad && a.t < b.t + b.h + pad && b.t < a.t + a.h + pad
    // A sign may reach past the line's inset by its arrow (the arrow sits on the line's end), never off the frame.
    const fr = { l: Math.max(4, inset.left - ARROW), r: W - Math.max(4, inset.right - ARROW), t: bar + 4, b: H - Math.max(4, inset.bottom - ARROW) }
    const inFrame = (c) => c.l >= fr.l - 0.5 && c.l + c.w <= fr.r + 0.5 && c.t >= fr.t - 0.5 && c.t + c.h <= fr.b + 0.5
    const onCity = (c) => avoid.some((a) => c.l < a.r && a.l < c.l + c.w && c.t < a.b && a.t < c.t + c.h)
    const onRoad = (c) => spine.length > 3 && lineHitsBox(spine, { l: c.l - 3, t: c.t - 3, r: c.l + c.w + 3, b: c.t + c.h + 3 })
    const placed = []
    // Pass 0 wants 6px of night around every city; each later pass gives up 2px of it.
    const nearCity = (c, give) => avoid.some((a) => c.l < a.r - give && a.l + give < c.l + c.w && c.t < a.b - give && a.t + give < c.t + c.h)
    // Nor on the other exit's line.
    const onLine = (c, id) =>
      out.some((o) => o.id !== id && o.line && lineHitsBox([o.line.sx, o.line.sy, o.line.x, o.line.y], { l: c.l - 3, t: c.t - 3, r: c.l + c.w + 3, b: c.t + c.h + 3 }))
    // What a pass may give up, in order: a little night around the cities,
    // then the other exit's line, then US-75, then the cities. Never the
    // frame, never the other sign.
    const clear = (c, pass, id) =>
      inFrame(c) &&
      !placed.some((q) => touches(c, q, GAP)) &&
      (pass >= 5 || !onRoad(c)) &&
      (pass >= 4 || !onLine(c, id)) &&
      (pass >= 6 || !(pass ? nearCity(c, 2 * Math.min(pass, 3)) : onCity(c)))
    const candidates = (s) => {
      const out2 = []
      const at = (l, t) => out2.push({ l: clamp(l, fr.l, fr.r - s.w), t: clamp(t, fr.t, fr.b - s.h) })
      const onTop = row || s.side === 'top' || s.side === 'bottom'
      if (onTop) {
        // Along the edge first; a sign that cannot fit there drops a row.
        for (const dy of [0, s.h + GAP, 2 * (s.h + GAP)])
          for (let k = 0; k <= 12; k++) {
            at(s.l - k * GAP, s.t + (s.side === 'bottom' ? -dy : dy))
            if (k) at(s.l + k * GAP, s.t + (s.side === 'bottom' ? -dy : dy))
          }
      } else
        for (let k = 0; k <= 16; k++) {
          at(s.l, s.t + k * GAP)
          if (k) at(s.l, s.t - k * GAP)
        }
      return out2
    }
    if (row) {
      out.sort((a, b) => a.ex - b.ex)
      let x = W - inset.right
      for (let i = out.length - 1; i >= 0; i--) {
        out[i].l = x - out[i].w
        out[i].t = bar + 6
        x = out[i].l - 2 * GAP
      }
      out.reverse()
    } else out.sort((a, b) => b.ex - a.ex || a.t - b.t)
    for (const s of out) {
      const keep = { l: s.l, t: s.t }
      let best = null
      for (let pass = 0; pass < PASSES && !best; pass++) {
        for (const c of candidates(s)) {
          const cand = { ...c, w: s.w, h: s.h }
          if (clear(cand, pass, s.id)) {
            best = cand
            break
          }
        }
      }
      const pick = best ?? { l: clamp(keep.l, fr.l, fr.r - s.w), t: clamp(keep.t, fr.t, fr.b - s.h) }
      s.l = pick.l
      s.t = pick.t
      placed.push(s)
    }
    live.exits = Object.fromEntries(out.map((s) => [s.id, { run: s.run, edge: s.edge }]))
    setExits(out)
  }, [])

  useEffect(() => {
    const v = view.current
    if (!v) return undefined
    measure()
    // Once the mono face has arrived, the signs have their real widths.
    document.fonts?.ready?.then(() => measure()).catch(() => {})
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

  // Desktop reading (r2 U6): as a plate or row with a place reaches the 42%
  // reading line, that place flares once on the sticky map (Allen for MD7,
  // Plano for JPMorgan, the New York exit for RBC, Richardson for UT Dallas).
  // Once per element per visit; never under reduced motion or quiet mode.
  useEffect(() => {
    if (motion === 'reduced' || typeof IntersectionObserver === 'undefined' || !window.matchMedia?.('(min-width: 1100px)').matches) return undefined
    const fired = new WeakSet()
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting || fired.has(e.target)) continue
          fired.add(e.target)
          const node = e.target.dataset.flare
          if (MAP_META.offgrid[node]) emit('offgridReached', node)
          else if (MAP_META.nodes[node]) {
            emit('flare', node)
            pulseNode(node)
          }
        }
      },
      // A band from the 42% reading line down to 50%, so a quick scroll cannot step over a short row.
      { rootMargin: '-42% 0px -50% 0px' },
    )
    for (const el of document.querySelectorAll('main [data-flare]')) io.observe(el)
    return () => io.disconnect()
  }, [motion])

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
              {exits
                .filter((e) => e.line)
                .map((e) => (
                  <line
                    key={e.id}
                    className="ng-exit-road"
                    data-node={e.id}
                    data-lit={lit[e.id] ? '' : undefined}
                    x1={e.line.sx}
                    y1={e.line.sy}
                    x2={e.line.x}
                    y2={e.line.y}
                  />
                ))}
            </svg>
          )}
          {/* Rendered from the start (hidden until placed), so each sign can be measured. */}
          {OFFGRID.map((id) => {
            const e = exits?.find((x) => x.id === id)
            const deg = MAP_META.offgrid[id].deg
            return (
              <span
                key={id}
                className="ng-exit"
                data-node={id}
                data-side={e?.side}
                data-placed={e ? '' : undefined}
                data-lit={lit[id] ? '' : undefined}
                style={{ '--x': `${Math.round(e?.l ?? 0)}px`, '--y': `${Math.round(e?.t ?? 0)}px` }}
              >
                <span className="ng-exit-name">{NODES[id].text}</span>
                <span className="ng-exit-name ng-exit-hot">{NODES[id].text}</span>
                <svg className="ng-exit-chev" viewBox="-8 -8 16 16" focusable="false" style={{ '--deg': `${deg - 90}deg` }}>
                  <path d="M-6 0H5M1 -4L5 0L1 4" />
                </svg>
              </span>
            )
          })}
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
