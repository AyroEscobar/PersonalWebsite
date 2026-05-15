import { motion } from 'framer-motion'

const ITEMS = [
  { label: 'shipping at',      value: 'MD7'              },
  { label: 'counting down to', value: 'JP Morgan, summer'},
  { label: 'coffee in',        value: 'Plano, Texas'     },
  { label: 'looking for',      value: 'hard problems'    },
]

const italicSerif = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

export default function Currently() {
  return (
    <section className="pt-2 pb-10 px-6 md:px-12 max-w-[900px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="smallcaps mb-5">A dispatch from the desk</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#4f3d2e]">
          {ITEMS.map((it, i) => (
            <div key={it.label} className="flex items-center gap-6">
              <span style={{ ...italicSerif, fontSize: '17px' }}>
                {it.label}{' '}
                <span className="text-[#2a1f15]" style={{ fontWeight: 600 }}>{it.value}</span>
              </span>
              {i < ITEMS.length - 1 && (
                <span
                  className="text-[#9c8a72] hidden sm:inline"
                  style={{ ...italicSerif, fontSize: '17px', opacity: 0.6 }}
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
