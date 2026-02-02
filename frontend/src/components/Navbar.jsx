// Navbar - Clean, minimal navigation

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenuAlt4, HiX } from 'react-icons/hi'
import { FaMapMarkedAlt } from 'react-icons/fa'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { label: 'Projects', action: () => scrollToSection('projects') },
    { label: 'Experience', action: () => scrollToSection('roles') },
    { label: 'Contact', action: () => scrollToSection('contact') },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#030303]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="text-white font-semibold text-lg tracking-tight hover:opacity-70 transition-opacity"
            >
              Ayro<span className="text-[#38bdf8]">.</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="text-[#888888] text-sm font-medium hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/hackathons"
                className="text-[#888888] text-sm font-medium hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <FaMapMarkedAlt size={12} />
                Map
              </Link>
            </div>

            {/* Resume Button - Desktop */}
            <div className="hidden md:block">
              <a
                href="https://github.com/AyroEscobar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white border border-[rgba(255,255,255,0.15)] px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
              >
                GitHub
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiX size={24} /> : <HiMenuAlt4 size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-[#030303] border-t border-[rgba(255,255,255,0.05)]"
            >
              <div className="px-6 py-6 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={link.action}
                    className="block w-full text-left px-4 py-3 text-[#c2c2c2] text-base font-medium hover:text-white hover:bg-[rgba(255,255,255,0.02)] rounded-lg transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Link
                  to="/hackathons"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-[#c2c2c2] text-base font-medium hover:text-white hover:bg-[rgba(255,255,255,0.02)] rounded-lg transition-colors"
                >
                  <FaMapMarkedAlt size={14} />
                  Hackathon Map
                </Link>
                <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.05)]">
                  <a
                    href="https://github.com/AyroEscobar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm font-medium text-white border border-[rgba(255,255,255,0.15)] px-4 py-3 rounded-lg"
                  >
                    GitHub Profile
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}

export default Navbar
