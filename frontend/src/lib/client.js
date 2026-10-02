import { getState, setMode, setMotion, setTier, subscribe } from './store.js'
import { detectTier } from './tier.js'
import { BOOT_MS, endBoot, readHtmlMode } from './mode.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled.
  Copies <html data-*> (set by the inline boot script) into the store,
  computes the render tier, and keeps both in sync with the OS setting.
*/
export function initClient() {
  const { mode, motion } = readHtmlMode()
  setMode(mode, { persist: false })
  setMotion(motion)
  setTier(detectTier())

  // The OS reduced-motion setting can change while the page is open.
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', () => setMode(getState().mode, { persist: false }))

  // Re-tier whenever mode or motion changes (quiet mode is always static).
  let last = `${getState().mode}/${getState().motion}`
  subscribe(() => {
    const key = `${getState().mode}/${getState().motion}`
    if (key === last) return
    last = key
    setTier(detectTier())
  })

  // The first-paint sequence owns 1.2 s; then data-boot goes away for good.
  if (document.documentElement.dataset.boot === 'run') window.setTimeout(endBoot, BOOT_MS + 400)
}
