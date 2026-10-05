import { useSyncExternalStore } from 'react'
import { SECTION_IDS } from '../content/sections.js'

/*
  The shared store. A tiny external store read with useSyncExternalStore,
  so it is hydration safe: during hydration every component sees
  SERVER_STATE, then re-renders with the live state.

  State
    focus   the section in view, one of the four ids, or 'top' (the nav)
    tier    'full' | 'lite' | 'still'          (src/lib/tier.js)
    quiet   true when the quiet switch is on (html[data-transparency='reduced'])
    motion  'on' | 'off'                       (the footer's "motion off" control)
    paused  true while the viewer paused the scene
    glLost  true after a WebGL context loss that did not restore

  Usage
    const quiet = useStore((s) => s.quiet)
    import { setFocus } from '../lib/store.js'
*/

const SERVER_STATE = Object.freeze({
  focus: 'top',
  tier: 'full',
  quiet: false,
  motion: 'on',
  paused: false,
  glLost: false,
})

let state = SERVER_STATE
const subscribers = new Set()

function set(patch) {
  const changed = Object.keys(patch).some((k) => patch[k] !== state[k])
  if (!changed) return
  state = Object.freeze({ ...state, ...patch })
  subscribers.forEach((fn) => fn())
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

export function setFocus(id) {
  if (id === 'top' || SECTION_IDS.includes(id)) set({ focus: id })
}

export function setTier(tier) {
  if (tier === 'full' || tier === 'lite' || tier === 'still') set({ tier })
}

export function setMotionState(motion) {
  if (motion === 'on' || motion === 'off') set({ motion })
}

export function setQuietState(quiet) {
  set({ quiet: !!quiet })
}

export function setPaused(paused) {
  set({ paused: !!paused })
}

export function setGlLost(glLost) {
  set({ glLost: !!glLost })
}
