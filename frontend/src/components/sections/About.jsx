import { motion } from 'framer-motion'
import pfp from '../../assets/pfp-web.jpg'

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
        <h2
          className="text-[#2a1f15] mb-10 flex items-center"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '32px' }}
        >
          <span className="num">I.</span>
          About
          <span className="rule" />
        </h2>

        <div className="grid md:grid-cols-[3fr_2fr] gap-14">
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

            <div className="pt-4">
              <p
                className="smallcaps mb-4"
                style={{ color: '#6b5645', letterSpacing: '0.22em' }}
              >
                What I build with
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                {stack.map(s => (
                  <li
                    key={s}
                    className="text-[#4f3d2e] flex items-baseline gap-3"
                    style={{ fontSize: '16px' }}
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

          {/* Profile photograph — tacked-up sepia print */}
          <div className="flex justify-center md:justify-start mt-4">
            <div
              className="relative w-60 h-60 flex-shrink-0 group"
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              <div
                className="absolute inset-0 rounded-sm translate-x-4 translate-y-4 transition-transform duration-300 group-hover:translate-x-3 group-hover:translate-y-3"
                style={{ border: '1.5px solid #9e451d', opacity: 0.55 }}
              />
              <div
                className="absolute inset-0 z-20 rounded-sm transition-opacity duration-300 group-hover:opacity-0"
                style={{ background: 'rgba(158,69,29,0.12)', mixBlendMode: 'multiply' }}
              />
              <img
                src={pfp}
                alt="Ayro Escobar"
                loading="lazy"
                decoding="async"
                className="relative z-10 w-full h-full object-cover rounded-sm"
                style={{
                  filter: 'sepia(22%) saturate(1.05) contrast(1.02)',
                  boxShadow: '0 12px 24px rgba(74,53,38,0.18)',
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
