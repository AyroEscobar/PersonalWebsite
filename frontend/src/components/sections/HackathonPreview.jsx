// Hackathon Preview Section - Compact design

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
    <section id="hackathons" className="py-24 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-[#6366f1] text-xs font-semibold tracking-widest uppercase mb-3">
            Hackathons
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            My Journey
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#12121a] border border-[rgba(255,255,255,0.06)] rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Stats */}
            <div className="flex-1 grid grid-cols-4 gap-3 w-full">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="text-center"
                >
                  <stat.icon className="text-[#6366f1] text-sm mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[#8888a0] text-[10px] uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/hackathons">
              <motion.span
                whileHover={{ x: 4 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] text-white rounded-lg font-semibold text-sm hover:bg-[#818cf8] transition-colors whitespace-nowrap"
              >
                <FaMapMarkedAlt size={14} />
                Explore Map
                <HiArrowRight size={14} />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HackathonPreview
