/*
  Functions that run INSIDE the page (serialized with fn.toString()), so each
  one is self-contained. Used by scripts/qa/run.mjs.
*/

/** Counts requestAnimationFrame callbacks from the very first script. Install with addInitScript. */
export function rafCounterInit() {
  window.__qa = { raf: 0, rafSince: 0 }
  const orig = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) =>
    orig((t) => {
      window.__qa.raf++
      cb(t)
    })
}

/** Scroll the whole page in steps so lazy parts mount, then back to top. */
export async function scrollThrough() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const step = Math.max(200, Math.floor(window.innerHeight * 0.6))
  const H = () => document.documentElement.scrollHeight
  for (let y = 0; y < H(); y += step) {
    window.scrollTo({ top: y, behavior: 'instant' })
    await sleep(120)
  }
  window.scrollTo({ top: H(), behavior: 'instant' })
  await sleep(400)
  window.scrollTo({ top: 0, behavior: 'instant' })
  await sleep(400)
  return H()
}

/**
 * Horizontal overflow and the elements that cause it. `expected` is the
 * emulated viewport width. On a phone (mobile emulation) content that
 * overflows widens the layout viewport itself, so innerWidth grows with it
 * (a 390 phone laid out 529 wide reads innerWidth 529 and scrollWidth 529).
 * So: the document must not scroll sideways (scrollWidth vs clientWidth),
 * and the layout viewport must not be wider than the screen it was given.
 */
export function overflowCheck(expected = 0) {
  const doc = document.documentElement
  const vw = expected || window.innerWidth
  const sw = doc.scrollWidth
  const widened = expected > 0 && window.innerWidth > expected + 1
  const offenders = []
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true
    }
    return false
  }
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed' && (r.left < -1 || r.right > vw + 1) && cs.visibility === 'hidden') continue
      if (clipped(el)) continue
      offenders.push({
        sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
        left: Math.round(r.left),
        right: Math.round(r.right),
      })
    }
  }
  return { viewport: vw, layout: window.innerWidth, scrollWidth: sw, overflow: sw > doc.clientWidth + 1 || widened, offenders: offenders.slice(0, 8), offenderCount: offenders.length }
}

/** Broken images (after a scroll-through) and missing alt. */
export function imagesCheck() {
  const imgs = [...document.images]
  return {
    total: imgs.length,
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    noAlt: imgs.filter((i) => !i.hasAttribute('alt')).map((i) => i.currentSrc || i.src),
    noSize: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map((i) => i.currentSrc || i.src),
  }
}

/** Every link on the page, for the link check. */
export function linksList() {
  return [...document.querySelectorAll('a[href]')].map((a) => ({
    href: a.getAttribute('href'),
    abs: a.href,
    text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 60),
  }))
}

