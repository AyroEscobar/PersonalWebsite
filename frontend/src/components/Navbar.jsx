import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiMenu } from 'react-icons/hi'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const go = (id) => {
    setOpen(false)
    if (!isHome) { window.location.href = `/#${id}`; return }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const links = [
    { label: 'About',       id: 'about' },
    { label: 'Experience',  id: 'roles' },
    { label: 'Projects',    id: 'projects' },
    { label: 'Contact',     id: 'contact' },
  ]

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#f5efe2]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(139,77,44,0.06)]' : ''
      }`}
    >
      <nav className="max-w-[900px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-[#8b4d2c] mono text-sm hover:opacity-70 transition-opacity">
          ayro.
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l, i) => (
            <button
              key={l.label}
              onClick={() => go(l.id)}
              className="mono text-[13px] text-[#6b5847] hover:text-[#8b4d2c] transition-colors"
            >
              <span className="text-[#8b4d2c] mr-1.5">{String(i + 1).padStart(2,'0')}.</span>
              {l.label}
            </button>
          ))}
          <Link
            to="/hackathons"
            className="mono text-[13px] text-[#6b5847] hover:text-[#8b4d2c] transition-colors"
          >
            <span className="text-[#8b4d2c] mr-1.5">05.</span>
            Circuit
          </Link>
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-[13px] text-[#8b4d2c] border border-[#8b4d2c] rounded px-4 py-2 hover:bg-[rgba(139,77,44,0.08)] transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-[#8b4d2c] p-2"
          aria-label="Menu"
        >
          {open ? <HiX size={22} /> : <HiMenu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-[#f5efe2] border-t border-[rgba(139,77,44,0.08)] px-6 py-8 flex flex-col gap-5"
          >
            {links.map((l, i) => (
              <button
                key={l.label}
                onClick={() => go(l.id)}
                className="mono text-sm text-[#2d2520] text-left hover:text-[#8b4d2c] transition-colors"
              >
                <span className="text-[#8b4d2c] block text-xs mb-0.5">{String(i + 1).padStart(2,'0')}.</span>
                {l.label}
              </button>
            ))}
            <Link
              to="/hackathons"
              onClick={() => setOpen(false)}
              className="mono text-sm text-[#2d2520] hover:text-[#8b4d2c] transition-colors"
            >
              <span className="text-[#8b4d2c] block text-xs mb-0.5">05.</span>
              Map
            </Link>
            <a
              href="https://github.com/AyroEscobar"
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-sm text-[#8b4d2c] border border-[#8b4d2c] rounded px-4 py-3 text-center hover:bg-[rgba(139,77,44,0.08)] transition-colors mt-2"
            >
              GitHub
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Navbar
