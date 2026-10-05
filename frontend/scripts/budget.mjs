#!/usr/bin/env node
/*
  budget (DESIGN.md 10). Runs after every build on dist, gzip -9. Fails the
  build when a budget is blown or something banned ships.

    entry JS (entry + static imports)   110 KB gz (target 100)
    lazy: the lens and loupe              8 KB gz (src/glass/lens.js)
    lazy: specimens (all)                12 KB gz
    lazy: the kit route                  20 KB gz (src/kit/*, never loaded by /)
    any other lazy chunk                  20 KB gz each
    CSS                                   24 KB gz
    HTML for /                            90 KB gz
    preloaded fonts                       3 files, 60 KB
    headshot files                        50 KB each
    initial transfer                     350 KB
    third-party requests, media files, three.js, Firebase, Mapbox,
    framer-motion, react-router, a React development build: zero

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
  lens: 8 * KB,
  specimens: 12 * KB,
  kit: 20 * KB,
  otherLazy: 20 * KB,
  css: 24 * KB,
  html: 90 * KB,
  fonts: 60 * KB,
  fontFiles: 3,
  image: 50 * KB,
  initial: 350 * KB,
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
    if (!row.ok) fails.push(`${group} ${name}: ${(bytes / KB).toFixed(1)} KB gz over ${(budget / KB).toFixed(0)} KB`)
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

  // Lazy chunks, classified by source path.
  const lazy = { lens: 0, kit: 0, specimens: 0 }
  for (const [key, c] of Object.entries(manifest)) {
    if (!c.isDynamicEntry) continue
    const size = fileGz(path.join(DIST, c.file)) + (c.imports || []).filter((i) => !entryFiles.has(manifest[i]?.file)).reduce((s, i) => s + fileGz(path.join(DIST, manifest[i].file)), 0)
    const src = c.src || key
    if (/src\/glass\/lens\.js$/.test(src)) lazy.lens += size
    else if (/src\/kit\//.test(src)) lazy.kit += size
    else if (/src\/sections\/specimens\//.test(src)) lazy.specimens += size
    else add('lazy', src, size, BUDGETS.otherLazy)
  }
  add('lazy', 'lens and loupe (src/glass/lens.js)', lazy.lens, BUDGETS.lens)
  add('lazy', 'kit route (src/kit)', lazy.kit, BUDGETS.kit)
  add('lazy', 'specimens (all)', lazy.specimens, BUDGETS.specimens)

  // CSS: every stylesheet in dist.
  const allCss = walk(path.join(DIST, 'assets'), { exts: ['.css'] })
  add('css', `css (${allCss.length} file${allCss.length === 1 ? '' : 's'})`, allCss.reduce((s, f) => s + fileGz(f), 0), BUDGETS.css)

  // HTML.
  const indexHtml = readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const htmlGz = gz(Buffer.from(indexHtml))
  add('html', 'index.html', htmlGz, BUDGETS.html)
  if (existsSync(path.join(DIST, '404.html'))) add('html', '404.html', fileGz(path.join(DIST, '404.html')), BUDGETS.html)

  // The kit route must never ride along with the home page.
  for (const f of entryFiles) if (/kit/i.test(f)) fails.push(`the kit route is in the entry bundle: ${f}`)
  if (/\/assets\/Kit-[\w-]+\.js/.test(indexHtml)) fails.push('index.html preloads the kit chunk')

  // Fonts: the preloads in index.html.
  const preloads = [...indexHtml.matchAll(/<link rel="preload" href="\/([^"]+\.woff2)"/g)].map((m) => m[1])
  const fontBytes = preloads.reduce((s, f) => s + raw(path.join(DIST, f)), 0)
  add('fonts', `${preloads.length} preloaded woff2`, fontBytes, BUDGETS.fonts, { files: preloads })
  if (preloads.length > BUDGETS.fontFiles) fails.push(`fonts: ${preloads.length} preloads, budget ${BUDGETS.fontFiles}`)
  const allFonts = walk(path.join(DIST, 'assets'), { exts: ['.woff2', '.woff', '.ttf', '.otf'] })
  if (allFonts.length > 3) fails.push(`fonts: ${allFonts.length} font files in dist, only Instrument Serif (italic, regular) and Inter are allowed`)
  if (allFonts.some((f) => /mono/i.test(f))) fails.push('fonts: a monospace font file shipped (DESIGN.md 2.3: no monospace)')

  // Images.
  for (const f of walk(path.join(DIST, 'assets'), { exts: ['.avif', '.webp', '.jpg', '.jpeg', '.png'] })) {
    if (/headshot/.test(f)) add('image', path.basename(f), raw(f), BUDGETS.image)
  }

  // Initial transfer: html + entry js + css + preloaded fonts + eager images + favicon.
  const eagerImgs = [...indexHtml.matchAll(/<img\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => !/loading="lazy"/.test(tag))
    .map((tag) => (tag.match(/src="\/([^"]+)"/) || [])[1])
    .filter((f) => f && existsSync(path.join(DIST, f)))
  const initial =
    htmlGz +
    entryGz +
    // Inlined stylesheets already ride in the HTML (scripts/prerender.mjs).
    [...cssFiles].filter((f) => !indexHtml.includes(`data-href="/${f}"`)).reduce((s, f) => s + fileGz(path.join(DIST, f)), 0) +
    fontBytes +
    eagerImgs.reduce((s, f) => s + raw(path.join(DIST, f)), 0) +
    (existsSync(path.join(DIST, 'favicon.svg')) ? fileGz(path.join(DIST, 'favicon.svg')) : 0)
  add('total', 'initial transfer', initial, BUDGETS.initial)

  // Banned content in dist.
  const jsFiles = walk(DIST, { exts: ['.js'] })
  const htmlFiles = walk(DIST, { exts: ['.html'] })
  const BANNED = [
    { re: /WebGLRenderer|THREE\.|three\.module/, name: 'three.js' },
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
      // A canonical link is a URL, not a request.
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
    console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${pad(r.group, 6)} ${pad(r.name, 40)} ${pad((r.gz / KB).toFixed(1) + ' KB', 10)} ${b}`)
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