/** Hash links whose target id does not exist. */
export function hashTargets() {
  // "/#id" points at the home page: it is a same-page anchor only when this is the home page.
  const home = location.pathname === '/' || location.pathname === '/index.html'
  return [...document.querySelectorAll(home ? 'a[href^="#"], a[href^="/#"]' : 'a[href^="#"]')]
    .map((a) => a.getAttribute('href').replace(/^\/?#/, ''))
    .filter((id) => id && !document.getElementById(decodeURIComponent(id)))
}

/**
 * Contrast spot check: every visible element with its own text, composited
 * against the backgrounds behind it (canvas readback normalizes any CSS color
 * syntax: oklab, color-mix, display-p3). Elements over a background image or
 * gradient are reported as 'complex' and skipped.
 */
export function contrastCheck() {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (css) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const over = (top, base) => {
    const a = top[3]
    return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a)).concat(1)
  }
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const hidden = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return true
      if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') return true
    }
    const r = el.getBoundingClientRect()
    return r.width <= 1 || r.height <= 1
  }
  const results = []
  let complex = 0
  for (const el of document.body.querySelectorAll('*')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue
    if (el.closest('svg')) continue
    if (hidden(el)) continue
    const cs = getComputedStyle(el)
    // Backgrounds from the element up, until an opaque one.
    const layers = []
    let isComplex = false
    for (let p = el; p; p = p.parentElement) {
      const pcs = getComputedStyle(p)
      if (pcs.backgroundImage && pcs.backgroundImage !== 'none') {
        isComplex = true
        break
      }
      const c = rgba(pcs.backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 0.999) break
    }
    if (isComplex) {
      complex++
      continue
    }
    let bg = [255, 255, 255, 1]
    if (!layers.length || layers[layers.length - 1][3] < 0.999) bg = rgba(getComputedStyle(document.documentElement).backgroundColor)
    if (bg[3] < 0.999) bg = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg)
    const fg = over(rgba(cs.color), bg)
    const size = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight) || 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const r = ratio(fg, bg)
    results.push({
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50),
      tag: el.tagName.toLowerCase(),
      ratio: Math.round(r * 100) / 100,
      min: large ? 3 : 4.5,
      size,
      fail: r < (large ? 3 : 4.5),
    })
  }
  return {
    checked: results.length,
    complex,
    lowest: results.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 5),
    failures: results.filter((r) => r.fail).slice(0, 20),
    failCount: results.filter((r) => r.fail).length,
  }
}

/**
 * Target size (WCAG 2.5.8, PLAN.md 8). A target under 24 by 24 fails unless it
 * is an inline link inside a sentence, or a 24px circle on its center touches
 * no other target (the spacing exception), which is reported as a warning.
 */
