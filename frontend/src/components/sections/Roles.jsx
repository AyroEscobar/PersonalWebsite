import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const roles = [
  {
    org: 'JP Morgan Chase',
    title: 'Software Engineer Intern · Digital Platform Services',
    period: 'Jun – Aug 2026',
    desc: 'Incoming. Working in Java, Spring Boot, Kafka, and GraphQL on platform services that power JPMC\'s digital surface.',
    type: 'work',
    badge: 'Incoming',
  },
  {
    org: 'MD7',
    title: 'Software Engineer (Contract)',
    period: '2025 – Present',
    desc: 'Building a Power BI competitor — clean executive dashboards focused on summaries and exec-level perspective. Shipping with the CTO; real ownership over architecture and ship cadence.',
    type: 'work',
    badge: 'Current',
  },
  {
    org: 'RBC — Royal Bank of Canada',
    title: 'Software Engineer Intern',
    period: 'New York City',
    desc: 'Shipped on engineering teams in midtown. Strong enough finish that a return offer (Jan–April) or a London posting is on the table.',
    type: 'work',
  },
  {
    org: 'Major League Hacking',
    title: 'MLH Coach',
    period: 'Ongoing',
    desc: 'Working directly with Jon Gottfried (MLH co-founder). Mentoring hackers, supporting marketing + outreach, and building automation — including a CSV → Google Sheet pipeline now used by the team.',
    type: 'community',
  },
  {
    org: 'HackUTD',
    title: 'Tech Team',
    period: 'Ongoing',
    desc: 'Tech crew for one of the largest collegiate hackathons in the country. 1,000+ hackers, a single weekend, very little sleep.',
    type: 'community',
  },
]

const TABS = ['All', 'Work', 'Community']

export default function Roles() {
  const [tab, setTab] = useState('All')

  const filtered = roles.filter(r =>
    tab === 'All' ? true : r.type === tab.toLowerCase()
  )

  return (
    <section id="roles" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[#ecf2fb] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">02.</span>
          Experience
          <span className="rule" />
        </h2>

        {/* Filter tabs */}
        <div className="flex gap-0 mb-8 border-b border-[rgba(100,255,218,0.1)]">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mono text-[13px] px-5 py-2.5 border-b-2 -mb-px transition-all ${
                tab === t
                  ? 'text-[#64ffda] border-[#64ffda]'
                  : 'text-[#8a93a3] border-transparent hover:text-[#64ffda] hover:bg-[rgba(100,255,218,0.03)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Role rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-0"
          >
            {filtered.map((r, i) => (
              <motion.div
                key={r.org + r.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="py-6 border-b border-[rgba(100,255,218,0.07)] last:border-0 group -mx-4 px-4 rounded-lg hover:bg-[rgba(100,255,218,0.025)] transition-colors cursor-default"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#ecf2fb] font-semibold">{r.title}</span>
                    <span className="text-[#64ffda] opacity-70">@</span>
                    <span className="text-[#64ffda]">{r.org}</span>
                    {r.badge && (
                      <span
                        className="mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded"
                        style={{
                          color: '#64ffda',
                          background: 'rgba(100,255,218,0.08)',
                          border: '1px solid rgba(100,255,218,0.25)',
                        }}
                      >
                        {r.badge}
                      </span>
                    )}
                  </div>
                  <span className="mono text-[12px] text-[#8a93a3] whitespace-nowrap pt-0.5">{r.period}</span>
                </div>
                <p className="text-[#8a93a3] text-sm leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
