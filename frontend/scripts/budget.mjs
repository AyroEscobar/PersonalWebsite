#!/usr/bin/env node
/*
  budget (DESIGN.md 3.14, BRIEF.md). Runs after every build on dist, gzip -9. Fails the build
  when a budget is blown or something banned ships. Measured, never assumed.

    entry JS (entry + static imports)   110 KB gz
    the scene chunk (src/scene + three) 220 KB gz
    lazy: the kit route                  20 KB gz (src/kit/*, never loaded by /)
    lazy: the 404                        20 KB gz
    any other lazy chunk                 20 KB gz each
    CSS                                  24 KB gz
    HTML for /                           90 KB gz
    preloaded fonts                      2 files (Cinzel, EB Garamond upright), 60 KB together
    all font files                       4 (those two, the EB Garamond italic, Marcellus SC); no monospace
    the figure mesh                     400 KB
    pot stills                           four: light and dark, turned away and facing, AVIF 20 KB or less each
    posters                              eight: the light and the dark vase, desktop and phone, AVIF 20 KB
                                         or less each, WebP 32 KB or less each
    initial transfer                    500 KB (html, css, entry, the two preloaded fonts, the light
                                         desktop poster, the favicon)
    three in the entry, R3F, Firebase, Mapbox, framer-motion, react-router, a React development
    build, third-party requests, media files: zero

  Usage: node scripts/budget.mjs [--json]   Writes .build/budget.json.
  QA imports measure() for its bundle report.
*/
import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { walk } from './lib/rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const KB = 1024

export const BUDGETS = {
  entryJs: 110 * KB,
  scene: 220 * KB,
  kit: 20 * KB,
  notFound: 20 * KB,
  otherLazy: 20 * KB,
  css: 24 * KB,
  html: 90 * KB,
  fonts: 60 * KB,
  fontFiles: 2,
  allFontFiles: 4,
  figure: 400 * KB,
  posterAvif: 20 * KB,
  posterWebp: 32 * KB,
  potStill: 20 * KB,
  initial: 500 * KB,
}

const gz = (buf) => gzipSync(buf, { level: 9 }).length
const fileGz = (p) => gz(readFileSync(p))
const raw = (p) => statSync(p).size

function readManifest() {
  for (const p of [path.join(DIST, '.vite/manifest.json'), path.join(ROOT, '.build/manifest.json')]) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  }
  throw new Error('budget: no Vite manifest (dist/.vite/manifest.json or .build/manifest.json). Build first.')
}

