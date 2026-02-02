// About Section - Compact, clean design

import { motion } from 'framer-motion'

function About() {
  return (
    <section id="about" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <p className="text-[#6366f1] text-xs font-semibold tracking-widest uppercase mb-3">
            About
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Building & Teaching
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-4 text-[#8888a0] text-sm md:text-base leading-relaxed">
            <p>
              I'm a software engineer and CS student at UT Dallas passionate
              about creating impactful products and helping others grow.
            </p>

            <p>
              I believe the best way to learn is to teach—that's why I spend time
              mentoring at hackathons, coaching peers through technical interviews,
              and pair programming on projects.
            </p>

            <p className="text-[#d4d4dc]">
              Currently focused on AI/ML, full-stack development, and building
              tools that make developers' lives easier.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
