import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'
import { PROJECTS } from '../../data/projects'

const FEATURED = {
  name: 'OpenClaw',
  tagline: 'Personal AI OS',
  body:
    'A 24/7 multi-agent AI OS running on a Mac Mini M4 Pro — calendar, email, ' +
    'health, finance, morning briefings, reminders. Built on Claude with a custom ' +
    'multi-agent architecture. It runs my life so I can focus on the work that moves things.',
  status: 'Always-on',
  bullets: [
    'Always-on multi-agent runtime on Mac Mini M4 Pro',
    'Calendar, email, finance, health integrations',
    'Daily executive briefings and ambient reminders',
    'Custom Claude-based agent orchestration',
  ],
  tech: ['Claude', 'Python', 'multi-agent', 'macOS', 'cron', 'IMAP / OAuth'],
}

const italicSerif = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontStyle: 'italic',
}

const sectionHeader = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontWeight: 700,
  fontSize: '32px',
}

export default function Projects() {
  const { data: liveProjects } = useProjects()
  const [hovered, setHovered] = useState(null)

  // Merge: hardcoded baseline + any Firestore additions (de-duped by id/title)
  const grid = (() => {
    const base = [...PROJECTS]
    if (liveProjects?.length) {
      for (const lp of liveProjects) {
        const key = (lp.id || lp.title || '').toString().toLowerCase()
        if (!base.find(p => (p.id || p.title || '').toString().toLowerCase() === key)) {
          base.push(lp)
        }
      }
    }
    return base
  })()

  return (
    <section id="projects" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-h mb-10 flex items-center">
          <span className="num">III.</span>
          Projects
          <span className="rule" />
        </h2>

        {/* Featured: OpenClaw */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mb-16 rounded-sm overflow-hidden"
          style={{
            background:
              'linear-gradient(145deg, rgba(235,223,197,0.96), rgba(220,207,176,0.85))',
            border: '1px solid rgba(74,53,38,0.16)',
            boxShadow:
              '0 0 0 1px rgba(74,53,38,0.02), 0 16px 36px rgba(74,53,38,0.08)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, #9e451d 30%, #9e451d 70%, transparent)',
              opacity: 0.65,
            }}
          />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 p-8 md:p-10">
            <div>
              <p className="smallcaps mb-3">Featured · {FEATURED.status}</p>
              <div className="flex items-baseline gap-4 mb-4 flex-wrap">
                <h3
                  className="text-[#2a1f15]"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 'clamp(34px, 4.6vw, 46px)',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {FEATURED.name}
                </h3>
                <span
                  className="text-[#6b5645]"
                  style={{ ...italicSerif, fontSize: '17px' }}
                >
                  / {FEATURED.tagline}
                </span>
              </div>
              <p
                className="text-[#4f3d2e] leading-relaxed mb-6"
                style={{ fontSize: '17px' }}
              >
                {FEATURED.body}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {FEATURED.tech.map(t => (
                  <span
                    key={t}
                    className="text-[#6b5645]"
                    style={{ ...italicSerif, fontSize: '14px' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-3 md:border-l md:border-[rgba(158,69,29,0.18)] md:pl-8">
              {FEATURED.bullets.map(b => (
                <li
                  key={b}
                  className="text-[#4f3d2e] leading-relaxed flex gap-3"
                  style={{ fontSize: '16px' }}
                >
                  <span
                    className="text-[#9e451d] flex-shrink-0 mt-0.5"
                    style={italicSerif}
                  >
                    —
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.article>

        <p className="smallcaps mb-6" style={{ color: '#6b5645' }}>
          The Shelf — more things I've built
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {grid.map((p, i) => (
            <motion.article
              key={p.id || p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: (i % 6) * 0.07 }}
              onMouseEnter={() => setHovered(p.id || p.title)}
              onMouseLeave={() => setHovered(null)}
              className="glass-card flex flex-col p-7 cursor-default relative"
              style={hovered === (p.id || p.title) ? {
                boxShadow: '0 0 28px rgba(158,69,29,0.10), 0 14px 28px rgba(74,53,38,0.10)',
              } : {}}
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[#2a1f15] mb-1"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontWeight: 700,
                      fontSize: '22px',
                      letterSpacing: '-0.005em',
                      lineHeight: 1.1,
                    }}
                  >
                    {p.title}
                  </h3>
                  {p.tagline && (
                    <p
                      className="text-[#6b5645]"
                      style={{ ...italicSerif, fontSize: '15px' }}
                    >
                      {p.tagline}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 pt-1">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
                      onClick={e => e.stopPropagation()}
                      aria-label={`${p.title} on GitHub`}
                    >
                      <FaGithub size={17} />
                    </a>
                  )}
                  {p.live && (
                    <a
                      href={p.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <FaExternalLinkAlt size={13} />
                    </a>
                  )}
                </div>
              </div>

              <p
                className="text-[#4f3d2e] leading-relaxed flex-1 mb-5"
                style={{ fontSize: '15.5px' }}
              >
                {p.description}
              </p>

              <div className="flex items-end justify-between gap-3 mt-auto">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(p.tech || []).map((t, j) => (
                    <span
                      key={j}
                      className="text-[#6b5645]"
                      style={{ ...italicSerif, fontSize: '13.5px' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {(p.category || p.status) && (
                  <span
                    className="text-[#6b5645] whitespace-nowrap"
                    style={{ ...italicSerif, fontSize: '13px', letterSpacing: '0.03em', opacity: 0.85 }}
                  >
                    {p.status || p.category}
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 text-center"
        >
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-teal"
          >
            More on GitHub →
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
