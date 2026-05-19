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

export default function Skills() {
  return (
    <Section id="skills" code="SECTION 03 // STACK" title="Stack matrix" intro="WHAT I BUILD WITH">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Panel title="STACK.MATRIX" accent="cyan" meta="4 LAYERS">
          <div className="divide-y divide-line">
            {STACK.map((g) => (
              <div
                key={g.cat}
                className="grid sm:grid-cols-[156px_1fr] gap-y-2 sm:gap-x-7 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-[3px] h-3.5 rounded-sm" style={{ background: ACCENT[g.accent] }} />
                  <span
                    className="font-mono"
                    style={{ fontSize: '10.5px', letterSpacing: '0.18em', color: ACCENT[g.accent] }}
                  >
                    {g.cat}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {g.items.map((it, idx) => (
                    <span key={it} className="flex items-center gap-x-3">
                      <span className="font-mono" style={{ fontSize: '13px', color: '#aeb9c9' }}>{it}</span>
                      {idx < g.items.length - 1 && <span className="text-muted">·</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
      <p className="mt-5 eyebrow" style={{ opacity: 0.5 }}>
        ▸ AWS Certified Cloud Practitioner · Solutions Architect next
      </p>
    </Section>
  )
}
