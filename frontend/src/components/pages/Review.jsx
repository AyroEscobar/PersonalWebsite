// Review Page - Form for people to submit testimonials about Ayro
// URL: /review (share this link with people you've helped)

import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FaCheckCircle, FaPaperPlane } from 'react-icons/fa'
import { Link } from 'react-router-dom'

function Review() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const roles = [
    'Student',
    'Hacker',
    'Hackathon Organizer',
    'Mentee',
    'Colleague',
    'Other'
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Add testimonial to Firestore (approved: false by default)
      await addDoc(collection(db, 'testimonials'), {
        name: formData.name,
        role: formData.role,
        message: formData.message,
        approved: false,
        date: serverTimestamp()
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 md:p-12 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FaCheckCircle className="text-green-400 text-3xl" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
          <p className="text-white/60 mb-6">
            Your review has been submitted and is pending approval. I really appreciate you taking the time!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition-colors"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Leave a <span className="gradient-text">Review</span>
          </h1>
          <p className="text-white/50">
            Worked with me at a hackathon or project? I'd love to hear about your experience!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8">
          {/* Name */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-white/70 text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>

          {/* Role */}
          <div className="mb-5">
            <label htmlFor="role" className="block text-white/70 text-sm font-medium mb-2">
              How do you know me?
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#0B0B42]">Select an option</option>
              {roles.map(role => (
                <option key={role} value={role} className="bg-[#0B0B42]">{role}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-white/70 text-sm font-medium mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="How did I help you? What was your experience working with me?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white font-medium rounded-xl transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Submit Review
              </>
            )}
          </motion.button>

          <p className="text-white/30 text-xs text-center mt-4">
            Your review will be visible after approval.
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default Review
