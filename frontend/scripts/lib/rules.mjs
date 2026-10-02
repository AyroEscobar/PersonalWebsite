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

// Shapes that must never ship (PLAN.md 12 step 8).
export const PRIVATE_SHAPES = [
  { name: 'EIN-shaped number', re: /\b\d{2}-\d{7}\b/ },
  { name: 'phone-shaped number', re: /(?<![\w.])\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/ },
  { name: '2027 near JPMorgan or RBC', re: /(JPMorgan|JPM|J\.P\.|RBC)[\s\S]{0,80}2027|2027[\s\S]{0,80}(JPMorgan|JPM|J\.P\.|RBC)/ },
]

export function loadFacts() {
  if (!existsSync(FACTS_PATH)) return null
  const list = JSON.parse(readFileSync(FACTS_PATH, 'utf8'))
  return new Map(list.map((f) => [f.id, f]))
}

/** Denylist: one term per line, '#' comments. Esvo terms are skipped when ALLOW_ESVO=1. */
export function loadDenylist() {
  if (!existsSync(DENYLIST_PATH)) return null
  const allowEsvo = process.env.ALLOW_ESVO === '1'
  return readFileSync(DENYLIST_PATH, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .filter((l) => !(allowEsvo && /esvo/i.test(l)))
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

/** Hex tokens from the first :root block of tokens.css: { night: '#0B1226', ... } */
export function readTokens(tokensCss) {
  const block = tokensCss.match(/:root\s*{([\s\S]*?)}/)[1]
  const out = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) out[m[1]] = m[2].toUpperCase()
  return out
}

/*
  Contrast pairs (PLAN.md 2.1, acceptance 36): text tokens on every surface
  they sit on. Body text (ink, dim) needs 7:1 on night and deck; every text
  token needs 4.5:1; UI graphics need 3:1.
*/
export const CONTRAST_RULES = [
  ...['night', 'deck'].flatMap((s) => ['ink', 'dim'].map((t) => ({ fg: t, bg: s, min: 7, kind: 'body text' }))),
  ...['night', 'deck', 'deck-2'].flatMap((s) =>
    ['ink', 'dim', 'sodium', 'led', 'beacon'].map((t) => ({ fg: t, bg: s, min: 4.5, kind: 'text' })),
  ),
  ...['night', 'deck'].flatMap((s) => ['trace-lit', 'sodium'].map((t) => ({ fg: t, bg: s, min: 3, kind: 'graphic' }))),
  { fg: 'night', bg: 'sodium', min: 4.5, kind: 'text on sodium fill' },
  { fg: 'night', bg: 'beacon', min: 4.5, kind: 'text on beacon fill' },
]
