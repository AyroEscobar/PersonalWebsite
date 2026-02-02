// Projects Section - Compact expandable cards

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'

function Projects() {
  const { data: projects, loading, error } = useProjects()
  const [expandedId, setExpandedId] = useState(null)

  if (loading || error || projects.length === 0) {
    return null
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <section id="projects" className="py-24 px-6 md:px-12 lg:px-24">
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
            Projects
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Featured Work
          </h2>
        </motion.div>

        {/* Projects List */}
        <div className="space-y-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div
                className={`bg-[#12121a] border rounded-xl overflow-hidden transition-all duration-300 ${
                  expandedId === project.id
                    ? 'border-[#6366f1]/40'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                {/* Collapsed View - Always visible */}
                <button
                  onClick={() => toggleExpand(project.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-[#3a3a4a] text-xs font-mono flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-white font-semibold text-sm truncate">
                      {project.title}
                    </h3>
                    <span className="hidden sm:block text-[#8888a0] text-xs truncate">
                      {project.tech?.slice(0, 3).join(' · ')}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === project.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <FaChevronDown className="text-[#8888a0] text-xs" />
                  </motion.div>
                </button>

                {/* Expanded View */}
                <AnimatePresence>
                  {expandedId === project.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
                          {/* Description */}
                          <p className="text-[#8888a0] text-sm leading-relaxed mb-4">
                            {project.description}
                          </p>

                          {/* Tech stack */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.tech?.map((tech, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-[rgba(99,102,241,0.1)] text-[#818cf8] rounded-md font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>

                          {/* Links */}
                          <div className="flex items-center gap-4">
                            {project.github && (
                              <a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#8888a0] hover:text-white text-xs font-medium transition-colors"
                              >
                                <FaGithub size={14} />
                                <span>Code</span>
                              </a>
                            )}
                            {project.live && (
                              <a
                                href={project.live}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#8888a0] hover:text-[#6366f1] text-xs font-medium transition-colors"
                              >
                                <FaExternalLinkAlt size={12} />
                                <span>Live</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View more link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8888a0] hover:text-[#6366f1] text-sm font-medium transition-colors"
          >
            View all on GitHub →
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default Projects
