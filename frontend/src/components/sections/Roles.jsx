import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi'
import Section from '../ui/Section'

const ROLES = [
  {
    org: 'JPMorganChase', title: 'Software Engineer Intern',
    unit: 'Digital & Platform Services', loc: 'Plano, TX',
    period: 'INCOMING JUN 2026', type: 'work', accent: '#6dd5ff', badge: 'INCOMING',
    summary:
      'Joining the Digital & Platform Services team for Commercial & Investment Banking ' +
      'as a software engineering intern.',
  },
  {
    org: 'MD7', title: 'Software Engineer Intern',
    unit: 'Contract', loc: 'Allen, TX',
    period: '2026', type: 'work', accent: '#6ee7a3', badge: 'CURRENT',
    summary:
      'Building a Power BI competitor: clean executive dashboards focused on summaries and ' +
      'exec level perspective. Shipping directly with the CTO, with real ownership over ' +
      'architecture and ship cadence.',
  },
  {
    org: 'RBC', title: 'Software Engineer Intern',
    unit: 'Royal Bank of Canada · AidenEdge Program', loc: 'New York City',
    period: 'JAN to APR 2026', type: 'work', accent: '#d99cff', badge: '6 DESKS',
    summary:
      'Selected for the inaugural cohort of the AidenEdge Program, 1 of 10 interns. A ' +
      'rotational software engineering internship across six trading floor desks in four ' +
      'months. Every desk shipped a real AI system.',
    detail: [
      ['RATES TRADING & FX ALGORITHMS', 'Built an AI code review agent trained on 4,000+ pull request comments from the desk’s two strongest engineers. It runs as a first pass before human review.'],
      ['RATES TRADING', 'Built a trade compression tool that decomposes the desk’s compression swaps into their true underlying risks, giving traders a sharper read on real exposure.'],
      ['QUANTITATIVE INVESTMENT STRATEGIES', 'Built an autonomous multi-agent platform that parallelizes research, analysis, and report generation across 60+ quant strategies, cutting processing from 2 hours to 10 minutes per strategy. Integrated into RBC internal systems.'],
      ['AI & DIGITAL INNOVATION', 'Audited 4,700+ internal AI agents to architect 12 centralized workflows, surfacing a 70% redundancy rate and trimming prompt logic to cut token waste.'],
      ['CROSS-ASSET SALES', 'Built an AI editorial QA agent for the desk’s flagship research brief, a global markets digest read by 1,500+ employees including executives. It reviews every issue before it sends.'],
      ['ALTERNATIVE ASSET GROUP', 'Architected an automated SEC filing pipeline that pulls 20 credit reports in 5 minutes, down from an hour, comparing N-CSR and 13F filings into structured storage.'],
    ],
  },
  {
    org: 'Major League Hacking', title: 'Coach',
    unit: 'Contract', loc: 'Hybrid',
    period: '2025 to PRESENT', type: 'community', accent: '#ffb86b',
    summary:
      'Coaching hackers and supporting Global Hack Week events streamed to hundreds of ' +
      'viewers. Built a CSV to Google Sheet automation the team now runs weekly.',
  },
  {
    org: 'HackUTD', title: 'Software Engineer · Tech Team',
    unit: 'Hack Portal', loc: 'Richardson, TX',
    period: '2025 to PRESENT', type: 'community', accent: '#6dd5ff',
    summary:
      'Tech team for North America’s largest hackathon, 1,200+ participants. I develop ' +
      'and maintain Hack Portal, the platform that runs the event.',
  },
  {
    org: 'ACM UTD', title: 'Technical Interview Prep Officer',
    unit: 'Education Division', loc: 'Richardson, TX',
    period: '2025', type: 'community', accent: '#6ee7a3',
    summary:
      'Led DSA prep in Java for a cohort of students, arrays through dynamic programming, ' +
      'plus mock interviews with personalized feedback on problem solving.',
  },
]

const TABS = ['ALL', 'WORK', 'COMMUNITY']

function RoleCard({ r, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel panel-glow">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span
            className="font-mono shrink-0 mt-0.5"
            style={{ fontSize: '11px', color: r.accent, letterSpacing: '0.05em' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="display text-ink" style={{ fontSize: '16px', fontWeight: 600 }}>
                  {r.org}
                </span>
                {r.badge && (
                  <span
                    className="font-mono px-1.5 py-0.5 rounded-sm"
                    style={{
                      fontSize: '9px', letterSpacing: '0.12em',
                      color: r.accent, border: `1px solid ${r.accent}55`, background: `${r.accent}0f`,
                    }}
                  >
                    {r.badge}
                  </span>
                )}
              </div>
              <span className="eyebrow shrink-0">{r.period}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-cyan" style={{ fontSize: '12.5px' }}>{r.title}</span>
              <span className="text-muted">·</span>
              <span className="eyebrow">{r.unit}</span>
              <span className="text-muted">·</span>
              <span className="eyebrow">{r.loc}</span>
            </div>
            <p className="mt-2.5 text-dim" style={{ fontSize: '13px', lineHeight: 1.75 }}>
              {r.summary}
            </p>

            {r.detail && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="mt-3 flex items-center gap-1.5 font-mono text-dim hover:text-cyan transition-colors"
                style={{ fontSize: '10.5px', letterSpacing: '0.14em' }}
              >
                <HiChevronDown
                  size={13}
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                />
                {open ? 'HIDE DESK LOG' : 'EXPAND DESK LOG'}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && r.detail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 ml-8 space-y-3 border-l border-border pl-4">
                {r.detail.map(([desk, body], i) => (
                  <div key={desk}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ fontSize: '9.5px', color: r.accent }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="eyebrow" style={{ color: '#a9b4c6', letterSpacing: '0.1em' }}>
                        {desk}
                      </span>
                    </div>
                    <p className="mt-1 text-dim" style={{ fontSize: '12px', lineHeight: 1.7 }}>
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function Roles() {
  const [tab, setTab] = useState('ALL')
  const filtered = ROLES.filter((r) => (tab === 'ALL' ? true : r.type === tab.toLowerCase()))

  return (
    <Section id="roles" code="SECTION 02 // EXPERIENCE" title="Deployment log" intro="WHERE I HAVE SHIPPED">
      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-mono transition-colors border ${
              tab === t ? 'text-cyan border-cyan/40 bg-cyan/5' : 'text-dim border-border hover:text-ink'
            }`}
            style={{ fontSize: '10.5px', letterSpacing: '0.16em' }}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2.5"
        >
          {filtered.map((r, i) => (
            <motion.div
              key={r.org + r.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <RoleCard r={r} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Section>
  )
}
