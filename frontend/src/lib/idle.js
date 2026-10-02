/*
  Scheduling helpers for anything that must stay off the critical path.

    afterLoad()                  resolves after window 'load' (immediately if it already fired)
    onIdle(fn, timeout)          requestIdleCallback with a setTimeout fallback (Safari); returns a cancel fn
    whenVisible(el, rootMargin)  resolves the first time el comes near the viewport
*/

export function afterLoad() {
  if (typeof window === 'undefined') return new Promise(() => {})
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
}

export function onIdle(fn, timeout = 1500) {
  if (typeof window === 'undefined') return () => {}
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 200)
  return () => window.clearTimeout(id)
}

export function whenVisible(el, rootMargin = '200px 0px') {
  return new Promise((resolve) => {
    if (!el || typeof IntersectionObserver === 'undefined') return resolve()
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          resolve()
        }
      },
      { rootMargin },
    )
    io.observe(el)
  })
}
