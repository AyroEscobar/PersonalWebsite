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
            className="text-[#6b5645] hover:text-[#9e451d] hover:-translate-y-1 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        ))}
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #6b5645, transparent)' }} />
      </div>

      {/* Fixed right email rail — italic serif */}
      <div className="fixed right-10 bottom-0 hidden xl:flex flex-col items-center gap-4 z-40">
        <a
          href="mailto:ayro.escobar@gmail.com"
          className="text-[13px] text-[#6b5645] hover:text-[#9e451d] hover:-translate-y-1 transition-all duration-200"
          style={{
            writingMode: 'vertical-rl',
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            letterSpacing: '0.05em',
          }}
        >
          ayro.escobar@gmail.com
        </a>
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #6b5645, transparent)' }} />
      </div>

      {/* Content */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="label mb-5"
        >
          From Plano, Texas — twenty years old
        </motion.p>

        {/* Name — solid ink, letterpress weight */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(54px, 9vw, 96px)',
            lineHeight: 0.95,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: '#2a1f15',
            fontFeatureSettings: '"ss01"',
          }}
        >
          Ayro Escobar.
        </motion.h1>

        {/* Rotating role — italic serif, no longer giant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-9 mt-4 h-10 flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(22px, 3.4vw, 32px)',
                color: '#4f3d2e',
                letterSpacing: '0.005em',
              }}
            >
              {ROLES[idx]}
            </motion.h2>
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[#4f3d2e] max-w-xl mb-4 leading-relaxed"
          style={{ fontSize: '19px' }}
        >
          I ship software at <span className="text-[#2a1f15] font-semibold">MD7</span>, interned at{' '}
          <span className="text-[#2a1f15] font-semibold">RBC</span> in New York, and head to{' '}
          <span className="text-[#2a1f15] font-semibold">JP Morgan</span> this summer.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-[#4f3d2e] max-w-xl mb-7 leading-relaxed"
          style={{ fontSize: '19px' }}
        >
          Trying to build a life where my family never worries about money — and a few things
          that outlast me. Both before twenty-five.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 mb-10"
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: '#9e451d', boxShadow: '0 0 10px rgba(196,101,53,0.6)' }}
          />
          <span
            className="text-[15px] text-[#6b5645]"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
          >
            Available for full-time conversations
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center gap-x-7 gap-y-4"
        >
          <a href="#projects" className="btn-teal">See what I'm building →</a>
          <a
            href="#contact"
            className="text-[16px] text-[#6b5645] hover:text-[#9e451d] transition-colors"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              textDecoration: 'underline',
              textUnderlineOffset: '6px',
              textDecorationColor: 'rgba(158,69,29,0.35)',
              textDecorationThickness: '1px',
            }}
          >
            or just say hello
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
              className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
            >
              <Icon size={20} />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
