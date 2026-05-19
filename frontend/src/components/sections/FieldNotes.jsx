import { motion } from 'framer-motion'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'

const NOTES = [
  {
    n: '01', title: 'READING', accent: 'cyan',
    body: "Naval's Almanack on loop. Working through The Hard Thing About Hard Things, Shoe Dog, and Steve Jobs. The pattern is always the same: people who did the work, slow.",
  },
  {
    n: '02', title: 'LISTENING', accent: 'green',
    body: "Lo-fi loops when I'm heads-down. Mid-century jazz when I'm thinking. The occasional Bossa Nova for Sunday afternoons in Plano.",
  },
  {
    n: '03', title: 'BUILDING', accent: 'amber',
    body: "Mostly my agent system, wiring up new integrations and tightening what it can do. Weekends go to the startups. My best ideas still show up in the gym.",
  },
  {
    n: '04', title: 'WATCHING', accent: 'magenta',
    body: "Late-night noir keeps me company. Recently: Nightcrawler, Drive, anything with the Coen brothers' fingerprints on it.",
  },
]

export default function FieldNotes() {
  return (
    <Section id="field-notes" code="SECTION 06 // DISPATCH" title="Field notes" intro="OUTSIDE THE WORK">
      <div className="grid sm:grid-cols-2 gap-5">
        {NOTES.map((note, i) => (
          <motion.div
            key={note.n}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
          >
            <Panel title={note.title} accent={note.accent} meta={`LOG ${note.n}`} glow>
              <p className="text-dim" style={{ fontSize: '13px', lineHeight: 1.8 }}>
                {note.body}
              </p>
            </Panel>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 eyebrow" style={{ opacity: 0.5 }}>▸ updated as I remember to</p>
    </Section>
  )
}
