// Roles Section - Premium card design

import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { SiMajorleaguehacking } from 'react-icons/si'
import { HiUserGroup } from 'react-icons/hi'

function Roles() {
  const roles = [
    {
      title: "MLH Coach",
      icon: SiMajorleaguehacking,
      gradient: "from-red-500 to-orange-500",
      description: "Mentoring hackers at Major League Hacking events, helping teams debug, ideate, and ship projects.",
      highlights: ["10+ hackathons", "100+ hackers helped", "Technical mentorship"]
    },
    {
      title: "GitHub Campus Expert",
      icon: FaGithub,
      gradient: "from-gray-400 to-white",
      description: "Building developer communities on campus, hosting workshops, and spreading open source culture.",
      highlights: ["Community building", "Technical workshops", "Open source"]
    },
    {
      title: "Hackathon Organizer",
      icon: HiUserGroup,
      gradient: "from-sky-400 to-cyan-400",
      description: "Organizing and running hackathons including HackUTD and &Hacks, creating spaces for students to build.",
      highlights: ["HackUTD", "&Hacks", "Event logistics"]
    }
  ]

  return (
    <section id="roles" className="py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            What I <span className="gradient-text">Do</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto">
            Beyond coding, I'm passionate about building communities and helping others grow
          </p>
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
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-6 group cursor-default"
            >
              {/* Icon with gradient background */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <role.icon size={28} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-3">{role.title}</h3>

              {/* Description */}
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                {role.description}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {role.highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 bg-white/5 text-white/70 rounded-full border border-white/10"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Roles
