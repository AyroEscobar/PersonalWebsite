// Testimonials Section - Compact design

import { motion } from 'framer-motion'
import { FaQuoteLeft } from 'react-icons/fa'
import { useTestimonials } from '../../hooks/useFirestore'

function Testimonials() {
  const { data: testimonials, loading, error } = useTestimonials()

  // Don't render if no testimonials or still loading
  if (loading || error || testimonials.length === 0) {
    return null
  }

  return (
    <section id="testimonials" className="py-24 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-[#6366f1] text-xs font-semibold tracking-widest uppercase mb-3">
            Testimonials
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            What People Say
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group"
            >
              <div className="h-full p-5 bg-[#12121a] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all">
                {/* Quote icon */}
                <FaQuoteLeft className="text-[#6366f1]/20 text-lg mb-3" />

                {/* Message */}
                <p className="text-[#8888a0] text-sm leading-relaxed mb-4">
                  "{testimonial.message}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center text-[#6366f1] font-semibold text-xs">
                    {testimonial.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-[#8888a0] text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
