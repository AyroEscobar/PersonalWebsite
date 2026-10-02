import { useSyncExternalStore } from 'react'
import { SECTION_IDS } from '../content/sections.js'
import { setFocus } from '../lib/store.js'

/*
  Where the reader is on the line (B, PLAN.md 4.5). One scroll listener for
  the rail, the bottom bar and the stops sheet.

    useRoute()  { index, progress }
                index     the current stop (0 to 5), the section under the
                          reading line at 42% of the viewport
                progress  0 to 1 along the whole line, continuous: it reaches
                          stop k exactly when section k reaches the reading line

  Section offsets are measured on resize, on load and when <main> changes
  height (lazy parts mounting, a details opening), never inside the scroll
  handler, so a scroll costs two reads of cached numbers and at most one
  store update. No requestAnimationFrame: scroll events already arrive once
  per frame, and the page keeps exactly one rAF loop (the map's).

  The last stops can sit too low to ever reach the reading line, so each
  arrival point is capped by how far the page can scroll. At the very bottom
  the reader is at the last stop.

  Also the writer of store.focus, which the map camera follows.
*/

const N = SECTION_IDS.length
// The reading line: a stop becomes current when its section's top passes 42%
// of the viewport, so the rail never lags a heading you are already reading (r1 M9).
const LINE = 0.42

let state = { index: 0, progress: 0 }
const SERVER = state
const readers = new Set()
let arrive = []
let ro = null

function measure() {
  const doc = document.documentElement
  const maxProbe = Math.max(0, doc.scrollHeight - window.innerHeight) + window.innerHeight * LINE
  const tops = SECTION_IDS.map((id) => {
    const el = document.getElementById(id)
    return el ? el.getBoundingClientRect().top + window.scrollY : Infinity
  })
  // Cap each arrival by the scroll range, keeping them strictly increasing.
  arrive = tops.map((t, k) => Math.min(t, maxProbe - (N - 1 - k) * 12))
  for (let k = 1; k < N; k++) if (arrive[k] <= arrive[k - 1]) arrive[k] = arrive[k - 1] + 1
}

function update() {
  if (!arrive.length) measure()
  const probe = window.scrollY + window.innerHeight * LINE
  let i = 0
  for (let k = 0; k < N; k++) if (arrive[k] <= probe + 1) i = k
  let f = 0
  if (i < N - 1) {
    const span = arrive[i + 1] - arrive[i]
    f = span > 0 ? Math.min(1, Math.max(0, (probe - arrive[i]) / span)) : 0
  }
  const progress = N > 1 ? Math.min(1, (i + f) / (N - 1)) : 0
  // Quantize so sub-pixel scrolls do not re-render anything.
  const q = Math.round(progress * 1000) / 1000
  if (i === state.index && q === state.progress) return
  const moved = i !== state.index
  state = { index: i, progress: q }
  readers.forEach((fn) => fn())
  if (moved) setFocus(SECTION_IDS[i])
}

const onScroll = () => update()
const onResize = () => {
  measure()
  update()
}

function start() {
  measure()
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('load', onResize, { once: true })
  document.fonts?.ready?.then(onResize).catch(() => {})
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(onResize)
    const main = document.getElementById('main')
    if (main) ro.observe(main)
  }
}

function stop() {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  ro?.disconnect()
  ro = null
}

function subscribe(fn) {
  readers.add(fn)
  if (readers.size === 1) start()
  return () => {
    readers.delete(fn)
    if (!readers.size) stop()
  }
}

export function useRoute() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  )
}

/*
  Scroll to a stop (or any element id on the page) and land focus on its
  heading, so keyboard and screen reader users arrive where they asked to
  go (a plain fragment link only moves the focus starting point).

  A smooth scroll can lose a race with another one already in flight (a
  scrollTo that has not finished, a flick on a trackpad). When the scroll
  settles, if the target is not where it should be, it is placed there
  without animation. History gets an entry, like a fragment link would.
*/
export function goTo(id, { smooth = true } = {}) {
  const el = document.getElementById(id)
  if (!el) return false
  const heading = document.getElementById(`${id}-h`)
  const target = heading || el
  const reduced = document.documentElement.dataset.motion === 'reduced'
  const animate = smooth && !reduced
  el.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'start' })
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  try {
    const hash = `#${id}`
    if (window.location.hash === hash) window.history.replaceState(null, '', hash)
    else window.history.pushState(null, '', hash)
  } catch {
    /* history blocked: the scroll already happened */
  }
  if (animate) settle(el)
  return true
}

function settle(el) {
  let done = false
  // A reader who takes over the scroll is never pulled back.
  const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  const takeover = () => finish(false)
  const finish = (fix) => {
    if (done) return
    done = true
    window.removeEventListener('scrollend', onEnd)
    INPUT.forEach((t) => window.removeEventListener(t, takeover, true))
    if (!fix) return
    const top = el.getBoundingClientRect().top
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    if (Math.abs(top - pad) > 24 && !(atBottom && top > pad)) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
  const onEnd = () => finish(true)
  INPUT.forEach((t) => window.addEventListener(t, takeover, { capture: true, passive: true }))
  if ('onscrollend' in window) window.addEventListener('scrollend', onEnd)
  window.setTimeout(onEnd, 1200)
}

/** Click handler for same-page stop links: plain clicks go through goTo, modified clicks stay native. */
export function onStopClick(e, id) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (!document.getElementById(id)) return
  e.preventDefault()
  goTo(id)
}
