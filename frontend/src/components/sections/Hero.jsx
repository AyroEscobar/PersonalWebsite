import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

const ROLES = [
  'Software Engineer',
  'Builder',
  'JPMC ’26 / RBC ’25',
  'AI Infrastructure Guy',
]

const socials = [
  { href: 'https://www.linkedin.com/in/ayroescobar/', Icon: FaLinkedin, label: 'LinkedIn' },
  { href: 'https://github.com/AyroEscobar',          Icon: FaGithub,   label: 'GitHub'   },
  { href: 'mailto:ayro.escobar@gmail.com',           Icon: MdEmail,    label: 'Email'    },
  { href: 'https://www.instagram.com/ayro.afk/',     Icon: FaInstagram,label: 'Instagram'},
]

export default function Hero() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % ROLES.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-6 md:px-12 max-w-[900px] mx-auto"
    >
      {/* Fixed left social rail */}
      <div className="fixed left-10 bottom-0 hidden xl:flex flex-col items-center gap-5 z-40">
        {socials.map(({ href, Icon, label }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={label}
            className="text-[#6b5847] hover:text-[#8b4d2c] hover:-translate-y-1 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        ))}
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #6b5847, transparent)' }} />
      </div>

      {/* Fixed right email rail */}
      <div className="fixed right-10 bottom-0 hidden xl:flex flex-col items-center gap-4 z-40">
        <a
          href="mailto:ayro.escobar@gmail.com"
          className="mono text-[12px] text-[#6b5847] hover:text-[#8b4d2c] hover:-translate-y-1 transition-all duration-200 tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          ayro.escobar@gmail.com
        </a>
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #6b5847, transparent)' }} />
      </div>

      {/* Content */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mono text-[#8b4d2c] text-sm mb-5 tracking-widest"
        >
          Plano, TX — 20 y/o
        </motion.p>

        {/* Name — static warm gradient, no motion (peace) */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(48px, 8vw, 82px)',
            lineHeight: 1,
            fontWeight: 800,
            background: 'linear-gradient(95deg, #2d2520 0%, #8b4d2c 55%, #6b3a1f 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ayro Escobar.
        </motion.h1>

        {/* Rotating role */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 mt-3 h-12 flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-semibold text-[#6b5847]"
              style={{ fontSize: 'clamp(26px, 4.5vw, 48px)' }}
            >
              {ROLES[idx]}
            </motion.h2>
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[#6b5847] max-w-lg mb-3 leading-relaxed text-base"
        >
          I ship software at <span className="text-[#2d2520] font-medium">MD7</span>, interned at{' '}
          <span className="text-[#2d2520] font-medium">RBC</span> in NYC, and head to{' '}
          <span className="text-[#2d2520] font-medium">JP Morgan</span> this summer.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-[#6b5847] max-w-lg mb-4 leading-relaxed text-base"
        >
          Trying to build a life where my family never worries about money — and a few things
          that outlast me. Both before 25.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2.5 mb-10"
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: '#8b4d2c', boxShadow: '0 0 8px #8b4d2c' }}
          />
          <span className="mono text-[12px] text-[#6b5847] tracking-wider">
            Available for full-time conversations
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-4"
        >
          <a href="#projects" className="btn-teal">See what I'm building</a>
          <a
            href="#contact"
            className="mono text-sm text-[#6b5847] border border-[rgba(140,122,102,0.25)] rounded px-7 py-4 hover:border-[#8b4d2c] hover:text-[#8b4d2c] transition-all"
          >
            Get in touch
          </a>
        </motion.div>

        {/* Mobile socials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex xl:hidden items-center gap-5 mt-10"
        >
          {socials.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[#6b5847] hover:text-[#8b4d2c] transition-colors"
            >
              <Icon size={20} />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
