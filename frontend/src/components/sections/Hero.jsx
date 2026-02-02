// Hero Section - Clean, typography-focused design

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram, FaArrowDown } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

function Hero() {
  const titles = [
    "Software Engineer",
    "MLH Coach",
    "GitHub Campus Expert",
    "Hackathon Organizer"
  ]

  const [titleIndex, setTitleIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const socialLinks = [
    { href: "https://www.linkedin.com/in/ayroescobar/", icon: FaLinkedin, label: "LinkedIn" },
    { href: "https://github.com/AyroEscobar", icon: FaGithub, label: "GitHub" },
    { href: "mailto:yro.escobar@gmail.com", icon: MdEmail, label: "Email" },
    { href: "https://www.instagram.com/ayro.afk/", icon: FaInstagram, label: "Instagram" },
  ]

  return (
    <section id="hero" className="min-h-screen flex flex-col justify-center relative px-6 md:px-12 lg:px-24">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-full text-sm text-[#c2c2c2]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            Available for opportunities
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-6"
        >
          <span className="text-white">Ayro</span>
          <br />
          <span className="text-[#666666]">Escobar</span>
        </motion.h1>

        {/* Rotating title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-10 mb-8"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={titleIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xl md:text-2xl text-[#38bdf8] font-medium"
            >
              {titles[titleIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-[#888888] max-w-xl mb-12 leading-relaxed"
        >
          Building products that matter and helping others learn to do the same.
          Currently studying CS at UT Dallas.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap gap-4 mb-16"
        >
          <a
            href="#projects"
            className="btn-primary"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="btn-secondary"
          >
            Get in Touch
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center gap-6"
        >
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target={social.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={social.label}
              className="text-[#666666] hover:text-white transition-colors duration-300"
            >
              <social.icon size={20} />
            </a>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-6 md:left-12 lg:left-24"
      >
        <motion.a
          href="#about"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex items-center gap-3 text-[#666666] hover:text-white transition-colors text-sm"
        >
          <FaArrowDown size={12} />
          <span className="tracking-widest uppercase text-xs">Scroll</span>
        </motion.a>
      </motion.div>

      {/* Side text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2"
      >
        <p
          className="text-[#333333] text-xs tracking-[0.3em] uppercase"
          style={{ writingMode: 'vertical-rl' }}
        >
          Software Engineer & Mentor
        </p>
      </motion.div>
    </section>
  )
}

export default Hero
