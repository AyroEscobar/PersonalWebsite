#!/usr/bin/env node
/*
  prerender (PLAN.md 7, 9, 11). After the client and SSR builds:

    dist/index.html      '/'     full page HTML, so the name and copy paint before any script
    dist/kit/index.html  '/kit'  the component kit (DESIGN.md 5.15), noindex, not in the sitemap
    dist/404.html        '/404'  the themed 404, served with HTTP 404 for unknown paths

  Then it hashes every inline <script> (the boot script) for the CSP and keeps
  vercel.json in sync: locally it rewrites the hash and tells you to commit it;
  on CI (VERCEL or CI set) a stale hash fails the build.

  The CSS is inlined into both pages (INLINE_CSS=0 turns it off) because it
  is small and it is the only render-blocking request.

  Also asserts the contract QA relies on: one h1, the four section h2s, the light and the dark
  poster <picture> with their phone cuts, alt, size and priority, no canvas in the HTML (the frieze
  host makes it), the figure credit on every page, no em or en dashes in the HTML.
*/
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const INLINE_CSS = process.env.INLINE_CSS !== '0'

async function inlineCss(html) {
  const links = [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)]
  for (const [tag, href] of links) {
    const css = (await readFile(path.join(DIST, href), 'utf8')).replace(/<\/style/gi, '<\\/style')
    html = html.replace(tag, `<style data-href="${href}">${css}</style>`)
  }
  return html
}

