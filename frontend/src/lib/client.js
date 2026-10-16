import { syncFromHtml, markStill } from './mode.js'
import { setFocus } from './store.js'
import { SECTION_IDS } from '../content/sections.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled.
  Copies <html data-*> (set by the inline boot script) into the store,
  follows the OS motion setting into the still tier, starts the section
  reveals, the active-section watcher and the scrolled flag (the header's
  solid bar). No three here: the scene is src/scene/, mounted by
  src/hero/Stage.jsx after load and idle.
*/
export function initClient() {
  syncFromHtml()

  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', (e) => {
    if (e.matches) markStill()
  })

  initReveals()
  initActiveSection()
  initScrolledFlag()
}

/* entrances: a 240 ms fade and a 16 px rise when a panel's section crosses the viewport */
function initReveals() {
  const els = document.querySelectorAll('.reveal')
  const q = new URLSearchParams(location.search)
  if (q.get('ui') === '0' || q.has('static') || q.has('t') || typeof IntersectionObserver === 'undefined') {
    els.forEach((el) => el.classList.add('in'))
    return
  }
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        io.unobserve(e.target)
      }),
    { threshold: 0.12 },
  )
  els.forEach((el) => io.observe(el))
}

/* the nav's active section */
function initActiveSection() {
  if (typeof IntersectionObserver === 'undefined') return
  const io = new IntersectionObserver(
    (es) => {
      for (const e of es) if (e.isIntersecting) setFocus(e.target.id)
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  for (const id of ['top', ...SECTION_IDS]) {
    const el = document.getElementById(id)
    if (el) io.observe(el)
  }
}

/* after the hero has scrolled by, the header becomes a solid bar (html.scrolled) */
function initScrolledFlag() {
  const d = document.documentElement
  const on = () => d.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.5)
  window.addEventListener('scroll', on, { passive: true })
  on()
}
