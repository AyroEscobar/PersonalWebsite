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

/** a over b at alpha (sRGB, the way the browser composites). */
export const over = (a, b, alpha) => a.map((v, i) => v * alpha + b[i] * (1 - alpha))
/** CSS brightness(k) on an sRGB colour, clamped. */
export const brighten = (c, k) => c.map((v) => Math.min(255, v * k))

/*
  Token pairs (DESIGN.md 2.1): body text on the void and on the plate needs 4.5:1 (ink and
  ink-2 measure 15 to 19); cyan is eyebrows, the email link and the button fill, never body;
  void on cyan is the primary button's ink.
*/
export const CONTRAST_RULES = [
  ...['ink', 'ink-2'].map((t) => ({ fg: t, bg: 'void', min: 7, kind: 'body text on the void' })),
  ...['ink', 'ink-2', 'cyan'].map((t) => ({ fg: t, bg: 'plate', min: 4.5, kind: 'text on the solid plate (fallbacks)' })),
  ...['ink', 'ink-2', 'cyan'].map((t) => ({ fg: t, bg: 'plate-2', min: 4.5, kind: 'text on the plate gradient' })),
  { fg: 'cyan', bg: 'void', min: 4.5, kind: 'the eyebrows and the email link on the void' },
  { fg: 'void', bg: 'cyan', min: 4.5, kind: 'void ink on the cyan button' },
  { fg: 'ink', bg: 'void', min: 3, kind: 'the focus ring' },
]

/*
  Composite contrast (DESIGN.md 4.2): text on glass is measured against what is actually
  behind it. The worst case on this page is the BRIGHTEST backdrop pixel under a panel: the
  poster script measures it from the real hero frame under each panel box and records it in
  public/poster/meta.json (brightest.rgb); check-content composites the glass fill, the
  backdrop brightness and the scrim over that pixel, and every text token on that surface
  must reach its floor. QA re-measures on the live page at five scroll positions.

    fill       the white fill alpha at its weakest point
    brightness the backdrop-filter brightness
    scrim      the void alpha under the copy (0 where the copy sits on the padding ring)
*/
export const COMPOSITE_RULES = [
  { key: 'panel', glass: 'thick panel under its scrim (the hero at p 0)', fill: 0.05, brightness: 1.07, scrim: 0.62, text: ['ink', 'ink-2', 'cyan'], min: 4.5 },
  { key: 'card', glass: 'card under its scrim (check out at p 0.2)', fill: 0.05, brightness: 1.07, scrim: 0.7, text: ['ink', 'ink-2', 'cyan'], min: 4.5 },
  { key: 'pill', glass: 'glass pill on its void base (the nav and the glass buttons at p 0)', fill: 0.05, brightness: 1.07, scrim: 0.66, text: ['ink', 'ink-2'], min: 4.5 },
  { key: 'theme', glass: 'the theme line on its void pool (p 0)', fill: 0, brightness: 1, scrim: 0.7, text: ['ink'], min: 4.5 },
  { key: 'title', glass: 'the bare section title on the raw scene (p 0.2), large text', fill: 0, brightness: 1, scrim: 0, text: ['ink'], min: 3 },
  { key: 'footer', glass: 'the footer on its void gradient (p 1)', fill: 0, brightness: 1, scrim: 0.86, text: ['ink', 'ink-2'], min: 4.5, links: true },
]
