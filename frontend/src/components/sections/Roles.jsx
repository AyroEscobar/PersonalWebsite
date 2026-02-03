// Roles Section - Compact experience cards

import { motion } from 'framer-motion'
import { FaGithub, FaChalkboardTeacher } from 'react-icons/fa'
import { SiMajorleaguehacking } from 'react-icons/si'
import { HiUserGroup } from 'react-icons/hi'

function Roles() {
  const roles = [
    {
      title: "MLH Coach",
      icon: SiMajorleaguehacking,
      description: "Mentoring hackers at Major League Hacking events, helping teams debug, ideate, and ship.",
      tags: ["10+ events", "100+ hackers"]
    },
    {
      title: "GitHub Campus Expert",
      icon: FaGithub,
      description: "Building developer communities on campus, hosting workshops, spreading open source culture.",
      tags: ["Workshops", "Community"]
    },
    {
      title: "HackUTD Organizer",
      icon: HiUserGroup,
      description: "Organizing UTD's flagship hackathon, managing logistics, sponsors, and hacker experience.",
      tags: ["HackUTD", "Logistics"]
    },
    {
      title: "TIP Officer",
      icon: FaChalkboardTeacher,
      description: "Technical Interview Prep officer — coached a team of 4 from arrays to dynamic programming.",
      tags: ["Fall 2025", "DSA"]
    }
  ]

  return (
    <section id="roles" className="py-24 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
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
            Experience
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            What I Do
          </h2>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group"
            >
              <div className="h-full bg-[#12121a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.15)] transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-[rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(99,102,241,0.15)] transition-colors">
                    <role.icon size={18} className="text-[#6366f1]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {role.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[#8888a0] text-xs leading-relaxed mb-3">
                      {role.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {role.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-1 bg-[rgba(255,255,255,0.04)] text-[#8888a0] rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Roles