export async function prerender() {
  const { render } = await import(pathToFileURL(path.join(ROOT, 'dist-ssr/entry-server.js')))
  const { NOT_FOUND } = await import(pathToFileURL(path.join(ROOT, 'src/content/meta.js')))
  const { KIT } = await import(pathToFileURL(path.join(ROOT, 'src/content/kit.js')))
  const { SECTION_IDS, headingId } = await import(pathToFileURL(path.join(ROOT, 'src/content/sections.js')))

  let template = await readFile(path.join(DIST, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('prerender: #root placeholder not found in dist/index.html')

  // Inline the stylesheet: one page, one small CSS file, and it removes the only
  // render-blocking request (about 0.4 s of mobile FCP in Lighthouse's model).
  if (INLINE_CSS) {
    template = await inlineCss(template)
  }

  const home = await render('home')
  const notFound = await render('404')
  const kit = await render('kit')

  const homeHtml = template.replace('<div id="root"></div>', `<div id="root">${home}</div>`)
  const nfHtml = template
    .replace('<div id="root"></div>', `<div id="root" data-page="404">${notFound}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${NOT_FOUND.title.text}</title>\n    <meta name="robots" content="noindex" />`)
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/\s*<meta property="og:url"[^>]*>/, '')
  const kitHtml = template
    .replace('<div id="root"></div>', `<div id="root" data-page="kit">${kit}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${KIT.title.text}</title>\n    <meta name="robots" content="noindex" />`)
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/\s*<meta property="og:url"[^>]*>/, '')

  // Contract checks.
  const problems = []
  const h1s = home.match(/<h1[\s>]/g) || []
  if (h1s.length !== 1) problems.push(`home has ${h1s.length} h1 elements, needs exactly 1`)
  for (const id of SECTION_IDS) {
    if (!home.includes(`id="${id}"`)) problems.push(`home is missing section #${id}`)
    if (!new RegExp(`<h2[^>]*id="${headingId(id)}"`).test(home)) problems.push(`home is missing <h2 id="${headingId(id)}">`)
  }
  const h2s = home.match(/<h2[\s>]/g) || []
  if (h2s.length !== SECTION_IDS.length) problems.push(`home has ${h2s.length} h2 elements, needs exactly ${SECTION_IDS.length}`)
  // the hero's two poster pictures (the light and the dark vase), each with its phone cut, sized, described
  // and high priority; the boot script preloads the one this visitor sees
  const hero = home.slice(home.indexOf('id="top"'), home.indexOf('id="check-out"'))
  for (const theme of ['light', 'dark']) {
    const pic = hero.match(new RegExp(`<picture class="poster poster--${theme}">[\\s\\S]*?<\\/picture>`))?.[0] || ''
    if (!pic) {
      problems.push(`the hero has no ${theme} poster <picture>`)
      continue
    }
    for (const f of [`/poster/frieze-${theme}.avif`, `/poster/frieze-${theme}-m.avif`, `/poster/frieze-${theme}.webp`, `/poster/frieze-${theme}-m.webp`]) if (!pic.includes(f)) problems.push(`the ${theme} poster <picture> is missing ${f}`)
    if (!/<img[^>]*\balt="[^"]+"/.test(pic)) problems.push(`the ${theme} poster <img> has no alt`)
    if (!/<img[^>]*\bfetchpriority="high"/i.test(pic)) problems.push(`the ${theme} poster <img> is not fetchpriority high`)
    if (!/<img[^>]*\bwidth="\d+"[^>]*\bheight="\d+"/.test(pic)) problems.push(`the ${theme} poster <img> has no width and height`)
  }
  if (/<canvas\b/.test(home)) problems.push('home ships a <canvas> in its HTML (the frieze host makes the one canvas after load)')
  if (!/CC BY 3\.0/.test(home) || !/CC BY 3\.0/.test(notFound) || !/CC BY 3\.0/.test(kit)) problems.push('the CC BY figure credit is missing from a page footer')
  if (!/<h1[\s>]/.test(notFound)) problems.push('404 has no h1')
  if ((kit.match(/<h1[\s>]/g) || []).length !== 1) problems.push('kit needs exactly one h1')
  for (const [name, html] of [['index.html', homeHtml], ['404.html', nfHtml], ['kit/index.html', kitHtml]]) {
    if (/[–—]/.test(html)) problems.push(`${name} contains an en or em dash`)
  }
  if (problems.length) throw new Error(`prerender:\n  ${problems.join('\n  ')}`)

  await writeFile(path.join(DIST, 'index.html'), homeHtml)
  await writeFile(path.join(DIST, '404.html'), nfHtml)
  await mkdir(path.join(DIST, 'kit'), { recursive: true })
  await writeFile(path.join(DIST, 'kit/index.html'), kitHtml)

  const hashes = new Set()
  for (const html of [homeHtml, nfHtml, kitHtml]) {
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`)
    }
  }
  await syncCsp([...hashes].sort())
  return { homeBytes: Buffer.byteLength(homeHtml), notFoundBytes: Buffer.byteLength(nfHtml), kitBytes: Buffer.byteLength(kitHtml), hashes: [...hashes] }
}

async function syncCsp(hashes) {
  const file = path.join(ROOT, 'vercel.json')
  const raw = await readFile(file, 'utf8')
  const config = JSON.parse(raw)
  let csp
  for (const block of config.headers || []) {
    for (const h of block.headers || []) if (h.key === 'Content-Security-Policy') csp = h
  }
  if (!csp) throw new Error('prerender: vercel.json has no Content-Security-Policy header')
  // 'wasm-unsafe-eval' is the meshopt decoder (three/addons/libs/meshopt_decoder) that unpacks the
  // figure mesh: WebAssembly only, never eval, and only from this origin's scripts.
  const want = `script-src 'self' 'wasm-unsafe-eval'${hashes.length ? ' ' + hashes.join(' ') : ''}`
  const have = (csp.value.match(/script-src[^;]*/) || [''])[0].trim()
  if (have === want) return
  if (process.env.VERCEL || process.env.CI) {
    throw new Error(`prerender: vercel.json CSP is stale.\n  have: ${have}\n  want: ${want}\n  Run \`npm run build\` locally and commit vercel.json.`)
  }
  csp.value = csp.value.replace(/script-src[^;]*/, want)
  await writeFile(file, JSON.stringify(config, null, 2) + '\n')
  console.warn(`prerender: updated the CSP script hash in vercel.json. Commit it.\n  ${want}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  prerender()
    .then((r) => console.log(`prerender: index.html ${r.homeBytes} B, 404.html ${r.notFoundBytes} B, ${r.hashes.length} inline script hash(es)`))
    .catch((e) => {
      console.error(e.message)
      process.exit(1)
    })
}
