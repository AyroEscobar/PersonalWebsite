#!/usr/bin/env node
/*
  poster. Renders the posters from the real scene headlessly (window.__poster, the scene's own
  poster(): the composition box alone, transparent, at the poster frame, as the live canvas draws it)
  and measures the composite the visitor sees:

    public/poster/frieze-{light,dark}.{avif,webp}     1600 px wide (800 CSS px at DPR 2), the desktop room
    public/poster/frieze-{light,dark}-m.{avif,webp}   960 px wide (480 CSS px at DPR 2), the phone room
                                                      AVIF 20 KB or less, WebP 32 KB or less (the quality
                                                      steps down until each fits)
    public/poster/meta.json   sizes; the light composite's mean luminance (the first screen at 1440x900,
                              floor 0.09); the share of drawn pixels in each poster (the dark one must
                              not be empty); the darkest and lightest clay under the text on the clay,
                              per theme (rules.mjs COMPOSITE_RULES, check-content's extremes); and every
                              visible text line measured on the composite at four widths, five scroll
                              positions and both themes (lib/composite.mjs)
    .build/poster/*.png       the sources, and hero-1440.png (the composed light hero) for scripts/og.mjs

  Run after `npm run build` with the dist served here: node scripts/poster.mjs [--tier full] [--fast]
  (--fast skips the composite measurement and keeps the last one). The outputs are committed, so the
  deploy build never needs Chrome or sharp.
*/
import { mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { serveDist } from './serve-dist.mjs'
import { launchChrome } from './lib/chrome.mjs'
import { connect } from './lib/cdp.mjs'
import { measureComposite } from './lib/composite.mjs'
import { COMPOSITE_RULES } from './lib/rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/poster')
const SRC = path.join(ROOT, '.build/poster')
const argv = process.argv.slice(2)
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d)
const FAST = argv.includes('--fast')
const TIER = opt('tier', 'full')
const { T_POSTER } = await import(pathToFileURL(path.join(ROOT, 'src/scene/comp.js')))
const FLOOR = 0.09
const BUDGET = { avif: 20 * 1024, webp: 32 * 1024 }
const SIZES = [
  { suffix: '', cssWidth: 800 },
  { suffix: '-m', cssWidth: 480 },
]
const THEMES = ['light', 'dark']

let sharp
try {
  sharp = (await import('../tools/sharp.mjs')).default
} catch {
  console.error('poster: sharp is missing. Run `npm run tools` first.')
  process.exit(1)
}
if (!existsSync(path.join(ROOT, 'dist/index.html'))) {
  console.error('poster: dist/index.html missing. Run `npm run build` first.')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })
mkdirSync(SRC, { recursive: true })

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const waitReady = (page) => page.eval('new Promise((r, j) => { let n = 0; const f = () => window.__ready ? setTimeout(r, 400) : (++n > 400 ? j(new Error("scene never became ready")) : setTimeout(f, 50)); f() })')
const HIDE = `(() => { const s = document.createElement('style'); s.textContent = '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))) })()`

/** Encode a PNG to AVIF and WebP, stepping the quality down until each fits its budget. */
async function encode(png, base) {
  const out = {}
  for (const [ext, budget, qs, enc] of [
    ['avif', BUDGET.avif, [60, 55, 50, 45, 40, 36, 32, 28], (q) => sharp(png).avif({ quality: q, effort: 7 })],
    ['webp', BUDGET.webp, [86, 80, 74, 68, 62, 56, 50, 44, 38], (q) => sharp(png).webp({ quality: q, alphaQuality: Math.min(90, q + 6), effort: 6 })],
  ]) {
    let buf = null
    let q = 0
    for (q of qs) {
      buf = await enc(q).toBuffer()
      if (buf.length <= budget) break
    }
    writeFileSync(`${base}.${ext}`, buf)
    out[ext] = { bytes: buf.length, quality: q, ok: buf.length <= budget }
  }
  return out
}

/** The share of pixels the poster draws (alpha over 8). */
async function drawn(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let n = 0
  for (let i = 3; i < data.length; i += info.channels) if (data[i] > 8) n++
  return Number((n / (info.width * info.height)).toFixed(4))
}

