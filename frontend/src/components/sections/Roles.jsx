import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Section from '../ui/Section'

const ROLES = [
  {
    org: 'JP Morgan Chase', title: 'Software Engineer Intern',
    unit: 'Digital Platform Services', period: 'JUN–AUG 2026',
    type: 'work', badge: 'INCOMING', accent: '#6dd5ff',
    desc: 'Incoming SWE intern. Java, Spring Boot, Kafka and GraphQL on platform services powering JPMC\'s digital surface under Commercial Investment Banking.',
  },
  {
    org: 'MD7', title: 'Software Engineer', unit: 'Contract',
    period: '2025–PRESENT', type: 'work', badge: 'CURRENT', accent: '#6ee7a3',
    desc: 'Building a Power BI competitor — clean executive dashboards focused on summaries and exec-level perspective. Shipping directly with the CTO; real ownership over architecture and ship cadence.',
  },
  {
    org: 'RBC — Royal Bank of Canada', title: 'Software Engineer Intern',
    unit: 'New York City', period: 'PRIOR', type: 'work', accent: '#6b7689',
    desc: 'Shipped on engineering teams in midtown Manhattan. Strong enough finish that a return offer is on the table.',
  },
  {
    org: 'Major League Hacking', title: 'Coach', unit: 'Hybrid',
    period: '2025–PRESENT', type: 'community', accent: '#ffb86b',
    desc: 'Mentoring hackers and supporting Global Hack Week events streamed to hundreds of viewers. Built a CSV → Google Sheet automation now used by the team weekly.',
  },
  {
    org: 'ACM UTD', title: 'Technical Interview Prep Officer',
    unit: 'Richardson, TX', period: '2025–PRESENT', type: 'community', accent: '#d99cff',
    desc: 'Lead DSA prep for 15 students — arrays through dynamic programming — and run mock technical interviews with personalized feedback on problem-solving.',
  },
  {
    org: 'HackUTD', title: 'Software Engineer · Tech Team',
    unit: 'Richardson, TX', period: '2024–PRESENT', type: 'community', accent: '#6b7689',
    desc: 'Tech crew for North America\'s largest hackathon — 1,200+ participants. Optimized HackPortal and the event site, lowering latency on SVG-heavy components.',
  },
]

const TABS = ['ALL', 'WORK', 'COMMUNITY']

export default function Roles() {
  const [tab, setTab] = useState('ALL')
  const filtered = ROLES.filter((r) => (tab === 'ALL' ? true : r.type === tab.toLowerCase()))

  return (
    <Section id="roles" code="SECTION 02 // EXPERIENCE" title="Deployment log" intro="WHERE I HAVE SHIPPED">
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-mono transition-colors border ${
              tab === t
                ? 'text-cyan border-cyan/40 bg-cyan/5'
                : 'text-dim border-border hover:text-ink'
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
              className="panel panel-glow p-5"
            >
              <div className="flex items-start gap-4">
                <span
                  className="font-mono shrink-0 mt-0.5"
                  style={{ fontSize: '11px', color: r.accent, letterSpacing: '0.05em' }}
                >
                  {String(i + 1).padStart(2, '0')}
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
                            color: r.accent, border: `1px solid ${r.accent}55`,
                            background: `${r.accent}0f`,
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
                  </div>
                  <p className="mt-2.5 text-dim" style={{ fontSize: '13px', lineHeight: 1.75 }}>
                    {r.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Section>
  )
}
