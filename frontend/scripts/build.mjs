#!/usr/bin/env node
/*
  build (PLAN.md 7, 11; `npm run build`, also what Vercel runs).

    1  force a production build (the live site once shipped React's dev build)
    2  fix BUILD_SHA and BUILD_DATE once, so both builds and the stamp agree
    3  check-content      (fails on unsourced copy, dashes, privacy, contrast)
    4  vite build         client, with a manifest
    5  vite build --ssr   src/entry-server.jsx into dist-ssr
    6  prerender          dist/index.html, dist/kit/index.html, dist/404.html, CSP hash
                          (the posters in public/poster are committed by `npm run poster`, run by hand)
    7  budget             gzip budgets and banned code
    8  tidy               manifest to .build/, dist-ssr removed

  Flags: --skip-check (only for debugging a broken check), --keep-ssr
*/
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(ROOT)
const args = new Set(process.argv.slice(2))
const t0 = Date.now()
const step = (n) => console.log(`\nbuild: ${n}`)

if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
  console.warn(`build: NODE_ENV was "${process.env.NODE_ENV}" in the environment. Forcing production. (questions.md #26: remove it from the Vercel project env.)`)
}
process.env.NODE_ENV = 'production'

if (!process.env.BUILD_SHA) {
  let sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      sha = 'dev'
    }
  }
  process.env.BUILD_SHA = sha
}
if (!process.env.BUILD_DATE) process.env.BUILD_DATE = new Date().toISOString().slice(0, 10)
console.log(`build: mode production, sha ${process.env.BUILD_SHA}, date ${process.env.BUILD_DATE}`)

const fail = (msg) => {
  console.error(`\nbuild: FAILED at ${msg}`)
  process.exit(1)
}

// 3
if (!args.has('--skip-check')) {
  step('check-content')
  const { checkContent } = await import('./check-content.mjs')
  const { errors } = await checkContent()
  if (errors.length) fail('check-content')
}

// the first paint needs the committed posters (scripts/poster.mjs renders them from the real scene)
for (const f of ['frieze-light.avif', 'frieze-light.webp', 'frieze-light-m.avif', 'frieze-light-m.webp', 'frieze-dark.avif', 'frieze-dark.webp', 'frieze-dark-m.avif', 'frieze-dark-m.webp', 'meta.json']) {
  if (!existsSync(path.join(ROOT, 'public/poster', f))) fail(`public/poster/${f} is missing: run \`npm run poster\` after a build and commit public/poster`)
}

// 4, 5
const { build } = await import('vite')
step('vite build (client)')
await build({ mode: 'production', logLevel: 'warn' }).catch((e) => fail(`vite client build: ${e.message}`))
step('vite build (ssr)')
await build({
  mode: 'production',
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    manifest: false,
    copyPublicDir: false,
    rollupOptions: { output: { entryFileNames: 'entry-server.js' } },
  },
}).catch((e) => fail(`vite ssr build: ${e.message}`))

// 6
step('prerender')
const { prerender } = await import('./prerender.mjs')
const pr = await prerender().catch((e) => fail(e.message))
console.log(`prerender: index.html ${pr.homeBytes} B, kit/index.html ${pr.kitBytes} B, 404.html ${pr.notFoundBytes} B, ${pr.hashes.length} inline script hash(es)`)

// 7
step('budget')
const { measure, printTable } = await import('./budget.mjs')
let result
try {
  result = measure()
} catch (e) {
  fail(e.message)
}
printTable(result)
mkdirSync(path.join(ROOT, '.build'), { recursive: true })
writeFileSync(path.join(ROOT, '.build/budget.json'), JSON.stringify(result, null, 2))

// 8: the manifest is for our scripts, not for visitors.
const manifest = path.join(ROOT, 'dist/.vite/manifest.json')
if (existsSync(manifest)) {
  renameSync(manifest, path.join(ROOT, '.build/manifest.json'))
  rmSync(path.join(ROOT, 'dist/.vite'), { recursive: true, force: true })
}
if (!args.has('--keep-ssr')) rmSync(path.join(ROOT, 'dist-ssr'), { recursive: true, force: true })

if (result.fails.length) fail('budget')
console.log(`\nbuild: ok in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
