import { syncFromHtml, markStill } from './mode.js'
import { setFocus } from './store.js'
import { SECTION_IDS } from '../content/sections.js'
import { initNeckCut, initReveals, initSun } from './reveal.js'

/*
  Client start-up, called once from main.jsx after hydration is scheduled. Copies <html data-*> (set by
  the inline boot script) into the store, follows the OS motion setting into the still tier (the theme
  does not follow the OS: light is the default and the switch the only way to dark), watches the
  section in view (the nav's aria-current), sets html.scrolled at the cut (the neck becomes a ground bar
  with a rule and the tongues go) and moves the late sun on the clay with the reader (src/lib/reveal.js).
  No three here: the scene is src/scene/, mounted by src/lib/frieze-host.js.
*/
export function initClient() {
  syncFromHtml()

  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', (e) => {
    if (e.matches) markStill()
  })

  initActiveSection()
  initNeckCut()
  initReveals()
  initSun()
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
