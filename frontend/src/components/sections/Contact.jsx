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
        <p className="mono text-[#8b4d2c] text-sm mb-5 tracking-widest">06. What's next</p>

        <h2
          className="font-bold mb-6"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #2d2520 0%, #57483b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Let's build something.
        </h2>

        <p className="text-[#6b5847] max-w-md mx-auto leading-relaxed mb-12">
          Hiring, co-founding, or just want to talk about what you're working on —
          inbox is open and I'm fast to reply.
        </p>

        <a href="mailto:ayro.escobar@gmail.com" className="btn-teal text-base !px-10 !py-5">
          ayro.escobar@gmail.com
        </a>
      </motion.div>
    </section>
  )
}