export function measure() {
  if (!existsSync(path.join(DIST, 'index.html'))) throw new Error('budget: dist/index.html missing. Build first.')
  const manifest = readManifest()
  const rows = []
  const fails = []
  const add = (group, name, bytes, budget, extra = {}) => {
    const row = { group, name, gz: bytes, budget, ok: budget == null || bytes <= budget, ...extra }
    rows.push(row)
    if (!row.ok) fails.push(`${group} ${name}: ${(bytes / KB).toFixed(1)} KB over ${(budget / KB).toFixed(0)} KB`)
    return row
  }

  // Entry: index.html's chunk and everything it statically imports.
  const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry)
  const entryFiles = new Set()
  const cssFiles = new Set()
  const visit = (key) => {
    const c = manifest[key]
    if (!c || entryFiles.has(c.file)) return
    entryFiles.add(c.file)
    for (const css of c.css || []) cssFiles.add(css)
    for (const imp of c.imports || []) visit(imp)
  }
  visit(entryKey)
  let entryGz = 0
  for (const f of entryFiles) entryGz += fileGz(path.join(DIST, f))
  add('js', `entry (${entryFiles.size} file${entryFiles.size > 1 ? 's' : ''})`, entryGz, BUDGETS.entryJs, { files: [...entryFiles] })

  // Lazy chunks, classified by source path. The scene group is the dynamic entry whose src is under
  // src/scene/ plus its non-entry imports (three rides in the same chunk via manualChunks).
  const lazy = { scene: 0, kit: 0, notFound: 0 }
  const sceneFiles = []
  for (const [key, c] of Object.entries(manifest)) {
    if (!c.isDynamicEntry) continue
    const imports = (c.imports || []).filter((i) => !entryFiles.has(manifest[i]?.file))
    const size = fileGz(path.join(DIST, c.file)) + imports.reduce((s, i) => s + fileGz(path.join(DIST, manifest[i].file)), 0)
    const src = c.src || key
    if (/src\/scene\//.test(src)) { lazy.scene += size; sceneFiles.push(c.file, ...imports.map((i) => manifest[i].file)) }
    else if (/src\/kit\//.test(src)) lazy.kit += size
    else if (/NotFound\.jsx$/.test(src)) lazy.notFound += size
    else add('lazy', src, size, BUDGETS.otherLazy)
  }
  add('lazy', 'scene chunk (src/scene + three)', lazy.scene, BUDGETS.scene, { files: sceneFiles })
  add('lazy', 'kit route (src/kit)', lazy.kit, BUDGETS.kit)
  add('lazy', 'the 404', lazy.notFound, BUDGETS.notFound)
  if (!lazy.scene) fails.push('no scene chunk in the manifest (src/scene/frieze.js must be a dynamic import)')

  // CSS: every stylesheet in dist.
  const allCss = walk(path.join(DIST, 'assets'), { exts: ['.css'] })
  add('css', `css (${allCss.length} file${allCss.length === 1 ? '' : 's'})`, allCss.reduce((s, f) => s + fileGz(f), 0), BUDGETS.css)

  // HTML.
  const indexHtml = readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const htmlGz = gz(Buffer.from(indexHtml))
  add('html', 'index.html', htmlGz, BUDGETS.html)
  if (existsSync(path.join(DIST, '404.html'))) add('html', '404.html', fileGz(path.join(DIST, '404.html')), BUDGETS.html)

  // The kit route and the scene must never ride along with the home page's entry.
  for (const f of entryFiles) {
    if (/kit/i.test(f)) fails.push(`the kit route is in the entry bundle: ${f}`)
    if (/scene/i.test(f)) fails.push(`the scene chunk is in the entry bundle: ${f}`)
  }
  if (/\/assets\/Kit-[\w-]+\.js/.test(indexHtml)) fails.push('index.html preloads the kit chunk')
  if (/<link rel="modulepreload"[^>]*\/assets\/scene-[\w-]+\.js/.test(indexHtml)) fails.push('index.html preloads the scene chunk')
  for (const f of entryFiles) {
    const t = readFileSync(path.join(DIST, f), 'utf8')
    if (/WebGLRenderer|three\.module|ShaderChunk/.test(t)) fails.push(`three symbols in an entry file: ${f}`)
  }

  // Fonts: the preloads in index.html, and every font file in dist.
  const preloads = [...indexHtml.matchAll(/<link rel="preload" href="\/([^"]+\.woff2)"/g)].map((m) => m[1])
  const fontBytes = preloads.reduce((s, f) => s + raw(path.join(DIST, f)), 0)
  add('fonts', `${preloads.length} preloaded woff2`, fontBytes, BUDGETS.fonts, { files: preloads })
  if (preloads.length > BUDGETS.fontFiles) fails.push(`fonts: ${preloads.length} preloads, budget ${BUDGETS.fontFiles}`)
  const allFonts = walk(path.join(DIST, 'assets'), { exts: ['.woff2', '.woff', '.ttf', '.otf'] })
  if (allFonts.length > BUDGETS.allFontFiles) fails.push(`fonts: ${allFonts.length} font files in dist; only Cinzel, EB Garamond (upright and italic) and Marcellus SC ship`)
  for (const f of allFonts) {
    if (!/\/(cinzel-latin-wght-normal|eb-garamond-latin-wght-normal|eb-garamond-latin-400-italic|marcellus-sc-latin-400-normal)-[\w-]+\.woff2$/.test(f)) fails.push(`fonts: unexpected font file ${path.basename(f)}`)
    if (/mono/i.test(f)) fails.push(`fonts: a monospace file ships (${path.basename(f)}); v5 has none`)
  }
  for (const want of ['cinzel-latin-wght-normal', 'eb-garamond-latin-wght-normal']) if (!preloads.some((p) => p.includes(want))) fails.push(`fonts: ${want} is not preloaded`)

  // The figure mesh and the posters.
  for (const f of walk(path.join(DIST, 'assets'), { exts: ['.glb'] })) add('figure', path.basename(f), raw(f), BUDGETS.figure)
  const posterDir = path.join(DIST, 'poster')
  for (const name of ['frieze-light', 'frieze-light-m', 'frieze-dark', 'frieze-dark-m']) {
    for (const [ext, budget] of [['avif', BUDGETS.posterAvif], ['webp', BUDGETS.posterWebp]]) {
      const f = path.join(posterDir, `${name}.${ext}`)
      if (!existsSync(f)) { fails.push(`poster missing: poster/${name}.${ext} (run npm run poster)`); continue }
      add('poster', `${name}.${ext}`, raw(f), budget)
    }
  }
  // the pot's four stills (lazy: only the laid-out pot's, once the reader nears the belly)
  for (const name of ['pot-light-in', 'pot-light-face', 'pot-dark-in', 'pot-dark-face']) {
    const f = path.join(DIST, 'pot', `${name}.avif`)
    if (!existsSync(f)) { fails.push(`pot still missing: pot/${name}.avif (run npm run poster -- --pot)`); continue }
    add('poster', `${name}.avif`, raw(f), BUDGETS.potStill)
  }

  // Initial transfer: html + entry js + css (inlined, so inside the html) + the two preloaded fonts + the
  // light desktop poster (the boot script preloads the one poster this visitor sees; both pictures are
  // lazy, so it is the only image on the first paint) + favicon. Any eager <img> would count too.
  const eagerImgs = [...indexHtml.matchAll(/<img\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => !/loading="lazy"/.test(tag))
    .map((tag) => (tag.match(/src="\/([^"]+)"/) || [])[1])
    .filter((f) => f && existsSync(path.join(DIST, f)))
  const firstPoster = path.join(DIST, 'poster/frieze-light.avif')
  const initial =
    htmlGz +
    entryGz +
    [...cssFiles].filter((f) => !indexHtml.includes(`data-href="/${f}"`)).reduce((s, f) => s + fileGz(path.join(DIST, f)), 0) +
    fontBytes +
    (existsSync(firstPoster) ? raw(firstPoster) : 0) +
    eagerImgs.reduce((s, f) => s + raw(path.join(DIST, f)), 0) +
    (existsSync(path.join(DIST, 'favicon.svg')) ? fileGz(path.join(DIST, 'favicon.svg')) : 0)
  add('total', 'initial transfer', initial, BUDGETS.initial)

  // Banned content in dist.
  const jsFiles = walk(DIST, { exts: ['.js'] })
  const htmlFiles = walk(DIST, { exts: ['.html'] })
  const BANNED = [
    { re: /@react-three|useFrame\(/, name: 'react-three-fiber' },
    { re: /firestore|firebaseapp|initializeApp\(/i, name: 'Firebase' },
    { re: /mapbox/i, name: 'Mapbox' },
    { re: /framer-motion|motion\.div/, name: 'framer-motion' },
    { re: /react-router|createBrowserRouter/, name: 'react-router' },
    { re: /validateDOMNesting|In HTML, %s cannot be a/, name: 'React development build' },
  ]
  for (const f of [...jsFiles, ...htmlFiles]) {
    const text = readFileSync(f, 'utf8')
    for (const b of BANNED) if (b.re.test(text)) fails.push(`banned in dist: ${b.name} in ${path.relative(DIST, f)}`)
  }
  for (const f of walk(DIST, { exts: ['.mp3', '.wav', '.mp4', '.mov', '.ogg', '.m4a', '.webm'] })) fails.push(`media file in dist: ${path.relative(DIST, f)}`)

  // Third-party resources: anything the browser would fetch from another origin.
  const third = []
  for (const f of htmlFiles) {
    const t = readFileSync(f, 'utf8')
    for (const m of t.matchAll(/<(script|link|img|source|iframe|video|audio)\b[^>]*\b(src|href|srcset)="(https?:)?\/\/[^"]+"[^>]*>/g)) {
      if (!/rel="canonical"/.test(m[0])) third.push(`${path.relative(DIST, f)}: ${m[0].slice(0, 100)}`)
    }
  }
  for (const f of walk(path.join(DIST, 'assets'), { exts: ['.css'] })) {
    const t = readFileSync(f, 'utf8')
    for (const m of t.matchAll(/url\(\s*['"]?(https?:)?\/\/[^)]+\)|@import\s+url\(\s*['"]?https?:/g)) third.push(`${path.relative(DIST, f)}: ${m[0].slice(0, 100)}`)
  }
  for (const f of jsFiles) {
    const t = readFileSync(f, 'utf8')
    for (const m of t.matchAll(/(fetch|import|sendBeacon|EventSource|WebSocket)\(\s*[`'"](https?:|wss?:)?\/\/[^`'"]+/g)) third.push(`${path.relative(DIST, f)}: ${m[0].slice(0, 100)}`)
  }
  for (const t of third) fails.push(`third-party resource: ${t}`)

  return { rows, fails, entryFiles: [...entryFiles], preloads, initial, budgets: BUDGETS }
}

export function printTable({ rows, fails }) {
  const pad = (s, n) => String(s).padEnd(n)
  console.log('budget:')
  for (const r of rows) {
    const b = r.budget == null ? '' : `/ ${(r.budget / KB).toFixed(0)} KB`
    console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${pad(r.group, 7)} ${pad(r.name, 40)} ${pad((r.gz / KB).toFixed(1) + ' KB', 10)} ${b}`)
  }
  if (fails.length) {
    console.error(`budget: ${fails.length} failure(s)`)
    for (const f of fails) console.error(`  ${f}`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = measure()
    printTable(result)
    mkdirSync(path.join(ROOT, '.build'), { recursive: true })
    writeFileSync(path.join(ROOT, '.build/budget.json'), JSON.stringify(result, null, 2))
    if (process.argv.includes('--json')) console.log(JSON.stringify(result))
    process.exit(result.fails.length ? 1 : 0)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
