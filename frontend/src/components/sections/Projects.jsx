import { motion } from 'framer-motion'
import { useProjects } from '../../hooks/useFirestore'
import { PROJECTS } from '../../data/projects'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'

const FEATURED = {
  name: '24/7 Multi-Agent System',
  tagline: 'the system that runs my life',
  body:
    'A 24/7 multi-agent system I built and run on a Mac Mini M4 Pro. It watches my ' +
    'finances, tracks my health, curates the news I read, files my notes, and writes the ' +
    'briefing I wake up to. Every agent is one I wrote and scheduled myself, built on ' +
    'Claude, so I can spend my attention on the work that moves things.',
  bullets: [
    'Always on, 20+ scheduled agents and services',
    'Autonomous finance tracking, from bank email to dashboard',
    'Health, news, and research agents reporting in daily',
    'A briefing on my phone before 8am, every morning',
  ],
  tech: ['Claude', 'OpenClaw', 'Python', 'PostgreSQL', 'LaunchAgents'],
}

const STATUS_COLOR = {
  LIVE: '#6ee7a3', SHIPPED: '#6ee7a3', BUILDING: '#ffb86b',
  HACKATHON: '#d99cff', TOOL: '#6dd5ff', ARCHIVED: '#6b7689',
}

// Tech shown as a clean inline readout, no chips.
function TechLine({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono" style={{ fontSize: '11.5px' }}>
      {items.map((t, i) => (
        <span key={t} className="flex items-center gap-x-2.5">
          <span style={{ color: '#8b97a8' }}>{t}</span>
          {i < items.length - 1 && <span className="text-muted">·</span>}
        </span>
      ))}
    </div>
  )
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
    <Section id="projects" code="SECTION 04 // BUILD.LOG" title="Build log" intro="SELECTED WORK">
      {/* Featured */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Panel title="FEATURED // THE SYSTEM" accent="cyan" meta="ALWAYS ON" glow scan>
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap mb-3">
                <h3 className="display text-ink" style={{ fontSize: 'clamp(24px,3.4vw,34px)', lineHeight: 1.05 }}>
                  {FEATURED.name}
                </h3>
                <span className="text-cyan" style={{ fontSize: '13px' }}>/ {FEATURED.tagline}</span>
              </div>
              <p className="text-dim mb-5" style={{ fontSize: '13.5px', lineHeight: 1.8 }}>
                {FEATURED.body}
              </p>
              <TechLine items={FEATURED.tech} />
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
          const link = p.live || p.github
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
                <span className="eyebrow">{p.year} · {p.category}</span>
                {p.tagline && (
                  <p className="text-cyan mt-1.5" style={{ fontSize: '13px' }}>{p.tagline}</p>
                )}
                <p className="text-dim flex-1 mt-3 mb-4" style={{ fontSize: '12.5px', lineHeight: 1.75 }}>
                  {p.description}
                </p>
                <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-line">
                  <TechLine items={p.tech || []} />
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 font-mono text-dim hover:text-cyan transition-colors"
                      style={{ fontSize: '10.5px', letterSpacing: '0.1em' }}
                    >
                      {p.live ? 'VISIT' : 'GITHUB'} <span style={{ fontSize: '11px' }}>↗</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}
