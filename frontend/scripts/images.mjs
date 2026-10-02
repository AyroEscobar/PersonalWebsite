/*
  Image pipeline (PLAN.md 3.3, 9). Run by hand: `npm run images`. Outputs are
  committed, so the deploy build never needs sharp.

    src/assets/pfp-web.jpg  ->  src/assets/img/headshot-{270,540}.{avif,webp}
                                a sodium-on-night duotone, 50 KB or less each
    public/favicon.svg      ->  public/apple-touch-icon.png (180 px, square)

  Colors come from the tokens: --night #0B1226 in the shadows, --trace #2A3757
  in the mids, --sodium #FFA53D only in the brightest light.
*/
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
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

// Shadows sit in --night, mids in --trace, only the brightest light turns --sodium.
const STOPS = [
  [0, [0x0b, 0x12, 0x26]],
  [0.55, [0x2a, 0x37, 0x57]],
  [1, [0xff, 0xa5, 0x3d]],
]
const GAMMA = 1.4

function ramp(t) {
  let j = 0
  while (j < STOPS.length - 2 && t > STOPS[j + 1][0]) j++
  const [t0, a] = STOPS[j]
  const [t1, b] = STOPS[j + 1]
  const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
  return [0, 1, 2].map((c) => Math.round(a[c] + (b[c] - a[c]) * u))
}
const LIMIT = 50 * 1024

async function headshot() {
  const src = path.join(ROOT, 'src/assets/pfp-web.jpg')
  const outDir = path.join(ROOT, 'src/assets/img')
  await mkdir(outDir, { recursive: true })
  const { data, info } = await sharp(src).rotate().greyscale().normalise().raw().toBuffer({ resolveWithObject: true })
  const rgb = Buffer.alloc(info.width * info.height * 3)
  for (let i = 0; i < info.width * info.height; i++) {
    const [r, g, b] = ramp(Math.pow(data[i * info.channels] / 255, GAMMA))
    rgb[i * 3] = r
    rgb[i * 3 + 1] = g
    rgb[i * 3 + 2] = b
  }
  const base = sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } })
  const report = []
  for (const w of [270, 540]) {
    const resized = base.clone().resize({ width: w })
    for (const [ext, opts] of [
      ['avif', { quality: 50, effort: 6, chromaSubsampling: '4:2:0' }],
      ['webp', { quality: 70, effort: 6 }],
    ]) {
      const file = path.join(outDir, `headshot-${w}.${ext}`)
      await resized.clone()[ext](opts).toFile(file)
      const { size } = await stat(file)
      report.push([path.relative(ROOT, file), size])
      if (size > LIMIT) throw new Error(`${file} is ${size} bytes, over the 50 KB budget`)
    }
  }
  const meta = await sharp(path.join(outDir, 'headshot-540.webp')).metadata()
  await writeFile(
    path.join(outDir, 'headshot.json'),
    JSON.stringify({ width: meta.width, height: meta.height, widths: [270, 540] }, null, 2) + '\n',
  )
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
