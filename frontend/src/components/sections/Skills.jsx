// Skills Section - Clean, minimal grid

import { motion } from 'framer-motion'
import { FaJava, FaPython, FaReact, FaJs, FaNodeJs, FaGitAlt } from 'react-icons/fa'
import { SiCplusplus, SiTailwindcss, SiPostgresql, SiSupabase, SiFirebase, SiTypescript } from 'react-icons/si'

function Skills() {
  const skills = [
    { name: "Java", icon: FaJava },
    { name: "Python", icon: FaPython },
    { name: "C++", icon: SiCplusplus },
    { name: "JavaScript", icon: FaJs },
    { name: "TypeScript", icon: SiTypescript },
    { name: "React", icon: FaReact },
    { name: "Node.js", icon: FaNodeJs },
    { name: "Tailwind", icon: SiTailwindcss },
    { name: "PostgreSQL", icon: SiPostgresql },
    { name: "Supabase", icon: SiSupabase },
    { name: "Firebase", icon: SiFirebase },
    { name: "Git", icon: FaGitAlt },
  ]

  return (
    <section id="skills" className="py-32 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.05)]">
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
            Skills
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
            Tech<br />
            <span className="text-[#666666]">Stack</span>
          </h2>
        </motion.div>

        {/* Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="group"
              >
                <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
                  <skill.icon
                    size={28}
                    className="text-[#666666] group-hover:text-white transition-colors duration-300 mb-3"
                  />
                  <span className="text-[#666666] text-xs font-medium text-center group-hover:text-[#c2c2c2] transition-colors">
                    {skill.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Skills
