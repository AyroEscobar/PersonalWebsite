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
    'Calendar / email / finance / health integrations',
    'Daily executive briefings + ambient reminders',
    'Custom Claude-based agent orchestration',
  ],
  tech: ['Claude', 'Python', 'multi-agent', 'macOS', 'cron', 'IMAP / OAuth'],
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
        <h2 className="text-[#2d2520] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">03.</span>
          Projects
          <span className="rule" />
        </h2>

        {/* Featured: OpenClaw */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mb-14 rounded-xl overflow-hidden"
          style={{
            background:
              'linear-gradient(145deg, rgba(237,229,212,0.95), rgba(221,208,184,0.88))',
            border: '1px solid rgba(139,77,44,0.22)',
            boxShadow:
              '0 0 0 1px rgba(139,77,44,0.04), 0 18px 44px rgba(74,53,38,0.10)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, #8b4d2c 30%, #8b4d2c 70%, transparent)',
              opacity: 0.6,
            }}
          />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 p-8 md:p-10">
            <div>
              <p className="mono text-[11px] tracking-widest text-[#8b4d2c] mb-3 uppercase">
                Featured · {FEATURED.status}
              </p>
              <div className="flex items-baseline gap-4 mb-4 flex-wrap">
                <h3
                  className="text-[#2d2520]"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 'clamp(32px, 4.4vw, 44px)',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {FEATURED.name}
                </h3>
                <span className="mono text-[12px] text-[#6b5847]">
                  / {FEATURED.tagline}
                </span>
              </div>
              <p className="text-[#6b5847] leading-relaxed mb-6">{FEATURED.body}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {FEATURED.tech.map(t => (
                  <span key={t} className="mono text-[11px] text-[#57483b]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-3 md:border-l md:border-[rgba(139,77,44,0.1)] md:pl-8">
              {FEATURED.bullets.map(b => (
                <li
                  key={b}
                  className="text-[#57483b] text-sm leading-relaxed flex gap-3"
                >
                  <span className="text-[#8b4d2c] mt-1 flex-shrink-0">▹</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.article>

        {hasGrid && (
          <>
            <p className="mono text-[12px] tracking-widest text-[#6b5847] mb-6 uppercase">
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
                    boxShadow: '0 0 32px rgba(139,77,44,0.10), 0 14px 32px rgba(74,53,38,0.10)',
                  } : {}}
                >
                  <div className="flex items-center justify-between mb-6">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M6 13C6 11.3 7.3 10 9 10h7.5l2 3H31c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3V13z"
                        stroke="#8b4d2c" strokeWidth="1.5" fill="none"/>
                    </svg>
                    <div className="flex items-center gap-3">
                      {p.github && (
                        <a href={p.github} target="_blank" rel="noopener noreferrer"
                          className="text-[#6b5847] hover:text-[#8b4d2c] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaGithub size={18} />
                        </a>
                      )}
                      {p.live && (
                        <a href={p.live} target="_blank" rel="noopener noreferrer"
                          className="text-[#6b5847] hover:text-[#8b4d2c] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaExternalLinkAlt size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="text-[#2d2520] font-semibold text-lg mb-2 group-hover:text-[#8b4d2c] transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[#6b5847] text-sm leading-relaxed flex-1 mb-6">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto">
                    {p.tech?.map((t, j) => (
                      <span key={j} className="mono text-[11px] text-[#6b5847]">{t}</span>
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
            View more on GitHub
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
