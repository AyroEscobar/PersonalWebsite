import { useEffect, useState } from 'react'
import { SECTION_IDS } from '../content/sections.js'

/*
  The section in view, for the nav's aria-current: the last section whose
  top has passed 38% of the viewport. Scroll work happens on
  requestAnimationFrame only. 'origin' on the server and while hydrating.
*/
export function useActiveSection(ids = SECTION_IDS) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      const line = window.innerHeight * 0.38
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) cur = id
      }
      setActive(cur)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])
  return active
}
