import { syncFromHtml, markStill } from './mode.js'
import { setFocus } from './store.js'
import { SECTION_IDS } from '../content/sections.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled.
  Copies <html data-*> (set by the inline boot script) into the store,
  follows the OS motion setting into the still tier, starts the pointer
  specular on glass, the section reveals, the active-section watcher and the
  wordmark's step-aside. No three here: the scene is src/scene/, mounted by
  src/hero/Stage.jsx after load and idle.
*/
export function initClient() {
  syncFromHtml()

  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', (e) => {
    if (e.matches) markStill()
  })

  initPointerSpec()
  initReveals()
  initActiveSection()
  initScrolledFlag()
}

/* the pointer specular on glass that asked for it (fine pointers only) */
function initPointerSpec() {
  if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return
  let raf = 0
  let last = null
  const apply = () => {
    raf = 0
    if (!last) return
    const { el, x, y } = last
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((x - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((y - r.top) / r.height) * 100}%`)
  }
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target.closest?.('.glass[data-spec]')
      if (!el) return
      last = { el, x: e.clientX, y: e.clientY }
      if (!raf) raf = requestAnimationFrame(apply)
    },
    { passive: true },
  )
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

/* the wordmark steps aside once the hero has scrolled by */
function initScrolledFlag() {
  const d = document.documentElement
  const on = () => d.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.5)
  window.addEventListener('scroll', on, { passive: true })
  on()
}
