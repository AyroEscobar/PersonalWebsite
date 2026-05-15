import { motion } from 'framer-motion'

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
        <h2 className="section-h mb-10 flex items-center">
          <span className="num">I.</span>
          About
          <span className="rule" />
        </h2>

        <div className="grid md:grid-cols-[2fr_1fr] gap-12 md:gap-16">
          <div className="space-y-5 text-[#4f3d2e] leading-relaxed" style={{ fontSize: '18px' }}>
            <p className="dropcap">
              I'm a twenty-year-old software engineer out of{' '}
              <span className="text-[#2a1f15] font-semibold">Plano, Texas</span> — Computer
              Science at <span className="text-[#2a1f15] font-semibold">UT Dallas</span>,
              graduating Fall 2027. The extended timeline isn't a slow walk; it's
              back-to-back internships that I refused to skip.
            </p>
            <p>
              I want to be financially free, take care of my family, and ship things that
              matter — before twenty-five. That sentence is the whole map. Every role I take,
              every hour I spend, gets weighed against it.
            </p>
            <p>
              I went <span className="text-[#2a1f15] font-semibold">RBC New York</span> →{' '}
              <span className="text-[#2a1f15] font-semibold">MD7</span> →{' '}
              <span className="text-[#2a1f15] font-semibold">JP Morgan</span> before turning
              twenty-one. In between, I built{' '}
              <span className="text-[#2a1f15] font-semibold">OpenClaw</span> — a 24/7 personal
              AI OS that runs my life so I can focus on the work that actually moves things.
            </p>

            {/* Dated reflection — sahas-style quote with month */}
            <blockquote
              className="mt-8 border-l-2 pl-5 py-1"
              style={{ borderColor: 'rgba(158,69,29,0.4)' }}
            >
              <p
                className="text-[#2a1f15]"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontStyle: 'italic',
                  fontSize: '20px',
                  lineHeight: 1.5,
                }}
              >
                “The cost of doing the work is doing the work. There is no shortcut.”
              </p>
              <footer
                className="mt-2 text-[#6b5645]"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontStyle: 'italic',
                  fontSize: '13px',
                  letterSpacing: '0.05em',
                }}
              >
                — a note to myself, May 2026
              </footer>
            </blockquote>
          </div>

          {/* Side column — stack list */}
          <div>
            <p className="smallcaps mb-4">What I build with</p>
            <ul className="space-y-2">
              {stack.map(s => (
                <li
                  key={s}
                  className="text-[#4f3d2e] flex items-baseline gap-3"
                  style={{ fontSize: '15.5px' }}
                >
                  <span
                    className="text-[#9e451d] flex-shrink-0"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic' }}
                  >
                    —
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
