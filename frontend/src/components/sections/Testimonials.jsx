// Testimonials Section - Clean, minimal design

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
    <section id="testimonials" className="py-32 px-6 md:px-12 lg:px-24 border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[#38bdf8] text-sm font-medium tracking-widest uppercase mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
            What People<br />
            <span className="text-[#666666]">Say</span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group"
            >
              <div className="h-full p-6 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
                {/* Quote icon */}
                <FaQuoteLeft className="text-[rgba(255,255,255,0.06)] text-2xl mb-4" />

                {/* Message */}
                <p className="text-[#888888] text-sm leading-relaxed mb-6 group-hover:text-[#c2c2c2] transition-colors">
                  "{testimonial.message}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="w-10 h-10 rounded-full bg-[#111111] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#38bdf8] font-medium text-sm">
                    {testimonial.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-[#666666] text-xs">{testimonial.role}</p>
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
