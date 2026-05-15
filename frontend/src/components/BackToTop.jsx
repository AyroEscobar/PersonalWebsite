import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const fn = () => setShow(window.scrollY > 720)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:-translate-y-0.5"
          style={{
            background: 'rgba(235,223,197,0.92)',
            border: '1px solid rgba(74,53,38,0.20)',
            boxShadow: '0 8px 22px rgba(74,53,38,0.12)',
            backdropFilter: 'blur(6px)',
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '13.5px',
            color: '#4f3d2e',
          }}
        >
          <span style={{ fontSize: '12px' }}>↑</span>
          back to top
        </motion.button>
      )}
    </AnimatePresence>
  )
}
