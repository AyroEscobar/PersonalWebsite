import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const stats = [
  { n: '7+',  label: 'Hackathons\nattended' },
  { n: '6',   label: 'Cities\nvisited'     },
  { n: '3',   label: 'Events\norganized'   },
  { n: '10+', label: 'Events\ncoached'     },
]

export default function HackathonPreview() {
  return (
    <section id="hackathons" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[#e6f1ff] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">04.</span>
          Hackathons
          <span className="rule" />
        </h2>

        <p className="text-[#8892a4] leading-relaxed mb-12 max-w-xl">
          Hackathons changed my life — first real projects, best friends, and my first job offer.
          Now I spend a lot of time making that happen for others, whether coaching, organizing,
          or just showing up to help teams across the finish line.
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
                className="font-bold mb-1"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(40px, 5vw, 56px)',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #e6f1ff, #64ffda)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {s.n}
              </p>
              <p className="mono text-[12px] text-[#8892a4] whitespace-pre-line leading-relaxed">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Link
          to="/hackathons"
          className="mono text-sm text-[#64ffda] flex items-center gap-2 group w-fit hover:opacity-80 transition-opacity"
        >
          Explore the interactive map
          <span className="group-hover:translate-x-1.5 transition-transform">→</span>
        </Link>
      </motion.div>
    </section>
  )
}
