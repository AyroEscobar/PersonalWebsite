/*
  Static scans of dist (PLAN.md 12 steps 7 and 8, acceptance 2, 4, 15, 20, 21).
  Returns a list of { id, status: 'pass' | 'fail' | 'warn', detail }.
*/
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { BANNED, DASH_RE, PRIVATE_SHAPES, loadDenylist, loadNearRules, readTokens, termRegex, walk, hexToRgb, WRONG_LINKEDIN_RE } from '../lib/rules.mjs'

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

  // Privacy: denylist terms (held groups included unless ALLOW_HELD=1), its proximity rules, and shapes.
  const deny = loadDenylist()
  const shapes = [...PRIVATE_SHAPES, ...loadNearRules()]
  const privacy = []
  for (const f of text) {
    const t = readFileSync(f, 'utf8')
    if (deny) for (const term of deny) if (termRegex(term).test(t)) privacy.push(`${rel(f)}: denylist term`)
    for (const s of shapes) if (s.re.test(t)) privacy.push(`${rel(f)}: ${s.name}`)
  }
  push('privacy', privacy.length ? 'fail' : deny ? 'pass' : 'warn', privacy.length ? privacy.join('; ') : deny ? 'denylist terms, proximity rules, EIN and phone shapes clean' : 'denylist missing, shape checks only')

  // v2 has no map (DESIGN.md 7.2): the map labels check went with it.
  const index = existsSync(path.join(DIST, 'index.html')) ? readFileSync(path.join(DIST, 'index.html'), 'utf8') : ''

  // The LinkedIn slug (Ayro, Sat Oct 17, 2026): his profile is /in/ayroescobar/, the other slug is wrong.
  {
    const wrong = walk(DIST, { exts: ['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg'] }).filter((f) => WRONG_LINKEDIN_RE.test(readFileSync(f, 'utf8'))).map(rel)
    const real = index.includes('https://www.linkedin.com/in/ayroescobar/')
    push('linkedin-slug', !wrong.length && real ? 'pass' : 'fail', wrong.length ? `the wrong slug in ${wrong.join(', ')}` : real ? 'only /in/ayroescobar/ (in index.html, the hero, contact and the JSON-LD)' : 'index.html does not link /in/ayroescobar/')
  }

  // CSS palette and cut effects.
  const tokens = readTokens(readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8'))
  // print.css redefines the tokens for paper (ink on white); those values are tokens too
  const printTokens = [...readFileSync(path.join(ROOT, 'src/styles/print.css'), 'utf8').matchAll(/--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)].map((m) => m[1].toUpperCase())
  const allowed = new Set([...Object.values(tokens).map((h) => h.toUpperCase()), ...printTokens, '#FFFFFF', '#FFF', '#000000', '#000'])
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
  // the clay's wheel rings are the one repeating gradient (on .frieze and the phone hero's clay layer);
  // anywhere else it is a scanline risk
  for (const m of cssText.matchAll(/([^{}]+)\{[^{}]*repeating-linear-gradient/g)) if (!/frieze|\.hero:{1,2}before/.test(m[1])) cut.push(`repeating-linear-gradient on ${m[1].trim().slice(0, 60)} (scanline risk)`)
  if (/corner-shape/.test(cssText)) cut.push('corner-shape (chamfer)')
  if (/clip-path\s*:\s*polygon/.test(cssText)) cut.push('clip-path polygon (chamfer risk)')
  if (/cursor\s*:\s*url\(/.test(cssText)) cut.push('cursor replacement')
  // Keyframes may only touch transform, opacity and stroke properties.
  for (const m of cssText.matchAll(/@keyframes\s+([\w-]+)\s*{([\s\S]*?})\s*}/g)) {
    const props = [...m[2].matchAll(/([a-z-]+)\s*:/g)].map((p) => p[1]).filter((p) => !/^(transform|opacity|stroke|stroke-dashoffset|stroke-opacity|offset-distance|translate|scale|rotate|visibility)$/.test(p))
    if (props.length) cut.push(`@keyframes ${m[1]} animates ${[...new Set(props)].join(', ')}`)
  }
  push('effects', cut.length ? 'fail' : 'pass', cut.length ? cut.join('; ') : 'no cut effects, keyframes touch transform and opacity only')

  // Dependencies that must be gone (acceptance 4) and media (budget also checks). three is the
  // scene (DESIGN.md 3.1): allowed in the lazy scene chunk only, never in the entry or any other file.
  const jsText = js.map((f) => readFileSync(f, 'utf8')).join('\n')
  const notScene = js.filter((f) => !/\/assets\/scene-[\w-]+\.js$/.test(f))
  const notSceneText = notScene.map((f) => readFileSync(f, 'utf8')).join('\n')
  const gone = [
    ['Firebase', /firestore|firebaseapp/i, jsText],
    ['Mapbox', /mapbox/i, jsText],
    ['three.js outside the scene chunk', /WebGLRenderer|three\.module|REVISION\s*=\s*['"]\d+/, notSceneText],
    ['framer-motion', /framer-motion/, jsText],
    ['react-router', /react-router|createBrowserRouter/, jsText],
  ]
    .filter(([, re, t]) => re.test(t + index))
    .map(([n]) => n)
  const sceneChunks = js.length - notScene.length
  push('removed-deps', gone.length || sceneChunks !== 1 ? 'fail' : 'pass', gone.length ? `in dist: ${gone.join(', ')}` : sceneChunks !== 1 ? `${sceneChunks} scene chunks (expected 1)` : 'no Firebase, Mapbox, framer-motion or react-router; three only in the one scene chunk')

  // Sound policy (PLAN.md 6.6): the site makes no sound. No Web Audio, no media
  // element, no speech, no vibration. Opt-in ticks would have to change this rule first.
  const htmlText = html.map((f) => readFileSync(f, 'utf8')).join('\n')
  const sound = [
    ['Web Audio', /\b(webkit)?AudioContext\b/.test(jsText)],
    ['new Audio()', /\bnew Audio\(/.test(jsText)],
    ['speech synthesis', /speechSynthesis/.test(jsText)],
    ['vibration', /\.vibrate\(/.test(jsText)],
    ['<audio> or <video>', /<(audio|video)\b/i.test(htmlText)],
  ]
    .filter(([, hit]) => hit)
    .map(([n]) => n)
  push('sound', sound.length ? 'fail' : 'pass', sound.length ? `makes sound: ${sound.join(', ')}` : 'silent: no Web Audio, media elements, speech or vibration')

  // Copy invariants on the prerendered page.
  const pageText = index.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  const closers = (pageText.match(/Onto what(&#x27;|')s next\./g) || []).length
  push('closer-once', closers === 1 ? 'pass' : 'fail', `"Onto what's next." appears ${closers} time(s)`)
  push('competed', /\b(won(?!['’]t)|placed|winner|finalist)\b/i.test(pageText) ? 'fail' : 'pass', 'no award or placement words')
  return out
}
