#!/usr/bin/env node
/*
  check-content. Runs before every build. Fails on:

    1  a visible content string with no fact ids and no ui flag
    2  a fact id that is missing from facts.json or not public
    3  a `verbatim` item that does not match his quote in facts.json
    4  a duplicate content id
    5  an en or em dash anywhere in src, index.html or public (fonts and binaries excepted)
    6  a banned word (voice.md)
    7  a privacy denylist term or proximity rule, an EIN or phone shape
    8  "twenty" or "20 years" anywhere in src (no age on the site); "Onto what's next." not exactly once
    9  a token pair under its contrast floor, or text on glass under its floor measured on the
       composite: the glass fill, brightness and scrim over the brightest backdrop pixel the
       poster script measured under a panel (public/poster/meta.json); and every visible text line
       measured on the real composite over the live scene at 1440, 390, 768 and 1920 and at p 0,
       0.3, 0.56, 0.8 and 1 (meta.json composite, scripts/lib/composite.mjs): 4.5:1, 3:1 large
   10  an off-palette color literal (#hex or rgb() in CSS and JSX; three's 0x literals are the
       scene's own), or a cut effect (scanlines, glitch, chamfers, cursor replacement) in src
   11  an import of @react-three, framer-motion, firebase or react-router anywhere; an import of
       three or three/addons anywhere but src/scene/
   12  backdrop-filter anywhere in src but src/styles/glass.css; SVG noise or displacement anywhere
       but glass.css and the nav's clear lens (src/glass/lens.js, DESIGN.md 4.3)
   13  a monospace face anywhere but through --mono in the footer build line, the scene controls
       and the kit captions; <code>, <kbd>, <samp>, <pre> never
   14  a keyframe or transition that animates backdrop-filter, box-shadow or filter
   15  magenta, sky or dawn used as a text colour (they are the scene's)

  facts.json and the denylist live outside the public repo. When either is missing (on Vercel)
  those checks are skipped with a warning.

  Usage: node scripts/check-content.mjs   (exit 1 on any error)
*/
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { COMPOSITE_VIEWS, COMPOSITE_PS } from './lib/composite.mjs'
import {
  BANNED,
  COMPOSITE_RULES,
  CONTRAST_RULES,
  brighten,
  over,
  DASH_RE,
  PRIVATE_SHAPES,
  contrast,
  hexToRgb,
  loadDenylist,
  loadFacts,
  loadNearRules,
  readTokens,
  termRegex,
  walk,
  where,
  FACTS_PATH,
  DENYLIST_PATH,
} from './lib/rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rel = (p) => path.relative(ROOT, p)

