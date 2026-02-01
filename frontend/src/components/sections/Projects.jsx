// Projects Section - Featured projects with modern cards

import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'

function Projects() {
  const { data: projects, loading, error } = useProjects()

  // Don't render if no projects or still loading
  if (loading || error || projects.length === 0) {
    return null
  }

  return (
    <section id="projects" className="py-24 px-4 md:px-6">
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
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg">
            Some things I've built
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass rounded-2xl overflow-hidden group"
            >
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-sky-500/20 via-purple-500/20 to-pink-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B42] to-transparent opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/20 text-sm font-medium">Project Image</span>
                </div>
              </div>

              <div className="p-5">
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tech.map((tech, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-sky-500/10 text-sky-400 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  {project.github && (
                    <motion.a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors"
                    >
                      <FaGithub size={16} />
                      <span>Code</span>
                    </motion.a>
                  )}
                  {project.live && (
                    <motion.a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-1.5 text-white/50 hover:text-sky-400 text-sm transition-colors"
                    >
                      <FaExternalLinkAlt size={14} />
                      <span>Live</span>
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <motion.a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 4 }}
            className="inline-flex items-center gap-2 text-white/50 hover:text-sky-400 text-sm font-medium transition-colors"
          >
            View all on GitHub
            <FaExternalLinkAlt size={12} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

export default Projects
