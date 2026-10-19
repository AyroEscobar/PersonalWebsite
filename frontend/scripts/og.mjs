#!/usr/bin/env node
/*
  og. The social card, composed for a 520 px preview (LinkedIn, iMessage), not cropped from the hero:
  1200x630, the clay of the frieze, his name in Cinzel at 120 px, one line (Founder of Esvo
  Technologies · UT Dallas), the man and the disk on the ground line at the right (the transparent light
  poster from `npm run poster`, .build/poster/frieze-light.png, its disk running off the right edge as on
  a phone), the meander along the bottom edge. No buttons and no body text. Rendered headlessly from one
  self-contained page (the fonts and the poster inlined), written to public/og.png at 300 KB or less.
  Run by hand after the poster: `npm run og`.
*/
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launchChrome } from './lib/chrome.mjs'
import { connect } from './lib/cdp.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, '.build/poster/frieze-light.png')
const OUT = path.join(ROOT, 'public/og.png')
const TMP = path.join(ROOT, '.build/og')
const W = 1200
const NAME = 120
const H = 630

if (!existsSync(SRC)) {
  console.error('og: .build/poster/frieze-light.png missing. Run `npm run poster` first.')
  process.exit(1)
}
const { ASPECT, FOOT_X, FOOT_Y } = await import(pathToFileURL(path.join(ROOT, 'src/scene/comp.js')))
const { HERO, OG } = await import(pathToFileURL(path.join(ROOT, 'src/content/identity.js')))
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(ROOT, 'src/assets/fonts', f)).toString('base64')}`
const poster = `data:image/png;base64,${readFileSync(SRC).toString('base64')}`
const [first, ...rest] = HERO.name.text.split(' ')

// the room: 486 px tall, bottom on the meander's top edge, the disk's centre (0.75 of the room) on
// the card's right edge, so the man stands in the right half clear of the name
const MU = 6
const MEANDER = MU * 5 + 12
const roomH = 486
const roomW = Math.round(roomH * ASPECT)
const roomLeft = Math.round(W - 0.75 * roomW)
const roomTop = H - MEANDER - 6 - roomH
const footX = roomLeft + FOOT_X * roomW
const footY = roomTop + FOOT_Y * roomH

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Cinzel'; src: url(${font('cinzel-latin-wght-normal.woff2')}) format('woff2'); font-weight: 400 900; }
@font-face { font-family: 'EB Garamond'; src: url(${font('eb-garamond-latin-wght-normal.woff2')}) format('woff2'); font-weight: 400 800; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body {
  position: relative;
  color: #141110;
  /* the clay as the site lays it (components.css .frieze and .frieze-sun): the late sun from the upper right
     with the wheel's broad rings inside it, the clay turning away toward the left and the foot */
  background:
    radial-gradient(48% 50% at 70% 34%, color-mix(in srgb, #E09249 72%, transparent) 0%, color-mix(in srgb, #E09249 40%, transparent) 46%, transparent 100%) 50% -189px / 132% 970px no-repeat,
    linear-gradient(180deg, transparent 52%, color-mix(in srgb, #3A2E26 9%, transparent) 100%),
    linear-gradient(90deg, color-mix(in srgb, #3A2E26 10%, transparent) 0%, transparent 42%),
    #C47D45;
}
.name { position: absolute; left: 62px; top: 58px; font: 500 ${NAME}px/0.98 'Cinzel', serif; letter-spacing: 0.02em; text-transform: uppercase; }
.name span { display: block; white-space: nowrap; }
.name .a::after { content: '\\00B7'; padding-left: 0.12em; }
.line { position: absolute; left: 68px; top: ${Math.round(58 + 2 * NAME * 0.98 + 24)}px; font: 400 36px/1.2 'EB Garamond', serif; }
.room { position: absolute; left: ${roomLeft}px; top: ${roomTop}px; width: ${roomW}px; height: ${roomH}px; }
.room img { width: 100%; height: 100%; display: block; }
.ground { position: absolute; left: ${footX}px; top: ${footY}px; width: 0; height: 0; }
.ground::before, .ground::after { content: ''; position: absolute; left: -400vw; width: 800vw; background: #141110; transform-origin: 400vw 0; transform: rotate(-14deg); }
.ground::before { top: -0.5px; height: 4px; }
.ground::after { top: ${4 + 0.036 * roomW}px; height: 2px; }
.meander { position: absolute; left: 0; right: 0; bottom: 0; height: ${MEANDER}px; border-top: 2px solid #141110; border-bottom: 2px solid #141110; padding: 4px 0; background: #C47D45; }
.meander::before { content: ''; display: block; height: ${MU * 5}px; background: #141110;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 5'%3E%3Cpath d='M0 4.5H.5V.5h4v2h-2v2H6' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E") 0 0 / ${MU * 6}px ${MU * 5}px repeat-x; }
</style></head><body>
<h1 class="name"><span class="a">${first}</span><span>${rest.join(' ')}</span></h1>
<p class="line">${OG.line.text}</p>
<div class="ground"></div>
<div class="room"><img src="${poster}" alt=""></div>
<div class="meander"></div>
</body></html>`

mkdirSync(TMP, { recursive: true })
const page0 = path.join(TMP, 'card.html')
writeFileSync(page0, html)
const shot = path.join(TMP, 'card.png')
const chrome = await launchChrome({ tag: 'og' })
let code = 0
try {
  const cdp = await connect(chrome.wsUrl)
  const page = await cdp.newPage({ width: W, height: H, dpr: 1 })
  await page.goto(pathToFileURL(page0).href, { settle: 400 })
  await page.eval('document.fonts.ready.then(() => document.fonts.size)')
  await page.screenshot(shot)
  // the name and the line must not touch the man or the disk (the poster's drawn pixels)
  const r = await page.eval(`(() => { const b = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [e.left, e.top, e.right, e.bottom].map(Math.round) }; return { name: b('.name span:last-child'), line: b('.line') } })()`)
  console.log(`og: name ${r.name.join(',')}, line ${r.line.join(',')}, room ${roomLeft},${roomTop} ${roomW}x${roomH}`)
  cdp.close()
} catch (e) {
  console.error(e.stack || String(e))
  code = 1
} finally {
  await chrome.kill()
}
if (code) process.exit(code)

const sharp = (await import('../tools/sharp.mjs')).default
writeFileSync(OUT, await sharp(shot).png({ compressionLevel: 9, effort: 10 }).toBuffer())
let kb = statSync(OUT).size / 1024
if (kb > 300) {
  writeFileSync(OUT, await sharp(shot).png({ palette: true, colors: 256, dither: 0.5, compressionLevel: 9, effort: 10 }).toBuffer())
  kb = statSync(OUT).size / 1024
}
rmSync(page0)
if (kb > 300) {
  console.error(`og: og.png is ${kb.toFixed(0)} KB, over 300 KB`)
  process.exit(1)
}
console.log(`og: wrote public/og.png (${kb.toFixed(1)} KB)`)
