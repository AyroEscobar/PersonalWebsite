import { motion } from 'framer-motion'

const NOTES = [
  {
    n: '01',
    title: 'Reading',
    body:
      'Naval\'s Almanack on loop. Working through The Hard Thing About Hard Things, ' +
      'Shoe Dog, and Steve Jobs. The pattern is always: people who did the work, slow.',
  },
  {
    n: '02',
    title: 'Listening',
    body:
      'Lo-fi loops when I\'m heads-down. Mid-century jazz when I\'m thinking. The ' +
      'occasional Bossa Nova for Sunday afternoons in Plano.',
  },
  {
    n: '03',
    title: 'Building',
    body:
      'Mostly OpenClaw — extending its agent surface, wiring up new integrations. ' +
      'On weekends, Aviation with co-founders. Side note: I get most of my best ' +
      'ideas in the gym.',
  },
  {
    n: '04',
    title: 'Watching',
    body:
      'Late-night noir keeps me company. Recently: Nightcrawler, Drive, anything ' +
      'with the Coen brothers\' fingerprints on it.',
  },
]

const italicSerif = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

export default function FieldNotes() {
  return (
    <section id="field-notes" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-h mb-3 flex items-center">
          <span className="num">V.</span>
          Field Notes
          <span className="rule" />
        </h2>
        <p
          className="text-[#6b5645] mb-12 max-w-xl"
          style={{ ...italicSerif, fontSize: '17px' }}
        >
          Things outside the work that keep me grounded. Updated as I remember to.
        </p>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {NOTES.map((n, i) => (
            <motion.article
              key={n.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: (i % 2) * 0.08 }}
              className="group"
            >
              <p
                className="smallcaps mb-2"
                style={{ letterSpacing: '0.22em', fontSize: '12px' }}
              >
                field note <span style={{ color: '#9e451d', marginLeft: 4 }}>{n.n}</span>
              </p>
              <h3
                className="text-[#2a1f15] mb-3 transition-colors group-hover:text-[#9e451d]"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: '24px',
                  letterSpacing: '-0.005em',
                  lineHeight: 1.1,
                }}
              >
                {n.title}
              </h3>
              <p
                className="text-[#4f3d2e] leading-relaxed"
                style={{ fontSize: '16px' }}
              >
                {n.body}
              </p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
