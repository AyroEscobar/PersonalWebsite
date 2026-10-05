/*
  Render tiers (DESIGN.md 3.10): full, lite and still. The inline boot
  script decides before first paint and writes html[data-tier]; CSS reads it
  directly. This module re-detects after a change (motion on again), with
  the same rules, and never imports three.

    still   prefers-reduced-motion, no WebGL2, html[data-motion=off], a lost context
    lite    saveData, deviceMemory <= 4, a coarse pointer, the short side under 700 px
    full    otherwise

  ?tier= forces one. DPR caps: full 2, lite 1.5.
*/
export const DPR_CAP = { full: 2, lite: 1.5, still: 1 }

export function readTier() {
  if (typeof document === 'undefined') return 'full'
  const t = document.documentElement.dataset.tier
  return t === 'lite' || t === 'still' ? t : 'full'
}

export function detectTier() {
  if (typeof window === 'undefined') return 'full'
  const q = new URLSearchParams(window.location.search)
  const forced = q.get('tier')
  if (forced === 'full' || forced === 'lite' || forced === 'still') return forced
  const mq = (s) => {
    try {
      return window.matchMedia(s).matches
    } catch {
      return false
    }
  }
  if (document.documentElement.dataset.motion === 'off') return 'still'
  if (mq('(prefers-reduced-motion: reduce)')) return 'still'
  let gl = null
  try {
    gl = document.createElement('canvas').getContext('webgl2')
  } catch {
    gl = null
  }
  if (!gl) return 'still'
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  const n = navigator
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  if (n.connection?.saveData || (n.deviceMemory && n.deviceMemory <= 4) || mq('(pointer: coarse)') || small) return 'lite'
  return 'full'
}

export function writeTier(tier) {
  if (typeof document !== 'undefined') document.documentElement.dataset.tier = tier
}
