import { motion } from 'framer-motion'
import Section from '../ui/Section'
import { Panel } from '../ui/Panel'

export default function Contact() {
  return (
    <Section id="contact" code="SECTION 08 // CHANNEL" title="Open channel" intro="REACH THE OPERATOR">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Panel title="OPEN.CHANNEL" accent="green" meta="RESPONSE ~FAST" glow scan>
          <div className="font-mono mb-5" style={{ fontSize: '12.5px' }}>
            <div className="text-dim">
              <span className="text-green">$</span> open channel
            </div>
            <div className="text-green mt-1.5">▸ channel open · inbox monitored daily</div>
          </div>

          <p className="text-dim mb-7 max-w-[520px]" style={{ fontSize: '14px', lineHeight: 1.85 }}>
            Building something, stuck on something hard, or just want to trade ideas? My
            inbox is open and I move fast. I am always down to meet people who build.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="mailto:ayro.escobar@gmail.com" className="btn-term">
              ▸ ayro.escobar@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/ayroescobar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/AyroEscobar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              GitHub
            </a>
          </div>
        </Panel>
      </motion.div>
    </Section>
  )
}
