import { useSyncExternalStore } from 'react'
import { msToNextMinute } from '../lib/clock.js'
import { HORIZON, skyState } from '../lib/sun.js'
import { getState, subscribe as subscribeStore } from '../lib/store.js'

/*
  One minute clock for all of the chrome (B, PLAN.md 4.7).

  Every LocalClock, SkyWord and NowBoard on the page reads the same Date from
  one module-level timer, aligned to the next minute boundary, so the top bar,
  the hero board and the now section always flip together and the page runs
  one timeout instead of one per component. It starts with the first reader
  and stops with the last. It resyncs when the tab becomes visible again.

    usePlanoNow()   Date, or null on the server and during hydration
    useSky()        'night' | 'dawn' | 'day' | 'golden' | 'dusk', or null
    syncBeacons()   phase-locks every .beacon on the page (see below)
*/

let now = null
let timer = 0
const readers = new Set()

function tick() {
  now = new Date()
  readers.forEach((fn) => fn())
  writeHorizon()
  timer = window.setTimeout(tick, msToNextMinute(now))
}

function onVisible() {
  if (document.visibilityState !== 'visible') return
  window.clearTimeout(timer)
  tick()
}

function subscribe(fn) {
  readers.add(fn)
  if (readers.size === 1) {
    tick()
    document.addEventListener('visibilitychange', onVisible)
  }
  return () => {
    readers.delete(fn)
    if (!readers.size) {
      window.clearTimeout(timer)
      timer = 0
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

const getSnapshot = () => now
const getServerSnapshot = () => null

export function usePlanoNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// The sky only changes every few minutes; cache it per minute so every reader
// gets the same string without recomputing the solar position.
let skyAt = null
let sky = null
const skySnapshot = () => {
  if (!now) return null
  if (skyAt !== now) {
    skyAt = now
    sky = skyState(now)
  }
  return sky
}

export function useSky() {
  return useSyncExternalStore(subscribe, skySnapshot, getServerSnapshot)
}

/*
  The horizon band over the map (PLAN.md 2.4). --horizon is written on <html>
  once a minute while anything reads the clock. Quiet mode and forced colors
  keep the tokens.css value (transparent), so the inline property is removed
  there instead of written.
*/
let lastMode = null
function writeHorizon() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const quiet = getState().mode === 'quiet'
  const s = skySnapshot()
  if (quiet || !s) root.style.removeProperty('--horizon')
  else root.style.setProperty('--horizon', HORIZON[s])
  if (s) root.dataset.sky = s
}

if (typeof window !== 'undefined') {
  subscribeStore(() => {
    const mode = getState().mode
    if (mode === lastMode) return
    lastMode = mode
    if (now) writeHorizon()
  })
}

/*
  Obstruction lights on a skyline flash in unison. Every .beacon on the page
  runs the same CSS animation; pinning each one's startTime to the document
  timeline origin puts them all in phase, including ones that mount later
  (a popover opening, a lazily rendered board). No-op without WAAPI or when
  motion is off (then nothing is animating anyway).
*/
export function syncBeacons(root = document) {
  if (typeof document === 'undefined' || typeof document.getAnimations !== 'function') return
  for (const el of root.querySelectorAll('.beacon')) {
    for (const a of el.getAnimations()) {
      try {
        a.startTime = 0
      } catch {
        /* an animation that cannot be re-timed keeps its own phase */
      }
    }
  }
}
