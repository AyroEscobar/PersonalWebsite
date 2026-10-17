import { syncFromHtml, markStill, themeColorMeta } from './mode.js'
import { setFocus, setThemeState } from './store.js'
import { SECTION_IDS } from '../content/sections.js'
import { STORAGE } from '../content/constants.js'
import { HEAD } from '../content/meta.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled. Copies <html data-*> (set by
  the inline boot script) into the store, follows the OS motion setting into the still tier and the OS
  colour scheme while the viewer has not picked a theme, watches the section in view (the nav's
  aria-current) and sets html.scrolled after 80 px (the neck becomes a ground bar with a rule and the
  tongues go). No three here: the scene is src/scene/, mounted by src/lib/frieze-host.js.
*/
export function initClient() {
  syncFromHtml()

  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', (e) => {
    if (e.matches) markStill()
  })

  followSystemTheme()
  initActiveSection()
  initScrolledFlag()
}

/* no stored choice and no ?theme=: the vase follows the system's light or dark */
function followSystemTheme() {
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)')
  dark?.addEventListener?.('change', (e) => {
    let stored = null
    try {
      stored = localStorage.getItem(STORAGE.theme)
    } catch {
      stored = null
    }
    if (stored || /[?&]theme=/.test(location.search)) return
    const theme = e.matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    themeColorMeta().content = HEAD.themeColor[theme]
    setThemeState(theme)
  })
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

/* after 80 px the neck is a ground bar with a 1 px rule (html.scrolled) */
function initScrolledFlag() {
  const d = document.documentElement
  let ticking = false
  const on = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      d.classList.toggle('scrolled', window.scrollY > 80)
    })
  }
  window.addEventListener('scroll', on, { passive: true })
  d.classList.toggle('scrolled', window.scrollY > 80)
}
