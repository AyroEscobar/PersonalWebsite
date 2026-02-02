// Roles Section - Clean, minimal design

import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { SiMajorleaguehacking } from 'react-icons/si'
import { HiUserGroup } from 'react-icons/hi'

function Roles() {
  const roles = [
    {
      title: "MLH Coach",
      icon: SiMajorleaguehacking,
      description: "Mentoring hackers at Major League Hacking events, helping teams debug, ideate, and ship projects.",
      highlights: ["10+ hackathons", "100+ hackers helped", "Technical mentorship"]
    },
    {
      title: "GitHub Campus Expert",
      icon: FaGithub,
      description: "Building developer communities on campus, hosting workshops, and spreading open source culture.",
      highlights: ["Community building", "Technical workshops", "Open source"]
    },
    {
      title: "Hackathon Organizer",
      icon: HiUserGroup,
      description: "Organizing and running hackathons including HackUTD and &Hacks, creating spaces for students to build.",
      highlights: ["HackUTD", "&Hacks", "Event logistics"]
    }
  ]

  return (
    <section id="roles" className="py-32 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.05)]">
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
            What I<br />
            <span className="text-[#666666]">Do</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 md:p-8 hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6 group-hover:border-[rgba(255,255,255,0.1)] transition-colors">
                  <role.icon size={24} className="text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-4">
                  {role.title}
                </h3>

                {/* Description */}
                <p className="text-[#888888] text-sm leading-relaxed mb-6">
                  {role.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                  {role.highlights.map((highlight, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 bg-[rgba(255,255,255,0.03)] text-[#666666] rounded-md"
                    >
                      {highlight}
                    </span>
                  ))}
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
