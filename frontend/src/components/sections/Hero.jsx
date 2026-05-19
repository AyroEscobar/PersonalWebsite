import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import Globe from '../Globe'

const ROLES = ['software engineer', 'systems builder', 'automation obsessive', 'founding engineer']

const CHANNELS = [
  { href: 'https://github.com/AyroEscobar',           Icon: FaGithub,    code: 'GH', label: 'GitHub'    },
  { href: 'https://www.linkedin.com/in/ayroescobar/', Icon: FaLinkedin,  code: 'IN', label: 'LinkedIn'  },
  { href: 'mailto:ayro.escobar@gmail.com',            Icon: MdEmail,     code: 'EM', label: 'Email'     },
  { href: 'https://www.instagram.com/ayro.afk/',      Icon: FaInstagram, code: 'IG', label: 'Instagram' },
]

// Type-and-erase loop over a list of words.
function useTyped(words, speed = 62, erase = 30, hold = 1600) {
  const [display, setDisplay] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[wordIdx % words.length]
    let to
    if (!deleting && display === word) {
      to = setTimeout(() => setDeleting(true), hold)
    } else if (deleting && display === '') {
      setDeleting(false)
      setWordIdx((i) => i + 1)
    } else {
      to = setTimeout(() => {
        setDisplay((d) => (deleting ? word.slice(0, d.length - 1) : word.slice(0, d.length + 1)))
      }, deleting ? erase : speed)
    }
    return () => clearTimeout(to)
  }, [display, deleting, wordIdx, words, speed, erase, hold])

  return display
}

function Corner({ pos }) {
  const map = {
    tl: 'top-0 left-0 border-t border-l',
    tr: 'top-0 right-0 border-t border-r',
    bl: 'bottom-0 left-0 border-b border-l',
    br: 'bottom-0 right-0 border-b border-r',
  }
  return <span className={`absolute w-4 h-4 border-cyan/40 ${map[pos]}`} aria-hidden="true" />
}

export default function Hero() {
  const typed = useTyped(ROLES)

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center px-6 md:px-10 pt-24 pb-20"
    >
      <div className="max-w-[1120px] mx-auto w-full grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-6 items-center">
        {/* ─── Console column ─── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="eyebrow text-cyan" style={{ letterSpacing: '0.2em' }}>OPERATOR</span>
            <span className="w-8 h-px bg-border" />
            <span className="eyebrow">PLANO, TX · UTD CS 2027</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="display"
            style={{ fontSize: 'clamp(44px, 7.4vw, 86px)', lineHeight: 0.97, color: '#eef3f9' }}
          >
            AYRO<br />ESCOBAR
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
            className="mt-5 font-mono flex flex-wrap items-center gap-x-2 gap-y-1"
            style={{ fontSize: '14.5px' }}
          >
            <span className="text-green">$</span>
            <span className="text-dim">whoami</span>
            <span className="text-cyan">▸</span>
            <span className="text-ink">{typed}</span>
            <span className="blink text-cyan">▋</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
            className="mt-6 text-dim max-w-[460px]"
            style={{ fontSize: '14px', lineHeight: 1.85 }}
          >
            Currently shipping at <span className="text-ink">MD7</span>. Interned at{' '}
            <span className="text-ink">RBC</span> in New York, headed to{' '}
            <span className="text-ink">JP Morgan</span> this summer. Building software that
            outlasts me, and a life where my family never worries about money.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
            className="mt-6 flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-green" style={{ boxShadow: '0 0 10px #6ee7a3' }} />
            <span className="eyebrow text-green" style={{ letterSpacing: '0.16em' }}>ONLINE</span>
            <span className="text-muted">·</span>
            <span className="eyebrow">building in public</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href="#projects" className="btn-term">▸ View Build Log</a>
            <a href="#contact" className="btn-ghost">Open Channel</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.82 }}
            className="mt-9 flex items-center gap-5 flex-wrap"
          >
            <span className="eyebrow" style={{ opacity: 0.55 }}>CHANNELS</span>
            {CHANNELS.map(({ href, Icon, code, label }) => (
              <a
                key={code}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                aria-label={label}
                className="flex items-center gap-1.5 text-dim hover:text-cyan transition-colors"
              >
                <Icon size={13} />
                <span className="eyebrow" style={{ letterSpacing: '0.1em' }}>{code}</span>
              </a>
            ))}
          </motion.div>
        </div>

        {/* ─── Globe column ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="relative h-[300px] md:h-[480px]"
        >
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
          <div className="absolute inset-0">
            <Suspense fallback={null}><Globe /></Suspense>
          </div>
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 eyebrow whitespace-nowrap"
            style={{ opacity: 0.5 }}
          >
            ◇ OPERATOR MESH · LIVE
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted hover:text-cyan transition-colors"
        aria-label="Scroll to about"
      >
        <span className="eyebrow">SCROLL</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </motion.span>
      </a>
    </section>
  )
}
