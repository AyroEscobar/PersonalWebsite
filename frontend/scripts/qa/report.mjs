/*
  QA report writer: qa-report.md and qa-report.json in the reviews dir, with
  the numbers beside the baseline (research/baseline-metrics.json) and the
  PLAN.md 13 acceptance criteria mapped to the checks that prove them.
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { localConfig } from '../lib/chrome.mjs'

const KB = 1024

// Acceptance criteria (PLAN.md 13) -> the check ids that decide them.
// 'manual' means a person has to look (Ayro's five minutes or a design review).
const CRITERIA = [
  [1, 'npm run build passes with check-content and budget green', ['build/npm run build', 'budget/budgets']],
  [2, 'no U+2013 or U+2014 in dist or src', ['static/dashes', 'build/npm run build']],
  [3, 'every visible string carries a public fact id or ui flag', ['build/npm run build']],
  [4, 'no Firebase, Mapbox, three.js, framer-motion or react-router in dist', ['static/removed-deps']],
  [5, 'no audio, EXIF photos, backend, Admin or Review in the branch', ['repo/removed files']],
  [6, 'vercel.json: no catch-all, immutable assets, headers and CSP hash', ['repo/vercel.json', 'http/security headers', 'http/immutable assets']],
  [7, 'granular commits, no AI attribution, nothing pushed', ['repo/commits']],
  [8, 'JPMorgan once as Software Engineer Intern, CIB, June to August 2026', ['build/npm run build', 'static/privacy'], 'manual'],
  [9, 'MD7 reads Software Engineer (contract), May 2026 to present', ['build/npm run build'], 'manual'],
  [10, 'HackUTD past tense, February 2025 to September 2026, tech team', ['build/npm run build'], 'manual'],
  [11, 'agent system: no count, no time of day, no link', ['static/privacy'], 'manual'],
  [12, 'Viaere: no counts, customers or start date; co-founders not named', ['static/privacy'], 'manual'],
  [13, 'Interview-Lens says built with a team; nobody is founder', ['build/npm run build'], 'manual'],
  [14, 'hackathons use competed; no awards implied', ['static/competed']],
  [15, 'none of the private facts appear', ['static/privacy']],
  [16, 'the only live numbers are time, sky, build stamp and visit stamp', [], 'manual'],
  [17, 'twenty only via the AGE constant', ['build/npm run build']],
  [18, "Onto what's next. exactly once", ['static/closer-once']],
  [19, 'hero map: four Texas labels and two off-grid links only', ['static/map-labels']],
  [20, 'palette is the tokens only', ['static/palette']],
  [21, 'no scanline, glitch, noise, bracket, chamfer or full-viewport blend', ['static/effects']],
  [22, 'fonts: exactly Overpass and Overpass Mono, two preloads, 65 KB', ['fonts/only overpass', 'budget/budgets']],
  [23, 'past sodium, current LED, beacon only for live status', [], 'manual'],
  [24, 'RouteRail six stops with aria-current at 1440 and 390', ['nav/aria-current tracks the section']],
  [25, 'first paint within 1.3 s, never over content, skipped when it should be', ['motion/first paint runs once', 'motion/no first paint on repeat or deep link', 'motion/reduced motion', 'motion/quiet mode']],
  [26, 'tap or click sends a wave along the road graph within 2 s', [], 'manual'],
  [27, 'ping button fires from Plano and says pinged from plano', ['signature/ping status @1440', 'signature/ping status @390']],
  [28, 'reduced motion or quiet: no canvas, ping highlights a node', ['motion/reduced motion', 'motion/quiet mode']],
  [29, 'vertical swipes on the map scroll the page (pan-y)', ['signature/map touch-action pan-y']],
  [30, 'Lighthouse mobile: perf 90+, a11y, bp, seo 100', ['lighthouse/mobile-full']],
  [31, 'mobile LCP 2.5 s, CLS 0.02, TBT 150 ms; desktop perf 99', ['lighthouse/mobile-full', 'lighthouse/desktop-full']],
  [32, 'entry JS, CSS, HTML, initial transfer budgets; zero third-party and media', ['budget/budgets']],
  [33, '?quiet scores at least as high as full mode', ['lighthouse/mobile quiet >= full', 'lighthouse/desktop quiet >= full']],
  [34, 'one rAF loop, idle when the hero is offscreen', ['motion/rAF idle with hero offscreen']],
  [35, 'axe: zero violations on / and /404 at both widths', ['axe/home@390', 'axe/home@1440', 'axe/404@390', 'axe/404@1440']],
  [36, 'token contrast floors and measured text contrast', ['build/npm run build', 'page/home@390 contrast', 'page/home@1440 contrast']],
  [37, 'keyboard sequence, focus return, unobscured focus', ['keyboard/skip link first', 'keyboard/visible focus', 'keyboard/focus not obscured', 'keyboard/tab order spec', 'keyboard/cmd+k and esc', 'keyboard/rail stop lands below the bar']],
  [38, 'targets 24 px, bars and dialog rows 44 px', ['page/home@390 targets', 'page/home@1440 targets']],
  [39, 'map, specimens and ProgramStrip have text equivalents', [], 'manual'],
  [40, 'single-key shortcuts can be turned off and it persists', [], 'manual'],
  [41, 'title, canonical, og:url, sitemap on www; twitter name=', ['meta/title, canonical, og, twitter', 'http//sitemap.xml']],
  [42, 'robots and sitemap MIME; unknown path is a themed 404', ['http//robots.txt', 'http//sitemap.xml', 'http/404 status']],
  [43, 'og.png 1200 by 630, 300 KB, alt without dashes or numbers', ['meta/og.png']],
  [44, 'JSON-LD Person validates', ['meta/json-ld person']],
  [45, 'prerendered h1, six h2s and the hero caption', ['prerender/h1 and h2s before JS', 'prerender/hero caption before JS']],
  [46, '?quiet removes canvas, boot and motion; same DOM', ['motion/quiet mode']],
  [47, 'print: one or two pages, no map or buttons', ['print/print hides chrome'], 'manual'],
  [48, '404 has h1, a link home, the poster, passes axe', ['http/404 status', 'axe/404@390', 'axe/404@1440']],
  [49, 'qa-report.md and the after shots exist', []],
  [50, 'scratch under 1 GB, no Chrome profiles left', ['repo/scratch']],
]

function criteriaStatus(R) {
  const by = new Map(R.checks.map((c) => [`${c.area}/${c.id}`, c]))
  return CRITERIA.map(([n, text, ids, manual]) => {
    if (n === 49) return { n, text, status: R.shots.length ? 'pass' : 'pending', detail: `${R.shots.length} shots` }
    const found = ids.map((id) => by.get(id)).filter(Boolean)
    let status
    if (!ids.length) status = 'manual'
    else if (!found.length) status = 'pending'
    else if (found.some((c) => c.status === 'fail')) status = 'fail'
    else if (found.some((c) => c.status === 'pending')) status = 'pending'
    else status = manual ? 'pass + manual' : 'pass'
    return { n, text, status, detail: found.map((c) => `${c.id}: ${c.status}`).join(', ') }
  })
}

const fmtMs = (v) => (v == null ? '-' : `${(v / 1000).toFixed(2)} s`)

export function writeReport(R, { REVIEWS, SHOTS }) {
  const cfg = localConfig()
  const baselinePath = cfg.baselinePath
  const baseline = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null
  const crit = criteriaStatus(R)
  const count = (s) => R.checks.filter((c) => c.status === s).length
  const L = []
  L.push('# ayroescobar.com QA report', '')
  L.push(`Run ${R.startedAt} to ${R.finishedAt || 'unfinished'}. Branch build served like Vercel, headless Chrome over CDP.`)
  L.push(`Options: widths ${R.options.WIDTHS.join(', ')}; ${R.options.FAST ? 'fast (no Lighthouse, no external links)' : `Lighthouse ${R.options.LH_RUNS} run(s) per preset`}${R.options.STRICT ? '; strict' : ''}.`, '')
  L.push(`**${count('pass')} pass, ${count('fail')} fail, ${count('pending')} pending (not built yet), ${count('warn')} warn.**`, '')

  if (R.lighthouse && !R.lighthouse.skipped) {
    L.push('## Lighthouse (median)', '')
    L.push('| preset | perf | a11y | bp | seo | FCP | LCP | TBT | CLS | bytes | baseline perf / LCP |', '|---|---|---|---|---|---|---|---|---|---|---|')
    for (const [k, { median: m }] of Object.entries(R.lighthouse)) {
      const b = baseline?.lighthouse?.[k.startsWith('mobile') ? 'lh-live-mobile' : 'lh-live-desktop']
      L.push(`| ${k} | ${m.performance} | ${m.accessibility} | ${m['best-practices']} | ${m.seo} | ${fmtMs(m.fcp)} | ${fmtMs(m.lcp)} | ${Math.round(m.tbt)} ms | ${m.cls?.toFixed(3)} | ${Math.round(m.bytes / KB)} KB | ${b ? `${b.scores.performance} / ${b.metrics['largest-contentful-paint']}` : '-'} |`)
    }
    L.push('')
  }

  if (R.budget) {
    L.push('## Bundle (gzip -9)', '')
    L.push('| group | item | size | budget | |', '|---|---|---|---|---|')
    for (const r of R.budget.rows) L.push(`| ${r.group} | ${r.name} | ${(r.gz / KB).toFixed(1)} KB | ${r.budget == null ? '' : (r.budget / KB).toFixed(0) + ' KB'} | ${r.ok ? 'ok' : '**over**'} |`)
    if (baseline?.bundle) L.push('', `Baseline (master): ${baseline.bundle.gzip_js_kb} KB gz JS, ${baseline.bundle.css_gzip_kb} KB gz CSS, three.js ${baseline.bundle.split_gzip_kb.three} KB, Firebase ${baseline.bundle.split_gzip_kb.firebase} KB.`)
    L.push('')
  }

  L.push('## Pages', '')
  L.push('| route | width | height | overflow | console | failed req | KB | broken img | contrast fails (lowest) | small targets | axe |', '|---|---|---|---|---|---|---|---|---|---|---|')
  for (const p of R.pages) {
    L.push(`| ${p.route} | ${p.width} | ${p.height} | ${p.overflow.overflow || p.overflow.offenderCount ? '**yes**' : 'no'} | ${p.consoleErrors.length} | ${p.failedReqs.length} | ${Math.round(p.bytes / KB)} | ${p.images.broken.length} | ${p.contrast.failCount} (${p.contrast.lowest[0]?.ratio ?? '-'}) | ${p.targets.smallCount} | ${p.axe == null ? '-' : p.axe.length} |`)
  }
  L.push('')

  L.push('## Acceptance criteria (PLAN.md 13)', '')
  L.push('| # | criterion | status | evidence |', '|---|---|---|---|')
  for (const c of crit) L.push(`| ${c.n} | ${c.text} | ${c.status} | ${c.detail} |`)
  L.push('')

  L.push('## Every check', '')
  L.push('| area | check | status | detail |', '|---|---|---|---|')
  for (const c of R.checks) L.push(`| ${c.area} | ${c.id} | ${c.status} | ${String(c.detail || '').replace(/\|/g, '/').slice(0, 300)} |`)
  L.push('')

  if (R.keyboard?.sequence) {
    L.push('## Keyboard sequence at 1440', '')
    L.push(R.keyboard.sequence.map((f, i) => `${i + 1}. ${f.tag}${f.href ? ` ${f.href}` : ''} "${f.name}"${f.outline || f.shadow ? '' : ' (no ring)'}${f.obscured ? ' (obscured)' : ''}`).join('\n'), '')
  }

  if (R.motion && Object.keys(R.motion).length) {
    L.push('## Motion probes', '')
    for (const [k, v] of Object.entries(R.motion)) L.push(`- ${k}: rAF ${v.raf} in 3 s, canvas ${v.canvas}, data-boot at load ${v.bootAtLoad}, after ${v.boot}, mode ${v.mode}, motion ${v.motion}, tier ${v.tier}, long animations ${v.animations?.length ?? 0}`)
    L.push('')
  }

  if (R.links.external.length) {
    L.push('## External links', '')
    for (const l of R.links.external) L.push(`- ${l.status} ${l.href}`)
    L.push('')
  }

  L.push('## Screenshots', '', `In ${SHOTS}:`, '', R.shots.map((s) => `- ${s}`).join('\n') || '- none', '')
  L.push('## Manual (Ayro, five minutes)', '', '- VoiceOver over the rail, the map label, one desk branch and the JumpList.', '- A real iPhone tap on the hero: feel the ping and confirm scrolling never gets trapped.', '')

  const md = path.join(REVIEWS, 'qa-report.md')
  writeFileSync(md, L.join('\n'))
  writeFileSync(path.join(REVIEWS, 'qa-report.json'), JSON.stringify({ ...R, criteria: crit }, null, 1))
  return { md }
}
