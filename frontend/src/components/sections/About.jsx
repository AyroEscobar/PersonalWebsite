import { motion } from 'framer-motion'
import pfp from '../../assets/pfp123.jpg'

export default function About() {
  const skills = ['Java & Python', 'TypeScript', 'React & Tailwind', 'Node.js', 'PostgreSQL / Firebase', 'Docker & AWS']

  return (
    <section id="about" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[#e6f1ff] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">01.</span>
          About Me
          <span className="rule" />
        </h2>

        <div className="grid md:grid-cols-[3fr_2fr] gap-14">
          <div className="space-y-4 text-[#8892a4] leading-relaxed">
            <p>
              I'm a software engineer and CS student at UT Dallas who loves building
              impactful products and helping others do the same. My path into tech
              started at hackathons — and I've been hooked ever since.
            </p>
            <p>
              I believe the best way to learn is to teach. That's why I spend time
              mentoring at hackathons, coaching peers through technical interviews, and
              organizing events that give students the same chance I got.
            </p>
            <p>
              Outside of code, I'm usually at a hackathon (attending, coaching, or running
              one), deep in an AI/ML rabbit hole, or trying to become a better technical
              communicator.
            </p>

            <div className="pt-3">
              <p className="text-[#8892a4] text-sm mb-4">A few things I work with:</p>
              <ul className="grid grid-cols-2 gap-2">
                {skills.map(s => (
                  <li key={s} className="mono text-[12px] text-[#a8b2d8] flex items-center gap-2">
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
