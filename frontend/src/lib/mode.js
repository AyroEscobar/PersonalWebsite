import { getState, setMotionState, setQuietState, setThemeState, setTier, useStore } from './store.js'
import { STORAGE } from '../content/constants.js'
import { HEAD } from '../content/meta.js'
import { detectTier, readTier, writeTier } from './tier.js'

/*
  Modes. The inline boot script (src/lib/boot-inline.js) decides them before first paint and writes
  them on <html>. initClient() copies them into the store; after that, setTheme(), setQuiet() and
  setMotion() are the only writers.

    readHtmlMode()     { theme, quiet, motion, tier } from <html data-*>
    setTheme(theme)    'light' (black-figure) or 'dark' (red-figure): html[data-theme], ae.theme, the
                       first theme-color meta (the boot script writes it first in <head>); the
                       scene follows the store (src/lib/frieze-host.js) and fires the vase as a kiln
                       while the page crossfades (a view transition where the browser has one)
    setQuiet(on)       the quiet switch: the poster instead of the live scene (html[data-transparency]),
                       persisted per viewer
    setMotion(on)      "motion off" unmounts the scene and sets the still tier; "motion on" re-detects
                       the tier. Persisted (ae.motion).
    useTheme(), useQuiet(), useTier()   SERVER_STATE values on the server and while hydrating
*/

export function readHtmlMode() {
  if (typeof document === 'undefined') return { theme: 'light', quiet: false, motion: 'on', tier: 'full' }
  const d = document.documentElement.dataset
  const theme = d.theme === 'dark' ? 'dark' : 'light'
  return {
    theme,
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

export function themeColorMeta() {
  let m = document.querySelector('meta[name="theme-color"]:not([media])')
  if (!m) {
    m = document.createElement('meta')
    m.name = 'theme-color'
    document.head.prepend(m)
  }
  return m
}

export function setTheme(theme) {
  if (typeof document === 'undefined' || (theme !== 'light' && theme !== 'dark')) return
  const apply = () => {
    document.documentElement.dataset.theme = theme
    themeColorMeta().content = HEAD.themeColor[theme]
    setThemeState(theme)
  }
  // the kiln: the page crossfades (a view transition, 400 ms, reveal.css) while the scene fires the vase
  // (src/scene/frieze.js); the still tier and reduced motion keep the instant swap
  const still = getState().tier === 'still' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!still && document.startViewTransition) document.startViewTransition(apply)
  else {
    snap()
    apply()
  }
  try {
    localStorage.setItem(STORAGE.theme, theme)
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

export function toggleTheme() {
  const next = getState().theme === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
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

export function useTheme() {
  return useStore((s) => s.theme)
}

export function useQuiet() {
  return useStore((s) => s.quiet)
}

export function useTier() {
  return useStore((s) => s.tier)
}

export function syncFromHtml() {
  const m = readHtmlMode()
  setThemeState(m.theme)
  setQuietState(m.quiet)
  setMotionState(m.motion)
  setTier(m.tier)
}
