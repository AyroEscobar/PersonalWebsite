/*
  Field life (DESIGN.md 3.5): the blobs drift only while their field is
  near the screen. One IntersectionObserver marks each .field with
  .is-live; motion.css runs the drift (both motion gates, not at tier lite)
  only on live fields, so the page never holds every blob as a moving layer.
  Without JavaScript, or before this runs, the field is simply still.
*/
export function initFieldLife() {
  if (typeof IntersectionObserver === 'undefined') return
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle('is-live', e.isIntersecting)
    },
    { rootMargin: '25% 0px' },
  )
  document.querySelectorAll('.field').forEach((f) => io.observe(f))
}
