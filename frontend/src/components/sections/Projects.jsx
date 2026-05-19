import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'
import { PROJECTS } from '../../data/projects'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'
import Tag from '../ui/Tag'

const FEATURED = {
  name: 'OpenClaw',
  tagline: 'Personal AI operating system',
  body:
    'A 24/7 multi-agent AI OS running on a Mac Mini M4 Pro — calendar, email, health, ' +
    'finance, morning briefings, reminders. Built on Claude with a custom multi-agent ' +
    'architecture. It runs my life so I can focus on the work that moves things.',
  bullets: [
    'Always-on multi-agent runtime, 20+ scheduled services',
    'Calendar · email · finance · health integrations',
    'Daily executive briefings + ambient reminders',
    'Custom Claude-based agent orchestration',
  ],
  tech: ['Claude', 'Python', 'Multi-agent', 'macOS', 'Postgres', 'OAuth'],
}

const STATUS_COLOR = {
  LIVE: '#6ee7a3', SHIPPED: '#6ee7a3', ONGOING: '#6dd5ff',
  'IN-DEV': '#ffb86b', HACKATHON: '#d99cff', TOOL: '#6dd5ff', ARCHIVED: '#6b7689',
}

export default function Projects() {
  const { data: liveProjects } = useProjects()

  const grid = (() => {
    const base = [...PROJECTS]
    if (liveProjects?.length) {
      for (const lp of liveProjects) {
        const key = (lp.id || lp.title || '').toString().toLowerCase()
        if (!base.find((p) => (p.id || p.title || '').toString().toLowerCase() === key)) {
          base.push(lp)
        }
      }
    }
    return base
  })()

  return (
    <Section id="projects" code="SECTION 04 // BUILD.LOG" title="Build log" intro="THINGS I HAVE SHIPPED">
      {/* Featured — OpenClaw */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Panel title="FEATURED // OPENCLAW" accent="cyan" meta="ALWAYS-ON" glow scan>
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap mb-3">
                <h3 className="display text-ink" style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1 }}>
                  OpenClaw
                </h3>
                <span className="text-cyan" style={{ fontSize: '13px' }}>/ {FEATURED.tagline}</span>
              </div>
              <p className="text-dim mb-5" style={{ fontSize: '13.5px', lineHeight: 1.8 }}>
                {FEATURED.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {FEATURED.tech.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>
            <ul className="space-y-2.5 md:border-l border-border md:pl-6">
              {FEATURED.bullets.map((b) => (
                <li key={b} className="flex gap-2.5 text-dim" style={{ fontSize: '12.5px', lineHeight: 1.6 }}>
                  <span className="text-cyan shrink-0">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </motion.div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {grid.map((p, i) => {
          const col = STATUS_COLOR[p.status] || '#6b7689'
          return (
            <motion.div
              key={p.id || p.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: (i % 6) * 0.06 }}
              className="panel panel-glow flex flex-col"
            >
              <div className="flex items-center gap-2.5 px-4 h-9 border-b border-border">
                <span className="text-muted text-xs">[</span>
                <span className="font-mono text-ink" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' }}>
                  {(p.title || '').toUpperCase()}
                </span>
                <span className="flex-1 h-px bg-line" />
                {p.status && (
                  <span
                    className="font-mono px-1.5 py-0.5 rounded-sm"
                    style={{ fontSize: '9px', letterSpacing: '0.1em', color: col, border: `1px solid ${col}55`, background: `${col}0f` }}
                  >
                    {p.status}
                  </span>
                )}
                <span className="text-muted text-xs">]</span>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="eyebrow">{p.year} · {p.category}</span>
                    {p.tagline && (
                      <p className="text-cyan mt-1" style={{ fontSize: '13px' }}>{p.tagline}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-1 shrink-0">
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer"
                         aria-label={`${p.title} on GitHub`} className="text-dim hover:text-cyan transition-colors">
                        <FaGithub size={15} />
                      </a>
                    )}
                    {p.live && (
                      <a href={p.live} target="_blank" rel="noopener noreferrer"
                         aria-label={`${p.title} live`} className="text-dim hover:text-cyan transition-colors">
                        <FaExternalLinkAlt size={11} />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-dim flex-1 mb-4" style={{ fontSize: '12.5px', lineHeight: 1.75 }}>
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {(p.tech || []).map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <a href="https://github.com/AyroEscobar" target="_blank" rel="noopener noreferrer" className="btn-term">
          ▸ Full Repository Index
        </a>
      </div>
    </Section>
  )
}
