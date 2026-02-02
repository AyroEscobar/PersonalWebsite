// Contact Section - Clean, minimal design

import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram, FaArrowRight } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

function Contact() {
  const socials = [
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: "https://www.linkedin.com/in/ayroescobar/",
      handle: "@ayroescobar"
    },
    {
      name: "GitHub",
      icon: FaGithub,
      url: "https://github.com/AyroEscobar",
      handle: "@AyroEscobar"
    },
    {
      name: "Email",
      icon: MdEmail,
      url: "mailto:yro.escobar@gmail.com",
      handle: "yro.escobar@gmail.com"
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "https://www.instagram.com/ayro.afk/",
      handle: "@ayro.afk"
    }
  ]

  return (
    <section id="contact" className="py-32 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left - CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#38bdf8] text-sm font-medium tracking-widest uppercase mb-4">
              Contact
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
              Let's work<br />
              <span className="text-[#666666]">together</span>
            </h2>
            <p className="text-[#888888] text-base md:text-lg leading-relaxed mb-8 max-w-md">
              Whether you want to collaborate on a project, need a hackathon coach,
              or just want to chat—I'd love to hear from you.
            </p>
            <a
              href="mailto:yro.escobar@gmail.com"
              className="inline-flex items-center gap-2 text-white hover:text-[#38bdf8] transition-colors text-lg font-medium group"
            >
              yro.escobar@gmail.com
              <FaArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Right - Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {socials.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target={social.url.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center">
                    <social.icon size={18} className="text-[#666666] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{social.name}</p>
                    <p className="text-[#666666] text-xs">{social.handle}</p>
                  </div>
                </div>
                <FaArrowRight size={14} className="text-[#333333] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-32 pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-[#333333] text-sm">
            © 2025 Ayro Escobar
          </p>
          <p className="text-[#333333] text-sm">
            Built with React & Tailwind
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact
