// Footer - Animated and stylish

import { motion } from 'framer-motion'
import { FaHeart } from 'react-icons/fa'

function Footer() {
  const currentYear = 2026

  return (
    <footer className="py-12 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Animated divider */}
          <motion.div
            className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent"
            animate={{
              opacity: [0.5, 1, 0.5],
              scaleX: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Built with love */}
          <motion.div
            className="flex items-center gap-2 text-[#8888a0] text-sm"
            whileHover={{ scale: 1.05 }}
          >
            <span>Built with</span>
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FaHeart className="text-[#ef4444]" size={14} />
            </motion.span>
            <span>in Texas</span>
          </motion.div>

          {/* Copyright with animated gradient */}
          <motion.p
            className="text-lg font-semibold"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-[#3a3a4a]">© {currentYear}</span>
            {' '}
            <motion.span
              className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#6366f1] bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Ayro Escobar
            </motion.span>
          </motion.p>

          {/* Animated dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-[#6366f1]"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
