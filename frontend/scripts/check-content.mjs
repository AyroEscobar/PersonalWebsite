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
    8  an age spelled out anywhere in src ("twenty", "20 years", "I'm 20"): the age is read from the
       one AGE constant in src/content/constants.js (identity-age); "Onto what's next." not exactly once
    9  a palette pair under its contrast floor in either theme (rules.mjs CONTRAST_RULES); text on
       the clay (the neck, the theme line) under its floor against the darkest and the lightest
       pixel the poster script measured under it on the real render, per theme (meta.json
       extremes); and every visible text line measured on the real composite at 1440, 390, 768 and
       1920, at p 0, 0.3, 0.56, 0.8 and 1, in both themes (meta.json composite,
       scripts/lib/composite.mjs): 4.5:1, 3:1 large. The light poster composite's mean luminance
       is 0.09 or more; the dark poster has a non-empty alpha.
   10  an off-palette color literal (#hex or rgb() in CSS and JSX; three's 0x literals are the
       scene's own), or a cut effect (scanlines, glitch, chamfers, cursor replacement) in src
   11  an import of @react-three, framer-motion, firebase or react-router anywhere; an import of
       three or three/addons anywhere but src/scene/
   12  backdrop-filter anywhere (v5 has no glass); SVG noise or displacement anywhere
   13  a monospace face anywhere: --mono is the label stack (tokens.css), used only by the scene
       controls and the kit captions; <code>, <kbd>, <samp>, <pre> never
   14  a keyframe or transition that animates backdrop-filter, box-shadow or filter
   15  --white, --clay or --clay-lit used as a text colour (the disk, the clay and its highlight)
   16  the wrong LinkedIn slug anywhere in src, public or index.html; the real profile missing from
       src/content/constants.js
   17  the composition out of step: src/scene/comp.js (BOX: aspect, foot point) against
       --room-aspect, --foot-x and --foot-y in tokens.css, and the poster sizes in
       src/hero/Frieze.jsx against the frames the scene renders

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
  WRONG_LINKEDIN_RE,
  LINKEDIN_OK,
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
    { re: /feTurbulence|feDisplacementMap/, name: 'SVG noise or displacement' },
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

    // 16: the wrong LinkedIn slug, anywhere in src, public or index.html
    {
      const m = text.match(WRONG_LINKEDIN_RE)
      if (m) err(`${r}:${where(text, m.index)}: the wrong LinkedIn slug; his profile is ${LINKEDIN_OK}`)
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

    // 8: the age comes from one constant (Ayro asked for it on the hero, Thu Oct 15, 2026), so a
    // birthday is a one-line change; a spelled-out age anywhere else in src goes stale unseen
    if (r.startsWith('src/') && r !== 'src/content/constants.js') {
      const m = text.match(/\btwenty\b|\b\d{2} years\b|\b\d{2}[ -]year[ -]old\b|\bI'?m \d{2}\b|\bI am \d{2}\b/i)
      if (m) err(`${r}:${where(text, m.index)}: an age ("${m[0]}"); read it from AGE in src/content/constants.js`)
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

      // 12: v5 has no glass, so no backdrop-filter anywhere
      {
        const m = code.match(/(^|[\s;{'"`])(-webkit-)?backdrop-filter\s*:|backdropFilter|setProperty\(\s*['"](-webkit-)?backdrop-filter/)
        if (m) err(`${r}:${where(text, m.index)}: backdrop-filter (v5 has no glass)`)
      }

      // 13: no monospace face ships. --mono is the label stack (tokens.css), used by the kit captions;
      // never a monospace family, never <code>, <kbd>, <samp>, <pre>.
      {
        const allowMono = /^src\/styles\/(tokens|components|kit)\.css$/.test(r)
        const m = code.match(/\bmonospace\b|\bfont-mono\b|Geist Mono|ui-monospace|var\(--mono\)|<(code|kbd|samp|pre)[\s>]/)
        if (m && !(allowMono && m[0] === 'var(--mono)')) err(`${r}:${where(text, m.index)}: monospace (${m[0].trim()}); no monospace face ships`)
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
        // 15: the disk, the clay and its highlight are never text (text uses the role tokens)
        if (/^src\/styles\/(components|page|kit|base)\.css$/.test(r)) {
          for (const m of text.matchAll(/(^|[\s;{])color\s*:\s*var\(--(white|clay|clay-lit)\)/g)) {
            err(`${r}:${where(text, m.index)}: --${m[2]} as a text colour; use a role token (tokens.css)`)
          }
        }
      }
    }
  }

  // ---------- 16: the real profile is the one constant ----------
  {
    const constants = readFileSync(path.join(ROOT, 'src/content/constants.js'), 'utf8')
    if (!constants.includes(`LINKEDIN = '${LINKEDIN_OK}'`)) err(`src/content/constants.js: LINKEDIN must be '${LINKEDIN_OK}'`)
  }

  // ---------- 17: the composition, in step across the scene, the CSS and the posters ----------
  {
    const comp = await import(pathToFileURL(path.join(ROOT, 'src/scene/comp.js')))
    const cssVar = (name) => (tokensCss.match(new RegExp(`--${name}:\\s*([\\d.]+)%?;`)) || [])[1]
    const want = { 'room-aspect': comp.ASPECT, 'foot-x': comp.FOOT_X * 100, 'foot-y': comp.FOOT_Y * 100 }
    for (const [k, v] of Object.entries(want)) {
      const have = Number(cssVar(k))
      if (!(Math.abs(have - v) <= (k === 'room-aspect' ? 0.0005 : 0.01))) err(`tokens.css --${k} is ${cssVar(k)}, src/scene/comp.js gives ${v.toFixed(4)}`)
    }
    const frieze = readFileSync(path.join(ROOT, 'src/hero/Frieze.jsx'), 'utf8')
    const num = (k) => Number((frieze.match(new RegExp(`\\b${k}:\\s*(\\d+)`)) || [])[1])
    const bw = comp.BOX.r - comp.BOX.l, bh = comp.BOX.t - comp.BOX.b
    // scripts/poster.mjs renders 800 and 480 CSS px wide at DPR 2 (frieze.js poster())
    const frame = (css) => [css * 2, Math.round((css * bh) / bw) * 2]
    const [w, h] = frame(800), [mw, mh] = frame(480)
    if (num('w') !== w || num('h') !== h || num('mw') !== mw || num('mh') !== mh) err(`src/hero/Frieze.jsx POSTER is ${num('w')}x${num('h')} and ${num('mw')}x${num('mh')}; the scene renders ${w}x${h} and ${mw}x${mh}`)
  }

  // ---------- 9: palette contrast, both themes ----------
  const pairs = []
  for (const rule of CONTRAST_RULES) {
    if (!tokens[rule.fg] || !tokens[rule.bg]) {
      err(`contrast: token --${!tokens[rule.fg] ? rule.fg : rule.bg} missing from the palette in tokens.css`)
      continue
    }
    const ratio = contrast(hexToRgb(tokens[rule.fg]), hexToRgb(tokens[rule.bg]))
    pairs.push({ ...rule, ratio })
    if (ratio < rule.min) err(`contrast (${rule.theme}): --${rule.fg} on --${rule.bg} is ${ratio.toFixed(2)}, needs ${rule.min} (${rule.kind})`)
  }

  // ---------- 9: text on the clay, against the darkest and lightest pixel measured under it ----------
  const metaPath = path.join(ROOT, 'public/poster/meta.json')
  let meta = null
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    } catch (e) {
      err(`contrast: public/poster/meta.json is unreadable (${e.message})`)
    }
  }
  if (!meta?.extremes) {
    err('contrast: public/poster/meta.json has no `extremes` measurement; run `npm run poster` after a build so the clay under the text is measured, not assumed')
  } else {
    for (const theme of ['light', 'dark']) {
      for (const rule of COMPOSITE_RULES) {
        const px = meta.extremes[theme]?.[rule.key]
        if (!px) {
          err(`contrast: meta.json has no extremes.${theme}.${rule.key} measurement`)
          continue
        }
        const t = rule.text[theme]
        if (!tokens[t]) {
          err(`contrast: token --${t} missing from tokens.css`)
          continue
        }
        const ratio = Math.min(contrast(hexToRgb(tokens[t]), px.dark), contrast(hexToRgb(tokens[t]), px.light))
        pairs.push({ fg: t, bg: `${rule.where}, ${theme}`, min: rule.min, ratio, kind: 'composite' })
        if (ratio < rule.min) err(`contrast (${theme}): --${t} on ${rule.where} is ${ratio.toFixed(2)} against the measured clay (rgb ${px.dark.join(', ')} to rgb ${px.light.join(', ')}), needs ${rule.min}`)
      }
    }
  }

  // ---------- 9: every text line measured on the real composite, both themes (scripts/lib/composite.mjs via poster.mjs) ----------
  if (meta) {
    // the poster is the first paint: a dark or failed light render never ships; the dark poster is drawn
    if (!(meta.luminance >= 0.09)) err(`poster: public/poster/meta.json luminance ${meta.luminance} (the light composite) is under the 0.09 floor; re-run \`npm run poster\``)
    if (!(meta.alpha?.dark > 0.01)) err(`poster: the dark poster's alpha is empty (${meta.alpha?.dark}); re-run \`npm run poster\``)
    for (const theme of ['light', 'dark']) {
      const comp = meta.composite?.[theme]
      if (!comp) {
        err(`contrast: public/poster/meta.json has no measured ${theme} composite; run \`npm run poster\` after a build`)
        continue
      }
      for (const v of COMPOSITE_VIEWS) {
        for (const p of COMPOSITE_PS) {
          const m = comp.views?.[v.name]?.[p]
          if (!m) err(`contrast: the ${theme} composite was not measured at ${v.name} p ${p}`)
          else if (!m.lines) err(`contrast: the ${theme} composite at ${v.name} p ${p} measured no text`)
        }
      }
      for (const f of comp.failures || []) err(`contrast (${theme}): ${f.view} p ${f.p}: ${f.sel} "${f.text}" is ${f.ratio} on the composite, needs ${f.min}`)
      if (comp.lowest) pairs.push({ fg: comp.lowest.sel, bg: `the live composite (${theme}, ${comp.lowest.view} p ${comp.lowest.p})`, min: comp.lowest.min, ratio: comp.lowest.ratio, kind: 'measured' })
    }
  }

  // ---------- 9: links take their surface's ink (base.css), so they are measured with it ----------
  {
    const baseCss = readFileSync(path.join(ROOT, 'src/styles/base.css'), 'utf8')
    const block = baseCss.match(/(^|\n)a\s*\{([^}]*)\}/)
    const color = block?.[2].match(/(^|[\s;])color\s*:\s*([^;]+);/)?.[2].trim()
    if (!color) err('contrast: src/styles/base.css has no `a { color: ... }` rule for links')
    else if (color !== 'inherit' && !/^var\(--(ink|accent|foot-ink)\)$/.test(color)) err(`contrast: links are ${color} (base.css); they must inherit their surface's ink or use --ink, --accent or --foot-ink`)
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
