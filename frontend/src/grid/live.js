/*
  Shared between NightGrid and the lazy GridCanvas (A). GridCanvas sets
  `canvas` while a working WebGL2 context is drawing waves; until then (and
  forever on tier static) NightGrid answers pings on the poster instead.
*/
export const live = { canvas: false }

/**
 * Arrival on a poster node: the wave got there, or a static ping chose it.
 * The ring opens and the label flares to full ink, then settles (r1 T5).
 * Only transform and opacity move; without motion the label still lights.
 */
export function pulseNode(node, { variant = 'hero', motion = true } = {}) {
  if (typeof document === 'undefined') return
  const root = document.querySelector(`.ng-cam[data-variant="${variant}"] .ng-node[data-node="${node}"]`)
  if (!root) return
  const hot = root.querySelector('.ng-label-hot')
  if (hot?.animate) {
    hot.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], {
      duration: motion ? 1500 : 900,
      easing: motion ? 'ease-out' : 'step-end',
    })
  }
  const ring = root.querySelector('.ng-ring')
  if (!ring || !motion || !ring.animate) return
  ring.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(3.2)', opacity: 0 },
    ],
    { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  )
}
