#!/usr/bin/env node
/*
  lh-mobile: Lighthouse mobile alone, outside the QA harness, on the built dist: N runs (default 3) of
  the home page (and ?quiet=1 unless LH_QUIET=0), each printed as a line of JSON, then the median of each.

    SERVE_PORT=4713 CDP_PORT=4714 node scripts/lh-mobile.mjs [runs]

  SERVE_PORT serves dist (LH_ROOT another folder), CDP_PORT is the headless Chrome's debugging port, so
  every port stays where the caller wants it. Needs `npm run tools` (Lighthouse).
*/
import { serveDist } from './serve-dist.mjs'
import { launchChrome } from './lib/chrome.mjs'

const runs = Number(process.argv[2] || 3)
const { default: lighthouse } = await import('../tools/lighthouse.mjs')
const { server, url } = await serveDist({ port: Number(process.env.SERVE_PORT || 0), ...(process.env.LH_ROOT ? { root: process.env.LH_ROOT } : {}) })
const chrome = await launchChrome({ tag: 'lh' })
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
let code = 0
try {
  for (const target of process.env.LH_QUIET === '0' ? [`${url}/`] : [`${url}/`, `${url}/?quiet=1`]) {
    const rows = []
    for (let i = 0; i < runs; i++) {
      const r = await lighthouse(target, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] })
      const l = r.lhr, a = (id) => l.audits[id]?.numericValue
      const row = { target: target.replace(url, ''), run: i + 1, perf: Math.round(l.categories.performance.score * 100), a11y: Math.round(l.categories.accessibility.score * 100), bp: Math.round(l.categories['best-practices'].score * 100), seo: Math.round(l.categories.seo.score * 100), fcp: Math.round(a('first-contentful-paint')), lcp: Math.round(a('largest-contentful-paint')), tbt: Math.round(a('total-blocking-time')), cls: +a('cumulative-layout-shift').toFixed(4), si: Math.round(a('speed-index')), bytes: a('total-byte-weight') }
      rows.push(row)
      console.log(JSON.stringify(row))
    }
    const med = Object.fromEntries(['perf', 'a11y', 'bp', 'seo', 'fcp', 'lcp', 'tbt', 'cls', 'si', 'bytes'].map((k) => [k, median(rows.map((x) => x[k]))]))
    console.log(JSON.stringify({ target: target.replace(url, ''), median: med }))
  }
} catch (e) {
  console.error(e.stack || String(e))
  code = 1
} finally {
  await chrome.kill?.()
  server.close()
}
process.exit(code)
