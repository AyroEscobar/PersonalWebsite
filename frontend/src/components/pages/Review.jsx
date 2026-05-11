import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FaCheckCircle, FaPaperPlane, FaArrowLeft } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useTestimonials } from '../../hooks/useFirestore'

const MIN = 20
const MAX = 300

const ROLES = ['Hacker', 'Hackathon Organizer', 'Mentee', 'Student', 'Colleague', 'Friend', 'Other']

export default function Review() {
  const [form, setForm]         = useState({ name: '', role: '', message: '', website: '' })
  const [submitting, setSub]    = useState(false)
  const [submitted, setDone]    = useState(false)
  const [error, setError]       = useState(null)
  const { data: testimonials }  = useTestimonials()

  const onChange = (e) => {
    const { name, value } = e.target
    if (name === 'message' && value.length > MAX) return
    setForm(p => ({ ...p, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.website) { setDone(true); return }
    if (form.message.length < MIN) { setError(`${MIN - form.message.length} more characters needed.`); return }
    setSub(true)
    try {
      await addDoc(collection(db, 'testimonials'), {
        name: form.name.trim(),
        role: form.role,
        message: form.message.trim(),
        approved: false,
        date: serverTimestamp(),
      })
      setDone(true)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSub(false)
    }
  }

  const len   = form.message.length
  const valid = len >= MIN && len <= MAX

  /* ─── Success ─── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md w-full"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(139,77,44,0.1)', border: '1px solid rgba(139,77,44,0.3)' }}
          >
            <FaCheckCircle className="text-[#8b4d2c] text-3xl" />
          </div>
          <h2 className="text-[#2d2520] text-2xl font-semibold mb-3">Thank You!</h2>
          <p className="text-[#6b5847] mb-8 leading-relaxed">
            Your kind words mean a lot. Your review will appear on the site after a quick check.
          </p>
          <Link to="/" className="btn-teal">Back to Home</Link>
        </motion.div>
      </div>
    )
  }

  /* ─── Form ─── */
  return (
    <div className="min-h-screen px-6 md:px-12 pt-28 pb-16">
      <div className="max-w-[900px] mx-auto">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/" className="mono text-[13px] text-[#6b5847] hover:text-[#8b4d2c] transition-colors flex items-center gap-2">
            <FaArrowLeft size={11} /> Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <p className="mono text-[#8b4d2c] text-sm mb-3 tracking-widest">Leave a Review</p>
          <h1
            className="font-bold mb-3"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(32px, 5vw, 52px)',
              background: 'linear-gradient(135deg, #2d2520, #57483b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Worked with me?
          </h1>
          <p className="text-[#6b5847] max-w-md">
            At a hackathon, project, or event? I'd love to hear how I helped.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-[3fr_2fr] gap-10 items-start">

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <form onSubmit={onSubmit} className="glass-card p-8 space-y-5">
              {/* Honeypot */}
              <input
                type="text" name="website" value={form.website} onChange={onChange}
                style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off"
              />

              <div>
                <label className="block text-[#57483b] text-sm mb-2">Your Name</label>
                <input
                  type="text" name="name" value={form.name} onChange={onChange}
                  required placeholder="Jane Doe"
                  className="field"
                />
              </div>

              <div>
                <label className="block text-[#57483b] text-sm mb-2">How do you know me?</label>
                <select name="role" value={form.role} onChange={onChange} required className="field">
                  <option value="" disabled>Select one…</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[#57483b] text-sm mb-2">How did I help you?</label>
                <textarea
                  name="message" value={form.message} onChange={onChange}
                  required rows={4} placeholder="Share a quick story…"
                  className="field resize-none"
                />
                <div className="flex justify-between mt-2">
                  <span className={`mono text-[11px] ${len < MIN ? 'text-[#f0b429]' : 'text-[#6b5847]'}`}>
                    {len < MIN ? `${MIN - len} more characters needed` : 'Looks good!'}
                  </span>
                  <span className={`mono text-[11px] ${len > MAX * 0.9 ? 'text-[#f0b429]' : 'text-[#6b5847]'}`}>
                    {len}/{MAX}
                  </span>
                </div>
              </div>

              {error && <p className="text-[#f0b429] text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !valid}
                className="btn-teal w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-[#8b4d2c]/30 border-t-[#8b4d2c] rounded-full animate-spin" /> Submitting…</>
                  : <><FaPaperPlane size={13} /> Submit Review</>
                }
              </button>
            </form>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <p className="mono text-[12px] text-[#6b5847] mb-5 tracking-wider">
              {testimonials?.length || 0} people have shared their experience
            </p>

            {testimonials?.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="glass-card p-5"
              >
                <p className="text-[#6b5847] text-sm mb-3 italic line-clamp-3">"{t.message}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mono text-[#8b4d2c] text-xs flex-shrink-0"
                    style={{ background: 'rgba(139,77,44,0.08)', border: '1px solid rgba(139,77,44,0.2)' }}
                  >
                    {t.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[#2d2520] text-sm font-medium">{t.name}</p>
                    <p className="text-[#6b5847] text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {(!testimonials || testimonials.length === 0) && (
              <div className="glass-card p-6 text-center">
                <p className="text-[#6b5847] text-sm">Be the first to leave a review!</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
