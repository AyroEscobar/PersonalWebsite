/*
  Render tiers (PLAN.md 4.0, research components.md 3.1). One function decides
  how much the device gets; every heavy component reads store.tier.

    static  reduced motion (OS or quiet mode), Save-Data, 2g, no WebGL2
    lite    coarse pointer, deviceMemory <= 4 or hardwareConcurrency <= 4
    full    everything else

  The WebGL2 check here is cheap (constructor present). GridCanvas does the
  real context creation and calls markWebGLUnavailable() if it fails, which
  drops the tier to static and leaves the SVG poster in charge.
*/

let webglBroken = false

const mq = (q) => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(q).matches

export function detectTier() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'static'
  const root = document.documentElement
  if (root.dataset.mode === 'quiet' || root.dataset.motion === 'reduced') return 'static'
  if (mq('(prefers-reduced-motion: reduce)')) return 'static'
  const c = navigator.connection
  if (c?.saveData || /2g$/.test(c?.effectiveType ?? '')) return 'static'
  if (webglBroken || typeof window.WebGL2RenderingContext === 'undefined') return 'static'
  const lowMem = (navigator.deviceMemory ?? 8) <= 4
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4
  if (mq('(pointer: coarse)') || lowMem || lowCpu) return 'lite'
  return 'full'
}

/** Called by GridCanvas when getContext('webgl2') fails or the context is lost for good. */
export function markWebGLUnavailable() {
  webglBroken = true
}

/** Frame budget per tier, for anything with a rAF loop (there is exactly one: GridCanvas). */
export const TIER_FPS = { full: 60, lite: 30, static: 0 }

/** Canvas resolution scale per tier (half res on lite). */
export const TIER_DPR = {
  full: () => Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 1.5),
  lite: () => 0.5 * Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2),
  static: () => 0,
}
