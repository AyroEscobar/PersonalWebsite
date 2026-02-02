// Hackathon Preview Section - Clean, minimal design

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
    <section id="hackathons" className="py-32 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[#38bdf8] text-sm font-medium tracking-widest uppercase mb-4">
            Experience
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
            Hackathon<br />
            <span className="text-[#666666]">Journey</span>
          </h2>
        </motion.div>

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 md:p-12"
        >
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left - Content */}
            <div className="flex-1">
              <p className="text-[#888888] text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                From competing to coaching to organizing—explore the interactive map
                to see my hackathon journey across North America.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                    className="group"
                  >
                    <div className="flex flex-col items-center text-center p-4 bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(255,255,255,0.12)] transition-all">
                      <stat.icon className="text-[#666666] group-hover:text-[#38bdf8] text-lg mb-3 transition-colors" />
                      <div className="text-2xl font-semibold text-white mb-1">{stat.value}</div>
                      <div className="text-[#666666] text-xs uppercase tracking-wider">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <Link to="/hackathons">
                <motion.span
                  whileHover={{ x: 4 }}
                  className="inline-flex items-center gap-3 text-white font-medium hover:text-[#38bdf8] transition-colors group"
                >
                  <span className="px-5 py-3 bg-white text-[#030303] rounded-lg font-medium text-sm group-hover:bg-[#38bdf8] transition-colors">
                    Explore the Map
                  </span>
                  <HiArrowRight className="text-[#666666] group-hover:text-[#38bdf8] transition-colors" />
                </motion.span>
              </Link>
            </div>

            {/* Right - Map preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 w-full lg:w-72 h-48 rounded-xl overflow-hidden relative bg-[#111111] border border-[rgba(255,255,255,0.06)]"
            >
              {/* Subtle map dots */}
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
                    className="absolute w-1.5 h-1.5 bg-[#38bdf8] rounded-full"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      delay: i * 0.4,
                    }}
                  />
                ))}

                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
                  <line x1="20%" y1="30%" x2="45%" y2="45%" stroke="white" strokeWidth="1" />
                  <line x1="45%" y1="45%" x2="70%" y2="25%" stroke="white" strokeWidth="1" />
                  <line x1="30%" y1="65%" x2="60%" y2="55%" stroke="white" strokeWidth="1" />
                </svg>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FaMapMarkedAlt className="text-3xl text-[rgba(255,255,255,0.06)] mx-auto mb-2" />
                  <span className="text-[#666666] text-xs uppercase tracking-wider">Interactive Map</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HackathonPreview
