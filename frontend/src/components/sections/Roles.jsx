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

const tabStyle = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '17px',
}

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
        <h2
          className="text-[#2a1f15] mb-10 flex items-center"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '32px' }}
        >
          <span className="num">II.</span>
          Experience
          <span className="rule" />
        </h2>

        {/* Filter tabs — italic serif */}
        <div className="flex gap-1 mb-8 border-b border-[rgba(158,69,29,0.18)]">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tabStyle}
              className={`px-5 py-2.5 border-b-2 -mb-px transition-all ${
                tab === t
                  ? 'text-[#9e451d] border-[#9e451d]'
                  : 'text-[#6b5645] border-transparent hover:text-[#9e451d]'
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
                className="py-6 border-b border-[rgba(158,69,29,0.12)] last:border-0 group -mx-4 px-4 rounded transition-colors cursor-default hover:bg-[rgba(158,69,29,0.04)]"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-[#2a1f15] font-semibold" style={{ fontSize: '18px' }}>
                      {r.title}
                    </span>
                    <span
                      className="text-[#9e451d]"
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontStyle: 'italic',
                        fontSize: '17px',
                      }}
                    >
                      at
                    </span>
                    <span
                      className="text-[#9e451d] font-semibold"
                      style={{ fontSize: '18px' }}
                    >
                      {r.org}
                    </span>
                    {r.badge && (
                      <span
                        className="px-2.5 py-0.5 rounded-sm"
                        style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontStyle: 'italic',
                          fontSize: '12px',
                          color: '#9e451d',
                          background: 'rgba(158,69,29,0.08)',
                          border: '1px solid rgba(158,69,29,0.30)',
                        }}
                      >
                        {r.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[#6b5645] whitespace-nowrap"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: '15px',
                    }}
                  >
                    {r.period}
                  </span>
                </div>
                <p className="text-[#4f3d2e] leading-relaxed" style={{ fontSize: '16.5px' }}>
                  {r.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
