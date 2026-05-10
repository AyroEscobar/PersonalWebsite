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
        <p className="mono text-[#64ffda] text-sm mb-5 tracking-widest">06. What's Next?</p>

        <h2
          className="font-bold mb-6"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #e6f1ff 0%, #a8b2d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Get In Touch
        </h2>

        <p className="text-[#8892a4] max-w-md mx-auto leading-relaxed mb-12">
          Whether you want to build something together, need a hackathon coach, or just
          want to say hi — my inbox is open.
        </p>

        <a href="mailto:ayro.escobar@gmail.com" className="btn-teal text-base !px-10 !py-5">
          Say Hello
        </a>
      </motion.div>
    </section>
  )
}
