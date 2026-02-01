// About Section - Premium design with photo and bio

import { motion } from 'framer-motion'
import pfp from '../../assets/pfp.JPG'

function About() {
  return (
    <section id="about" className="py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-6 md:p-10"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex-shrink-0"
            >
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 to-purple-500/30 rounded-full blur-2xl scale-110" />
              <img
                src={pfp}
                alt="Ayro Escobar"
                className="relative h-48 w-48 md:h-56 md:w-56 rounded-full object-cover object-right border-2 border-white/10"
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  About <span className="gradient-text">Me</span>
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-sky-400 to-purple-400 rounded-full mb-6 mx-auto md:mx-0" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-white/80 text-base md:text-lg leading-relaxed mb-4"
              >
                I'm a software engineer and CS student at UT Dallas who's passionate
                about building cool stuff and helping others do the same.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-white/70 text-base md:text-lg leading-relaxed mb-4"
              >
                I believe the best way to learn is to teach—that's why I spend so much time
                mentoring at hackathons, helping classmates, and pair programming on projects.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-white/60 text-base md:text-lg leading-relaxed mb-6"
              >
                I love that lightbulb moment when things finally click. Always learning, always sharing.
              </motion.p>

              {/* Status badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-sm font-medium"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Incoming SWE @ JP Morgan • Summer 2026
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
