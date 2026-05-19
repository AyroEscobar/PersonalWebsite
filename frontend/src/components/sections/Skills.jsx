import { motion } from 'framer-motion'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'
import Tag from '../ui/Tag'

const STACK = [
  { cat: 'LANGUAGES',    accent: 'cyan',    items: ['Java', 'TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'] },
  { cat: 'AI & AGENTS',  accent: 'magenta', items: ['Prompt Engineering', 'Multi-agent systems', 'Agent orchestration', 'Claude API', 'Gemini API', 'OpenAI API'] },
  { cat: 'FRAMEWORKS',   accent: 'green',   items: ['React', 'Next.js', 'Node.js', 'Spring Boot', 'React Native', 'Tailwind'] },
  { cat: 'CLOUD & DATA', accent: 'amber',   items: ['AWS', 'PostgreSQL', 'Firebase', 'Supabase', 'MongoDB', 'Kafka', 'GraphQL'] },
]

export default function Skills() {
  return (
    <Section id="skills" code="SECTION 03 // STACK" title="Stack matrix" intro="WHAT I BUILD WITH">
      <div className="grid sm:grid-cols-2 gap-6">
        {STACK.map((g, i) => (
          <motion.div
            key={g.cat}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <Panel title={g.cat} accent={g.accent} glow meta={`${g.items.length} MODULES`}>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <Tag key={it}>{it}</Tag>
                ))}
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 eyebrow" style={{ opacity: 0.5 }}>
        ▸ AWS Certified Cloud Practitioner · Solutions Architect next
      </p>
    </Section>
  )
}
