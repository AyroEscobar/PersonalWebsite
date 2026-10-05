#!/usr/bin/env node
/*
  og (PLAN.md 9, DESIGN.md 6.10). Screenshots og/og.html at 1200 by 630 in
  headless Chrome (unique profile, killed and deleted after) and writes
  public/og.png, 300 KB or less: his first screen, light, with the lens on
  line 2. Run by hand after a build when the hero changes: `npm run og`.
*/
import { statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveDist } from './serve-dist.mjs'
import { launchChrome } from './lib/chrome.mjs'
import { connect } from './lib/cdp.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/og.png')

const { server, url } = await serveDist({ port: 0, root: ROOT })
const chrome = await launchChrome({ tag: 'og' })
try {
  const cdp = await connect(chrome.wsUrl)
  const page = await cdp.newPage({ width: 1200, height: 630, dpr: 1 })
  await page.goto(`${url}/og/og.html`, { settle: 200 })
  // og.js borrows the built first screen and sets body[data-ready] once the fonts and the lens are in.
  await page.eval("new Promise(r => { let n = 0; const t = () => (document.body.dataset.ready || ++n > 120) ? r() : setTimeout(t, 50); t() })")
  const built = await page.eval('document.body.dataset.built || null')
  if (!built) throw new Error('og: no build found (run npm run build first)')
  const fonts = await page.eval("[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family)")
  if (!fonts.some((f) => /Instrument Serif/.test(f)) || !fonts.some((f) => /Inter/.test(f))) throw new Error(`og: the site fonts did not load (${fonts.join(', ')})`)
  await page.screenshot(OUT)
  const errors = page.console.filter((c) => c.type !== 'warning')
  if (errors.length) console.warn('og: console:', errors)
  await page.close()
  cdp.close()
  let kb = statSync(OUT).size / 1024
  // The field is soft gradients, which full-color PNG stores badly: a
  // 256-color palette with dithering keeps the look well under the budget.
  if (kb > 300) {
    const sharp = (await import('../tools/sharp.mjs')).default
    const buf = await sharp(OUT).png({ palette: true, colors: 256, dither: 0.6, compressionLevel: 9, effort: 10 }).toBuffer()
    writeFileSync(OUT, buf)
    kb = statSync(OUT).size / 1024
  }
  if (kb > 300) throw new Error(`og: og.png is ${kb.toFixed(0)} KB, over 300 KB`)
  console.log(`og: wrote public/og.png (${kb.toFixed(1)} KB)`)
} finally {
  await chrome.kill()
  server.close()
}
