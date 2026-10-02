import { useEffect, useRef } from 'react'
import gridUrl from '../data/dfw-grid.json?url'
import { createEngine } from './PingWave.js'
import { emit, endPing, getState, on, setTier } from '../lib/store.js'
import { TIER_DPR, detectTier, markWebGLUnavailable } from '../lib/tier.js'
import { live } from './live.js'

/*
  GridCanvas (PLAN.md 4.1, 4.2). Owned by A. The lazy WebGL2 layer over the
  poster, mounted by NightGrid through DeferredMount on tiers full and lite,
  after load. Its chunk holds the engine (PingWave.js) and the graph code;
  the road data is fetched as its own file (dfw-grid.json).

  Each mount makes its own <canvas>, so a remount (StrictMode in dev, a tier
  change) never inherits a lost context. If WebGL2 fails at any point the
  tier drops to static: this layer unmounts and the poster answers pings.
*/
export default function GridCanvas() {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    const cam = document.querySelector('.ng-cam[data-variant="hero"]')
    if (!el || !cam) return undefined
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    el.appendChild(canvas)

    let engine = null
    let cancelled = false
    const offs = []
    const fail = () => {
      live.canvas = false
      markWebGLUnavailable()
      setTier(detectTier())
    }

    const hero = document.querySelector('.hero')
    createEngine(canvas, {
      gridUrl,
      cam,
      heroInView: () => {
        if (!hero) return true
        const r = hero.getBoundingClientRect()
        return r.bottom > 0 && r.top < window.innerHeight
      },
      tier: getState().tier,
      dprFor: () => (TIER_DPR[getState().tier] ?? TIER_DPR.lite)() || 1,
      onReached: (node) => emit('nodeReached', node),
      onDone: (id) => endPing(id),
      onFail: fail,
    })
      .then((e) => {
        if (cancelled) {
          e.destroy()
          return
        }
        engine = e
        live.canvas = true
        offs.push(on('ping', (p) => engine.ping(p, p.id)))
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => engine.resize())
          ro.observe(canvas)
          offs.push(() => ro.disconnect())
        }
        if (hero && typeof IntersectionObserver !== 'undefined') {
          const io = new IntersectionObserver((es) => engine.setHeroVisible(es.some((x) => x.isIntersecting)))
          io.observe(hero)
          offs.push(() => io.disconnect())
        }
      })
      .catch(() => {
        if (!cancelled) fail()
      })

    return () => {
      cancelled = true
      live.canvas = false
      offs.forEach((off) => off())
      engine?.destroy()
      canvas.remove()
    }
  }, [])

  return <div ref={host} className="ng-canvas-host" />
}
