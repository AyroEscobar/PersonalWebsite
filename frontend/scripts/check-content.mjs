#!/usr/bin/env node
/*
  check-content (PLAN.md 7, 11, 13). Runs before every build. Fails on:

    1  a visible content string with no fact ids and no ui flag
    2  a fact id that is missing from facts.json or not public
    3  a `verbatim` item that does not match his quote in facts.json
    4  a duplicate content id
    5  an en or em dash anywhere in src, index.html, public or og (fonts excepted)
    6  a banned word (voice.md)
    7  a privacy denylist term, an EIN or phone shape, 2027 near JPMorgan or RBC
    8  'twenty' outside the AGE constant; "Onto what's next." not exactly once
    9  a token pair under its contrast floor
   10  an off-palette color literal, or a cut effect (scanlines, glitch, chamfers,
       cursor replacement) in src
   11  an import of three, @react-three, framer-motion, firebase or react-router

  facts.json and the denylist live outside the public repo. When either is
  missing (on Vercel) those checks are skipped with a warning.

  Usage: node scripts/check-content.mjs   (exit 1 on any error)
*/
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  BANNED,
  CONTRAST_RULES,
  DASH_RE,
  PRIVATE_SHAPES,
  contrast,
  hexToRgb,
  loadDenylist,
  loadFacts,
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
      // Derived lists (NODE_IDS, SECTION_IDS, ALLOWED_MAP_LABELS) repeat checked strings.
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

  // ---------- 5, 6, 7, 10, 11: every source text file ----------
  const textExts = ['.js', '.jsx', '.mjs', '.css', '.html', '.svg', '.txt', '.xml', '.json', '.md']
  const files = [
    ...walk(path.join(ROOT, 'src'), { exts: textExts, skip: ['src/assets/fonts'] }),
    ...walk(path.join(ROOT, 'public'), { exts: textExts }),
    ...walk(path.join(ROOT, 'og'), { exts: textExts }),
    path.join(ROOT, 'index.html'),
  ].filter((f) => existsSync(f))

  const tokensCss = readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8')
  const tokens = readTokens(tokensCss)
  const tokenHex = new Set(Object.values(tokens).map((h) => h.toUpperCase()))
  const tokenRgb = new Set(Object.values(tokens).map((h) => hexToRgb(h).join(',')))
  tokenRgb.add('243,236,223') // --hairline is ink at 10%

  const CUT_EFFECTS = [
    { re: /\bscan-?lines?\b/i, name: 'scanlines' },
    { re: /\bglitch/i, name: 'glitch' },
    { re: /chromatic[- ]aberration/i, name: 'chromatic aberration' },
    { re: /feTurbulence|feDisplacementMap/, name: 'SVG noise filter' },
    { re: /corner-shape\s*:/, name: 'chamfered corners' },
    { re: /cursor\s*:\s*url\(/, name: 'cursor replacement' },
    { re: /mix-blend-mode\s*:/, name: 'mix-blend-mode (never on a full-viewport layer)' },
  ]
  const BANNED_IMPORTS = /from\s+['"](three|@react-three\/[\w-]+|framer-motion|motion\/react|firebase(\/[\w-]+)?|react-router(-dom)?)['"]|import\(\s*['"](three|@react-three|framer-motion|firebase|react-router)/

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
    for (const s of PRIVATE_SHAPES) {
      const m = text.match(s.re)
      if (m) err(`${r}:${where(text, m.index)}: ${s.name}`)
    }

    if (r.startsWith('src/') && !r.endsWith('src/content/constants.js')) {
      const m = text.match(/\btwenty\b/i)
      if (m) err(`${r}:${where(text, m.index)}: "twenty" outside the AGE constant`)
    }

    if (isCode && r.startsWith('src/')) {
      const isTokenFile = /src\/styles\/(tokens|print)\.css$/.test(r)
      if (!isTokenFile) {
        for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/g)) {
          const hex = m[0].length === 4 ? '#' + [...m[0].slice(1)].map((c) => c + c).join('') : m[0]
          // ids like href="#now" never match: they are not hex
          if (!tokenHex.has(hex.toUpperCase())) err(`${r}:${where(text, m.index)}: off-palette color ${m[0]} (use a token)`)
        }
        for (const m of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
          if (!tokenRgb.has(`${m[1]},${m[2]},${m[3]}`)) err(`${r}:${where(text, m.index)}: off-palette color ${m[0]})`)
        }
      }
      for (const c of CUT_EFFECTS) {
        const m = text.match(c.re)
        if (m) err(`${r}:${where(text, m.index)}: cut effect, ${c.name} (PLAN.md 2.4)`)
      }
      const imp = text.match(BANNED_IMPORTS)
      if (imp) err(`${r}:${where(text, imp.index)}: removed dependency imported (${imp[0]})`)
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
