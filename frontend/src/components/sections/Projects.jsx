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
        <h2 className="text-[#ecf2fb] text-2xl font-semibold mb-10 flex items-center">
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
              'linear-gradient(145deg, rgba(22,28,39,0.95), rgba(17,22,31,0.95))',
            border: '1px solid rgba(100,255,218,0.18)',
            boxShadow:
              '0 0 0 1px rgba(100,255,218,0.02), 0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, #64ffda 30%, #64ffda 70%, transparent)',
              opacity: 0.6,
            }}
          />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 p-8 md:p-10">
            <div>
              <p className="mono text-[11px] tracking-widest text-[#64ffda] mb-3 uppercase">
                Featured · {FEATURED.status}
              </p>
              <div className="flex items-baseline gap-4 mb-4 flex-wrap">
                <h3
                  className="text-[#ecf2fb]"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 'clamp(32px, 4.4vw, 44px)',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {FEATURED.name}
                </h3>
                <span className="mono text-[12px] text-[#8a93a3]">
                  / {FEATURED.tagline}
                </span>
              </div>
              <p className="text-[#8a93a3] leading-relaxed mb-6">{FEATURED.body}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {FEATURED.tech.map(t => (
                  <span key={t} className="mono text-[11px] text-[#b0b8c7]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-3 md:border-l md:border-[rgba(100,255,218,0.1)] md:pl-8">
              {FEATURED.bullets.map(b => (
                <li
                  key={b}
                  className="text-[#b0b8c7] text-sm leading-relaxed flex gap-3"
                >
                  <span className="text-[#64ffda] mt-1 flex-shrink-0">▹</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.article>

        {hasGrid && (
          <>
            <p className="mono text-[12px] tracking-widest text-[#8a93a3] mb-6 uppercase">
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
                    boxShadow: '0 0 40px rgba(100,255,218,0.09), 0 16px 48px rgba(0,0,0,0.5)',
                  } : {}}
                >
                  <div className="flex items-center justify-between mb-6">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M6 13C6 11.3 7.3 10 9 10h7.5l2 3H31c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3V13z"
                        stroke="#64ffda" strokeWidth="1.5" fill="none"/>
                    </svg>
                    <div className="flex items-center gap-3">
                      {p.github && (
                        <a href={p.github} target="_blank" rel="noopener noreferrer"
                          className="text-[#8a93a3] hover:text-[#64ffda] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaGithub size={18} />
                        </a>
                      )}
                      {p.live && (
                        <a href={p.live} target="_blank" rel="noopener noreferrer"
                          className="text-[#8a93a3] hover:text-[#64ffda] transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <FaExternalLinkAlt size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="text-[#ecf2fb] font-semibold text-lg mb-2 group-hover:text-[#64ffda] transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[#8a93a3] text-sm leading-relaxed flex-1 mb-6">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto">
                    {p.tech?.map((t, j) => (
                      <span key={j} className="mono text-[11px] text-[#8a93a3]">{t}</span>
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
