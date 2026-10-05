/*
  Pointer light on glass (DESIGN.md 4.2). One listener for the whole page.

    hover   on fine pointers, every [data-spec] element tracks the pointer in
            --mx and --my, so its specular sits under the cursor
    press   pressing a glass button lights it from within at the press point;
            inside a .btn-group the glow also spills across the seam into the
            neighbouring glass button (.is-spill), from prototype c
*/
export function initPointer() {
  if (typeof document === 'undefined') return
  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  const place = (el, e) => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`)
    el.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`)
  }

  if (fine) {
    document.addEventListener(
      'pointermove',
      (e) => {
        const el = e.target.closest?.('[data-spec]')
        if (el) place(el, e)
      },
      { passive: true },
    )
  }

  document.addEventListener(
    'pointerdown',
    (e) => {
      const btn = e.target.closest?.('.btn')
      if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return
      if (btn.classList.contains('glass')) place(btn, e)
      const group = btn.closest('.btn-group')
      if (!group) return
      const lit = [...group.querySelectorAll('.btn.glass')].filter((b) => b !== btn)
      lit.forEach((b) => {
        place(b, e)
        b.classList.add('is-spill')
      })
      const off = () => {
        lit.forEach((b) => b.classList.remove('is-spill'))
        window.removeEventListener('pointerup', off)
        window.removeEventListener('pointercancel', off)
      }
      window.addEventListener('pointerup', off)
      window.addEventListener('pointercancel', off)
    },
    { passive: true },
  )
}
