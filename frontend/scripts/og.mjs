#!/usr/bin/env node
/*
  og (DESIGN.md 6.1). The social card is the hero frame itself: the 1440x900 poster capture
  (.build/poster/hero-1440.png, from `npm run poster`) cropped to 1200x630 on the man and the
  rock and written to public/og.png at 300 KB or less. Run by hand after the poster: `npm run og`.
*/
import { existsSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, '.build/poster/hero-1440.png')
const OUT = path.join(ROOT, 'public/og.png')

if (!existsSync(SRC)) {
  console.error('og: .build/poster/hero-1440.png missing. Run `npm run poster` first.')
  process.exit(1)
}
const sharp = (await import('../tools/sharp.mjs')).default
// 1440x900 -> a 1200x630 window: full width scaled to 1200 gives 750 tall; v4's frame has the rock's top at
// 106 and his feet near 850 (of 900), so the window starts at 86 of 750 and holds both whole
const buf = await sharp(SRC).resize({ width: 1200, height: 750 }).extract({ left: 0, top: 86, width: 1200, height: 630 }).png({ compressionLevel: 9, effort: 10 }).toBuffer()
writeFileSync(OUT, buf)
let kb = statSync(OUT).size / 1024
if (kb > 300) {
  const smaller = await sharp(OUT).png({ palette: true, colors: 256, dither: 0.5, compressionLevel: 9, effort: 10 }).toBuffer()
  writeFileSync(OUT, smaller)
  kb = statSync(OUT).size / 1024
}
if (kb > 300) {
  console.error(`og: og.png is ${kb.toFixed(0)} KB, over 300 KB`)
  process.exit(1)
}
console.log(`og: wrote public/og.png (${kb.toFixed(1)} KB)`)
