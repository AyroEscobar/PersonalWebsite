// Contact Section - Clean and modern

import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram, FaFileDownload } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

function Contact() {
  const socials = [
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: "https://www.linkedin.com/in/ayroescobar/",
      color: "hover:border-blue-400/50 hover:text-blue-400",
      handle: "ayroescobar"
    },
    {
      name: "GitHub",
      icon: FaGithub,
      url: "https://github.com/AyroEscobar",
      color: "hover:border-white/50 hover:text-white",
      handle: "AyroEscobar"
    },
    {
      name: "Email",
      icon: MdEmail,
      url: "mailto:yro.escobar@gmail.com",
      color: "hover:border-red-400/50 hover:text-red-400",
      handle: "yro.escobar"
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "https://www.instagram.com/ayro.afk/",
      color: "hover:border-pink-400/50 hover:text-pink-400",
      handle: "ayro.afk"
    }
  ]

  return (
    <section id="contact" className="py-24 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Let's <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-md mx-auto">
            Whether you want to collaborate, need a hackathon coach, or just want to chat—I'd love to hear from you.
          </p>
        </motion.div>

        {/* Social cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {socials.map((social, index) => (
            <motion.a
              key={index}
              href={social.url}
              target={social.url.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={`flex flex-col items-center p-5 glass rounded-2xl text-white/50 border border-transparent ${social.color} transition-all duration-200`}
            >
              <social.icon size={28} className="mb-3" />
              <span className="font-medium text-sm">{social.name}</span>
              <span className="text-xs text-white/30 mt-1">@{social.handle}</span>
            </motion.a>
          ))}
        </div>

        {/* Resume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="glass rounded-2xl p-8 inline-block">
            <h3 className="text-lg font-medium text-white mb-4">Want the full picture?</h3>
            <motion.a
              href="/resume.pdf"
              download
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl border border-white/10 transition-colors"
            >
              <FaFileDownload size={18} />
              Download Resume
            </motion.a>
            <p className="text-white/30 text-xs mt-3">PDF format</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-white/20 text-xs text-center mt-20"
        >
          Built with React, Tailwind, and Three.js
        </motion.p>
      </div>
    </section>
  )
}

export default Contact
