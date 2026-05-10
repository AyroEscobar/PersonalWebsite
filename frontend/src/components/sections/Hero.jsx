import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

const ROLES = ['Software Engineer', 'MLH Coach', 'GitHub Campus Expert', 'Hackathon Organizer']

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
            className="text-[#8892a4] hover:text-[#64ffda] hover:-translate-y-1 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        ))}
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #8892a4, transparent)' }} />
      </div>

      {/* Fixed right email rail */}
      <div className="fixed right-10 bottom-0 hidden xl:flex flex-col items-center gap-4 z-40">
        <a
          href="mailto:ayro.escobar@gmail.com"
          className="mono text-[12px] text-[#8892a4] hover:text-[#64ffda] hover:-translate-y-1 transition-all duration-200 tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          ayro.escobar@gmail.com
        </a>
        <div className="w-px h-24 mt-2" style={{ background: 'linear-gradient(180deg, #8892a4, transparent)' }} />
      </div>

      {/* Content */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mono text-[#64ffda] text-sm mb-5 tracking-widest"
        >
          Hi, my name is
        </motion.p>

        {/* Name — shimmer gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(48px, 8vw, 82px)',
            lineHeight: 1,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #e6f1ff 0%, #64ffda 40%, #a8b2d8 65%, #e6f1ff 100%)',
            backgroundSize: '300%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 6s linear infinite',
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
              className="font-semibold text-[#8892a4]"
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
          className="text-[#8892a4] max-w-lg mb-4 leading-relaxed text-base"
        >
          I build products that matter and help others learn to do the same.
          CS student at UT Dallas, currently interning at{' '}
          <span className="text-[#e6f1ff] font-medium">RBC</span> in New York.
          Incoming at{' '}
          <span className="text-[#e6f1ff] font-medium">JP Morgan</span> this summer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2.5 mb-10"
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: '#64ffda', boxShadow: '0 0 8px #64ffda' }}
          />
          <span className="mono text-[12px] text-[#8892a4] tracking-wider">Available for opportunities</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-4"
        >
          <a href="#projects" className="btn-teal">See my work</a>
          <a
            href="#contact"
            className="mono text-sm text-[#8892a4] border border-[rgba(168,178,216,0.25)] rounded px-7 py-4 hover:border-[#64ffda] hover:text-[#64ffda] transition-all"
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
              className="text-[#8892a4] hover:text-[#64ffda] transition-colors"
            >
              <Icon size={20} />
            </a>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0%   center; }
          100% { background-position: 300% center; }
        }
      `}</style>
    </section>
  )
}
