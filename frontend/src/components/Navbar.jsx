import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram, FaEnvelope, FaMapMarkedAlt } from 'react-icons/fa'
import { HiMenuAlt4, HiX } from 'react-icons/hi'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home'

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false)
    if (!isHome) {
      window.location.href = `/#${sectionId}`
      return
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { label: 'About', action: () => scrollToSection('about') },
    { label: 'Roles', action: () => scrollToSection('roles') },
    { label: 'Projects', action: () => scrollToSection('projects') },
    { label: 'Contact', action: () => scrollToSection('contact') },
  ]

  const socialLinks = [
    { href: "https://www.linkedin.com/in/ayroescobar/", icon: FaLinkedin, hoverColor: "hover:text-blue-400", label: "LinkedIn" },
    { href: "https://github.com/AyroEscobar", icon: FaGithub, hoverColor: "hover:text-white", label: "GitHub" },
    { href: "mailto:yro.escobar@gmail.com", icon: FaEnvelope, hoverColor: "hover:text-red-400", label: "Email" },
    { href: "https://www.instagram.com/ayro.afk/", icon: FaInstagram, hoverColor: "hover:text-pink-400", label: "Instagram" },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-50"
      >
        <div className="glass rounded-2xl px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="text-white font-semibold text-lg tracking-tight hover:text-sky-400 transition-colors"
            >
              <span className="gradient-text">A</span>yro
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="px-3 py-1.5 text-white/70 text-sm font-medium hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/hackathons"
                className="px-3 py-1.5 text-white/70 text-sm font-medium hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 flex items-center gap-1.5"
              >
                <FaMapMarkedAlt size={12} />
                Map
              </Link>
            </div>

            {/* Desktop Social Links */}
            <div className="hidden md:flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`text-white/40 ${social.hoverColor} transition-colors duration-200 p-1.5`}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white/70 hover:text-white p-1.5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiX size={22} /> : <HiMenuAlt4 size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl mt-2 p-4 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={link.action}
                    className="px-4 py-3 text-white/80 text-left font-medium hover:bg-white/5 rounded-xl transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Link
                  to="/hackathons"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <FaMapMarkedAlt size={14} />
                  Hackathon Map
                </Link>
              </div>

              {/* Mobile Social Links */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`text-white/50 ${social.hoverColor} transition-colors p-2`}
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}

export default Navbar
