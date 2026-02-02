// Hero Section - Clean, typography-focused design with profile image

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram, FaArrowDown } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import pfp from '../../assets/pfp123.jpg'

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
    { href: "mailto:ayro.escobar@gmail.com", icon: MdEmail, label: "Email" },
    { href: "https://www.instagram.com/ayro.afk/", icon: FaInstagram, label: "Instagram" },
  ]

  return (
    <section id="hero" className="min-h-screen flex flex-col justify-center relative px-6 md:px-12 lg:px-24 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]" />

      {/* Accent glow */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#6366f1]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-32 w-64 h-64 bg-[#a855f7]/8 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left - Text content */}
          <div className="flex-1">
            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            >
              <span className="text-white">Ayro</span>
              <br />
              <span className="text-[#8888a0]">Escobar</span>
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
                  className="text-xl md:text-2xl text-[#6366f1] font-semibold"
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
              className="text-lg md:text-xl text-[#8888a0] max-w-xl mb-8 leading-relaxed"
            >
              Building products that matter and helping others learn to do the same.
              Currently studying CS at UT Dallas.
            </motion.p>

            {/* Current positions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col gap-3 mb-10"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[#d4d4dc] text-sm font-medium">
                  SWE Intern @ <span className="text-white font-semibold">RBC</span> — New York
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2">
                  <span className="inline-flex rounded-full h-2 w-2 bg-[#6366f1]"></span>
                </span>
                <span className="text-[#d4d4dc] text-sm font-medium">
                  Incoming SWE Intern @ <span className="text-white font-semibold">JP Morgan</span> — Summer 2026
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-12"
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
                  className="text-[#8888a0] hover:text-[#6366f1] transition-colors duration-300"
                >
                  <social.icon size={22} />
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right - Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-shrink-0"
          >
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden border-2 border-[rgba(255,255,255,0.1)]">
                <img
                  src={pfp}
                  alt="Ayro Escobar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative border */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[#6366f1]/30 rounded-2xl -z-10" />
            </div>
          </motion.div>
        </div>
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
          className="flex items-center gap-3 text-[#8888a0] hover:text-white transition-colors text-sm"
        >
          <FaArrowDown size={12} />
          <span className="tracking-widest uppercase text-xs font-medium">Scroll</span>
        </motion.a>
      </motion.div>
    </section>
  )
}

export default Hero
