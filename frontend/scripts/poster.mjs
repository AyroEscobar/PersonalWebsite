#!/usr/bin/env node
/*
  poster (DESIGN.md 3.11). Renders the real scene headlessly and writes the first-paint frames:

    public/poster/hero-1440.{avif,webp}   1440x900 at DPR 1, the hero camera, t 2.3, p 0
    public/poster/hero-780.{avif,webp}    390x844 at DPR 2 with mobile emulation (780x1688)
    public/poster/meta.json               sizes, mean luminance, the brightest backdrop pixel under
                                          each text surface (check-content's composite), t, build sha
    .build/poster/*.png                   the source captures

  The composite measurement (rules.mjs COMPOSITE_RULES): for each key, the page is laid out with
  its UI at the frame's progress and scrolled to it, the boxes of that surface are read, the bare
  scene is captured at the same progress, and the brightest pixel under those boxes is kept:
    panel   .panel at p 0        card   .card at p 0.2         pill    .nav and .btn.glass at p 0
    theme   .theme-line at p 0   title  .sec-title--bare at p 0.2   footer  .footer at p 1

  Gate (prototype b's graft): the mean luminance of the 1440 frame must be 0.09 or higher, and
  this page targets 0.25; under 0.09 the script exits 1 and names the lights to raise.

  Run after `npm run build` with the dist served here: node scripts/poster.mjs [--tier full]
  The outputs are committed, so the deploy build never needs Chrome or sharp.
*/
import { mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveDist } from './serve-dist.mjs'
import { launchChrome } from './lib/chrome.mjs'
import { connect } from './lib/cdp.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/poster')
const SRC = path.join(ROOT, '.build/poster')
const argv = process.argv.slice(2)
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d)
const TIER = opt('tier', 'full')
const T = 2.3
const FLOOR = 0.09
const TARGET = 0.25
const BUDGET = { avif: 20 * 1024, webp: 32 * 1024 }
const FRAMES = [
  { p: 0, keys: { panel: '.panel', pill: '.nav, .btn.glass', theme: '.theme-line' }, scrollTo: null },
  { p: 0.2, keys: { card: '.card', title: '.sec-title--bare' }, scrollTo: 'check-out' },
  { p: 1, keys: { footer: '.footer' }, scrollTo: 'bottom' },
]

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

const VIEWS = [
  { name: 'hero-1440', w: 1440, h: 900, dpr: 1, mobile: false },
  { name: 'hero-780', w: 390, h: 844, dpr: 2, mobile: true },
]

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** Mean luminance (0..1) of a PNG and the brightest pixel inside each list of boxes (CSS px, scaled by dpr). */
async function analyse(png, dpr, boxes) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let sum = 0
  const n = width * height
  for (let i = 0; i < n; i++) sum += lum(data[i * channels], data[i * channels + 1], data[i * channels + 2])
  const brightest = {}
  for (const [key, list] of Object.entries(boxes)) {
    let best = null
    let bestL = -1
    for (const b of list) {
      const x0 = Math.max(0, Math.floor(b.x0 * dpr)), y0 = Math.max(0, Math.floor(b.y0 * dpr))
      const x1 = Math.min(width, Math.ceil(b.x1 * dpr)), y1 = Math.min(height, Math.ceil(b.y1 * dpr))
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * channels
          const l = lum(data[i], data[i + 1], data[i + 2])
          if (l > bestL) { bestL = l; best = [data[i], data[i + 1], data[i + 2]] }
        }
      }
    }
    if (best) brightest[key] = best
  }
  return { mean: sum / n / 255, brightest }
}

const waitReady = (page) => page.eval('new Promise((r, j) => { let n = 0; const f = () => window.__ready ? setTimeout(r, 400) : (++n > 400 ? j(new Error("scene never became ready")) : setTimeout(f, 50)); f() })')

