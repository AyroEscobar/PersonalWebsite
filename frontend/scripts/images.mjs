/*
  Image pipeline (PLAN.md 3.3, 9; DESIGN.md 6.3). Run by hand: `npm run images`.
  Outputs are committed, so the deploy build never needs sharp.

    src/assets/pfp-web.jpg  ->  src/assets/img/headshot-{160,320}.{avif,webp}
                                natural colour, a square crop on him (arms open
                                over the frozen lake) for the round avatar in the
                                origin card, 50 KB or less each
    public/favicon.svg      ->  public/apple-touch-icon.png (180 px, square)

  v1 drew the photo as a sodium-on-night duotone; v2 is light, so the photo
  keeps its own colour.
*/
import { readFile, writeFile, mkdir, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let sharp
try {
  sharp = (await import('../tools/sharp.mjs')).default
} catch {
  console.error('images: sharp is missing. Run `npm run tools` first.')
  process.exit(1)
}

// The square around him in the upright 540 by 720 photo: head near the top third, both hands in.
const CROP = { left: 180, top: 290, width: 192, height: 192 }
const WIDTHS = [160, 320]
const LIMIT = 50 * 1024

async function headshot() {
  const src = path.join(ROOT, 'src/assets/pfp-web.jpg')
  const outDir = path.join(ROOT, 'src/assets/img')
  await mkdir(outDir, { recursive: true })
  const base = sharp(await sharp(src).rotate().extract(CROP).toBuffer()).modulate({ saturation: 1.06 })
  const report = []
  for (const w of WIDTHS) {
    const resized = base.clone().resize({ width: w, height: w, kernel: 'lanczos3' })
    for (const [ext, opts] of [
      ['avif', { quality: 58, effort: 6, chromaSubsampling: '4:4:4' }],
      ['webp', { quality: 80, effort: 6 }],
    ]) {
      const file = path.join(outDir, `headshot-${w}.${ext}`)
      await resized.clone()[ext](opts).toFile(file)
      const { size } = await stat(file)
      report.push([path.relative(ROOT, file), size])
      if (size > LIMIT) throw new Error(`${file} is ${size} bytes, over the 50 KB budget`)
    }
  }
  // the v1 duotone sizes
  for (const old of ['headshot-270.avif', 'headshot-270.webp', 'headshot-540.avif', 'headshot-540.webp']) {
    const f = path.join(outDir, old)
    if (existsSync(f)) await unlink(f)
  }
  await writeFile(path.join(outDir, 'headshot.json'), JSON.stringify({ width: WIDTHS.at(-1), height: WIDTHS.at(-1), widths: WIDTHS }, null, 2) + '\n')
  return report
}

async function appleIcon() {
  const svg = await readFile(path.join(ROOT, 'public/favicon.svg'), 'utf8')
  const square = svg.replace(/rx="[\d.]+"/, 'rx="0"')
  const file = path.join(ROOT, 'public/apple-touch-icon.png')
  await sharp(Buffer.from(square), { density: 576 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(file)
  const { size } = await stat(file)
  return [[path.relative(ROOT, file), size]]
}

const rows = [...(await headshot()), ...(await appleIcon())]
for (const [f, s] of rows) console.log(`images: ${f}  ${(s / 1024).toFixed(1)} KB`)
