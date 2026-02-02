// About Section - Clean, minimal design

import { motion } from 'framer-motion'
import pfp from '../../assets/pfp.JPG'

function About() {
  return (
    <section id="about" className="py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto lg:mx-0">
              <img
                src={pfp}
                alt="Ayro Escobar"
                className="w-full h-full object-cover object-right rounded-2xl grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            {/* Decorative border */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-[rgba(255,255,255,0.1)] rounded-2xl -z-10 max-w-md mx-auto lg:mx-0" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Section label */}
            <p className="text-[#38bdf8] text-sm font-medium tracking-widest uppercase mb-4">
              About
            </p>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-8 leading-tight">
              Building cool stuff &<br />
              <span className="text-[#666666]">helping others do the same</span>
            </h2>

            <div className="space-y-6 text-[#888888] text-base md:text-lg leading-relaxed">
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

              <p className="text-[#c2c2c2]">
                Currently focused on AI/ML, full-stack development, and building
                tools that make developers' lives easier.
              </p>
            </div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 pt-10 border-t border-[rgba(255,255,255,0.08)]"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
                <span className="text-white font-medium">
                  Incoming SWE @ JP Morgan
                </span>
                <span className="text-[#666666]">
                  — Summer 2026
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
