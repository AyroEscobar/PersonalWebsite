/*
  The rules the brief and voice.md set, as code (shared by check-content,
  budget and the QA run). Nothing here names a private term: the privacy
  denylist is read from outside the repo (DENYLIST_PATH), because the repo
  is public.
*/
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const HQ = path.join(os.homedir(), 'Desktop/HQ/personal-brand')
export const FACTS_PATH = process.env.FACTS_PATH || path.join(HQ, 'facts.json')
export const DENYLIST_PATH = process.env.DENYLIST_PATH || path.join(HQ, 'denylist.txt')

// U+2013 en dash and U+2014 em dash (plus the figure dash and horizontal bar, same look).
export const DASH_RE = /[‒–—―]/

// voice.md "Don't" list and research components.md 3.6.
export const BANNED = [
  /\bpassionate\b/i,
  /\binnovative\b/i,
  /\bcutting[- ]edge\b/i,
  /\bleverag(e|es|ed|ing)\b/i,
  /\bsynerg(y|ies|istic)\b/i,
  /\bthrilled\b/i,
  /\bprompt engineer(ing)?\b/i,
  /\bexcited to announce\b/i,
  /\bworld[- ]class\b/i,
  /\bgame[- ]chang(er|ing)\b/i,
  /\brockstar\b/i,
  /\bninja\b/i,
  /\bguru\b/i,
  /\bvisionary\b/i,
  /\bdisrupt(ive|ing|or)?\b/i,
  /\bin every direction that matters\b/i,
  /\bnext[- ]gen\b/i,
  /\bseamless(ly)?\b/i,
  /\bunleash\b/i,
  /\bwon\b(?= (at|first|second|third|best|the))/i,
]

// Shapes that must never ship (PLAN.md 12 step 8). Rules that name a term,
// including proximity rules, live in the denylist outside the repo.
export const PRIVATE_SHAPES = [
  { name: 'EIN-shaped number', re: /\b\d{2}-\d{7}\b/ },
  { name: 'phone-shaped number', re: /(?<![\w.])\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/ },
]

export function loadFacts() {
  if (!existsSync(FACTS_PATH)) return null
  const list = JSON.parse(readFileSync(FACTS_PATH, 'utf8'))
  return new Map(list.map((f) => [f.id, f]))
}

/*
  The denylist (outside the repo, DENYLIST_PATH). One term per line, '#'
  comments, groups separated by a blank line.

    a group whose comment says [held] is skipped when ALLOW_HELD=1
    near: <term> | <word>, <word>       a proximity rule: fails when <term>
                                        sits within NEAR_CHARS characters of
                                        any listed word, on either side

  readDenylist() returns { terms, near } (near: [{ name, re }]) or null when
  the file is missing. loadDenylist() returns just the terms.
*/
export const NEAR_CHARS = 80
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function readDenylist() {
  if (!existsSync(DENYLIST_PATH)) return null
  const allowHeld = process.env.ALLOW_HELD === '1'
  const terms = []
  const near = []
  for (const group of readFileSync(DENYLIST_PATH, 'utf8').split(/\n\s*\n/)) {
    const lines = group.split('\n').map((l) => l.trim()).filter(Boolean)
    if (allowHeld && lines.some((l) => l.startsWith('#') && /\[held\]/i.test(l))) continue
    for (const l of lines) {
      if (l.startsWith('#')) continue
      const m = l.match(/^near:\s*(.+?)\s*\|\s*(.+)$/i)
      if (!m) {
        terms.push(l)
        continue
      }
      const words = m[2].split(',').map((w) => w.trim()).filter(Boolean).map(esc).join('|')
      const term = esc(m[1])
      near.push({
        name: `denylist proximity rule ${near.length + 1}`,
        re: new RegExp(`(${words})[\\s\\S]{0,${NEAR_CHARS}}${term}|${term}[\\s\\S]{0,${NEAR_CHARS}}(${words})`),
      })
    }
  }
  return { terms, near }
}

export function loadDenylist() {
  return readDenylist()?.terms ?? null
}

/** Proximity rules from the denylist (empty when the file is missing). */
export function loadNearRules() {
  return readDenylist()?.near ?? []
}

