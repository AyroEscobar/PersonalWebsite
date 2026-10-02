/*
  Shared between NightGrid and the lazy GridCanvas (A). GridCanvas sets
  `canvas` while a working WebGL2 context is drawing waves; until then (and
  forever on tier static) NightGrid answers pings on the poster instead.
*/
export const live = { canvas: false }

/** Ring pulse on a poster node: the wave arrived, or a static ping chose it. */
export function pulseNode(node, { variant = 'hero', motion = true } = {}) {
  if (typeof document === 'undefined') return
  const ring = document.querySelector(`.ng-cam[data-variant="${variant}"] .ng-node[data-node="${node}"] .ng-ring`)
  if (!ring || !motion || !ring.animate) return
  ring.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(3.2)', opacity: 0 },
    ],
    { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  )
}
