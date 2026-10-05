import { SECTION_IDS } from '../content/sections.js'

/*
  The reader (DESIGN.md 1.1, 4.3, 5.1, 6.1), ported from prototype a. One
  <nav id="nav"> reads his sentence line by line through the first screen
  of scroll, then morphs once into the navigation: a pill at the top on
  wide screens, a dock at the bottom on phones. Scrolling back up turns it
  into the lens again.

    const stop = startReader({ nav, sentence, lens })   after hydration and fonts
      nav       the <nav> (LensNav with `reader`)
      sentence  the ReadingSentence <p>, with its stand-in lens
      lens      the src/glass/lens.js module (maps, loupe, entry)

  Modes (html[data-mode], written by the boot script before paint):
    morph   the lens is the nav. The stand-in (CSS only) rests on line 2 at
            first paint; the nav takes its exact box and the stand-in hides.
    split   reduced motion or tier lite: the nav is a pill (a dock on
            phones) from first paint and the stand-in stays. Reduced motion:
            it rests on the last line and nothing travels. Lite: it reads the
            sentence by cross-fading from line to line, no morph.

  Geometry comes from the stand-in's own box, so the hand-off never jumps:
  x, width and height are its box, and line i sits (i - at) line pitches
  from it. Scroll work runs on requestAnimationFrame only. Moves are
  transforms; the morph is the one place width, height and radius
  transition (motion.css). Keyboard: focusing a nav word while it is the
  lens turns it into the nav at once.

  The reader owns the nav's classes and inline box after hydration (React
  renders it once and never again): is-lens / is-pill / is-dock, is-fixed,
  is-open, is-ready, over-content, aria-current and the bead.
*/

const PHONE = '(max-width: 639.98px)'
const MAG = 1.16

