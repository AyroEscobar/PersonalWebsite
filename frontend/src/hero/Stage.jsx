import { useEffect, useRef } from 'react'
import { HERO } from '../content/identity.js'
import { useHydrated } from '../lib/hydrated.js'
import { afterLoad, onIdle } from '../lib/idle.js'
import { getState, setGlLost, setPaused, setTier, subscribe } from '../lib/store.js'
import { markStill } from '../lib/mode.js'
import { setRims, watchRims, posterRock } from '../lib/rims.js'

/*
  The stage (DESIGN.md 3.11, 3.13, 5.9): the poster <picture> and the canvas, prerendered as
  plain markup so the first paint is the hero frame. On the client, after hydration, load and
  idle, it imports the scene chunk (src/scene/boulder.js) and mounts it on the canvas, unless the
  tier is still. The scene writes CSS custom properties (--rim per glass element, --scrim and --p
  on <html>) and never touches React state while running.

  States: poster only (before the chunk, the still tier, data-gl=lost) · canvas on (.on, 150 ms)
  · paused (identical pixels, loop stopped) · motion off (poster).

    <Stage />                 the home page
    <Stage kit />             the kit: the same stage, a short climb inside the hero
*/
const POSTER = {
  land: { avif: '/poster/hero-1440.avif', webp: '/poster/hero-1440.webp', w: 1440, h: 900 },
  phone: { avif: '/poster/hero-780.avif', webp: '/poster/hero-780.webp', w: 780, h: 1688 },
}

export default function Stage() {
  const canvasRef = useRef(null)
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated) return undefined
    const canvas = canvasRef.current
    const stopRims = watchRims()
    let mod = null
    let alive = true
    let unsubscribe = () => {}
    const d = document.documentElement

    const onFrame = (f) => {
      setRims(f.boulder, { fromScene: true })
      // the scrim rises with the backdrop above the weather: 0.62 + 0.08 smoothstep(0.85, 1, p)
      const k = f.dawn / 0.35
      d.style.setProperty('--scrim', (0.62 + 0.08 * k).toFixed(3))
      d.style.setProperty('--p', f.prog.toFixed(3))
    }
    const start = async () => {
      const tier = getState().tier
      if (tier === 'still' || mod || !alive) return
      try {
        const m = await import('../scene/boulder.js')
        if (!alive || getState().tier === 'still') return
        mod = m
        m.mount(canvas, {
          tier,
          onReady: () => requestAnimationFrame(() => canvas.classList.add('on')),
          onFrame,
          onLost: (lost, count) => {
            setGlLost(lost)
            if (lost) setRims(posterRock(), { force: true })
            // a second loss within a session: give up on the canvas and set the still tier
            if (lost && count >= 2) stop(true)
          },
          onError: () => stop(true),
        })
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Stage]', err)
        stop(true)
      }
    }
    const stop = (still = false) => {
      mod?.unmount()
      mod = null
      canvas.classList.remove('on')
      d.style.removeProperty('--scrim')
      setRims(posterRock(), { force: true })
      if (still) markStill()
    }
    // the footer's controls drive the store; the stage follows it
    let prev = getState()
    unsubscribe = subscribe(() => {
      const s = getState()
      if (s.tier !== prev.tier) {
        if (s.tier === 'still') stop()
        else if (!mod) start()
        else if (prev.tier !== 'still') { stop(); start() }
      }
      if (s.paused !== prev.paused && mod) (s.paused ? mod.pause() : mod.play())
      prev = s
    })
    // the chunk never competes with the first paint: wait for load, for the poster to decode and
    // commit (it is the LCP element), then an idle moment, then one more frame
    const img = canvas.parentElement?.querySelector('img')
    const decoded = img?.decode ? img.decode().catch(() => {}) : Promise.resolve()
    Promise.all([afterLoad(), decoded]).then(() => onIdle(() => requestAnimationFrame(() => requestAnimationFrame(start)), 1500))
    return () => {
      alive = false
      unsubscribe()
      stopRims()
      mod?.unmount()
      mod = null
      setPaused(false)
      setTier(getState().tier)
    }
  }, [hydrated])

  return (
    <div className="stage">
      <picture className="poster">
        <source media="(max-aspect-ratio: 9/10)" type="image/avif" srcSet={POSTER.phone.avif} />
        <source media="(max-aspect-ratio: 9/10)" type="image/webp" srcSet={POSTER.phone.webp} />
        <source type="image/avif" srcSet={POSTER.land.avif} />
        <img src={POSTER.land.webp} width={POSTER.land.w} height={POSTER.land.h} alt={HERO.sceneAlt.text} fetchPriority="high" decoding="async" />
      </picture>
      <canvas ref={canvasRef} className="scene" aria-hidden="true" />
    </div>
  )
}

export { POSTER }
