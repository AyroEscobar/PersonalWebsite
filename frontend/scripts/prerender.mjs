#!/usr/bin/env node
/*
  prerender (PLAN.md 7, 9, 11). After the client and SSR builds:

    dist/index.html  '/'    full page HTML, so the name and copy paint before any script
    dist/404.html    '/404' the themed 404, served with HTTP 404 for unknown paths

  Then it hashes every inline <script> (the boot script) for the CSP and keeps
  vercel.json in sync: locally it rewrites the hash and tells you to commit it;
  on CI (VERCEL or CI set) a stale hash fails the build.

  Also asserts the contract QA relies on: one h1, the six section h2s, no
  em or en dashes in the HTML.
*/
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

export async function prerender() {
  const { render } = await import(pathToFileURL(path.join(ROOT, 'dist-ssr/entry-server.js')))
  const { NOT_FOUND } = await import(pathToFileURL(path.join(ROOT, 'src/content/meta.js')))
  const { SECTION_IDS, headingId } = await import(pathToFileURL(path.join(ROOT, 'src/content/sections.js')))

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('prerender: #root placeholder not found in dist/index.html')

  const home = await render('home')
  const notFound = await render('404')

  const homeHtml = template.replace('<div id="root"></div>', `<div id="root">${home}</div>`)
  const nfHtml = template
    .replace('<div id="root"></div>', `<div id="root" data-page="404">${notFound}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${NOT_FOUND.title.text}</title>\n    <meta name="robots" content="noindex" />`)
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
  if (!/<h1[\s>]/.test(notFound)) problems.push('404 has no h1')
  for (const [name, html] of [['index.html', homeHtml], ['404.html', nfHtml]]) {
    if (/[–—]/.test(html)) problems.push(`${name} contains an en or em dash`)
  }
  if (problems.length) throw new Error(`prerender:\n  ${problems.join('\n  ')}`)

  await writeFile(path.join(DIST, 'index.html'), homeHtml)
  await writeFile(path.join(DIST, '404.html'), nfHtml)

  const hashes = new Set()
  for (const html of [homeHtml, nfHtml]) {
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`)
    }
  }
  await syncCsp([...hashes].sort())
  return { homeBytes: Buffer.byteLength(homeHtml), notFoundBytes: Buffer.byteLength(nfHtml), hashes: [...hashes] }
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
  const want = `script-src 'self'${hashes.length ? ' ' + hashes.join(' ') : ''}`
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
