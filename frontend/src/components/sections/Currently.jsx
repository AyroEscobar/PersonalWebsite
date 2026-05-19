import { motion } from 'framer-motion'
import { Panel } from '../ui/Panel'

const DOT = { green: '#6ee7a3', cyan: '#6dd5ff', amber: '#ffb86b', dim: '#6b7689' }

const STATUS = [
  { k: 'DEPLOYMENT', v: 'MD7 — Software Engineer', dot: 'green' },
  { k: 'NEXT OP',    v: 'JP Morgan · Summer 2026',  dot: 'cyan'  },
  { k: 'BASE',       v: 'Plano, Texas',             dot: 'dim'   },
  { k: 'SEEKING',    v: 'hard problems',            dot: 'amber' },
]

export default function Currently() {
  return (
    <div className="px-6 md:px-10 -mt-6 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-[1120px] mx-auto"
      >
        <Panel title="STATUS.NOW" meta="MAY 2026" bodyClass="p-0">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STATUS.map((s, i) => (
              <div
                key={s.k}
                className={`px-5 py-4 border-border ${i % 2 === 0 ? 'border-r' : ''} ${
                  i < 2 ? 'border-b lg:border-b-0' : ''
                } ${i === 2 ? 'lg:border-r' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: DOT[s.dot], boxShadow: `0 0 7px ${DOT[s.dot]}` }}
                  />
                  <span className="eyebrow">{s.k}</span>
                </div>
                <div className="text-ink" style={{ fontSize: '13.5px' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}
