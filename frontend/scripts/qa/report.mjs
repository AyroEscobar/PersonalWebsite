/*
  QA report writer: qa-report.md and qa-report.json in the reviews dir, with
  the numbers beside the baseline (research/baseline-metrics.json) and the
  DESIGN.md 11 acceptance criteria mapped to the checks that prove them.
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { localConfig } from '../lib/chrome.mjs'

const KB = 1024

// Acceptance criteria (DESIGN.md 11, the v2 spec; numbers 1 to 6 are looked at, not counted)
// -> the check ids that decide them. 'manual' means a person has to look.
const CRITERIA = [
  [1, 'the 1440 fold: name, role, city and a receipt in five seconds; the sentence and lens first; colour under every line; at least as striking as prototype a', ['prerender/the sentence before JS', 'r1/T2 email on the first screen @1440x900'], 'manual'],
  [2, 'the lens close up reads as thick clear glass, magnifying about 1.16x, the fringe faint', ['glass/reader takes the stand-in\'s box @1440'], 'manual'],
  [3, 'the 390 fold: masthead, six lines, the lens on line 2, both pills above 700px; lens off still reads as glass', ['glass/reader takes the stand-in\'s box @390', 'r1/T2 email on the first screen @390x844', 'r1/T6 name high on a phone @390x844'], 'manual'],
  [4, 'scrolling: the lens snaps line to line, becomes the pill (the dock on phones) once, active word in italic', ['glass/morph @1440', 'glass/morph @390', 'glass/deep link lands on the nav @1440', 'glass/deep link lands on the nav @390', 'nav/aria-current tracks the section']],
  [5, 'the kit page shows every component in every state, and the fallbacks look designed', ['glass/quiet mode @1440', 'glass/quiet mode @390', 'glass/forced colours @1440', 'glass/forced colours @390', 'glass/no backdrop-filter: line 2 reads once @1440', 'glass/no backdrop-filter: line 2 reads once @390'], 'manual'],
  [7, 'npm run build green: check-content, budget, prerender', ['build/npm run build', 'budget/budgets']],
  [8, 'no U+2013 or U+2014 in dist or src', ['static/dashes', 'build/npm run build']],
  [9, 'every visible string carries a public fact id or ui flag; nothing from the denylist', ['build/npm run build', 'static/privacy']],
  [10, 'measured composite contrast down the whole page at 390, 768, 1440 and 1920, zero failures', ['glass/measured contrast @1440', 'glass/measured contrast @390', 'glass/measured contrast @768', 'glass/measured contrast @1920', 'page/home@390 contrast', 'page/home@1440 contrast']],
  [11, '3 to 5 live glass surfaces on the first screen', ['glass/first-screen surfaces @1440', 'glass/first-screen surfaces @390']],
  [12, 'the morph under 600 ms and one #nav', ['glass/morph @1440', 'glass/morph @390']],
  [13, 'the keyboard reaches every nav word, button, link and summary, in reading order, with a visible ring', ['glass/keyboard reaches every control', 'keyboard/skip link first', 'keyboard/visible focus', 'keyboard/focus not obscured', 'keyboard/tab order spec', 'keyboard/nav word lands below the pill']],
  [14, 'no sideways scroll from 320 to 1920', ['glass/no sideways scroll at 320 to 1920']],
  [15, 'forced colours: a 2px border on every glass surface', ['glass/forced colours @1440', 'glass/forced colours @390']],
  [16, 'reduced motion: the field stops, no morph, the nav a pill from the start', ['motion/reduced motion']],
  [17, 'quiet: solid plates, the lens under the words', ['glass/quiet mode @1440', 'glass/quiet mode @390']],
  [18, 'axe: zero violations on / and the 404 at 390 and 1440', ['axe/home@390', 'axe/home@1440', 'axe/404@390', 'axe/404@1440']],
  [19, 'no monospace anywhere', ['v2/no monospace at 1440 (DESIGN.md 9.3)']],
  [20, 'fonts: Instrument Serif and Inter only, three preloads, 60 KB', ['fonts/only Instrument Serif and Inter', 'budget/budgets']],
  [21, 'no layout shift when the fonts arrive late, or while scrolling past the morph', ['r1/T12 no shift when the fonts arrive late', 'glass/scroll layout shift @320', 'glass/scroll layout shift @390', 'glass/scroll layout shift @1440']],
  [22, 'Lighthouse mobile: LCP under 2.5 s, CLS 0.02, TBT 150 ms; a11y, bp, seo 100', ['lighthouse/mobile-full']],
  [23, 'Lighthouse desktop', ['lighthouse/desktop-full']],
  [24, '?quiet=1 scores at least as high as full mode', ['lighthouse/mobile quiet >= full', 'lighthouse/desktop quiet >= full']],
  [25, 'entry JS, CSS, HTML, lens, kit, specimens and initial transfer budgets; zero third-party and media', ['budget/budgets', 'static/removed-deps']],
  [26, "Onto what's next. exactly once; hackathons competed", ['static/closer-once', 'static/competed']],
  [27, 'palette is the tokens; no scanline, glitch, chamfer or blend effects', ['static/palette', 'static/effects']],
  [28, 'title, canonical, og, twitter, JSON-LD; og.png 1200 by 630 under 300 KB', ['meta/title, canonical, og, twitter', 'meta/json-ld person', 'meta/og.png']],
  [29, 'robots and sitemap; an unknown path is a themed 404', ['http//robots.txt', 'http//sitemap.xml', 'http/404 status']],
  [30, 'the copy email button answers in the status region', ['interaction/copy email toast @390', 'interaction/copy email toast @1440']],
  [31, 'print: the nav and buttons hidden', ['print/print hides chrome']],
  [32, 'granular commits, no AI attribution, nothing pushed', ['repo/commits']],
  [33, 'scratch under 1 GB, no Chrome profiles left', ['repo/scratch']],
]

function criteriaStatus(R) {
  const by = new Map(R.checks.map((c) => [`${c.area}/${c.id}`, c]))
  return CRITERIA.map(([n, text, ids, manual]) => {
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

  L.push('## Acceptance criteria (DESIGN.md 11)', '')
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
    for (const [k, v] of Object.entries(R.motion)) L.push(`- ${k}: rAF ${v.raf} in 3 s, canvas ${v.canvas}, mode ${v.mode}, motion ${v.motion}, tier ${v.tier}, lens entry seen ${v.lensSeen}, long animations ${v.animations?.length ?? 0}`)
    L.push('')
  }

  if (R.links.external.length) {
    L.push('## External links', '')
    for (const l of R.links.external) L.push(`- ${l.status} ${l.href}`)
    L.push('')
  }

  L.push('## Screenshots', '', `In ${SHOTS}:`, '', R.shots.map((s) => `- ${s}`).join('\n') || '- none', '')
  L.push('## Manual (Ayro, five minutes)', '', '- Scroll the first screen slowly on a laptop and on an iPhone: the lens should read the sentence line by line and become the nav once.', '- Safari: the lens has no displacement there, so the loupe magnifies; check it still reads as glass.', '- VoiceOver over the nav, the sentence and one desk list.', '')

  const md = path.join(REVIEWS, 'qa-report.md')
  writeFileSync(md, L.join('\n'))
  writeFileSync(path.join(REVIEWS, 'qa-report.json'), JSON.stringify({ ...R, criteria: crit }, null, 1))
  return { md }
}
