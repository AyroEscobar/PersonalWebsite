/*
  Static scans of dist (PLAN.md 12 steps 7 and 8, acceptance 2, 4, 15, 20, 21).
  Returns a list of { id, status: 'pass' | 'fail' | 'warn', detail }.
*/
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { BANNED, DASH_RE, PRIVATE_SHAPES, loadDenylist, readTokens, termRegex, walk, hexToRgb } from '../lib/rules.mjs'

export async function staticScan(ROOT) {
  const DIST = path.join(ROOT, 'dist')
  const out = []
  const push = (id, status, detail) => out.push({ id, status, detail })
  const rel = (f) => path.relative(DIST, f)

  const html = walk(DIST, { exts: ['.html'] })
  const js = walk(DIST, { exts: ['.js'] })
  const css = walk(DIST, { exts: ['.css'] })
  const text = walk(DIST, { exts: ['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg'] })

  // Dashes (fonts are binary and excluded by extension).
  const dashHits = text.filter((f) => DASH_RE.test(readFileSync(f, 'utf8'))).map(rel)
  push('dashes', dashHits.length ? 'fail' : 'pass', dashHits.length ? `U+2013/U+2014 in ${dashHits.join(', ')}` : `none in ${text.length} files`)

  // Banned words in the visible HTML text.
  const visibleText = html.map((f) => readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).join(' ')
  const banned = BANNED.filter((re) => re.test(visibleText)).map(String)
  push('banned-words', banned.length ? 'fail' : 'pass', banned.length ? banned.join(', ') : 'none in prerendered text')

  // Privacy: denylist, shapes, Esvo.
  const deny = loadDenylist()
  const privacy = []
  for (const f of text) {
    const t = readFileSync(f, 'utf8')
    if (deny) for (const term of deny) if (termRegex(term).test(t)) privacy.push(`${rel(f)}: denylist term`)
    for (const s of PRIVATE_SHAPES) if (s.re.test(t)) privacy.push(`${rel(f)}: ${s.name}`)
  }
  push('privacy', privacy.length ? 'fail' : deny ? 'pass' : 'warn', privacy.length ? privacy.join('; ') : deny ? 'denylist, EIN, phone and 2027 checks clean' : 'denylist missing, shape checks only')

  // Map labels: only the six allowed node labels inside the map graphic.
  const { ALLOWED_MAP_LABELS } = await import(pathToFileURL(path.join(ROOT, 'src/content/places.js')))
  const index = existsSync(path.join(DIST, 'index.html')) ? readFileSync(path.join(DIST, 'index.html'), 'utf8') : ''
  const svgImgs = [...index.matchAll(/<svg[^>]*role="img"[\s\S]*?<\/svg>/g)].map((m) => m[0])
  const labels = svgImgs.flatMap((s) => [...s.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1].trim()))
  const stray = labels.filter((l) => !ALLOWED_MAP_LABELS.includes(l))
  push('map-labels', stray.length ? 'fail' : labels.length ? 'pass' : 'pending', stray.length ? `unexpected labels: ${stray.join(', ')}` : labels.length ? `${labels.length} labels, all allowed` : 'no map svg yet (A)')

  // CSS palette and cut effects.
  const tokens = readTokens(readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8'))
  const allowed = new Set([...Object.values(tokens).map((h) => h.toUpperCase()), '#FFFFFF', '#FFF', '#000000', '#000', '#060A18', '#B5BFD6', '#3A4A70'])
  const cssText = css.map((f) => readFileSync(f, 'utf8')).join('\n')
  const hexes = [...new Set([...cssText.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) => m[0].toUpperCase()))]
  const off = hexes.filter((h) => !allowed.has(h))
  const forbidden = ['#3B82F6', '#6DD5FF'].filter((h) => hexes.includes(h))
  push('palette', forbidden.length || off.length ? 'fail' : 'pass', forbidden.length ? `forbidden ${forbidden.join(', ')}` : off.length ? `off-palette ${off.join(', ')}` : `${hexes.length} hex colors, all tokens`)
  const rgbs = [...new Set([...cssText.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)].map((m) => `${m[1]},${m[2]},${m[3]}`))]
  const tokenRgb = new Set(Object.values(tokens).map((h) => hexToRgb(h).join(',')).concat(['243,236,223', '11,18,38', '0,0,0', '255,255,255']))
  const offRgb = rgbs.filter((r) => !tokenRgb.has(r))
  if (offRgb.length) push('palette-rgb', 'warn', `rgb() values not matching a token: ${offRgb.join(' | ')}`)

  const cut = []
  if (/mix-blend-mode\s*:/.test(cssText)) cut.push('mix-blend-mode')
  if (/repeating-linear-gradient/.test(cssText)) cut.push('repeating-linear-gradient (scanline risk)')
  if (/corner-shape/.test(cssText)) cut.push('corner-shape (chamfer)')
  if (/clip-path\s*:\s*polygon/.test(cssText)) cut.push('clip-path polygon (chamfer risk)')
  if (/cursor\s*:\s*url\(/.test(cssText)) cut.push('cursor replacement')
  // Keyframes may only touch transform, opacity and stroke properties.
  for (const m of cssText.matchAll(/@keyframes\s+([\w-]+)\s*{([\s\S]*?})\s*}/g)) {
    const props = [...m[2].matchAll(/([a-z-]+)\s*:/g)].map((p) => p[1]).filter((p) => !/^(transform|opacity|stroke|stroke-dashoffset|stroke-opacity|offset-distance|translate|scale|rotate|visibility)$/.test(p))
    if (props.length) cut.push(`@keyframes ${m[1]} animates ${[...new Set(props)].join(', ')}`)
  }
  push('effects', cut.length ? 'fail' : 'pass', cut.length ? cut.join('; ') : 'no cut effects, keyframes touch transform and opacity only')

  // Dependencies that must be gone (acceptance 4) and media (budget also checks).
  const jsText = js.map((f) => readFileSync(f, 'utf8')).join('\n')
  const gone = [
    ['Firebase', /firestore|firebaseapp/i],
    ['Mapbox', /mapbox/i],
    ['three.js', /WebGLRenderer/],
    ['framer-motion', /framer-motion/],
    ['react-router', /react-router|createBrowserRouter/],
  ]
    .filter(([, re]) => re.test(jsText + index))
    .map(([n]) => n)
  push('removed-deps', gone.length ? 'fail' : 'pass', gone.length ? `still in dist: ${gone.join(', ')}` : 'no Firebase, Mapbox, three.js, framer-motion or react-router')

  // Copy invariants on the prerendered page.
  const pageText = index.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  const closers = (pageText.match(/Onto what(&#x27;|')s next\./g) || []).length
  push('closer-once', closers === 1 ? 'pass' : 'fail', `"Onto what's next." appears ${closers} time(s)`)
  push('competed', /\b(won(?!['’]t)|placed|winner|finalist)\b/i.test(pageText) ? 'fail' : 'pass', 'no award or placement words')
  return out
}
