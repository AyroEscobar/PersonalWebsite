// Review Page - Form for people to submit testimonials about Ayro
// URL: /review (share this link with people you've helped)

import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FaCheckCircle, FaPaperPlane, FaHeart } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useTestimonials } from '../../hooks/useFirestore'

const MIN_MESSAGE_LENGTH = 20
const MAX_MESSAGE_LENGTH = 300

function Review() {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    message: '',
    website: '' // Honeypot field - bots will fill this, humans won't see it
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  // Get approved testimonials to show as social proof
  const { data: testimonials } = useTestimonials()

  const roles = [
    'Hacker',
    'Hackathon Organizer',
    'Mentee',
    'Student',
    'Colleague',
    'Friend',
    'Other'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target

    // Enforce max length on message
    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) {
      return
    }

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Honeypot check - if filled, it's a bot
    if (formData.website) {
      // Silently "succeed" but don't actually submit
      setSubmitted(true)
      return
    }

    // Validate message length
    if (formData.message.length < MIN_MESSAGE_LENGTH) {
      setError(`Please write at least ${MIN_MESSAGE_LENGTH} characters.`)
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'testimonials'), {
        name: formData.name.trim(),
        role: formData.role,
        message: formData.message.trim(),
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

  const messageLength = formData.message.length
  const isMessageValid = messageLength >= MIN_MESSAGE_LENGTH && messageLength <= MAX_MESSAGE_LENGTH

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
            Your kind words mean so much to me. Your review will appear on my site shortly!
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
    <div className="min-h-screen px-4 pt-20 pb-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Leave a <span className="gradient-text">Review</span>
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Worked with me at a hackathon, project, or event? I'd love to hear how I helped you!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8">
              {/* Honeypot - hidden from humans */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={{ position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
              />

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
                  How did I help you?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Share a quick story about how I helped you..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition-colors resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${messageLength < MIN_MESSAGE_LENGTH ? 'text-amber-400' : 'text-white/30'}`}>
                    {messageLength < MIN_MESSAGE_LENGTH
                      ? `${MIN_MESSAGE_LENGTH - messageLength} more characters needed`
                      : 'Keep it short and sweet!'
                    }
                  </span>
                  <span className={`text-xs ${messageLength > MAX_MESSAGE_LENGTH * 0.9 ? 'text-amber-400' : 'text-white/30'}`}>
                    {messageLength}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting || !isMessageValid}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
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
            </form>
          </motion.div>

          {/* Social Proof - Show existing testimonials */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-white/50 mb-4">
              <FaHeart className="text-red-400" />
              <span className="text-sm font-medium">
                {testimonials?.length || 0} people have shared their experience
              </span>
            </div>

            {testimonials?.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass rounded-2xl p-5"
              >
                <p className="text-white/80 text-sm mb-3 line-clamp-3">
                  "{t.message}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {t.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {(!testimonials || testimonials.length === 0) && (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-white/50 text-sm">
                  Be one of the first to leave a review!
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Review
