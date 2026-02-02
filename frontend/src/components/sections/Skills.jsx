// Skills Section - Categorized tech stack

import { motion } from 'framer-motion'
import { FaJava, FaPython, FaReact, FaJs, FaNodeJs, FaGitAlt, FaAws } from 'react-icons/fa'
import { SiCplusplus, SiTailwindcss, SiPostgresql, SiSupabase, SiFirebase, SiTypescript, SiMongodb, SiDocker } from 'react-icons/si'

function Skills() {
  const categories = [
    {
      title: "Languages",
      skills: [
        { name: "Java", icon: FaJava },
        { name: "Python", icon: FaPython },
        { name: "C++", icon: SiCplusplus },
        { name: "JavaScript", icon: FaJs },
        { name: "TypeScript", icon: SiTypescript },
      ]
    },
    {
      title: "Frontend",
      skills: [
        { name: "React", icon: FaReact },
        { name: "Tailwind", icon: SiTailwindcss },
      ]
    },
    {
      title: "Backend & Data",
      skills: [
        { name: "Node.js", icon: FaNodeJs },
        { name: "PostgreSQL", icon: SiPostgresql },
        { name: "MongoDB", icon: SiMongodb },
        { name: "Supabase", icon: SiSupabase },
        { name: "Firebase", icon: SiFirebase },
      ]
    },
    {
      title: "Tools",
      skills: [
        { name: "Git", icon: FaGitAlt },
        { name: "Docker", icon: SiDocker },
        { name: "AWS", icon: FaAws },
      ]
    }
  ]

  return (
    <section id="skills" className="py-24 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-[#6366f1] text-xs font-semibold tracking-widest uppercase mb-3">
            Skills
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Tech Stack
          </h2>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, catIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: catIndex * 0.1 }}
            >
              <h3 className="text-[#8888a0] text-xs font-semibold uppercase tracking-wider mb-4">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#12121a] border border-[rgba(255,255,255,0.06)] rounded-lg hover:border-[rgba(255,255,255,0.15)] transition-all group"
                  >
                    <skill.icon
                      size={18}
                      className="text-[#8888a0] group-hover:text-[#6366f1] transition-colors"
                    />
                    <span className="text-[#d4d4dc] text-sm font-medium">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
