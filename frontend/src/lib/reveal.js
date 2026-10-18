/*
  The page's own motion, in the entry (no three):

    initSun()   the late sun on the clay moves with the reader: the patch slides 60 px right and 40 px
                lower over the hero's exit, and comes down onto the contact band as it arrives. Where the
                browser has scroll-driven animations, motion.css does it on the compositor and this does
                nothing; elsewhere it writes the same transform from the band's position on a frame.
                Never in the still tier, never under reduced motion.
*/
const html = () => document.documentElement
const live = () => html().dataset.tier !== 'still' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const clamp01 = (x) => Math.min(1, Math.max(0, x))

/** One rAF-throttled scroll listener for a function of the page's position. */
function onScrollFrame(fn) {
  let ticking = false
  const run = () => {
    ticking = false
    fn()
  }
  const kick = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(run)
  }
  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('resize', kick, { passive: true })
  run()
}

export function initSun() {
  if (typeof window === 'undefined' || window.CSS?.supports?.('animation-timeline: scroll()')) return
  const suns = [...document.querySelectorAll('.frieze--hero > .frieze-sun, .frieze--contact > .frieze-sun')]
  if (!suns.length) return
  onScrollFrame(() => {
    const on = live()
    const vh = window.innerHeight
    for (const s of suns) {
      if (!on) {
        s.style.transform = ''
        continue
      }
      const hero = s.parentElement.classList.contains('frieze--hero')
      if (hero) {
        const p = clamp01(window.scrollY / Math.max(1, vh))
        s.style.transform = `translate3d(${(60 * p).toFixed(1)}px, ${(40 * p).toFixed(1)}px, 0)`
      } else {
        const r = s.parentElement.getBoundingClientRect()
        if (r.bottom < 0 || r.top > vh) continue
        const p = clamp01((vh - r.top) / Math.max(1, 0.6 * (vh + r.height)))
        s.style.transform = `translate3d(${(-40 * (1 - p)).toFixed(1)}px, ${(-60 * (1 - p)).toFixed(1)}px, 0)`
      }
    }
  })
}
