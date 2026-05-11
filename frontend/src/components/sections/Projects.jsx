import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'

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

export default function Projects() {
  const { data: projects, loading, error } = useProjects()
  const [hovered, setHovered] = useState(null)
  const hasGrid = !loading && !error && projects.length > 0

  return (
    <section id="projects" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
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
          className="relative mb-14 rounded-sm overflow-hidden"
          style={{
            background:
              'linear-gradient(145deg, rgba(235,223,197,0.96), rgba(220,207,176,0.88))',
            border: '1px solid rgba(158,69,29,0.28)',
            boxShadow:
              '0 0 0 1px rgba(158,69,29,0.04), 0 18px 44px rgba(74,53,38,0.10)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, #9e451d 30%, #9e451d 70%, transparent)',
              opacity: 0.7,
            }}
          />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 p-8 md:p-10">
            <div>
              <p className="smallcaps mb-3">
                Featured · {FEATURED.status}
              </p>
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

            <ul className="space-y-3 md:border-l md:border-[rgba(158,69,29,0.20)] md:pl-8">
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

        {hasGrid && (
          <>
            <p className="smallcaps mb-6" style={{ color: '#6b5645' }}>
              More things I've built
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="glass-card flex flex-col p-6 cursor-default"
                  style={hovered === p.id ? {
                    boxShadow: '0 0 32px rgba(158,69,29,0.10), 0 14px 32px rgba(74,53,38,0.10)',
                  } : {}}
                >
                  <div className="flex items-center justify-between mb-6">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M6 13C6 11.3 7.3 10 9 10h7.5l2 3H31c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3V13z"
                        stroke="#9e451d" strokeWidth="1.5" fill="none"/>
                    </svg>
                    <div className="flex items-center gap-3">
                      {p.github && (
                        <a href={p.github} target="_blank" rel="noopener noreferrer"
                          className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaGithub size={18} />
                        </a>
                      )}
                      {p.live && (
                        <a href={p.live} target="_blank" rel="noopener noreferrer"
                          className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaExternalLinkAlt size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3
                    className="text-[#2a1f15] mb-2"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontWeight: 600,
                      fontSize: '21px',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="text-[#4f3d2e] leading-relaxed flex-1 mb-6"
                    style={{ fontSize: '15.5px' }}
                  >
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto">
                    {p.tech?.map((t, j) => (
                      <span
                        key={j}
                        className="text-[#6b5645]"
                        style={{ ...italicSerif, fontSize: '14px' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-teal"
          >
            View more on GitHub →
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