/** Mean luminance (0..1) of a capture, and the darkest and lightest pixel inside each list of boxes (CSS px). */
async function analyse(png, dpr, boxes = {}) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let sum = 0
  for (let i = 0; i < width * height; i++) sum += lum(data[i * channels], data[i * channels + 1], data[i * channels + 2])
  const extremes = {}
  for (const [key, list] of Object.entries(boxes)) {
    let dark = null, light = null, dl = Infinity, ll = -1
    for (const b of list) {
      const x0 = Math.max(0, Math.floor(b.x0 * dpr)), y0 = Math.max(0, Math.floor(b.y0 * dpr))
      const x1 = Math.min(width, Math.ceil(b.x1 * dpr)), y1 = Math.min(height, Math.ceil(b.y1 * dpr))
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * channels
          const l = lum(data[i], data[i + 1], data[i + 2])
          if (l < dl) { dl = l; dark = [data[i], data[i + 1], data[i + 2]] }
          if (l > ll) { ll = l; light = [data[i], data[i + 1], data[i + 2]] }
        }
      }
    }
    if (dark) extremes[key] = { dark, light }
  }
  return { mean: sum / (width * height) / 255, extremes }
}

const metaPath = path.join(OUT, 'meta.json')
const old = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {}
const meta = { t: T_POSTER, tier: TIER, build: null, posters: {}, alpha: {}, extremes: {}, composite: FAST ? old.composite : null }
try {
  meta.build = execSync('git rev-parse --short=7 HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  meta.build = 'dev'
}

const { server, url } = await serveDist({ port: Number(process.env.SERVE_PORT || 0) })
const chrome = await launchChrome({ tag: 'poster' })
let code = 0
try {
  const cdp = await connect(chrome.wsUrl)

  // 1. the posters, from the scene's own poster()
  {
    const page = await cdp.newPage({ width: 1440, height: 900, dpr: 1 })
    await page.goto(`${url}/?tier=${TIER}&theme=light`, { settle: 600 })
    await waitReady(page)
    for (const theme of THEMES) {
      for (const s of SIZES) {
        const name = `frieze-${theme}${s.suffix}`
        const res = await page.eval(`window.__poster({ theme: ${JSON.stringify(theme)}, cssWidth: ${s.cssWidth}, dpr: 2, t: ${T_POSTER} }).then((o) => JSON.stringify({ w: o.width, h: o.height, url: o.url }))`)
        const { w, h, url: dataUrl } = JSON.parse(res)
        const png = path.join(SRC, `${name}.png`)
        writeFileSync(png, Buffer.from(dataUrl.split(',')[1], 'base64'))
        const enc = await encode(png, path.join(OUT, name))
        const share = await drawn(png)
        meta.posters[name] = { width: w, height: h, ...enc, drawn: share }
        if (!s.suffix) meta.alpha[theme] = share
        console.log(`poster: ${name} ${w}x${h}  avif ${(enc.avif.bytes / 1024).toFixed(1)} KB (q ${enc.avif.quality})  webp ${(enc.webp.bytes / 1024).toFixed(1)} KB (q ${enc.webp.quality})  drawn ${(share * 100).toFixed(1)}%`)
        if (!enc.avif.ok) { console.error(`poster: ${name}.avif is over ${BUDGET.avif / 1024} KB at the lowest quality`); code = 1 }
        if (!enc.webp.ok) { console.error(`poster: ${name}.webp is over ${BUDGET.webp / 1024} KB at the lowest quality`); code = 1 }
      }
    }
    await page.close()
  }

  // 2. the composed hero (the OG crop and the luminance floor) and the clay under the text, per theme
  for (const theme of THEMES) {
    meta.extremes[theme] = {}
    for (const v of [{ name: '1440', w: 1440, h: 900, dpr: 1, mobile: false }, { name: '390', w: 390, h: 844, dpr: 2, mobile: true }]) {
      const page = await cdp.newPage({ width: v.w, height: v.h, dpr: v.dpr, mobile: v.mobile })
      for (const p of [0, 1]) {
        await page.goto(`${url}/?tier=${TIER}&t=${T_POSTER}&theme=${theme}`, { settle: 600 })
        await waitReady(page)
        await page.eval('document.fonts.ready.then(() => true)')
        if (p === 1) await page.eval('scrollTo(0, document.documentElement.scrollHeight)')
        await new Promise((r) => setTimeout(r, 500))
        if (p === 0 && v.name === '1440') {
          const shot = path.join(SRC, theme === 'light' ? 'hero-1440.png' : `hero-1440-${theme}.png`)
          await page.screenshot(shot)
          const { mean } = await analyse(shot, 1)
          if (theme === 'light') meta.luminance = Number(mean.toFixed(4))
          meta[`mean_${theme}`] = Number(mean.toFixed(4))
        }
        const rules = COMPOSITE_RULES.filter((r) => r.p === p)
        const boxes = await page.eval(`(() => {
          const rules = ${JSON.stringify(rules.map((r) => ({ key: r.key, sel: r.sel })))}
          const out = {}
          const shown = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' }
          for (const r of rules) {
            out[r.key] = [...document.querySelectorAll(r.sel)].filter(shown).flatMap((el) => { const g = document.createRange(); g.selectNodeContents(el); return [...g.getClientRects()] })
              .filter((b) => b.width > 1 && b.height > 1 && b.bottom > 0 && b.top < innerHeight)
              .map((b) => ({ x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }))
          }
          return out
        })()`)
        await page.eval(HIDE)
        const png = path.join(SRC, `clay-${theme}-${v.name}-p${p}.png`)
        await page.screenshot(png)
        const { extremes } = await analyse(png, v.dpr, boxes)
        for (const r of rules) {
          const e = extremes[r.key]
          if (!e) { console.warn(`poster: ${theme} ${v.name} p ${p}: no visible ${r.key} text to measure`); continue }
          const cur = meta.extremes[theme][r.key]
          meta.extremes[theme][r.key] = cur
            ? { dark: lum(...e.dark) < lum(...cur.dark) ? e.dark : cur.dark, light: lum(...e.light) > lum(...cur.light) ? e.light : cur.light }
            : e
        }
      }
      await page.close()
    }
    console.log(`poster: ${theme} clay under the text: ${Object.entries(meta.extremes[theme]).map(([k, e]) => `${k} rgb(${e.dark}) to rgb(${e.light})`).join('  ')}`)
  }

  // 3. every text line on the composite: four widths, five scroll positions, both themes
  if (!FAST) {
    meta.composite = {}
    for (const theme of THEMES) {
      meta.composite[theme] = await measureComposite({ cdp, url, sharp, tmpDir: SRC, tier: TIER, theme, t: T_POSTER })
      const c = meta.composite[theme]
      if (c.failures.length) {
        console.error(`poster: ${c.failures.length} ${theme} line(s) under their contrast minimum on the composite:`)
        for (const f of c.failures) console.error(`  ${f.view} p ${f.p}: ${f.sel} "${f.text}" ${f.ratio} (needs ${f.min})`)
        code = 1
      }
    }
  }
  cdp.close()

  if (!(meta.luminance >= FLOOR)) {
    console.error(`poster: the light composite's mean luminance ${meta.luminance} is under the ${FLOOR} floor (a dark or failed render).`)
    code = 1
  }
  if (!(meta.alpha.dark > 0.01)) {
    console.error(`poster: the dark poster is empty (drawn ${meta.alpha.dark}).`)
    code = 1
  }
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
  writeFileSync(path.join(SRC, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`poster: wrote public/poster/meta.json (build ${meta.build}, light luminance ${meta.luminance})`)
  // the built dist serves the new posters too, until the next build copies public/ again
  const distPoster = path.join(ROOT, 'dist/poster')
  mkdirSync(distPoster, { recursive: true })
  for (const theme of THEMES) for (const s of SIZES) for (const ext of ['avif', 'webp']) {
    const f = `frieze-${theme}${s.suffix}.${ext}`
    writeFileSync(path.join(distPoster, f), readFileSync(path.join(OUT, f)))
  }
  writeFileSync(path.join(distPoster, 'meta.json'), readFileSync(metaPath))
  for (const [name, p] of Object.entries(meta.posters)) if (statSync(path.join(OUT, `${name}.avif`)).size !== p.avif.bytes) console.warn(`poster: ${name}.avif size changed under us`)
} catch (e) {
  console.error(e.stack || String(e))
  code = 1
} finally {
  await chrome.kill()
  server.close()
}
process.exit(code)
