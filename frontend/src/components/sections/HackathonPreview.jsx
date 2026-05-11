import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const stats = [
  { n: '10+', label: 'events\ncoached'    },
  { n: '7+',  label: 'hackathons\nattended' },
  { n: '6',   label: 'cities\nvisited'     },
  { n: '24h', label: 'average\nsleep cycle' },
]

const serifItalic = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

export default function HackathonPreview() {
  return (
    <section id="hackathons" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className="text-[#2a1f15] mb-10 flex items-center"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '32px' }}
        >
          <span className="num">IV.</span>
          The Circuit
          <span className="rule" />
        </h2>

        <p
          className="text-[#4f3d2e] leading-relaxed mb-12 max-w-xl"
          style={{ fontSize: '18px' }}
        >
          Hackathons are where the network came from — friends, first projects, first job
          offer. Now I show up as an <span className="text-[#2a1f15] font-semibold">MLH
          Coach</span> and on the <span className="text-[#2a1f15] font-semibold">HackUTD</span>{' '}
          tech team. If you're shipping at 4 a.m., I'm probably awake too.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p
                className="text-[#9e451d] mb-1"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(44px, 5.2vw, 60px)',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.n}
              </p>
              <p
                className="text-[#6b5645] whitespace-pre-line leading-snug"
                style={{ ...serifItalic, fontSize: '15px' }}
              >
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        <Link
          to="/hackathons"
          className="inline-flex items-center gap-2 text-[#9e451d] hover:text-[#7a3416] transition-colors group"
          style={{ ...serifItalic, fontSize: '17px' }}
        >
          Explore the interactive map
          <span className="group-hover:translate-x-1.5 transition-transform">→</span>
        </Link>
      </motion.div>
    </section>
  )
}
