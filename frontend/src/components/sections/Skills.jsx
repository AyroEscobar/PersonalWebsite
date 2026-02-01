// Skills Section - Clean grid with hover effects

import { motion } from 'framer-motion'
import { FaJava, FaPython, FaReact, FaJs, FaNodeJs, FaGitAlt } from 'react-icons/fa'
import { SiCplusplus, SiTailwindcss, SiPostgresql, SiSupabase, SiFirebase, SiTypescript } from 'react-icons/si'

function Skills() {
  const skills = [
    { name: "Java", icon: FaJava, color: "#f89820" },
    { name: "Python", icon: FaPython, color: "#3776ab" },
    { name: "C++", icon: SiCplusplus, color: "#00599c" },
    { name: "JavaScript", icon: FaJs, color: "#f7df1e" },
    { name: "TypeScript", icon: SiTypescript, color: "#3178c6" },
    { name: "React", icon: FaReact, color: "#61dafb" },
    { name: "Node.js", icon: FaNodeJs, color: "#339933" },
    { name: "Tailwind", icon: SiTailwindcss, color: "#06b6d4" },
    { name: "PostgreSQL", icon: SiPostgresql, color: "#336791" },
    { name: "Supabase", icon: SiSupabase, color: "#3ecf8e" },
    { name: "Firebase", icon: SiFirebase, color: "#ffca28" },
    { name: "Git", icon: FaGitAlt, color: "#f05032" },
  ]

  return (
    <section id="skills" className="py-24 px-4 md:px-6">
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
            Tech <span className="gradient-text">Stack</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg">
            Technologies I work with
          </p>
        </motion.div>

        {/* Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ y: -4, scale: 1.05 }}
                className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-200 cursor-default group"
              >
                <skill.icon
                  size={32}
                  style={{ color: skill.color }}
                  className="mb-2 group-hover:scale-110 transition-transform duration-200"
                />
                <span className="text-white/70 text-xs font-medium text-center group-hover:text-white transition-colors">
                  {skill.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Skills
