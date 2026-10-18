#!/usr/bin/env node
/*
  og. The social card is the light hero itself: the composed 1440x900 capture
  (.build/poster/hero-1440.png, from `npm run poster`) scaled to 1200 wide and cropped to 1200x630 on
  the plate with his name, the man and the disk, under the tongue band and above the meander, written
  to public/og.png at 300 KB or less. Run by hand after the poster: `npm run og`.
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
// 1440x900 -> a 1200x630 window: full width scaled to 1200 gives 750 tall. In v5's frame the tongue band
// runs 68 to 88 (57 to 73 scaled), the plate 137 to 801 (114 to 668), the disk's top is near 270 and his feet
// near 790 (225 and 658), the theme line 838 (698): the window starts at 54 of 750 with the tongue band
// along its top and holds the plate, the man and the disk whole
const buf = await sharp(SRC).resize({ width: 1200, height: 750 }).extract({ left: 0, top: 54, width: 1200, height: 630 }).png({ compressionLevel: 9, effort: 10 }).toBuffer()
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
