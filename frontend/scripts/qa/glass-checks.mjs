/*
  Glass checks (DESIGN.md 9, 10, 11): the v2 QA that replaced the r2 map
  checks. Run by run.mjs; each reports through check('glass', ...).

    contrast    text measured on what is really behind it: at scroll 0, 900,
                1800 and 2700, at 1440 and at 390, each text box is sampled
                with its text hidden (html.notext), and the lowest WCAG ratio
                between the text colour and any backdrop pixel under it must
                reach 4.5 (3 for large text). From prototype b's capture.
    surfaces    3 to 5 glass surfaces with a live backdrop-filter on the
                first screen (12.2)
    reader      the nav takes the stand-in lens's exact box after the fonts
                (morph mode), and a deep link lands with the nav as a pill
    morph       scrolling past the sentence morphs the lens into the pill in
                under 600 ms, and there is still one #nav
    keyboard    a Tab walk reaches every link, button and summary
    overflow    nothing scrolls sideways at 320, 390, 768, 1024, 1440, 1920
    forced      forced colours: every glass surface has a 2px border, the
                field is gone
    quiet       ?quiet=1: every glass surface is a solid plate (no
                backdrop-filter) and the lens sits under the words
*/

const fn = (f, ...args) => `(${f.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`

// Decode a PNG screenshot in the page and keep a sampler on window.__img.
const SAMPLER = `window.__px = async (b64) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + b64
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  window.__img = { w: c.width, h: c.height, at: (px, py) => { const i = (Math.round(py) * c.width + Math.round(px)) * 4; return [d[i], d[i + 1], d[i + 2]] } }
  return [c.width, c.height]
};
window.__rgb = (css) => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = css; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3]] };
true`

/** In the page: every visible text box in the viewport, with its colour and size, before the text is hidden. */
function textBoxes() {
  const shown = (el) => {
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.1) return false
    }
    return true
  }
  const out = []
  window.__els = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue
    const el = n.parentElement
    if (!el || el.closest('script, style, noscript, .sr-only, .loupe, svg, details:not([open]) > :not(summary)') || !shown(el)) continue
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight) || 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const range = document.createRange()
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) {
      if (r.width < 4 || r.height < 4) continue
      if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) continue
      // text under something else (the pinned nav passing over it) is not what a reader sees there
      const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
      if (hit && !el.contains(hit) && !hit.contains(el)) continue
      out.push({ i: window.__els.push(el) - 1, text: n.textContent.trim().slice(0, 32), color: cs.color, large, l: r.left, t: r.top, r: r.right, b: r.bottom })
    }
  }
  return out
}

/** In the page: the lowest ratio between each box's text colour and the backdrop pixels under it. */
function scoreBoxes(boxes, dpr) {
  const lin = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const img = window.__img
  return boxes
    .map((bx) => {
      const el = window.__els[bx.i]
      const fg = window.__rgb(bx.color)
      let worst = Infinity
      // a 9 by 3 grid inside the box, 1px in from its edges; a point under something else
      // (the pinned nav passing over a line) is not part of this text's backdrop
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 3; j++) {
          const cx = bx.l + 1 + ((bx.r - bx.l - 2) * (i + 0.5)) / 9
          const cy = bx.t + 1 + ((bx.b - bx.t - 2) * (j + 0.5)) / 3
          const hit = document.elementFromPoint(cx, cy)
          if (el && hit && !el.contains(hit) && !hit.contains(el)) continue
          const x = cx * dpr
          const y = cy * dpr
          if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue
          worst = Math.min(worst, ratio(fg, img.at(x, y)))
        }
      }
      return { text: bx.text, ratio: Math.round(worst * 100) / 100, min: bx.large ? 3 : 4.5 }
    })
    .filter((s) => Number.isFinite(s.ratio))
}

/** In the page: visible glass surfaces with a live backdrop-filter on screen. */
function liveGlass() {
  return [...document.querySelectorAll('.glass')].filter((g) => {
    const cs = getComputedStyle(g)
    const r = g.getBoundingClientRect()
    if (cs.visibility === 'hidden' || cs.display === 'none' || !r.width || r.bottom <= 0 || r.top >= innerHeight) return false
    const bf = cs.backdropFilter || cs.webkitBackdropFilter || 'none'
    return bf !== 'none'
  }).map((g) => g.className.split(' ').filter((c) => /^(glass--|lens-nav|btn|quiet|card|plate|contact|linkrow)/.test(c)).join('.'))
}

