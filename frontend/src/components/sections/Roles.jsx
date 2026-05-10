import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const roles = [
  {
    org: 'RBC Capital Markets',
    title: 'Software Engineer Intern',
    period: 'Summer 2025',
    desc: 'Working on engineering teams in New York. Financial technology at scale.',
    type: 'work',
  },
  {
    org: 'JP Morgan Chase',
    title: 'Software Engineer Intern',
    period: 'Summer 2026',
    desc: 'Incoming internship in software engineering.',
    type: 'work',
  },
  {
    org: 'Major League Hacking',
    title: 'MLH Coach',
    period: 'Ongoing',
    desc: 'Mentoring hackers at MLH-sanctioned events. Helped 100+ hackers across 10+ events debug, ideate, and ship projects under 24–48 hour deadlines.',
    type: 'community',
  },
  {
    org: 'GitHub',
    title: 'Campus Expert',
    period: 'Ongoing',
    desc: 'Building the developer community at UTD — workshops, open source advocacy, and connecting students with industry.',
    type: 'community',
  },
  {
    org: 'HackUTD',
    title: 'Organizer',
    period: '2024–2025',
    desc: "Running UTD's flagship 24-hour hackathon — sponsor relations, logistics, and making sure 500+ hackers have the best weekend of the year.",
    type: 'community',
  },
  {
    org: 'ACM UTD — TIP',
    title: 'Officer',
    period: 'Fall 2025',
    desc: 'Technical Interview Prep. Coached a cohort from basic arrays through dynamic programming, trees, and graphs.',
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
        <h2 className="text-[#e6f1ff] text-2xl font-semibold mb-10 flex items-center">
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
                  : 'text-[#8892a4] border-transparent hover:text-[#64ffda] hover:bg-[rgba(100,255,218,0.03)]'
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
                  <div>
                    <span className="text-[#e6f1ff] font-semibold">{r.title}</span>
                    <span className="text-[#64ffda] mx-2 opacity-70">@</span>
                    <span className="text-[#64ffda]">{r.org}</span>
                  </div>
                  <span className="mono text-[12px] text-[#8892a4] whitespace-nowrap pt-0.5">{r.period}</span>
                </div>
                <p className="text-[#8892a4] text-sm leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
