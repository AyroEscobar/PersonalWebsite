/*
  Lighthouse (PLAN.md 7, 12 step 4). Mobile and desktop presets, full mode
  and ?quiet=1 (the poster instead of the live scene), N runs each, median reported. Runs against the QA Chrome over
  its debugging port, so no second browser is launched.
*/

const CATS = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  tbt: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
  si: 'speed-index',
  bytes: 'total-byte-weight',
}

export const TARGETS = {
  mobile: { performance: 90, accessibility: 100, 'best-practices': 100, seo: 100, lcp: 2500, tbt: 150, cls: 0.02 },
  desktop: { performance: 99, accessibility: 100, 'best-practices': 100, seo: 100, lcp: 2500, tbt: 150, cls: 0.02 },
  goals: { mobilePerformance: 95, mobileLcp: 1800, mobileFcp: 1200 },
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b)
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null
}

export async function runLighthouse({ port, url, runs = 3, log = console.log }) {
  let lighthouse
  let desktopConfig
  try {
    const mod = await import('../../tools/lighthouse.mjs')
    lighthouse = mod.default
    desktopConfig = mod.desktopConfig
  } catch {
    return { skipped: 'lighthouse not installed (npm run tools)' }
  }
  const out = {}
  // A headless tab can die mid-run ("Target closed"). That is the harness, not
  // the page: retry the run up to twice, and report every retry (run.mjs turns
  // them into a warning), so a page that really crashes the tab still shows up.
  const retries = []
  for (const form of ['mobile', 'desktop']) {
    for (const variant of ['full', 'quiet']) {
      const target = variant === 'quiet' ? `${url}/?quiet=1` : `${url}/`
      const samples = []
      for (let i = 0; i < runs; i++) {
        const flags = { port, output: 'json', logLevel: 'error', onlyCategories: CATS }
        let result = null
        for (let attempt = 1; !result; attempt++) {
          try {
            result = await lighthouse(target, flags, form === 'desktop' ? desktopConfig : undefined)
          } catch (e) {
            const why = String(e?.message || e).split('\n')[0].slice(0, 160)
            retries.push(`${form}/${variant} run ${i + 1}: ${why}`)
            log(`  lighthouse ${form}/${variant} run ${i + 1}: ${why} (attempt ${attempt})`)
            if (attempt >= 3) throw e
          }
        }
        const lhr = result.lhr
        const s = { runtimeError: lhr.runtimeError?.message }
        for (const c of CATS) s[c] = lhr.categories[c]?.score == null ? null : Math.round(lhr.categories[c].score * 100)
        for (const [k, id] of Object.entries(METRICS)) s[k] = lhr.audits[id]?.numericValue ?? null
        s.failedAudits = Object.values(lhr.audits)
          .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
          .map((a) => a.id)
        samples.push(s)
        log(`  lighthouse ${form}/${variant} run ${i + 1}: perf ${s.performance} a11y ${s.accessibility} bp ${s['best-practices']} seo ${s.seo} lcp ${Math.round(s.lcp)}ms`)
      }
      const m = {}
      for (const k of [...CATS, ...Object.keys(METRICS)]) m[k] = median(samples.map((s) => s[k]))
      m.failedAudits = [...new Set(samples.flatMap((s) => s.failedAudits))]
      out[`${form}-${variant}`] = { median: m, samples }
    }
  }
  if (retries.length) Object.defineProperty(out, 'retries', { value: retries, enumerable: false })
  return out
}
