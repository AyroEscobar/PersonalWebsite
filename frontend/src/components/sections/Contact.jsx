import { motion } from 'framer-motion'

export default function Contact() {
  return (
    <section id="contact" className="py-36 px-6 md:px-12 max-w-[900px] mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="smallcaps mb-5">VI. — What's next</p>

        <h2
          className="text-[#2a1f15] mb-6"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 'clamp(44px, 6.5vw, 72px)',
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
          }}
        >
          Let's build something.
        </h2>

        <p
          className="text-[#4f3d2e] max-w-md mx-auto leading-relaxed mb-12"
          style={{ fontSize: '18px' }}
        >
          Hiring, co-founding, or just want to talk about what you're working on —
          inbox is open and I'm fast to reply.
        </p>

        <a
          href="mailto:ayro.escobar@gmail.com"
          className="btn-teal"
          style={{ fontSize: '19px', padding: '14px 32px' }}
        >
          ayro.escobar@gmail.com
        </a>
      </motion.div>
    </section>
  )
}
