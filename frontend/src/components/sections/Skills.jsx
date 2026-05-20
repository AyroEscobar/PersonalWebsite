import { motion } from 'framer-motion'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'

const ACCENT = { cyan: '#6dd5ff', magenta: '#d99cff', green: '#6ee7a3', amber: '#ffb86b' }

const STACK = [
  { cat: 'LANGUAGES',    accent: 'cyan',    items: ['Java', 'TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'] },
  { cat: 'AI & AGENTS',  accent: 'magenta', items: ['Prompt Engineering', 'Multi-agent systems', 'Agent orchestration', 'Claude', 'Gemini', 'OpenAI'] },
  { cat: 'FRAMEWORKS',   accent: 'green',   items: ['React', 'Next.js', 'Node.js', 'Spring Boot', 'React Native', 'Tailwind'] },
  { cat: 'CLOUD & DATA', accent: 'amber',   items: ['AWS', 'PostgreSQL', 'Firebase', 'Supabase', 'Kafka', 'GraphQL'] },
]

const CERTS = [
  { name: 'AWS Certified Cloud Practitioner',    status: 'ACTIVE', icon: '✓' },
  { name: 'AWS Solutions Architect Associate',   status: 'NEXT',   icon: '◯' },
]

export default function Skills() {
  return (
    <Section id="skills" code="SECTION 03 // STACK" title="Stack matrix" intro="WHAT I BUILD WITH">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* 2×2 grid of category cards — vertical lists for readability */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {STACK.map((g) => (
            <Panel key={g.cat} title={g.cat} accent={g.accent} meta={`${g.items.length} ITEMS`}>
              <ul className="space-y-1.5 font-mono" style={{ fontSize: '13px' }}>
                {g.items.map((it) => (
                  <li key={it} className="flex items-center gap-2.5">
                    <span
                      className="rounded-full shrink-0"
                      style={{
                        width: 4, height: 4,
                        background: ACCENT[g.accent],
                        boxShadow: `0 0 5px ${ACCENT[g.accent]}`,
                        opacity: 0.85,
                      }}
                    />
                    <span style={{ color: '#aeb9c9' }}>{it}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>

        {/* Certifications — dedicated panel, status-tagged rows */}
        <Panel title="CERTIFICATIONS" accent="amber" meta={`${CERTS.length} TRACKED`}>
          <div className="divide-y divide-line">
            {CERTS.map((c) => {
              const isActive = c.status === 'ACTIVE'
              const col = isActive ? '#6ee7a3' : '#ffb86b'
              return (
                <div key={c.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: '14px',
                      color: col,
                      minWidth: '1.6ch',
                      textAlign: 'center',
                    }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className="text-ink flex-1"
                    style={{ fontSize: '13.5px', letterSpacing: '0.005em' }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="font-mono px-2 py-0.5 rounded-sm shrink-0"
                    style={{
                      fontSize: '9.5px',
                      letterSpacing: '0.16em',
                      color: col,
                      border: `1px solid ${col}55`,
                      background: `${col}0f`,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </motion.div>
    </Section>
  )
}
