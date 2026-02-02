// Footer - Epic animated footer

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaHeart, FaLinkedin, FaGithub, FaInstagram, FaRocket, FaCoffee } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi'

function Footer() {
  const [isHovered, setIsHovered] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const socials = [
    { icon: FaLinkedin, href: "https://www.linkedin.com/in/ayroescobar/", label: "LinkedIn" },
    { icon: FaGithub, href: "https://github.com/AyroEscobar", label: "GitHub" },
    { icon: MdEmail, href: "mailto:ayro.escobar@gmail.com", label: "Email" },
    { icon: FaInstagram, href: "https://www.instagram.com/ayro.afk/", label: "Instagram" },
  ]

  // Fun easter egg messages
  const messages = [
    "You found me! 👀",
    "Keep clicking... 🎯",
    "Almost there! 🔥",
    "One more! 💫",
    "🎉 You're awesome!",
    "Okay that's enough 😂",
    "Seriously? 🤯",
    "I admire your persistence 💪",
    "Fine, have a cookie 🍪",
    "🚀🚀🚀"
  ]

  const handleClick = () => {
    setClickCount(prev => (prev + 1) % messages.length)
  }

  return (
    <footer className="relative py-16 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)] overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -bottom-32 left-1/4 w-96 h-96 bg-[#6366f1]/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-32 right-1/4 w-64 h-64 bg-[#a855f7]/5 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#6366f1] rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              bottom: '20%',
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Animated wave divider */}
          <motion.div
            className="w-24 h-[2px] mb-8 relative"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent"
              animate={{
                opacity: [0.5, 1, 0.5],
                x: [-20, 20, -20],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Social links */}
          <motion.div
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {socials.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-10 h-10 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#9090a8] hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all"
                whileHover={{
                  scale: 1.1,
                  y: -4,
                  boxShadow: "0 8px 20px rgba(99, 102, 241, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </motion.div>

          {/* Main text - clickable easter egg */}
          <motion.div
            className="text-center mb-6 cursor-pointer select-none"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Easter egg message */}
            <motion.div
              className="h-6 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: clickCount > 0 ? 1 : 0 }}
            >
              <span className="text-[#6366f1] text-sm font-medium">
                {messages[clickCount]}
              </span>
            </motion.div>

            {/* Copyright with animated gradient */}
            <motion.p className="text-xl md:text-2xl font-bold">
              <span className="text-[#3a3a4a]">© 2026</span>
              {' '}
              <motion.span
                className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] via-[#ec4899] to-[#6366f1] bg-clip-text text-transparent bg-[length:300%_auto]"
                animate={{
                  backgroundPosition: ['0% center', '100% center', '0% center'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Ayro Escobar
              </motion.span>
            </motion.p>
          </motion.div>

          {/* Built with love - animated */}
          <motion.div
            className="flex items-center gap-2 text-[#9090a8] text-sm mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <span>Crafted with</span>
            <motion.span
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FaHeart className="text-[#ef4444]" size={14} />
            </motion.span>
            <span>&</span>
            <motion.span
              animate={{
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <FaCoffee className="text-[#d97706]" size={14} />
            </motion.span>
            <span>in</span>
            <motion.span
              className="font-semibold text-white"
              whileHover={{ color: '#6366f1' }}
            >
              Texas
            </motion.span>
            <motion.span
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <HiSparkles className="text-[#fbbf24]" size={14} />
            </motion.span>
          </motion.div>

          {/* Fun tagline */}
          <motion.p
            className="text-[#3a3a4a] text-xs tracking-wider"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ color: '#6366f1' }}
          >
            <motion.span
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              &lt;/&gt;
            </motion.span>
            {' '}with passion, shipped with pride{' '}
            <motion.span
              animate={{
                x: [0, 4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FaRocket className="inline text-[#6366f1]" size={10} />
            </motion.span>
          </motion.p>

          {/* Animated line at very bottom */}
          <motion.div
            className="mt-8 flex items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i === 2 ? '#6366f1' : '#2a2a3a',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  backgroundColor: i === 2 ? ['#6366f1', '#a855f7', '#6366f1'] : ['#2a2a3a', '#3a3a4a', '#2a2a3a'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