const { server, url } = await serveDist({ port: 0 })
const chrome = await launchChrome({ tag: 'poster' })
const meta = { t: T, p: 0, tier: TIER, build: null, views: {}, brightest: {} }
try {
  meta.build = execSync('git rev-parse --short=7 HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  meta.build = 'dev'
}
let code = 0
try {
  const cdp = await connect(chrome.wsUrl)
  for (const v of VIEWS) {
    const page = await cdp.newPage({ width: v.w, height: v.h, dpr: v.dpr, mobile: v.mobile })
    const view = { width: v.w * v.dpr, height: v.h * v.dpr, dpr: v.dpr, brightest: {} }
    for (const fr of FRAMES) {
      // the page with its UI, at this progress, scrolled to the frame: the boxes of each surface
      await page.goto(`${url}/?tier=${TIER}&t=${T}&p=${fr.p}&static`, { settle: 900 })
      if (fr.scrollTo === 'bottom') await page.eval('scrollTo(0, document.documentElement.scrollHeight)')
      else if (fr.scrollTo) await page.eval(`scrollTo(0, document.getElementById(${JSON.stringify(fr.scrollTo)}).offsetTop)`)
      await new Promise((r) => setTimeout(r, 400))
      const boxes = await page.eval(`(() => {
        const keys = ${JSON.stringify(fr.keys)}
        const rect = (el) => { const r = el.getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom } }
        const vis = (b) => b.x1 > 0 && b.y1 > 0 && b.x0 < innerWidth && b.y0 < innerHeight && b.x1 > b.x0 && b.y1 > b.y0
        const out = {}
        for (const [k, sel] of Object.entries(keys)) out[k] = [...document.querySelectorAll(sel)].map(rect).filter(vis)
        return out
      })()`)
      // the bare scene at the same progress
      await page.goto(`${url}/?ui=0&tier=${TIER}&t=${T}&p=${fr.p}`, { settle: 1200 })
      await waitReady(page)
      const errs = page.console.filter((c) => /error|exception/.test(c.type))
      if (errs.length) console.warn(`poster: console on ${v.name} p ${fr.p}:`, errs.map((e) => e.text).join(' | '))
      const png = path.join(SRC, fr.p === 0 ? `${v.name}.png` : `${v.name}-p${fr.p}.png`)
      await page.screenshot(png)
      const { mean, brightest } = await analyse(png, v.dpr, boxes)
      for (const [k, px] of Object.entries(brightest)) view.brightest[k] = px
      for (const k of Object.keys(fr.keys)) if (!brightest[k]) console.warn(`poster: ${v.name} p ${fr.p}: no visible ${k} box to measure`)
      if (fr.p === 0) {
        view.mean = Number(mean.toFixed(4))
        const avif = path.join(OUT, `${v.name}.avif`)
        const webp = path.join(OUT, `${v.name}.webp`)
        await sharp(png).avif({ quality: 60, effort: 6 }).toFile(avif)
        await sharp(png).webp({ quality: 78, effort: 6 }).toFile(webp)
        view.sizes = { avif: statSync(avif).size, webp: statSync(webp).size, png: statSync(png).size }
        console.log(`poster: ${v.name}  avif ${(view.sizes.avif / 1024).toFixed(1)} KB  webp ${(view.sizes.webp / 1024).toFixed(1)} KB  mean luminance ${mean.toFixed(3)}`)
        if (view.sizes.avif > BUDGET.avif) { console.error(`poster: ${v.name}.avif is over ${BUDGET.avif / 1024} KB`); code = 1 }
        if (view.sizes.webp > BUDGET.webp) { console.error(`poster: ${v.name}.webp is over ${BUDGET.webp / 1024} KB`); code = 1 }
      }
    }
    console.log(`poster: ${v.name} brightest under each surface: ${Object.entries(view.brightest).map(([k, px]) => `${k} rgb(${px.join(',')})`).join('  ')}`)
    meta.views[v.name] = view
    await page.close()
  }
  cdp.close()
  // the composite worst case across both views
  for (const v of Object.values(meta.views)) {
    for (const [k, px] of Object.entries(v.brightest)) {
      const cur = meta.brightest[k]
      if (!cur || lum(...px) > lum(...cur)) meta.brightest[k] = px
    }
  }
  const mean = meta.views['hero-1440'].mean
  meta.luminance = mean
  if (mean < FLOOR) {
    console.error(`poster: mean luminance ${mean.toFixed(3)} is under the ${FLOOR} floor. Raise LIGHT.hemi (src/scene/lights.js), then LIGHT.exposure.`)
    code = 1
  } else if (mean < TARGET) {
    console.warn(`poster: mean luminance ${mean.toFixed(3)} is under the ${TARGET} target (the floor is ${FLOOR}).`)
  }
  writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
  writeFileSync(path.join(SRC, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`poster: wrote public/poster/meta.json (build ${meta.build}, luminance ${mean.toFixed(3)})`)
  // the built dist serves the new posters too, until the next build copies public/ again
  const distPoster = path.join(ROOT, 'dist/poster')
  mkdirSync(distPoster, { recursive: true })
  for (const f of ['hero-1440.avif', 'hero-1440.webp', 'hero-780.avif', 'hero-780.webp', 'meta.json']) writeFileSync(path.join(distPoster, f), readFileSync(path.join(OUT, f)))
} catch (e) {
  console.error(e.stack || String(e))
  code = 1
} finally {
  await chrome.kill()
  server.close()
}
process.exit(code)
