// Testimonials Section - Shows approved reviews from people Ayro has helped

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
    <section id="testimonials" className="py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            What People <span className="gradient-text">Say</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg">
            From hackers, students, and colleagues I've worked with
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-6 relative"
            >
              {/* Quote icon */}
              <FaQuoteLeft className="text-sky-400/20 text-3xl absolute top-4 right-4" />

              {/* Message */}
              <p className="text-white/70 text-sm leading-relaxed mb-4 relative z-10">
                "{testimonial.message}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-purple-400 flex items-center justify-center text-white font-medium text-sm">
                  {testimonial.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{testimonial.name}</p>
                  <p className="text-white/40 text-xs">{testimonial.role}</p>
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
