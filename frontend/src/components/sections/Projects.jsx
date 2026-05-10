import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { useProjects } from '../../hooks/useFirestore'

export default function Projects() {
  const { data: projects, loading, error } = useProjects()
  const [hovered, setHovered] = useState(null)

  if (loading || error || projects.length === 0) return null

  return (
    <section id="projects" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-[#e6f1ff] text-2xl font-semibold mb-10 flex items-center">
          <span className="num">03.</span>
          Projects
          <span className="rule" />
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              className="glass-card flex flex-col p-6 cursor-default"
              style={hovered === p.id ? {
                boxShadow: '0 0 40px rgba(100,255,218,0.09), 0 16px 48px rgba(0,0,0,0.5)',
              } : {}}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-6">
                {/* Folder icon */}
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M6 13C6 11.3 7.3 10 9 10h7.5l2 3H31c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3V13z"
                    stroke="#64ffda" strokeWidth="1.5" fill="none"/>
                </svg>
                <div className="flex items-center gap-3">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noopener noreferrer"
                      className="text-[#8892a4] hover:text-[#64ffda] transition-colors"
                      onClick={e => e.stopPropagation()}>
                      <FaGithub size={18} />
                    </a>
                  )}
                  {p.live && (
                    <a href={p.live} target="_blank" rel="noopener noreferrer"
                      className="text-[#8892a4] hover:text-[#64ffda] transition-colors"
                      onClick={e => e.stopPropagation()}>
                      <FaExternalLinkAlt size={14} />
                    </a>
                  )}
                </div>
              </div>

              <h3 className="text-[#e6f1ff] font-semibold text-lg mb-2 group-hover:text-[#64ffda] transition-colors">
                {p.title}
              </h3>
              <p className="text-[#8892a4] text-sm leading-relaxed flex-1 mb-6">
                {p.description}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto">
                {p.tech?.map((t, j) => (
                  <span key={j} className="mono text-[11px] text-[#8892a4]">{t}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-teal"
          >
            View more on GitHub
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
