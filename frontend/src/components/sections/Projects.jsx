// Projects Section - Clean, minimal cards

import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'

function Projects() {
  const { data: projects, loading, error } = useProjects()

  if (loading || error || projects.length === 0) {
    return null
  }

  return (
    <section id="projects" className="py-32 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[#6366f1] text-sm font-semibold tracking-widest uppercase mb-4">
            Projects
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Featured<br />
              <span className="text-[#8888a0]">Work</span>
            </h2>
            <a
              href="https://github.com/AyroEscobar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#8888a0] hover:text-[#6366f1] transition-colors text-sm font-medium"
            >
              View all on GitHub
              <FaArrowRight size={12} />
            </a>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-[#12121a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 md:p-8 hover:border-[rgba(255,255,255,0.2)] hover:bg-[#14141c] transition-all duration-300">
                {/* Project number */}
                <span className="text-[#3a3a4a] text-sm font-mono mb-4 block">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-[#6366f1] transition-colors">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-[#8888a0] text-sm md:text-base leading-relaxed mb-6">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech?.map((tech, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 bg-[rgba(99,102,241,0.1)] text-[#818cf8] rounded-lg font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#8888a0] hover:text-white text-sm font-medium transition-colors"
                    >
                      <FaGithub size={16} />
                      <span>Code</span>
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#8888a0] hover:text-[#6366f1] text-sm font-medium transition-colors"
                    >
                      <FaExternalLinkAlt size={14} />
                      <span>Live</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
