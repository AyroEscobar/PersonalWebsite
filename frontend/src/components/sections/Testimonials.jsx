import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTestimonials } from '../../hooks/useFirestore'

const serifItalic = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

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
          <h2
            className="text-[#2a1f15] flex items-center"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '32px' }}
          >
            <span className="num">V.</span>
            What People Say
            <span className="rule" />
          </h2>
          <Link to="/review" className="btn-teal !py-2 !px-4 !text-[14px]">
            Leave a note
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
              className="glass-card p-7"
            >
              <span
                className="block text-[#9e451d] mb-3"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '42px',
                  lineHeight: 0.5,
                  fontWeight: 700,
                  opacity: 0.5,
                }}
              >
                “
              </span>
              <p
                className="text-[#4f3d2e] leading-relaxed mb-5"
                style={{ ...serifItalic, fontSize: '16.5px' }}
              >
                {t.message}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(158,69,29,0.14)]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#9e451d] text-sm flex-shrink-0"
                  style={{
                    background: 'rgba(158,69,29,0.10)',
                    border: '1px solid rgba(158,69,29,0.28)',
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                  }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[#2a1f15] font-medium" style={{ fontSize: '15px' }}>
                    {t.name}
                  </p>
                  {t.role && (
                    <p
                      className="text-[#6b5645]"
                      style={{ ...serifItalic, fontSize: '13px' }}
                    >
                      {t.role}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
