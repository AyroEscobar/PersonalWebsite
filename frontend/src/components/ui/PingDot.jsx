import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAMED = {
  green: '#6ee7a3',
  cyan:  '#6dd5ff',
  amber: '#ffb86b',
  red:   '#ff6b8a',
}

// Small clickable status dot — emits a sonar ring on click.
// Use anywhere a static dot was sitting next to a label.
export default function PingDot({
  color = 'green',
  size = 6,
  glow = true,
  pulse = false,
  className = '',
  ariaLabel = 'Ping',
}) {
  const [pings, setPings] = useState([])
  const c = NAMED[color] || color

  const fire = (e) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    const id = Date.now() + Math.random()
    setPings((arr) => [...arr, id])
    setTimeout(() => setPings((arr) => arr.filter((x) => x !== id)), 1300)
  }

  const pad = 4 // hit area padding around the visible dot

  return (
    <button
      type="button"
      onClick={fire}
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center group ${className}`}
      style={{
        width: size + pad * 2,
        height: size + pad * 2,
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <span
        className="block rounded-full transition-transform group-hover:scale-125"
        style={{
          width: size,
          height: size,
          background: c,
          boxShadow: glow ? `0 0 8px ${c}` : 'none',
          animation: pulse ? 'blink 1.4s ease-in-out infinite' : 'none',
        }}
      />
      <AnimatePresence>
        {pings.map((id) => (
          <motion.span
            key={id}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 28, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              border: `1px solid ${c}`,
              background: 'transparent',
            }}
          />
        ))}
      </AnimatePresence>
    </button>
  )
}