export function termRegex(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\w])${escaped}([^\\w]|$)`, 'i')
}

/** Recursively list files under dir, skipping node_modules and dotted dirs. */
export function walk(dir, { exts = null, skip = [] } = {}) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = path.join(dir, name)
    if (skip.some((s) => p.includes(s))) continue
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p, { exts, skip }))
    else if (!exts || exts.includes(path.extname(name).toLowerCase())) out.push(p)
  }
  return out
}

/** Line and column for an index into text. */
export function where(text, index) {
  const before = text.slice(0, index)
  const line = before.split('\n').length
  return `${line}:${index - before.lastIndexOf('\n')}`
}

// ---------- color ----------

export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

export function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Hex tokens from the first :root block of tokens.css: { base: '#FBF9F4', ... } */
export function readTokens(tokensCss) {
  const block = tokensCss.match(/:root\s*{([\s\S]*?)}/)[1]
  const out = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) out[m[1]] = m[2].toUpperCase()
  return out
}

/** The field colours (oklch) from tokens.css: { peach: [r, g, b], 'sky-d': [...], ... } in sRGB 0..255. */
export function readFieldTokens(tokensCss) {
  const out = {}
  for (const m of tokensCss.matchAll(/--f-([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*;/g)) {
    out[m[1]] = oklchToRgb(Number(m[2]), Number(m[3]), Number(m[4]))
  }
  return out
}

/** OKLCH to gamma-encoded sRGB, clamped (Bjorn Ottosson's matrices, https://bottosson.github.io/posts/oklab/). */
export function oklchToRgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((v) => {
    const c = Math.min(1, Math.max(0, v))
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
  })
}

/** a over b at alpha (sRGB, the way the browser composites). */
export const over = (a, b, alpha) => a.map((v, i) => v * alpha + b[i] * (1 - alpha))
/** CSS brightness(k) on an sRGB colour, clamped. */
export const brighten = (c, k) => c.map((v) => Math.min(255, v * k))

/*
  Token pairs (DESIGN.md 2.1, 2.6): body text on the base needs 7:1, every
  other text token 4.5:1, the focus ring and the now dot 3:1.
*/
export const CONTRAST_RULES = [
  ...['ink', 'ink-2'].map((t) => ({ fg: t, bg: 'base', min: 7, kind: 'body text on the base' })),
  ...['ink-3', 'accent', 'accent-ink', 'ok-ink'].map((t) => ({ fg: t, bg: 'base', min: 4.5, kind: 'text on the base' })),
  ...['ink', 'ink-2', 'ink-3', 'accent'].map((t) => ({ fg: t, bg: 'plate-2', min: 4.5, kind: 'text on the solid plate (fallbacks)' })),
  { fg: 'on-ink', bg: 'ink', min: 4.5, kind: 'text on the ink pill and the tooltip' },
  { fg: 'plate', bg: 'accent', min: 4.5, kind: 'white on the accent' },
  { fg: 'accent', bg: 'base', min: 3, kind: 'the focus ring' },
  { fg: 'ok', bg: 'base', min: 3, kind: 'the now dot' },
]

/*
  Composite contrast (DESIGN.md 9.2): text on glass is measured against what
  is actually behind it. For each glass surface that holds text: the field
  blob at its core (its alpha over the base), the glass's backdrop
  brightness, then the glass's LEAST tint under copy. Saturate is left out
  (it keeps luminance). Sheets are checked without blur or brightness, the
  way phones and tier lite draw them. Body tokens need 4.5:1, large text
  and the focus ring 3:1.

  Two consequences, enforced in check-content: text on glass uses ink or
  ink-2 (ink-3 measures 4.1:1 on a sheet over rose, so it never sets text in
  the component styles), and links on glass use accent-ink (accent measures
  3.9:1 there).
*/
export const COMPOSITE_RULES = [
  {
    glass: 'sheet (cards, plates, now list, crew, stack)',
    fill: 0.14,
    brightness: 1,
    blobs: ['peach-d', 'butter-d', 'sky-d', 'lilac-d', 'rose-d'],
    text: ['ink', 'ink-2', 'accent-ink'],
    min: 4.5,
  },
  {
    glass: 'thick + scrim (the contact card)',
    fill: 0.22,
    brightness: 1.07,
    blobs: ['peach-d', 'butter-d', 'rose-d', 'peach', 'butter'],
    text: ['ink', 'ink-2', 'accent-ink'],
    min: 4.5,
  },
  {
    glass: 'thick pill (glass buttons, link row, quiet switch, toast)',
    fill: 0.03,
    brightness: 1.07,
    blobs: ['peach', 'butter', 'sky', 'lilac', 'rose', 'core', 'peach-d', 'butter-d', 'sky-d', 'lilac-d', 'rose-d'],
    text: ['ink'],
    min: 4.5,
  },
  {
    glass: 'clear lens (the sentence, large text)',
    fill: 0.03,
    brightness: 1.08,
    blobs: ['peach', 'butter', 'sky', 'lilac', 'rose', 'core'],
    text: ['ink'],
    min: 3,
  },
  {
    glass: 'none: the focus ring over the raw field',
    fill: 0,
    brightness: 1,
    blobs: ['peach', 'butter', 'sky', 'lilac', 'rose', 'core', 'peach-d', 'butter-d', 'sky-d', 'lilac-d', 'rose-d'],
    text: ['accent'],
    min: 3,
  },
  {
    // the hero lede and proof, section lines, the builds notes, the footer, and the links among
    // them: base.css sets every link outside glass in a token from this list (check-content)
    glass: 'none: text and links on the raw field',
    fill: 0,
    brightness: 1,
    blobs: ['peach', 'butter', 'sky', 'lilac', 'rose', 'core', 'peach-d', 'butter-d', 'sky-d', 'lilac-d', 'rose-d'],
    text: ['ink', 'ink-2'],
    min: 4.5,
    links: true,
  },
]
