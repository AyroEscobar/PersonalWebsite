import { getState, setMotionState, setQuietState, setTier, useStore } from './store.js'
import { STORAGE } from '../content/constants.js'
import { detectTier, readTier, writeTier } from './tier.js'

/*
  Modes (DESIGN.md 3.10, 4.5). The inline boot script (src/lib/boot-inline.js)
  decides them before first paint and writes them on <html>. initClient()
  copies them into the store; after that, setQuiet() and setMotion() are the
  only writers.

    readHtmlMode()     { quiet, motion, tier } from <html data-*>
    setQuiet(on)       the quiet switch: solid panels instead of glass
                       (html[data-transparency]), persisted per viewer
    setMotion(on)      "motion off" unmounts the scene and sets the still tier;
                       "motion on" re-detects the tier. Persisted (ae.motion).
    useQuiet()         false on the server and while hydrating
    useTier()          'full' on the server and while hydrating
*/

export function readHtmlMode() {
  if (typeof document === 'undefined') return { quiet: false, motion: 'on', tier: 'full' }
  const d = document.documentElement.dataset
  return {
    quiet: d.transparency === 'reduced',
    motion: d.motion === 'off' ? 'off' : 'on',
    tier: readTier(),
  }
}

/** One frame with no transitions, so a flip snaps instead of smearing. */
function snap() {
  const root = document.documentElement
  root.classList.add('no-transitions')
  void root.offsetWidth
  requestAnimationFrame(() => root.classList.remove('no-transitions'))
}

export function setQuiet(on) {
  if (typeof document === 'undefined') return
  snap()
  document.documentElement.dataset.transparency = on ? 'reduced' : 'full'
  try {
    localStorage.setItem(STORAGE.quiet, on ? '1' : '0')
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  setQuietState(on)
}

export function toggleQuiet() {
  setQuiet(!getState().quiet)
}

export function setMotion(on) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.motion = on ? 'on' : 'off'
  try {
    localStorage.setItem(STORAGE.motion, on ? 'on' : 'off')
  } catch {
    /* storage blocked */
  }
  setMotionState(on ? 'on' : 'off')
  const tier = on ? detectTier() : 'still'
  writeTier(tier)
  setTier(tier)
}

export function markStill() {
  writeTier('still')
  setTier('still')
}

export function useQuiet() {
  return useStore((s) => s.quiet)
}

export function useTier() {
  return useStore((s) => s.tier)
}

export function syncFromHtml() {
  const m = readHtmlMode()
  setQuietState(m.quiet)
  setMotionState(m.motion)
  setTier(m.tier)
}
