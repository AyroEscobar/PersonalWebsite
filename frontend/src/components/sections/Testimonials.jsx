import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTestimonials } from '../../hooks/useFirestore'

export default function Testimonials() {
  const { data: testimonials, loading, error } = useTestimonials()
  if (loading || error || testimonials.length === 0) return null

  return (
    <section id="testimonials" className="py-28 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <h2 className="text-[#2d2520] text-2xl font-semibold flex items-center">
            <span className="num">05.</span>
            What People Say
            <span className="rule" />
          </h2>
          <Link to="/review" className="btn-teal !py-2.5 !px-5 !text-[12px]">
            + Leave a review
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {testimonials.slice(0, 4).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <p className="text-[#57483b] text-sm leading-relaxed mb-5 italic">
                "{t.message}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(139,77,44,0.07)]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mono text-[#8b4d2c] text-xs font-semibold flex-shrink-0"
                  style={{ background: 'rgba(139,77,44,0.08)', border: '1px solid rgba(139,77,44,0.2)' }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[#2d2520] text-sm font-medium">{t.name}</p>
                  {t.role && <p className="text-[#6b5847] text-xs">{t.role}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
