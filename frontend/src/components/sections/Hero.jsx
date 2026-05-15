import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import pfp from '../../assets/pfp-web.jpg'

const socials = [
  { href: 'https://www.linkedin.com/in/ayroescobar/', Icon: FaLinkedin, label: 'LinkedIn' },
  { href: 'https://github.com/AyroEscobar',          Icon: FaGithub,   label: 'GitHub'   },
  { href: 'mailto:ayro.escobar@gmail.com',           Icon: MdEmail,    label: 'Email'    },
  { href: 'https://www.instagram.com/ayro.afk/',     Icon: FaInstagram,label: 'Instagram'},
]

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 max-w-[1000px] mx-auto"
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

      {/* Fixed right email rail */}
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

      {/* Two-column hero — text left, dithered photo right */}
      <div className="grid md:grid-cols-[1.55fr_1fr] gap-10 md:gap-14 items-center pt-20 md:pt-0">
        {/* Text column */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="label mb-5 flex items-center gap-3"
          >
            <span aria-hidden="true" style={{ width: 28, height: 1, background: 'currentColor', opacity: 0.5 }} />
            From Plano, Texas — twenty years old
          </motion.p>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(46px, 7vw, 78px)',
              lineHeight: 0.96,
              fontWeight: 700,
              letterSpacing: '-0.018em',
              color: '#2a1f15',
            }}
          >
            I'm Ayro Escobar.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#4f3d2e] max-w-xl mt-7 mb-3 leading-relaxed"
            style={{ fontSize: '18px' }}
          >
            Software engineer. Currently shipping at{' '}
            <span className="text-[#2a1f15] font-semibold">MD7</span>, interned at{' '}
            <span className="text-[#2a1f15] font-semibold">RBC</span> in New York, and head to{' '}
            <span className="text-[#2a1f15] font-semibold">JP Morgan</span> this summer.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-[#4f3d2e] max-w-xl mb-6 leading-relaxed"
            style={{ fontSize: '18px' }}
          >
            Trying to build a life where my family never worries about money — and a few
            things that outlast me. Both before twenty-five.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: '#9e451d', boxShadow: '0 0 10px rgba(196,101,53,0.55)' }}
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

        {/* Photo column — dithered with caption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col items-start md:items-center"
        >
          <div className="dither rounded-sm overflow-hidden" style={{ maxWidth: 280, width: '100%' }}>
            <img
              src={pfp}
              alt="Ayro Escobar"
              loading="eager"
              decoding="async"
              style={{
                width: '100%',
                aspectRatio: '4 / 5',
                objectFit: 'cover',
                filter: 'sepia(22%) saturate(1.05) contrast(1.04)',
              }}
            />
          </div>
          <p className="photo-caption">Plano, TX — May ’26</p>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#9c8a72] hover:text-[#4f3d2e] transition-colors"
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: '13px' }}
        aria-label="Scroll to about"
      >
        <span>read on</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '14px' }}
        >
          ↓
        </motion.span>
      </motion.a>
    </section>
  )
}
