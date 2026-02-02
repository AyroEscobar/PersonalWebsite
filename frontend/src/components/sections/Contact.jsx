// Contact Section - Compact design

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
      url: "mailto:ayro.escobar@gmail.com",
      handle: "ayro.escobar@gmail.com"
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "https://www.instagram.com/ayro.afk/",
      handle: "@ayro.afk"
    }
  ]

  return (
    <section id="contact" className="py-24 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left - CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#6366f1] text-xs font-semibold tracking-widest uppercase mb-3">
              Contact
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Let's Connect
            </h2>
            <p className="text-[#8888a0] text-sm leading-relaxed mb-6">
              Whether you want to collaborate on a project, need a hackathon coach,
              or just want to chat—I'd love to hear from you.
            </p>
            <a
              href="mailto:ayro.escobar@gmail.com"
              className="inline-flex items-center gap-2 text-white hover:text-[#6366f1] transition-colors text-sm font-semibold group"
            >
              ayro.escobar@gmail.com
              <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Right - Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            {socials.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target={social.url.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 bg-[#12121a] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all group"
              >
                <social.icon size={18} className="text-[#8888a0] group-hover:text-[#6366f1] transition-colors" />
                <span className="text-white text-sm font-medium">{social.name}</span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
