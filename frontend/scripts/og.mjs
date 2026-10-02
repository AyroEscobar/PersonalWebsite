#!/usr/bin/env node
/*
  og (PLAN.md 9). Screenshots og/og.html at 1200 by 630 in headless Chrome
  (unique profile, killed and deleted after) and writes public/og.png,
  300 KB or less. Run by hand when the template changes: `npm run og`.
*/
import { statSync } from 'node:fs'
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
  // og.js fetches the built page and sets body[data-ready] once the map (or the fallback rings) is in.
  await page.eval("new Promise(r => { let n = 0; const t = () => (document.body.dataset.ready || ++n > 80) ? r() : setTimeout(t, 50); t() })")
  const map = await page.eval('document.body.dataset.map || null')
  if (map !== 'grid') console.warn('og: no build found, the card uses the fallback rings (run npm run build first)')
  await page.eval('document.fonts.ready.then(() => document.fonts.size)')
  const fonts = await page.eval("[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family)")
  if (!fonts.some((f) => /Overpass/.test(f))) throw new Error(`og: Overpass did not load (${fonts.join(', ')})`)
  await page.screenshot(OUT)
  const errors = page.console.filter((c) => c.type !== 'warning')
  if (errors.length) console.warn('og: console:', errors)
  await page.close()
  cdp.close()
  const kb = statSync(OUT).size / 1024
  if (kb > 300) throw new Error(`og: og.png is ${kb.toFixed(0)} KB, over 300 KB`)
  console.log(`og: wrote public/og.png (${kb.toFixed(1)} KB)`)
} finally {
  await chrome.kill()
  server.close()
}