export function targetsCheck() {
  const els = [...document.querySelectorAll('a[href], button, [role="button"], input, select, summary, [tabindex]:not([tabindex="-1"])')].filter((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.classList.contains('skip-link') && r.width > 0 && r.height > 0
  })
  const rects = els.map((el) => el.getBoundingClientRect())
  const small = []
  const spaced = []
  els.forEach((el, i) => {
    const cs = getComputedStyle(el)
    const r = rects[i]
    if (r.width >= 24 && r.height >= 24) return
    if (el.tagName === 'A' && cs.display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 2) return
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const clash = rects.some((o, j) => {
      if (j === i || els[j].contains(el) || el.contains(els[j])) return false
      const dx = Math.max(o.left - cx, 0, cx - o.right)
      const dy = Math.max(o.top - cy, 0, cy - o.bottom)
      return Math.hypot(dx, dy) < 12
    })
    const row = { text: (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }
    ;(clash ? small : spaced).push(row)
  })
  return { small: small.slice(0, 20), smallCount: small.length, spaced: spaced.slice(0, 20), spacedCount: spaced.length }
}

/** Structure facts: headings, landmarks, fonts, canvases, html data attributes. */
export function domFacts() {
  const q = (s) => [...document.querySelectorAll(s)]
  const txt = (e) => e.innerText.replace(/\s+/g, ' ').trim()
  return {
    title: document.title,
    lang: document.documentElement.lang,
    h1: q('h1').map(txt),
    h2: q('h2').map((e) => ({ id: e.id, text: txt(e) })),
    sections: q('main section[id]').map((s) => ({ id: s.id, labelledby: s.getAttribute('aria-labelledby') })),
    landmarks: { header: q('header').length, nav: q('nav').length, main: q('main').length, footer: q('footer').length },
    skipFirst: (() => {
      const f = q('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')[0]
      return !!f && /skip/i.test(f.textContent)
    })(),
    positiveTabindex: q('[tabindex]').filter((e) => Number(e.getAttribute('tabindex')) > 0).length,
    canvases: q('canvas').length,
    html: { ...document.documentElement.dataset },
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`),
    mapLabels: q('svg[role="img"] text').map((t) => t.textContent.trim()).filter(Boolean),
    touchAction: (() => {
      const m = document.querySelector('[data-map], svg[role="img"]')
      return m ? getComputedStyle(m).touchAction : null
    })(),
    // textContent too: a button inside a folded <details> is not rendered, so its innerText is empty, but it has a name.
    unnamedButtons: q('button').filter((b) => !(b.innerText.trim() || b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby'))).length,
    perf: (() => {
      const n = performance.getEntriesByType('navigation')[0]
      const p = performance.getEntriesByType('paint').find((x) => x.name === 'first-contentful-paint')
      return { dcl: n && Math.round(n.domContentLoadedEventEnd), load: n && Math.round(n.loadEventEnd), fcp: p && Math.round(p.startTime) }
    })(),
  }
}

/** Running animations longer than the 150 ms reduced-motion allowance. */
export function runningAnimations() {
  return document
    .getAnimations()
    .filter((a) => a.playState === 'running')
    .map((a) => {
      const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {}
      const target = a.effect && a.effect.target
      return {
        name: a.animationName || a.transitionProperty || a.constructor.name,
        duration: typeof t.duration === 'number' ? t.duration : 0,
        iterations: t.iterations,
        target: target ? target.tagName.toLowerCase() + (target.className && typeof target.className === 'string' ? '.' + target.className.split(' ')[0] : '') : '',
      }
    })
    .filter((a) => a.duration > 150 || a.iterations === Infinity)
}

/** Describe the focused element for the keyboard walk. */
export function focusInfo() {
  const el = document.activeElement
  if (!el || el === document.body) return { tag: 'body' }
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1)
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1)
  const hit = document.elementFromPoint(cx, cy)
  const inView = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
  const fixedOver = hit && hit !== el && !el.contains(hit) && !hit.contains(el)
  return {
    tag: el.tagName.toLowerCase(),
    name: (el.getAttribute('aria-label') || el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 50),
    href: el.getAttribute('href'),
    role: el.getAttribute('role'),
    outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
    // A card title draws its ring around the ruler that holds it on focus (the ruler would
    // cover a ring on the link itself), so a ring on that child counts.
    shadow: cs.boxShadow !== 'none' || [...el.querySelectorAll(':scope > .ruler')].some((r) => getComputedStyle(r).boxShadow !== 'none' && Number(getComputedStyle(r).opacity) > 0.5),
    inView,
    obscured: inView && fixedOver,
    rect: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
  }
}

/**
 * DESIGN.md 9.3: share of visible text nodes set in any monospace face (v2
 * ships none, so the share must be zero). Text inside SVG,
 * screen-reader-only text, closed dialogs, popovers and folded details (but
 * their summaries) is not visible type, so it is not counted.
 */
export function monoShare() {
  const shown = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    }
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.bottom > 0
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let total = 0
  let mono = 0
  let outside = 0
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue
    const el = n.parentElement
    if (!el || el.closest('svg, script, style, noscript, .sr-only, dialog:not([open]), [popover]:not(:popover-open)')) continue
    const folded = el.closest('details:not([open])')
    if (folded && !el.closest('summary')) continue
    if (!shown(el)) continue
    total++
    if (/mono|courier|consolas|menlo/i.test(getComputedStyle(el).fontFamily.split(',')[0])) {
      mono++
      // v5 ships no monospace face at all
      outside++
    }
  }
  return { total, mono, outside, share: total ? Math.round((mono / total) * 1000) / 10 : 0 }
}

/** r1 T9: elements inside <main> with a visible border on all four sides. */
export function borderedBoxes() {
  const out = []
  for (const el of document.querySelectorAll('main *')) {
    const folded = el.closest('details:not([open])')
    if (folded && folded !== el && !el.closest('summary')) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map(
      (s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs[`border${s}Color`]),
    )
    const r = el.getBoundingClientRect()
    if (sides.every(Boolean) && r.width > 0 && r.height > 0) out.push(String(el.className || el.tagName).slice(0, 40))
  }
  return { count: out.length, sample: out.slice(0, 12) }
}

/** r1 T12: layout shift collected from the very first paint. Install with addInitScript. */
export function clsInit() {
  window.__cls = 0
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    /* no layout-shift entries in this browser */
  }
}
