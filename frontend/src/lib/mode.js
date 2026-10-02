import { useStore, setMode, getState } from './store.js'

/*
  Modes and motion (PLAN.md 4.0, 4.12, 6).

  The inline script (src/lib/boot-inline.js) decides the mode and motion
  before first paint and writes them on <html>. initClient() copies them into
  the store. After that, setMode() is the only writer.

    readHtmlMode()     { mode, motion, boot } from <html data-*>
    toggleQuiet()      flip quiet mode, persisted per viewer
    useQuiet()         true in quiet mode (false on the server and while hydrating)
    useReducedMotion() true when motion is reduced (OS or quiet mode)
    BOOT_MS            the first-paint budget; endBoot() removes data-boot after it

  CSS gates: use the `motion-ok:` Tailwind variant or nest rules under
  @media (prefers-reduced-motion: no-preference) { html:not([data-motion="reduced"]) ... }
*/

export const BOOT_MS = 1200

export function readHtmlMode() {
  if (typeof document === 'undefined') return { mode: 'full', motion: 'full', boot: false }
  const d = document.documentElement.dataset
  return {
    mode: d.mode === 'quiet' ? 'quiet' : 'full',
    motion: d.motion === 'reduced' ? 'reduced' : 'full',
    boot: d.boot === 'run',
  }
}

export function toggleQuiet() {
  setMode(getState().mode === 'quiet' ? 'full' : 'quiet')
}

export function useQuiet() {
  return useStore((s) => s.mode === 'quiet')
}

export function useReducedMotion() {
  return useStore((s) => s.motion === 'reduced')
}

/** Remove data-boot once the first-paint sequence has had its 1.2 s. */
export function endBoot() {
  if (typeof document !== 'undefined') delete document.documentElement.dataset.boot
}