export async function checkContent({ quiet = false } = {}) {
  const errors = []
  const warnings = []
  const err = (m) => errors.push(m)
  const warn = (m) => warnings.push(m)

  const facts = loadFacts()
  if (!facts) warn(`facts.json not found at ${FACTS_PATH}: fact id checks skipped`)
  const deny = loadDenylist()
  if (!deny) warn(`denylist not found at ${DENYLIST_PATH}: denylist check skipped`)
  const shapes = [...PRIVATE_SHAPES, ...loadNearRules()]

  // ---------- 1 to 4, 8: the content modules ----------
  const { NON_VISIBLE } = await import(pathToFileURL(path.join(ROOT, 'src/content/item.js')))
  const contentDir = path.join(ROOT, 'src/content')
  const modules = walk(contentDir, { exts: ['.js'] }).filter((f) => !/\/(item|index)\.js$/.test(f))
  const ids = new Map()
  const visible = []

  const checkFacts = (list, at) => {
    for (const id of list) {
      if (typeof id !== 'string') err(`${at}: fact id ${JSON.stringify(id)} is not a string`)
      else if (facts && !facts.has(id)) err(`${at}: unknown fact id "${id}"`)
      else if (facts && facts.get(id).public !== true) err(`${at}: fact "${id}" is not public in facts.json`)
    }
  }

  const visit = (node, at, inherited, isUi, file) => {
    if (node == null || typeof node === 'function') return
    if (typeof node === 'string') {
      visible.push({ text: node, at, file })
      if (!inherited.length && !isUi) err(`${at}: visible string has no fact ids and no ui flag: "${node.slice(0, 70)}"`)
      return
    }
    if (typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach((n, i) => visit(n, `${at}[${i}]`, inherited, isUi, file))
    let facts2 = inherited
    let ui2 = isUi
    if (Array.isArray(node.facts)) {
      if (!node.facts.length) err(`${at}: empty facts array`)
      checkFacts(node.facts, at)
      facts2 = node.facts
    }
    if (node.ui === true) ui2 = true
    if (typeof node.id === 'string' && (node.text !== undefined || node.facts || node.ui)) {
      if (ids.has(node.id)) err(`${at}: duplicate content id "${node.id}" (also at ${ids.get(node.id)})`)
      else ids.set(node.id, at)
    }
    if (node.verbatim && facts) {
      const f = facts.get(node.verbatim)
      if (!f) err(`${at}: verbatim fact "${node.verbatim}" not found`)
      else {
        const quote = f.fact.replace(/^'|'$/g, '')
        const parts = quote.split(/\s*\.\.\.\s*/).map((s) => s.trim()).filter(Boolean)
        let from = 0
        for (const part of parts) {
          const i = node.text.indexOf(part, from)
          if (i < 0) {
            err(`${at}: not verbatim to ${node.verbatim}; missing "${part.slice(0, 60)}"`)
            break
          }
          from = i + part.length
        }
      }
    }
    for (const [k, v] of Object.entries(node)) {
      if (NON_VISIBLE.has(k)) continue
      visit(v, `${at}.${k}`, facts2, ui2, file)
    }
  }

  for (const file of modules) {
    const mod = await import(pathToFileURL(file))
    const name = path.basename(file, '.js')
    if (name === 'constants') continue // constants are values, not copy; scanned as text below
    for (const [exp, value] of Object.entries(mod)) {
      if (/_IDS$|^ALLOWED_/.test(exp)) continue
      visit(value, `${name}.${exp}`, [], false, file)
    }
  }

  // "Onto what's next." exactly once in the content.
  const closers = visible.filter((v) => v.text.includes("Onto what's next."))
  if (closers.length !== 1) err(`"Onto what's next." must appear exactly once in content; found ${closers.length}`)

  // Banned words in content strings.
  for (const v of visible) {
    for (const re of BANNED) if (re.test(v.text)) err(`${v.at}: banned word ${re} in "${v.text.slice(0, 70)}"`)
  }

  // ---------- 5, 6, 7, 10 to 15: every source text file ----------
  const textExts = ['.js', '.jsx', '.mjs', '.css', '.html', '.svg', '.txt', '.xml', '.json', '.md']
  const files = [
    ...walk(path.join(ROOT, 'src'), { exts: textExts, skip: ['src/assets/fonts', 'src/assets/figure'] }),
    ...walk(path.join(ROOT, 'public'), { exts: textExts }),
    path.join(ROOT, 'index.html'),
  ].filter((f) => existsSync(f))

  const tokensCss = readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8')
  const tokens = readTokens(tokensCss)
  const tokenHex = new Set(Object.values(tokens).map((h) => h.toUpperCase()))
  const tokenRgb = new Set(Object.values(tokens).map((h) => hexToRgb(h).join(',')))

  const CUT_EFFECTS = [
    { re: /\bscan-?lines?\b/i, name: 'scanlines' },
    { re: /\bglitch/i, name: 'glitch' },
    { re: /chromatic[- ]aberration/i, name: 'chromatic aberration' },
    { re: /feTurbulence|feDisplacementMap/, name: 'SVG noise or displacement outside the glass material', allow: /^src\/(styles\/glass\.css|glass\/lens\.js)$/ },
    { re: /corner-shape\s*:/, name: 'chamfered corners' },
    { re: /cursor\s*:\s*url\(/, name: 'cursor replacement' },
    { re: /mix-blend-mode\s*:/, name: 'mix-blend-mode (never on a full-viewport layer)' },
    { re: /\bmatrix rain\b|katakana|\bscanline\b|\bnetrunner\b|\bjack in\b|access granted|initializing/i, name: 'cringe-list vocabulary' },
  ]
  const BANNED_IMPORTS = /from\s+['"](@react-three\/[\w-]+|framer-motion|motion\/react|firebase(\/[\w-]+)?|react-router(-dom)?)['"]|import\(\s*['"](@react-three|framer-motion|firebase|react-router)/
  const THREE_IMPORT = /from\s+['"]three(\/[\w./-]+)?['"]|import\(\s*['"]three/

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const r = rel(file)
    const isCode = /\.(js|jsx|mjs|css|html|svg)$/.test(file)

    const dash = text.match(new RegExp(DASH_RE.source, 'g'))
    if (dash) {
      const i = text.search(DASH_RE)
      err(`${r}:${where(text, i)}: en or em dash (${dash.length} in file)`)
    }

    if (r.startsWith('src/') && !r.startsWith('src/content/')) {
      for (const re of BANNED) {
        const m = text.match(re)
        if (m) err(`${r}:${where(text, m.index)}: banned word "${m[0]}"`)
      }
    }

    if (deny) {
      for (const term of deny) {
        const m = text.match(termRegex(term))
        if (m) err(`${r}:${where(text, m.index)}: denylist term (see ${DENYLIST_PATH})`)
      }
    }
    for (const s of shapes) {
      const m = text.match(s.re)
      if (m) err(`${r}:${where(text, m.index)}: ${s.name}`)
    }

    // 8: no age anywhere (BRIEF.md: age is never a selling point)
    if (r.startsWith('src/')) {
      const m = text.match(/\btwenty\b|\b20 years\b|\b\d{2} years old\b/i)
      if (m) err(`${r}:${where(text, m.index)}: an age ("${m[0]}"); the site states no age`)
    }

    if (isCode && r.startsWith('src/')) {
      const isTokenFile = /src\/styles\/(tokens|print)\.css$/.test(r)
      if (!isTokenFile) {
        for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/g)) {
          const hex = m[0].length === 4 ? '#' + [...m[0].slice(1)].map((c) => c + c).join('') : m[0]
          if (!tokenHex.has(hex.toUpperCase())) err(`${r}:${where(text, m.index)}: off-palette color ${m[0]} (use a token)`)
        }
        // CSS and JSX only: the scene's shaders and canvas gradients (src/scene) are not UI colour
        if (!r.startsWith('src/scene/')) {
          for (const m of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
            const c = `${m[1]},${m[2]},${m[3]}`
            if (!tokenRgb.has(c) && c !== '0,0,0' && c !== '255,255,255') err(`${r}:${where(text, m.index)}: off-palette color ${m[0]})`)
          }
        }
      }
      for (const c of CUT_EFFECTS) {
        if (c.allow?.test(r)) continue
        const m = text.match(c.re)
        if (m) err(`${r}:${where(text, m.index)}: cut effect, ${c.name}`)
      }

      // Comments may name what is banned; code may not. Positions stay put.
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
        .replace(/(^|\s)\/\/.*$/gm, (c) => c.replace(/[^\n]/g, ' '))

      // 12: the material lives in one file (DESIGN.md 4). Feature detection (CSS.supports) is allowed.
      if (r !== 'src/styles/glass.css') {
        const m = code.match(/(^|[\s;{'"`])(-webkit-)?backdrop-filter\s*:|backdropFilter|setProperty\(\s*['"](-webkit-)?backdrop-filter/)
        if (m) err(`${r}:${where(text, m.index)}: backdrop-filter outside src/styles/glass.css (render <Glass> instead)`)
      }

      // 13: monospace only through --mono (tokens.css defines it; components.css and kit.css use it on
      // .foot-row--mono, .ctl, .kit-sub and .kit-cap). Never <code>, <kbd>, <samp>, <pre>.
      {
        const allowMono = /^src\/styles\/(tokens|components|kit)\.css$/.test(r)
        const m = code.match(/\bmonospace\b|\bfont-mono\b|Geist Mono|var\(--mono\)|<(code|kbd|samp|pre)[\s>]/)
        if (m && !(allowMono && /^(var\(--mono\)|monospace|Geist Mono)$/.test(m[0])) && !(r === 'src/styles/fonts.css' && m[0] === 'Geist Mono')) err(`${r}:${where(text, m.index)}: monospace (${m[0].trim()}) outside the build line, the scene controls and the kit captions`)
      }

      // 11: three only in the scene chunk; the rest never
      const imp = code.match(BANNED_IMPORTS)
      if (imp) err(`${r}:${where(text, imp.index)}: removed dependency imported (${imp[0]})`)
      const three = code.match(THREE_IMPORT)
      if (three && !r.startsWith('src/scene/')) err(`${r}:${where(text, three.index)}: three imported outside src/scene/ (the entry never loads three; DESIGN.md 3.1)`)

      if (r.endsWith('.css')) {
        // 14: the material never animates.
        for (const m of text.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?\})\s*\}/g)) {
          const p = m[1].match(/(^|[\s;{])(-webkit-)?(backdrop-filter|box-shadow|filter)\s*:/)
          if (p) err(`${r}:${where(text, m.index)}: a keyframe animates ${p[3]}`)
        }
        for (const m of text.matchAll(/transition(-property)?\s*:([^;]*)/g)) {
          const p = m[2].match(/\b(backdrop-filter|box-shadow|filter)\b/)
          if (p) err(`${r}:${where(text, m.index)}: a transition animates ${p[1]}`)
        }
        // 15: the scene's hues are never text.
        if (/^src\/styles\/(components|page|kit|base)\.css$/.test(r)) {
          for (const m of text.matchAll(/(^|[\s;{])color\s*:\s*var\(--(magenta|sky|dawn)\)/g)) {
            err(`${r}:${where(text, m.index)}: --${m[2]} as a text colour; it is the scene's (DESIGN.md 2.1)`)
          }
        }
      }
    }
  }

  // ---------- 9: token contrast ----------
  const pairs = []
  for (const rule of CONTRAST_RULES) {
    if (!tokens[rule.fg] || !tokens[rule.bg]) {
      err(`contrast: token --${!tokens[rule.fg] ? rule.fg : rule.bg} missing from tokens.css`)
      continue
    }
    const ratio = contrast(hexToRgb(tokens[rule.fg]), hexToRgb(tokens[rule.bg]))
    pairs.push({ ...rule, ratio })
    if (ratio < rule.min) err(`contrast: --${rule.fg} on --${rule.bg} is ${ratio.toFixed(2)}, needs ${rule.min} (${rule.kind})`)
  }

  // ---------- 9: text on glass, on the composite over the brightest measured backdrop ----------
  const metaPath = path.join(ROOT, 'public/poster/meta.json')
  let brightest = null
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
      brightest = meta.brightest
    } catch (e) {
      err(`contrast: public/poster/meta.json is unreadable (${e.message})`)
    }
  }
  if (!brightest) {
    err('contrast: public/poster/meta.json has no `brightest` backdrop measurement; run `npm run poster` after a build so the composite is measured, not assumed')
  } else {
    const voidRgb = hexToRgb(tokens.void)
    for (const rule of COMPOSITE_RULES) {
      // the brightest pixel the poster script measured under this surface's boxes, on its frame
      const key = rule.key
      const px = brightest[key]
      if (!px) {
        err(`contrast: meta.json has no brightest.${key} measurement`)
        continue
      }
      let behind = brighten(px, rule.brightness)
      behind = over([255, 255, 255], behind, rule.fill)
      behind = over(voidRgb, behind, rule.scrim)
      let worst = null
      for (const t of rule.text) {
        if (!tokens[t]) {
          err(`contrast: token --${t} missing from tokens.css`)
          continue
        }
        const ratio = contrast(hexToRgb(tokens[t]), behind)
        if (!worst || ratio < worst.ratio) worst = { ratio, t }
      }
      if (!worst) continue
      pairs.push({ fg: worst.t, bg: rule.glass, min: rule.min, ratio: worst.ratio, kind: 'composite' })
      if (worst.ratio < rule.min) err(`contrast: --${worst.t} on ${rule.glass} over the brightest backdrop rgb(${px.join(', ')}) is ${worst.ratio.toFixed(2)}, needs ${rule.min}`)
    }
  }

  // ---------- 9: every text line measured on the real composite (scripts/lib/composite.mjs via poster.mjs) ----------
  {
    let comp = null
    try {
      comp = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')).composite : null
    } catch {
      comp = null
    }
    // the poster is the first paint: a dark or failed render (luminance under prototype b's 0.09 floor) never ships
    try {
      const lumMeta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')).luminance : null
      if (!(lumMeta >= 0.09)) err(`poster: public/poster/meta.json luminance ${lumMeta} is under the 0.09 floor (a dark or failed render); re-run \`npm run poster\``)
    } catch {
      /* unreadable meta is reported above */
    }
    if (!comp) err('contrast: public/poster/meta.json has no measured composite; run `npm run poster` after a build so every text line is measured over the live scene')
    else {
      for (const v of COMPOSITE_VIEWS) {
        for (const p of COMPOSITE_PS) {
          const m = comp.views?.[v.name]?.[p]
          if (!m) err(`contrast: the composite was not measured at ${v.name} p ${p}`)
          else if (!m.lines) err(`contrast: the composite at ${v.name} p ${p} measured no text`)
        }
      }
      for (const f of comp.failures || []) err(`contrast: ${f.view} p ${f.p}: ${f.sel} "${f.text}" is ${f.ratio} on the composite, needs ${f.min}`)
      if (comp.lowest) pairs.push({ fg: comp.lowest.sel, bg: `the live composite (${comp.lowest.view} p ${comp.lowest.p})`, min: comp.lowest.min, ratio: comp.lowest.ratio, kind: 'measured' })
    }
  }

  // ---------- 9: links outside glass sit on the raw scene, so their colour is a raw-scene token ----------
  {
    const rule = COMPOSITE_RULES.find((r) => r.links)
    const baseCss = readFileSync(path.join(ROOT, 'src/styles/base.css'), 'utf8')
    const block = baseCss.match(/(^|\n)a\s*\{([^}]*)\}/)
    const color = block?.[2].match(/(^|[\s;])color\s*:\s*var\(--([\w-]+)\)/)?.[2]
    if (!rule) err('contrast: rules.mjs has no raw-scene rule for links (COMPOSITE_RULES, links: true)')
    else if (!color) err('contrast: src/styles/base.css has no `a { color: var(--token) }` rule for links')
    else if (!rule.text.includes(color)) err(`contrast: links outside glass are --${color} (base.css); on the raw scene they must be one of ${rule.text.map((t) => `--${t}`).join(', ')}`)
  }

  if (!quiet) {
    for (const w of warnings) console.warn(`check-content: warning: ${w}`)
    if (errors.length) {
      console.error(`check-content: ${errors.length} error(s)`)
      for (const e of errors) console.error(`  ${e}`)
    } else {
      console.log(
        `check-content: ok (${visible.length} strings, ${ids.size} ids, ${files.length} files, ${pairs.length} contrast pairs, lowest ${Math.min(...pairs.map((p) => p.ratio)).toFixed(2)})`,
      )
    }
  }
  return { errors, warnings, pairs, strings: visible.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { errors } = await checkContent()
  process.exit(errors.length ? 1 : 0)
}
