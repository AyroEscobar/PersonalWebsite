import { getState, setMotion, setQuietState, setTier, useStore } from './store.js'
import { STORAGE } from '../content/constants.js'

/*
  Modes (DESIGN.md 4.4). The inline boot script (src/lib/boot-inline.js)
  decides them before first paint and writes them on <html>. initClient()
  copies them into the store; after that, setQuiet() is the only writer.

    readHtmlMode()     { quiet, motion, tier, lens } from <html data-*>
    setQuiet(on)       the quiet switch: solid panels instead of glass
                       (html[data-transparency]), persisted per viewer
    toggleQuiet()
    useQuiet()         false on the server and while hydrating
    useReducedMotion()
*/

export function readHtmlMode() {
  if (typeof document === 'undefined') return { quiet: false, motion: 'full', tier: 'full', lens: false }
  const d = document.documentElement.dataset
  return {
    quiet: d.transparency === 'reduced',
    motion: d.motion === 'reduced' ? 'reduced' : 'full',
    tier: d.tier === 'lite' ? 'lite' : 'full',
    lens: d.lens === 'on',
  }
}

/** One frame with no transitions, so a flip snaps instead of smearing (better-ui). */
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
  window.dispatchEvent(new CustomEvent('ae:quiet', { detail: on }))
}

export function toggleQuiet() {
  setQuiet(!getState().quiet)
}

export function useQuiet() {
  return useStore((s) => s.quiet)
}

export function useReducedMotion() {
  return useStore((s) => s.motion === 'reduced')
}

export function syncFromHtml() {
  const m = readHtmlMode()
  setQuietState(m.quiet)
  setMotion(m.motion)
  setTier(m.tier)
}
