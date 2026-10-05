import { setMotion } from './store.js'
import { syncFromHtml } from './mode.js'
import { initPointer } from '../glass/pointer.js'
import { onIdle } from './idle.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled.
  Copies <html data-*> (set by the inline boot script) into the store,
  follows the OS motion setting, starts the pointer specular, and loads the
  lens maps (src/glass/lens.js, its own small chunk) after fonts and paint.
*/
export function initClient() {
  syncFromHtml()

  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', (e) => {
    document.documentElement.dataset.motion = e.matches ? 'reduced' : 'full'
    setMotion(e.matches ? 'reduced' : 'full')
  })

  initPointer()

  const fonts = document.fonts?.ready ?? Promise.resolve()
  fonts.then(() =>
    onIdle(() => {
      import('../glass/lens.js').then((m) => m.startLens()).catch(() => {})
    }, 1200),
  )
}
