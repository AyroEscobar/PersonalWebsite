#!/usr/bin/env node
/*
  serve-dist (PLAN.md 11, 12). A Vercel-like static server for dist, used by
  `npm run preview`, the QA run and the OG capture.

    - headers come from vercel.json (security headers, CSP, immutable /assets/*)
    - cleanUrls: /404 and /404.html both serve 404.html
    - unknown paths serve 404.html with status 404 (no SPA fallback)
    - right MIME types for robots.txt and sitemap.xml

  Usage: node scripts/serve-dist.mjs [--port 4173] [--root dist]
  As a module: const { server, port, url } = await serveDist({ port: 0 })
*/
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function vercelHeaderRules() {
  const file = path.join(ROOT, 'vercel.json')
  if (!existsSync(file)) return []
  const config = JSON.parse(readFileSync(file, 'utf8'))
  // Vercel sources here are simple: literal paths, (.*) wildcards and :params.
  const toRegex = (source) => {
    const parts = source.split('(.*)').map((s) =>
      s.replace(/[.+?^${}()|[\]\\*]/g, '\\$&').replace(/:(\w+)/g, '([^/]+)'),
    )
    return new RegExp('^' + parts.join('(.*)') + '$')
  }
  return (config.headers || []).map((h) => ({ re: toRegex(h.source), headers: h.headers }))
}

export function serveDist({ port = 0, root = path.join(ROOT, 'dist'), host = '127.0.0.1', log = false } = {}) {
  const rules = vercelHeaderRules()
  const resolve = (urlPath) => {
    let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
    if (p.includes('..')) return null
    if (p.endsWith('/')) p += 'index.html'
    const candidates = [p, `${p}.html`]
    for (const c of candidates) {
      const abs = path.join(root, c)
      if (abs.startsWith(root) && existsSync(abs) && statSync(abs).isFile()) return abs
    }
    return null
  }
  const server = createServer((req, res) => {
    const urlPath = new URL(req.url, 'http://x').pathname
    let file = resolve(urlPath)
    let status = 200
    if (!file || /\/404(\.html)?$/.test(urlPath)) {
      file = path.join(root, '404.html')
      status = 404
    }
    for (const r of rules) if (r.re.test(urlPath)) for (const h of r.headers) res.setHeader(h.key, h.value)
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('not found')
    }
    res.statusCode = status
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream')
    if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    if (log) console.log(status, req.method, urlPath)
    if (req.method === 'HEAD') return res.end()
    res.end(readFileSync(file))
  })
  return new Promise((ok, bad) => {
    server.once('error', bad)
    server.listen(port, host, () => {
      const p = server.address().port
      ok({ server, port: p, url: `http://${host}:${p}` })
    })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = (name, dflt) => {
    const i = process.argv.indexOf(name)
    return i > 0 ? process.argv[i + 1] : dflt
  }
  const { url } = await serveDist({ port: Number(arg('--port', 4173)), root: path.resolve(ROOT, arg('--root', 'dist')), log: true })
  console.log(`serve-dist: ${url}  (Ctrl+C to stop)`)
}
