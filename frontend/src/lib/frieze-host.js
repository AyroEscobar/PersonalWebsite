import { getState, setGlLost, setPaused, subscribe } from './store.js'
import { markStill } from './mode.js'
import { afterLoad, onIdle } from './idle.js'

/*
  The frieze host: one canvas, one WebGL context, one mount for the whole page (no three here; the scene
  is the lazy chunk src/scene/frieze.js).

    const stop = startFriezeHost()   once, after hydration (App and the kit call it in an effect)

  Every [data-band] element on the page is a band (the hero's shoulder frieze, the pot in the belly and
  the contact band): each holds a .frieze-art layer and a .room box (the composition, which the poster
  fills). The scene moves the canvas into whichever band is the host and pauses when none is near.

  When it starts: after window load, after the first poster has decoded and committed (it is the LCP
  element), then an idle moment and two frames, so the chunk never competes with the first paint. Never
  in the still tier (reduced motion, motion off, no WebGL2) and never under quiet; the store drives it
  from then on: tier, quiet, paused and theme. A lost context shows the poster; a second loss in a
  session gives up on the canvas and sets the still tier.
*/
let mod = null
let canvas = null
let loading = false
let alive = false
let unsubscribe = () => {}
let cancelIdle = () => {}

const wants = () => {
  const s = getState()
  return alive && s.tier !== 'still' && !s.quiet
}

// every band with its art and room; the pot comes twice (the belly's rail and the band above Contact) and
// the scene uses whichever is laid out at the moment (room.getClientRects())
function bands() {
  return [...document.querySelectorAll('[data-band]')]
    .map((el) => ({ kind: el.dataset.band, el, art: el.querySelector('.frieze-art'), room: el.querySelector('.room'), belly: el.closest('.belly') }))
    .filter((b) => b.art && b.room && (b.kind === 'pot' || getComputedStyle(b.room).display !== 'none'))
}

async function start() {
  if (mod || loading || !wants()) return
  const list = bands()
  if (!list.length) return
  loading = true
  try {
    const m = await import('../scene/frieze.js')
    if (!wants()) return
    canvas = document.createElement('canvas')
    canvas.className = 'frieze-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    const s = getState()
    const me = await m.mount({
      canvas,
      bands: list,
      theme: s.theme,
      tier: s.tier,
      onReady: () => document.documentElement.classList.add('scene-live'),
      onError: (e) => {
        if (import.meta.env.DEV) console.warn('[frieze]', e)
        stop(true)
      },
      onLost: (lost, count) => {
        setGlLost(lost)
        if (lost && count >= 2) stop(true)
      },
    })
    if (!me) return
    mod = m
    if (!wants()) stop()
    else if (getState().paused) m.pause()
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[frieze]', e)
    stop(true)
  } finally {
    loading = false
  }
}

function stop(still = false) {
  mod?.unmount()
  mod = null
  canvas?.remove()
  canvas = null
  document.documentElement.classList.remove('scene-live')
  document.querySelectorAll('[data-band].is-live').forEach((el) => el.classList.remove('is-live'))
  if (still) markStill()
}

export function startFriezeHost() {
  if (alive) return () => {}
  alive = true
  let prev = getState()
  unsubscribe = subscribe(() => {
    const s = getState()
    const want = wants()
    if (s.tier !== prev.tier || s.quiet !== prev.quiet) {
      if (!want) stop()
      else if (!mod) start()
      else if (s.tier !== prev.tier) { stop(); start() }
    }
    if (s.paused !== prev.paused && mod) (s.paused ? mod.pause() : mod.play())
    if (s.theme !== prev.theme && mod) mod.setTheme(s.theme)
    prev = s
  })
  const img = [...document.querySelectorAll('[data-band="hero"] .poster img')].find((i) => i.offsetParent !== null)
  // a lazy poster out of view never decodes: wait at most 3 s for it
  const decoded = Promise.race([img?.decode ? img.decode().catch(() => {}) : Promise.resolve(), new Promise((r) => setTimeout(r, 3000))])
  Promise.all([afterLoad(), decoded]).then(() => {
    if (!alive) return
    cancelIdle = onIdle(() => requestAnimationFrame(() => requestAnimationFrame(start)), 1500)
  })
  return () => {
    alive = false
    cancelIdle()
    unsubscribe()
    stop()
    setPaused(false)
  }
}

/** For the kit and the tools: is the scene mounted right now. */
export const sceneMounted = () => !!mod
