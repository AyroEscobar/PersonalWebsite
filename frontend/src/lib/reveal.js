/*
  The page's own motion, in the entry (no three):

    initReveals()   below the fold the belly is made the way the pot was made (reveal.css): each section
                    title is cut in as it reaches 20% in view; each block (a work plate, an experience
                    row, the stack paragraph, the contact plate) turns in from the right as it enters, the
                    ones arriving together 60 ms apart; the foot's meander draws itself. Once each. Only
                    under html.rv, which the boot script sets in a live tier, not quiet, not under ?t=; on
                    the home page only; and rv goes the moment the tier turns still or quiet.
    initNeckCut()   the neck stays the pot's clay, with its tongues, until whichever comes first under it:
                    the hero's plate (at 1440, so the big name never passes under the nav words on a clear
                    neck) or its meander (on a phone, where the plate is under the frieze). At that frame
                    html.scrolled: the ground bar, its rule, no tongues. Pages without a shoulder (the
                    kit, the 404) keep the old rule, a bar after 80 px.
    initSun()   the late sun on the clay moves with the reader: the patch slides 60 px right and 40 px
                lower over the hero's exit, and comes down onto the contact band as it arrives. Where the
                browser has scroll-driven animations, motion.css does it on the compositor and this does
                nothing; elsewhere it writes the same transform from the band's position on a frame.
                Never in the still tier, never under reduced motion.
*/
import { getState, subscribe } from './store.js'

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

export function initReveals() {
  if (typeof window === 'undefined') return
  const d = html()
  window.__rv = true
  if (!d.classList.contains('rv')) return
  const allowed = () => {
    const s = getState()
    return s.tier !== 'still' && !s.quiet
  }
  if (typeof IntersectionObserver === 'undefined' || !document.querySelector('.hero') || !allowed()) {
    d.classList.remove('rv')
    return
  }
  const once = (io, el) => {
    el.classList.add('in')
    io.unobserve(el)
  }
  // the titles and the foot's meander, at 20% in view
  const titles = new IntersectionObserver(
    (es) => {
      for (const e of es) if (e.isIntersecting) once(titles, e.target)
    },
    { threshold: 0.2, rootMargin: '0px 0px -6% 0px' },
  )
  document.querySelectorAll('main .sec-title, .meander--foot').forEach((el) => titles.observe(el))
  // the blocks, one by one as they come up the screen; those that arrive together are 60 ms apart
  const blocks = new IntersectionObserver(
    (es) => {
      let k = 0
      const hits = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      for (const e of hits) {
        e.target.style.setProperty('--d', `${60 * k++}ms`)
        once(blocks, e.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  document.querySelectorAll('main .turn').forEach((el) => blocks.observe(el))
  // the still tier or quiet, mid-visit: everything is finished at once
  const off = subscribe(() => {
    if (allowed()) return
    d.classList.remove('rv')
    titles.disconnect()
    blocks.disconnect()
    off()
  })
}

export function initNeckCut() {
  if (typeof window === 'undefined') return
  const d = html()
  const meander = document.querySelector('.hero > .meander')
  const plate = document.querySelector('.hero-plate')
  if (!meander) {
    onScrollFrame(() => d.classList.toggle('scrolled', window.scrollY > 80))
    return
  }
  // the cut line: the neck's row and its tongue band (a constant, so the cut never flickers as the
  // tongues collapse)
  const px = (name) => parseFloat(getComputedStyle(d).getPropertyValue(name)) || 0
  onScrollFrame(() => {
    const line = px('--neck-h') + px('--tongue-h')
    const top = Math.min(meander.getBoundingClientRect().top, plate ? plate.getBoundingClientRect().top : Infinity)
    d.classList.toggle('scrolled', top <= line)
  })
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
