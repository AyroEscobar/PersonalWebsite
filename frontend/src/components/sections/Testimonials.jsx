import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTestimonials } from '../../hooks/useFirestore'
import Section from '../ui/Section'

export default function Testimonials() {
  const { data: testimonials, loading, error } = useTestimonials()
  if (loading || error || testimonials.length === 0) return null

  return (
    <Section id="testimonials" code="SECTION 07 // SIGNAL" title="Inbound signal" intro="WHAT PEOPLE SAY">
      <div className="grid md:grid-cols-2 gap-5">
        {testimonials.slice(0, 4).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="panel panel-glow p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan" style={{ boxShadow: '0 0 7px #6dd5ff' }} />
              <span className="eyebrow">TRANSMISSION {String(i + 1).padStart(2, '0')}</span>
            </div>
            <p className="text-ink mb-4" style={{ fontSize: '13.5px', lineHeight: 1.8 }}>
              "{t.message}"
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0 font-mono text-cyan"
                style={{ background: 'rgba(109,213,255,0.08)', border: '1px solid rgba(109,213,255,0.3)', fontSize: '13px' }}
              >
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-ink" style={{ fontSize: '12.5px', fontWeight: 600 }}>{t.name}</p>
                {t.role && <p className="eyebrow">{t.role}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/review" className="btn-ghost">▸ Leave a Transmission</Link>
      </div>
    </Section>
  )
}
