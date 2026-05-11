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
    { label: 'About',       id: 'about',    roman: 'I.'   },
    { label: 'Experience',  id: 'roles',    roman: 'II.'  },
    { label: 'Projects',    id: 'projects', roman: 'III.' },
    { label: 'Contact',     id: 'contact',  roman: 'VI.'  },
  ]

  const serifItalic = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }
  const roman       = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontWeight: 500 }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#f3ead6]/92 backdrop-blur-xl shadow-[0_1px_0_rgba(158,69,29,0.10)]' : ''
      }`}
    >
      <nav className="max-w-[900px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Logo — serif italic monogram */}
        <Link
          to="/"
          className="text-[#9e451d] hover:opacity-70 transition-opacity"
          style={{ ...serifItalic, fontSize: '20px', fontWeight: 600 }}
        >
          Ayro.
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <button
              key={l.label}
              onClick={() => go(l.id)}
              className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
              style={{ ...serifItalic, fontSize: '16px' }}
            >
              <span className="text-[#9e451d] mr-1.5" style={roman}>{l.roman}</span>
              {l.label}
            </button>
          ))}
          <Link
            to="/hackathons"
            className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
            style={{ ...serifItalic, fontSize: '16px' }}
          >
            <span className="text-[#9e451d] mr-1.5" style={roman}>IV.</span>
            Circuit
          </Link>
          <a
            href="https://github.com/AyroEscobar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9e451d] border border-[#9e451d] rounded-sm px-4 py-1.5 hover:bg-[rgba(158,69,29,0.07)] transition-colors"
            style={{ ...serifItalic, fontSize: '15px', fontWeight: 500 }}
          >
            GitHub
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-[#9e451d] p-2"
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
            className="md:hidden bg-[#f3ead6] border-t border-[rgba(158,69,29,0.18)] px-6 py-8 flex flex-col gap-5"
          >
            {links.map(l => (
              <button
                key={l.label}
                onClick={() => go(l.id)}
                className="text-[#2a1f15] text-left hover:text-[#9e451d] transition-colors"
                style={{ ...serifItalic, fontSize: '18px' }}
              >
                <span className="text-[#9e451d] block text-[14px] mb-0.5" style={roman}>{l.roman}</span>
                {l.label}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); window.location.href = '/hackathons' }}
              className="text-[#2a1f15] text-left hover:text-[#9e451d] transition-colors"
              style={{ ...serifItalic, fontSize: '18px' }}
            >
              <span className="text-[#9e451d] block text-[14px] mb-0.5" style={roman}>IV.</span>
              Circuit
            </button>
            <a
              href="https://github.com/AyroEscobar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9e451d] border border-[#9e451d] rounded-sm px-4 py-3 text-center hover:bg-[rgba(158,69,29,0.08)] transition-colors mt-2"
              style={{ ...serifItalic, fontSize: '16px', fontWeight: 500 }}
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
