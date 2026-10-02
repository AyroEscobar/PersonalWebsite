import { useSyncExternalStore } from 'react'
import { SECTION_IDS } from '../content/sections.js'
import { STORAGE } from '../content/constants.js'

/*
  The shared store (PLAN.md 4.0). A tiny external store read with
  useSyncExternalStore, so it is hydration safe: during hydration every
  component sees SERVER_STATE, then re-renders with the live state.

  State
    focus   one of the six section ids (RouteRail and NightGrid camera)
    tier    'full' | 'lite' | 'static'          (src/lib/tier.js)
    mode    'full' | 'quiet'                     (QuietToggle, ?quiet, storage)
    motion  'full' | 'reduced'                   (OS setting or quiet mode)
    pings   up to 3 active pings, newest last: { id, x, y, source, node, at }

  Actions
    setFocus(id)  ping({ x, y, source, node })  setMode('full' | 'quiet')
    setTier(tier) endPing(id)

  Events (fire and forget, not state)
    on('nodeReached', (nodeId) => {})   emitted by PingWave as the wave reaches a node
    on('ping', (ping) => {})            every ping, including static-tier pings
    emit(name, payload)

  Usage
    const focus = useStore((s) => s.focus)
    import { setFocus } from '../lib/store.js'
*/

const SERVER_STATE = Object.freeze({
  focus: 'origin',
  tier: 'static',
  mode: 'full',
  motion: 'full',
  pings: Object.freeze([]),
})

let state = SERVER_STATE
const subscribers = new Set()
const listeners = new Map()

function set(patch) {
  const next = { ...state, ...patch }
  for (const k of Object.keys(patch)) {
    if (next[k] !== state[k]) {
      state = Object.freeze(next)
      subscribers.forEach((fn) => fn())
      return
    }
  }
}

export function getState() {
  return state
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** Select a slice. Return primitives or stable references from the selector. */
export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(SERVER_STATE),
  )
}

// ---------- events ----------

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set())
  listeners.get(name).add(fn)
  return () => listeners.get(name)?.delete(fn)
}

export function emit(name, payload) {
  listeners.get(name)?.forEach((fn) => {
    try {
      fn(payload)
    } catch (err) {
      console.warn(`[store] ${name} listener failed`, err)
    }
  })
}

// ---------- actions ----------

export function setFocus(id) {
  if (!SECTION_IDS.includes(id)) return
  set({ focus: id })
}

export function setTier(tier) {
  if (!['full', 'lite', 'static'].includes(tier)) return
  set({ tier })
  if (typeof document !== 'undefined') document.documentElement.dataset.tier = tier
}

export function setMotion(motion) {
  if (!['full', 'reduced'].includes(motion)) return
  set({ motion })
}

let pingSeq = 0
const MAX_PINGS = 3

/**
 * Fire a ping. x and y are in the map's own coordinate space (A decides),
 * or omitted for a ping from a node (the `ping` button sends { node: 'plano' }).
 * Returns the ping id.
 */
export function ping({ x = null, y = null, source = 'pointer', node = null } = {}) {
  const p = Object.freeze({ id: ++pingSeq, x, y, source, node, at: now() })
  const pings = [...state.pings, p].slice(-MAX_PINGS)
  set({ pings: Object.freeze(pings) })
  emit('ping', p)
  return p.id
}

export function endPing(id) {
  const pings = state.pings.filter((p) => p.id !== id)
  if (pings.length !== state.pings.length) set({ pings: Object.freeze(pings) })
}

/**
 * Switch between the full site and quiet mode (the recruiter view and the
 * WCAG 2.2.2 pause control). Writes <html data-mode data-motion>, stores the
 * choice per viewer, and drops the tier to static in quiet mode.
 */
export function setMode(mode, { persist = true } = {}) {
  if (!['full', 'quiet'].includes(mode)) return
  const root = typeof document !== 'undefined' ? document.documentElement : null
  const osReduced = prefersReducedMotion()
  const motion = mode === 'quiet' || osReduced ? 'reduced' : 'full'
  if (root) {
    root.dataset.mode = mode
    root.dataset.motion = motion
    if (mode === 'quiet') delete root.dataset.boot
  }
  if (persist) {
    try {
      localStorage.setItem(STORAGE.mode, mode)
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  }
  set({ mode, motion })
}

// ---------- helpers ----------

function now() {
  return typeof performance !== 'undefined' ? performance.now() : 0
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