export async function glassChecks({ cdp, url, check, sleep }) {
  const capture = async (page) => (await page.send('Page.captureScreenshot', { format: 'png' })).data
  const origin = new URL(url).origin
  const fresh = async (opts, path = '/', settle = 1800) => {
    const page = await cdp.newPage(opts)
    await page.send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage,session_storage' })
    await page.goto(url + path, { settle })
    return page
  }
  const SIZES = [
    ['1440', { width: 1440, height: 900, dpr: 1 }],
    ['390', { width: 390, height: 844, dpr: 2, mobile: true }],
  ]

  // ---------- composite contrast, measured ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts)
    await page.eval(SAMPLER)
    const fails = []
    let lowest = null
    let n = 0
    for (const y of [0, 900, 1800, 2700]) {
      await page.eval(`window.scrollTo({ top: ${y}, behavior: 'instant' })`)
      await sleep(900)
      const boxes = await page.eval(fn(textBoxes))
      await page.eval(`document.documentElement.classList.add('notext')`)
      await sleep(120)
      await page.eval(`window.__px(${JSON.stringify(await capture(page))})`)
      await page.eval(`document.documentElement.classList.remove('notext')`)
      const scored = await page.eval(fn(scoreBoxes, boxes, opts.dpr))
      n += scored.length
      for (const s of scored) {
        if (!lowest || s.ratio / s.min < lowest.ratio / lowest.min) lowest = { ...s, y }
        if (s.ratio < s.min) fails.push(`"${s.text}" ${s.ratio} at ${y}`)
      }
    }
    check('glass', `measured contrast @${label}`, fails.length ? 'fail' : 'pass', fails.length ? fails.slice(0, 6).join(' | ') : `${n} text boxes at scroll 0, 900, 1800, 2700; lowest "${lowest?.text}" ${lowest?.ratio} (needs ${lowest?.min}) at ${lowest?.y}`)
    await page.close()
  }

  // ---------- glass surfaces on the first screen ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts)
    const live = await page.eval(fn(liveGlass))
    check('glass', `first-screen surfaces @${label}`, live.length >= 3 && live.length <= 5 ? 'pass' : 'fail', `${live.length} live backdrop-filters (3 to 5): ${live.join(', ')}`)
    await page.close()
  }

  // ---------- the reader takes the nav; a deep link lands on the pill ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts)
    const r = await page.eval(`(() => {
      const nav = document.getElementById('nav')
      const stand = document.querySelector('#sentence .lens-static')
      const a = nav.getBoundingClientRect(), b = stand.getBoundingClientRect()
      return { mode: document.documentElement.dataset.mode, lens: nav.classList.contains('is-lens'), ready: nav.classList.contains('is-ready'), handed: stand.classList.contains('is-handed'), dx: Math.round(Math.abs(a.left - b.left) + Math.abs(a.width - b.width)), dy: Math.round(Math.abs(a.top - b.top) + Math.abs(a.height - b.height)) }
    })()`)
    const ok = r.mode !== 'morph' || (r.lens && r.ready && r.handed && r.dx <= 2 && r.dy <= 2)
    check('glass', `reader takes the stand-in's box @${label}`, ok ? 'pass' : 'fail', `mode ${r.mode}, lens ${r.lens}, ready ${r.ready}, stand-in handed ${r.handed}, off by ${r.dx}px across and ${r.dy}px down`)
    await page.close()
    const deep = await fresh(opts, '/#work')
    const d = await deep.eval(`(() => { const n = document.getElementById('nav'); return { pill: n.classList.contains('is-pill') || n.classList.contains('is-dock'), fixed: getComputedStyle(n).position, cur: n.querySelector('[aria-current] .nav-sans')?.textContent || null } })()`)
    check('glass', `deep link lands on the nav @${label}`, d.pill && d.fixed === 'fixed' && d.cur === 'work' ? 'pass' : 'fail', `pill ${d.pill}, position ${d.fixed}, current "${d.cur}"`)
    await deep.close()
  }

  // ---------- the morph ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts)
    const m = await page.eval(`new Promise((done) => {
      const nav = document.getElementById('nav')
      if (document.documentElement.dataset.mode !== 'morph') return done({ skipped: true })
      const t0 = performance.now()
      let seen = false
      const mo = new MutationObserver(() => {
        if (nav.dataset.morphing !== undefined) seen = true
        const end = nav.classList.contains('is-pill') || nav.classList.contains('is-dock')
        if (seen && end && nav.dataset.morphing === undefined) { mo.disconnect(); done({ ms: Math.round(performance.now() - t0), navs: document.querySelectorAll('#nav, nav[aria-label="sections"]').length }) }
      })
      mo.observe(nav, { attributes: true, attributeFilter: ['class', 'data-morphing', 'style'] })
      window.scrollTo({ top: Math.round(innerHeight * 0.9), behavior: 'instant' })
      setTimeout(() => { mo.disconnect(); done({ ms: null, seen, navs: document.querySelectorAll('#nav').length }) }, 2000)
    })`)
    if (m.skipped) check('glass', `morph @${label}`, 'warn', 'not in morph mode (reduced motion or tier lite)')
    else check('glass', `morph @${label}`, m.ms != null && m.ms < 600 && m.navs === 1 ? 'pass' : 'fail', `lens to ${label === '390' ? 'dock' : 'pill'} in ${m.ms} ms (under 600), ${m.navs} nav element(s)`)
    await page.close()
  }

  // ---------- keyboard reaches everything ----------
  {
    const page = await fresh({ width: 1440, height: 900 })
    await page.eval('window.__seen = new Set(); document.addEventListener("focusin", (e) => window.__seen.add(e.target), true); true')
    for (let i = 0; i < 160; i++) {
      await page.key('Tab')
      await sleep(25)
      const done = await page.eval('document.activeElement === document.body')
      if (done && i > 5) break
    }
    await sleep(300)
    const r = await page.eval(`(() => {
      const ok = (e) => {
        if (e.closest('[inert], .sr-only') || e.getAttribute('tabindex') === '-1') return false
        if (e.closest('details:not([open])') && !e.matches('summary')) return false
        for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden') return false }
        return true
      }
      const all = [...document.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(ok)
      const missed = all.filter((e) => !window.__seen.has(e))
      return { total: all.length, seen: window.__seen.size, missed: missed.slice(0, 6).map((e) => e.tagName.toLowerCase() + ' "' + (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30) + '"') }
    })()`)
    check('glass', 'keyboard reaches every control', r.missed.length ? 'fail' : 'pass', r.missed.length ? `missed ${r.missed.join(', ')}` : `${r.total} links, buttons and summaries, all reached`)
    await page.close()
  }

  // ---------- no sideways scroll ----------
  {
    const bad = []
    for (const w of [320, 390, 768, 1024, 1440, 1920]) {
      const mobile = w < 720
      const page = await fresh({ width: w, height: mobile ? 800 : 900, dpr: mobile ? 2 : 1, mobile }, '/', 1200)
      const r = await page.eval(`(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((d) => setTimeout(d, 40)) }
        window.scrollTo({ top: 0, behavior: 'instant' })
        await new Promise((d) => setTimeout(d, 300))
        const d = document.documentElement
        return { sw: d.scrollWidth, cw: d.clientWidth, iw: innerWidth }
      })()`)
      if (r.sw > r.cw + 1 || r.iw > w + 1) bad.push(`${w}: scrollWidth ${r.sw}, clientWidth ${r.cw}, layout ${r.iw}`)
      await page.close()
    }
    check('glass', 'no sideways scroll at 320 to 1920', bad.length ? 'fail' : 'pass', bad.join(' | ') || '320, 390, 768, 1024, 1440, 1920')
  }

  // ---------- forced colours ----------
  for (const [label, opts] of SIZES) {
    const page = await cdp.newPage(opts)
    await page.media([{ name: 'forced-colors', value: 'active' }])
    await page.goto(url + '/', { settle: 1500 })
    const r = await page.eval(`(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }
      const glass = [...document.querySelectorAll('.glass')].filter(shown)
      const thin = glass.filter((g) => { const cs = getComputedStyle(g); return cs.borderTopStyle !== 'solid' || parseFloat(cs.borderTopWidth) < 2 })
      const fields = [...document.querySelectorAll('.field')].filter(shown).length
      return { glass: glass.length, thin: thin.slice(0, 5).map((g) => g.className.slice(0, 50)), fields }
    })()`)
    check('glass', `forced colours @${label}`, !r.thin.length && !r.fields ? 'pass' : 'fail', `${r.glass} glass surfaces, ${r.thin.length} without a 2px border${r.thin.length ? ': ' + r.thin.join(' | ') : ''}; ${r.fields} field layers shown`)
    await page.close()
  }

  // ---------- quiet: solid plates ----------
  for (const [label, opts] of SIZES) {
    const page = await fresh(opts, '/?quiet=1')
    const r = await page.eval(`(() => {
      const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' }
      const glass = [...document.querySelectorAll('.glass')].filter(shown)
      const blurred = glass.filter((g) => { const cs = getComputedStyle(g); return (cs.backdropFilter || 'none') !== 'none' })
      const nav = document.getElementById('nav')
      return { attr: document.documentElement.dataset.transparency, glass: glass.length, blurred: blurred.length, navZ: getComputedStyle(nav).zIndex, pressed: document.querySelector('.quiet')?.getAttribute('aria-pressed') }
    })()`)
    check('glass', `quiet mode @${label}`, r.attr === 'reduced' && r.glass > 0 && !r.blurred && r.pressed === 'true' ? 'pass' : 'fail', `data-transparency ${r.attr}, ${r.glass} glass surfaces, ${r.blurred} still blurred, nav z-index ${r.navZ}, switch pressed ${r.pressed}`)
    await page.close()
  }
}