export function startReader({ nav, sentence, lens: L }) {
  const html = document.documentElement
  const stand = sentence.querySelector('.lens-static')
  const list = nav.querySelector('.nav-list')
  const bead = nav.querySelector('.bead')
  const links = [...nav.querySelectorAll('.nav-a')]
  const sections = SECTION_IDS.map((id) => document.getElementById(id))
  const mode = html.dataset.mode === 'morph' ? 'morph' : 'split'
  const reduced = () => html.dataset.motion === 'reduced'
  const lite = html.dataset.tier === 'lite'
  const ms = (t) => (reduced() ? 0 : t)

  let G = null
  let state = mode === 'morph' ? 'lens' : 'pill'
  let idx = 1
  let forced = false
  let ticking = false
  let token = 0
  let active = null
  let loupeT = 0
  let fadeT = 0
  let openT = 0
  let first = true
  let stopped = false

  nav.dataset.lensOwn = ''
  stand.dataset.lensOwn = ''

  // ---------- geometry ----------
  function geometry() {
    const phone = window.matchMedia(PHONE).matches
    const lines = L.wordLines(sentence)
    const pitch = parseFloat(getComputedStyle(sentence).lineHeight) || 40
    const at = Number(getComputedStyle(stand).getPropertyValue('--lens-at')) || 0
    const prev = stand.style.transform
    stand.style.transform = ''
    const r = stand.getBoundingClientRect()
    stand.style.transform = prev
    const y0 = r.top + window.scrollY - at * pitch
    const last = Math.max(0, lines.length - 1)
    return {
      phone,
      lines,
      pitch,
      at,
      x: r.left + window.scrollX,
      W: r.width,
      H: r.height,
      ys: lines.map((_, i) => y0 + i * pitch),
      start: Math.min(1, last),
      last,
    }
  }
  const targetIdx = (y) => Math.max(G.start, Math.min(G.last, G.start + Math.round(y / G.pitch)))
  const threshold = () => (G.last - G.start) * G.pitch + 0.55 * G.pitch
  const lensBox = (i) => ({ x: G.x, y: G.ys[i], w: G.W, h: G.H, r: G.H / 2 })
  const toViewport = (b) => ({ ...b, x: b.x - window.scrollX, y: b.y - window.scrollY })

  // ---------- the inline box (lens state and the morph only) ----------
  /*
    b is where the nav shows; `at` is where its layout box sits, and the
    difference is a transform. Browsers count a layout shift when a visible
    box's layout position moves, never for a transform, so the morph keeps the
    layout box where the morph ends (the pill's or the dock's own CSS place,
    or the page origin for the lens, which is off screen by the time the lens
    takes over) and only the transform travels.
  */
  function place(b, at = { x: 0, y: 0 }) {
    const s = nav.style
    s.left = `${Math.round(at.x)}px`
    s.top = `${Math.round(at.y)}px`
    s.right = s.bottom = 'auto'
    s.margin = '0'
    s.width = `${b.w}px`
    s.height = `${b.h}px`
    s.borderRadius = `${b.r}px`
    s.transform = `translate3d(${Math.round(b.x) - Math.round(at.x)}px, ${Math.round(b.y) - Math.round(at.y)}px, 0)`
  }
  function unplace() {
    const s = nav.style
    s.left = s.top = s.right = s.bottom = s.margin = s.width = s.height = s.borderRadius = s.transform = ''
  }
  function still(fn) {
    nav.style.transition = 'none'
    fn()
    void nav.offsetWidth
    nav.style.transition = ''
  }
  function onEnd(fn, dur) {
    const t = ++token
    let done = false
    const finish = () => {
      if (done || t !== token) return
      done = true
      nav.removeEventListener('transitionend', h)
      fn()
    }
    const h = (e) => e.target === nav && e.propertyName === 'transform' && finish()
    nav.addEventListener('transitionend', h)
    window.setTimeout(finish, dur + 80)
  }
  const presetFor = () => (G.phone ? 'dock' : 'nav')

  // ---------- the loupe: the magnified words, in every browser (src/glass/lens.js) ----------
  function loupeAt(el, i) {
    window.clearTimeout(loupeT)
    if (G.lines[i]) L.loupeOn(el, G.lines[i], MAG)
  }
  function loupeAfterMove(el, i, dur) {
    window.clearTimeout(loupeT)
    L.loupeOff(el)
    loupeT = window.setTimeout(() => G.lines[i] && L.loupeOn(el, G.lines[i], MAG), dur)
  }

  // ---------- the section in view: aria-current and the bead ----------
  function placeBead() {
    const a = links.find((l) => l.hasAttribute('aria-current'))
    if (!a || !bead) return
    const lr = list.getBoundingClientRect()
    const ar = a.getBoundingClientRect()
    if (!lr.width) return
    bead.style.transform = `translateX(${ar.left - lr.left}px) scaleX(${ar.width / 100})`
    bead.dataset.placed = ''
  }
  function updateActive() {
    const line = window.innerHeight * 0.38
    let cur = SECTION_IDS[0]
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top <= line) cur = SECTION_IDS[i]
    })
    if (cur === active) return
    active = cur
    links.forEach((a) => {
      if (a.getAttribute('href') === `#${cur}`) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    })
    placeBead()
  }

  // ---------- the morph ----------
  function toPill() {
    state = 'pill'
    window.clearTimeout(loupeT)
    L.loupeOff(nav)
    const from = toViewport(lensBox(idx))
    const cls = G.phone ? 'is-dock' : 'is-pill'
    let to
    still(() => {
      // measure where the pill (or dock) will sit, with its own classes and no inline box
      unplace()
      nav.classList.remove('is-lens')
      nav.classList.add(cls, 'is-fixed')
      const r = nav.getBoundingClientRect()
      to = { x: r.left, y: r.top, w: r.width, h: r.height, r: G.phone ? 28 : r.height / 2 }
      place(from, to)
    })
    nav.dataset.morphing = ''
    nav.dataset.lensPreset = presetFor()
    place(to, to)
    window.clearTimeout(openT)
    openT = window.setTimeout(() => {
      if (state !== 'pill') return
      nav.classList.add('is-open', 'over-content')
      placeBead()
    }, ms(260))
    onEnd(() => {
      delete nav.dataset.morphing
      still(unplace)
      const r = nav.getBoundingClientRect()
      L.applyLens(nav, presetFor(), r.width, r.height)
      placeBead()
    }, ms(500))
  }

  function toLens() {
    state = 'lens'
    window.clearTimeout(openT)
    nav.classList.remove('is-open', 'over-content')
    idx = targetIdx(window.scrollY)
    let at
    still(() => {
      const r = nav.getBoundingClientRect()
      at = { x: r.left, y: r.top, w: r.width, h: r.height, r: G.phone ? 28 : r.height / 2 }
      place(at, at)
    })
    nav.dataset.morphing = ''
    nav.dataset.lensPreset = 'lens'
    nav.classList.remove('is-pill', 'is-dock')
    nav.classList.add('is-lens')
    place(toViewport(lensBox(idx)), at)
    onEnd(() => {
      still(() => {
        nav.classList.remove('is-fixed')
        idx = targetIdx(window.scrollY)
        place(lensBox(idx))
      })
      delete nav.dataset.morphing
      L.applyLens(nav, 'lens', G.W, G.H)
      loupeAt(nav, idx)
      update()
    }, ms(500))
  }

  // ---------- lite: the stand-in reads by cross-fade ----------
  function moveStand(i, fade = true) {
    const go = () => {
      stand.style.transform = i === G.at ? '' : `translateY(${(i - G.at) * G.pitch}px)`
      stand.style.opacity = ''
      loupeAt(stand, i)
    }
    window.clearTimeout(fadeT)
    if (!fade) return go()
    L.loupeOff(stand)
    stand.style.opacity = '0'
    fadeT = window.setTimeout(go, 160)
  }

  // ---------- scroll ----------
  function update() {
    ticking = false
    if (!G || stopped) return
    updateActive()
    const y = window.scrollY
    if (mode === 'morph') {
      const want = forced || y > threshold()
      if (state === 'lens' && !want) {
        if (nav.dataset.morphing !== undefined) return
        const i = targetIdx(y)
        if (i !== idx) {
          idx = i
          place(lensBox(idx))
          loupeAfterMove(nav, idx, ms(420))
        }
      } else if (state === 'lens' && want) toPill()
      else if (state === 'pill' && !want) toLens()
    } else {
      nav.classList.toggle('over-content', y > 40)
      if (lite && !reduced()) {
        const i = targetIdx(y)
        if (i !== idx) {
          idx = i
          moveStand(idx)
        }
      }
    }
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  // ---------- set up, and again on resize ----------
  function setup() {
    G = geometry()
    if (mode === 'morph') {
      nav.classList.remove('is-auto')
      if (state === 'lens' && nav.dataset.morphing === undefined) {
        idx = targetIdx(window.scrollY)
        if (window.scrollY > threshold() || forced) {
          state = 'pill'
          still(() => {
            unplace()
            nav.classList.remove('is-lens', 'is-pill', 'is-dock')
            nav.classList.add(G.phone ? 'is-dock' : 'is-pill', 'is-fixed', 'is-open', 'over-content')
          })
          nav.dataset.lensPreset = presetFor()
          const r = nav.getBoundingClientRect()
          L.applyLens(nav, presetFor(), r.width, r.height)
        } else {
          still(() => {
            nav.classList.remove('is-pill', 'is-dock', 'is-fixed', 'is-open', 'over-content')
            nav.classList.add('is-lens')
            place(lensBox(idx))
          })
          nav.dataset.lensPreset = 'lens'
          if (first) L.materialize(nav, 'lens', G.W, G.H, { fx: false })
          else L.applyLens(nav, 'lens', G.W, G.H)
          loupeAt(nav, idx)
        }
      } else if (state === 'pill' && nav.dataset.morphing === undefined) {
        // a resize can cross the phone line: pill and dock swap
        still(() => {
          nav.classList.remove('is-pill', 'is-dock')
          nav.classList.add(G.phone ? 'is-dock' : 'is-pill')
        })
        nav.dataset.lensPreset = presetFor()
        const r = nav.getBoundingClientRect()
        L.applyLens(nav, presetFor(), r.width, r.height)
      }
      nav.classList.add('is-ready')
      stand.classList.add('is-handed')
      L.loupeOff(stand)
    } else {
      nav.dataset.lensPreset = presetFor()
      const r = nav.getBoundingClientRect()
      L.applyLens(nav, presetFor(), r.width, r.height)
      idx = reduced() ? G.last : lite ? targetIdx(window.scrollY) : G.start
      if (first) L.materialize(stand, 'lens', G.W, G.H, { fx: false })
      else L.applyLens(stand, 'lens', G.W, G.H)
      if (lite && !reduced()) moveStand(idx, false)
      else loupeAt(stand, idx)
      nav.classList.add('is-ready')
    }
    first = false
    active = null
    update()
  }

  // keyboard: a nav word focused while it is the lens turns it into the nav at once
  const onFocusIn = () => {
    if (mode !== 'morph' || forced) return
    forced = true
    update()
  }
  const onFocusOut = (e) => {
    if (nav.contains(e.relatedTarget)) return
    forced = false
    onScroll()
  }
  // the quiet switch: the loupe steps aside for the solid plate, and comes back
  const onQuiet = () => {
    if (!G) return
    const el = mode === 'morph' ? nav : stand
    if (mode === 'morph' && state !== 'lens') return
    loupeAt(el, idx)
  }
  let rt = 0
  const onResize = () => {
    window.clearTimeout(rt)
    rt = window.setTimeout(setup, 150)
  }

  setup()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('ae:quiet', onQuiet)
  nav.addEventListener('focusin', onFocusIn)
  nav.addEventListener('focusout', onFocusOut)

  return () => {
    stopped = true
    ;[loupeT, fadeT, openT, rt].forEach((t) => window.clearTimeout(t))
    token++
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('ae:quiet', onQuiet)
    nav.removeEventListener('focusin', onFocusIn)
    nav.removeEventListener('focusout', onFocusOut)
  }
}
