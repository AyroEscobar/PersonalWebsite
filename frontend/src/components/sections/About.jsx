import { motion } from 'framer-motion'
import pfp from '../../assets/pfp123.jpg'

export default function About() {
  const stack = [
    'Java · Spring Boot',
    'Python',
    'JavaScript · React',
    'Kafka · GraphQL',
    'AWS (Cloud Practitioner)',
    'Claude · multi-agent',
  ]

  return (
    <section id="about" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[#ecf2fb] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">01.</span>
          About
          <span className="rule" />
        </h2>

        <div className="grid md:grid-cols-[3fr_2fr] gap-14">
          <div className="space-y-4 text-[#8a93a3] leading-relaxed">
            <p>
              I'm a 20-year-old software engineer out of <span className="text-[#ecf2fb]">Plano,
              Texas</span> — CS at <span className="text-[#ecf2fb]">UT Dallas</span>, graduating
              Fall 2027. The extended timeline isn't a slow walk; it's back-to-back internships
              that I refused to skip.
            </p>
            <p>
              I want to be financially free, take care of my family, and ship things that
              matter — before 25. That sentence is the whole map. Everything I build, every
              role I take, every hour I spend, gets weighed against it.
            </p>
            <p>
              I went <span className="text-[#ecf2fb]">RBC New York</span> →{' '}
              <span className="text-[#ecf2fb]">MD7</span> →{' '}
              <span className="text-[#ecf2fb]">JP Morgan</span> before turning 21. In between,
              I built <span className="text-[#ecf2fb]">OpenClaw</span> — a 24/7 personal AI OS
              that runs my life so I can focus on the work that actually moves things.
            </p>

            <div className="pt-3">
              <p className="text-[#8a93a3] text-sm mb-4">What I build with:</p>
              <ul className="grid grid-cols-2 gap-2">
                {stack.map(s => (
                  <li key={s} className="mono text-[12px] text-[#b0b8c7] flex items-center gap-2">
                    <span className="text-[#64ffda] text-xs">▹</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Profile image with teal offset border */}
          <div className="flex justify-center md:justify-start mt-2">
            <div className="relative w-56 h-56 flex-shrink-0 group">
              {/* Offset teal border */}
              <div
                className="absolute inset-0 rounded translate-x-5 translate-y-5 transition-transform duration-300 group-hover:translate-x-4 group-hover:translate-y-4"
                style={{ border: '2px solid #64ffda', opacity: 0.5 }}
              />
              {/* Teal overlay that fades on hover */}
              <div
                className="absolute inset-0 z-20 rounded transition-opacity duration-300 group-hover:opacity-0"
                style={{ background: 'rgba(100,255,218,0.1)', mixBlendMode: 'multiply' }}
              />
              <img
                src={pfp}
                alt="Ayro Escobar"
                className="relative z-10 w-full h-full object-cover rounded"
                style={{ filter: 'grayscale(20%) contrast(1.05)' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
