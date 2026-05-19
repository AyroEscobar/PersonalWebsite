import { motion } from 'framer-motion'

// Consistent section frame: code eyebrow + hairline + big title, scroll-revealed.
export default function Section({ id, code, title, intro, children, className = '' }) {
  return (
    <section id={id} className={`relative px-6 md:px-10 py-20 md:py-24 ${className}`}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-9"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="eyebrow text-cyan" style={{ letterSpacing: '0.2em' }}>{code}</span>
            <span className="flex-1 h-px bg-border" />
            {intro && <span className="eyebrow hidden sm:block">{intro}</span>}
          </div>
          <h2 className="section-title">{title}</h2>
        </motion.div>
        {children}
      </div>
    </section>
  )
}
