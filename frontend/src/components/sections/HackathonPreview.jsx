// Hackathon Preview Section - Premium teaser for the map

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaMapMarkedAlt, FaTrophy, FaUsers, FaMicrophone } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'

function HackathonPreview() {
  const stats = [
    { label: "Hackathons", value: "7+", icon: FaTrophy },
    { label: "Cities", value: "6", icon: FaMapMarkedAlt },
    { label: "Organized", value: "3", icon: FaUsers },
    { label: "Coached", value: "10+", icon: FaMicrophone },
  ]

  return (
    <section id="hackathons" className="py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 glass" />

          {/* Animated orbs */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              {/* Left - Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-4"
                >
                  My Hackathon <span className="gradient-text">Journey</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-white/60 text-base md:text-lg mb-8 max-w-lg mx-auto lg:mx-0"
                >
                  From competing to coaching to organizing—explore the interactive map to see my hackathon journey across North America.
                </motion.p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <stat.icon className="text-sky-400 text-xl mx-auto mb-2" />
                      <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-white/40 text-xs">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/hackathons">
                    <motion.span
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition-colors"
                    >
                      <FaMapMarkedAlt />
                      Explore the Map
                      <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </motion.span>
                  </Link>
                </motion.div>
              </div>

              {/* Right - Map preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-shrink-0 w-full lg:w-80 h-56 rounded-2xl overflow-hidden relative bg-[#0B0B42]/50 border border-white/10"
              >
                {/* Animated map dots */}
                <div className="absolute inset-0 p-6">
                  {[
                    { x: 20, y: 30 },
                    { x: 45, y: 45 },
                    { x: 70, y: 25 },
                    { x: 30, y: 65 },
                    { x: 60, y: 55 },
                    { x: 80, y: 70 },
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-sky-400 rounded-full"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkedAlt className="text-4xl text-white/10 mx-auto mb-2" />
                    <span className="text-white/20 text-xs">Interactive Map</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HackathonPreview
