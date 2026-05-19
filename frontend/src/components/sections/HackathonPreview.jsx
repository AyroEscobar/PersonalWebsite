import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'

const STATS = [
  { n: '10+', label: 'EVENTS COACHED' },
  { n: '7+',  label: 'HACKATHONS RUN' },
  { n: '6',   label: 'CITIES ON MAP' },
  { n: '1.2K', label: 'HACKERS REACHED' },
]

export default function HackathonPreview() {
  return (
    <Section id="hackathons" code="SECTION 05 // FIELD.OPS" title="The circuit" intro="WHERE THE NETWORK CAME FROM">
      <Panel title="FIELD.OPS" accent="amber" meta="MLH · HACKUTD" glow>
        <p className="text-dim mb-6" style={{ fontSize: '13.5px', lineHeight: 1.8 }}>
          <span className="text-amber">▸ </span>
          Hackathons are where the network came from — friends, first projects, first job
          offer. Now I show up as an <span className="text-ink">MLH Coach</span> and on the{' '}
          <span className="text-ink">HackUTD</span> tech team. If you're shipping at 4 a.m.,
          I'm probably awake too.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border border-border rounded-sm p-4 bg-panel-hi"
            >
              <div className="display text-ink" style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1 }}>
                {s.n}
              </div>
              <div className="eyebrow mt-1.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <Link to="/hackathons" className="btn-ghost">
          ▸ Open Interactive Map
        </Link>
      </Panel>
    </Section>
  )
}
