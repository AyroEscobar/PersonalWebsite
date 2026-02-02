// About Section - Clean, minimal design

import { motion } from 'framer-motion'

function About() {
  return (
    <section id="about" className="py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase mb-4">
            About
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Building cool stuff &<br />
            <span className="text-[#8888a0]">helping others do the same</span>
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl"
        >
          <div className="space-y-6 text-[#8888a0] text-base md:text-lg leading-relaxed">
            <p>
              I'm a software engineer and CS student at UT Dallas who's passionate
              about creating impactful products and fostering community growth.
            </p>

            <p>
              I believe the best way to learn is to teach—that's why I spend time
              mentoring at hackathons, helping classmates, and pair programming on
              projects. There's nothing better than that lightbulb moment when
              things finally click.
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
