import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiMenu } from 'react-icons/hi'

const LINKS = [
  { label: 'ABOUT',      id: 'about'    },
  { label: 'EXPERIENCE', id: 'roles'    },
  { label: 'BUILD.LOG',  id: 'projects' },
  { label: 'CONTACT',    id: 'contact'  },
]

function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Chicago' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="hidden lg:flex items-center gap-2 eyebrow" style={{ letterSpacing: '0.12em' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green" style={{ boxShadow: '0 0 8px #6ee7a3' }} />
      {t} CT
    </span>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const go = (id) => {
    setOpen(false)
    if (!isHome) { window.location.href = `/#${id}`; return }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        scrolled ? 'bg-bg/92 backdrop-blur-md border-b border-border' : 'border-b border-transparent'
      }`}
    >
      <nav className="max-w-[1120px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Monogram */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="Home">
          <span className="text-cyan" style={{ fontSize: '13px' }}>◇</span>
          <span
            className="font-mono text-ink group-hover:text-cyan transition-colors"
            style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.16em' }}
          >
            AYRO.ESCOBAR
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="px-3 py-1.5 font-mono text-dim hover:text-cyan transition-colors"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em' }}
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/hackathons"
            className="px-3 py-1.5 font-mono text-dim hover:text-cyan transition-colors"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em' }}
          >
            FIELD.OPS
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Clock />
          <a href="https://github.com/AyroEscobar" target="_blank" rel="noopener noreferrer" className="btn-term" style={{ padding: '7px 13px', fontSize: '11px' }}>
            GitHub
          </a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-cyan p-2" aria-label="Menu">
          {open ? <HiX size={20} /> : <HiMenu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-panel border-t border-border overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className="text-left px-3 py-3 font-mono text-ink hover:text-cyan transition-colors"
                  style={{ fontSize: '13px', letterSpacing: '0.12em' }}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => { setOpen(false); window.location.href = '/hackathons' }}
                className="text-left px-3 py-3 font-mono text-ink hover:text-cyan transition-colors"
                style={{ fontSize: '13px', letterSpacing: '0.12em' }}
              >
                FIELD.OPS
              </button>
              <a
                href="https://github.com/AyroEscobar"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-term mt-3 justify-center"
              >
                GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
