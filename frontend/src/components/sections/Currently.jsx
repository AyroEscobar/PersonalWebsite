import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Panel } from '../ui/Panel'

const COLORS = {
  ok:      '#6ee7a3',
  pending: '#ffb86b',
  bracket: '#424b5e',
  label:   '#6dd5ff',
  op:      '#3a4255',
  text:    '#aeb9c9',
  ink:     '#d4dde9',
}

function useClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Chicago' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

const scrollToId = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Currently() {
  const time = useClock()

  const lines = [
    {
      tag: 'OK',
      segs: [['mono', 'operator.ayro'], ['op', '//'], ['mono', 'online'], ['op', '·'], ['mono', `${time || '——:——:——'} CT`]],
    },
    {
      tag: 'OK', href: 'about',
      segs: [['label', 'base'], ['op', '·'], ['mono', 'tx']],
    },
    {
      tag: 'OK', href: 'roles',
      segs: [['label', 'shipped'], ['op', '·'], ['mono', 'rbc nyc'], ['op', '·'], ['mono', 'md7']],
    },
    {
      tag: 'OK', href: 'roles',
      segs: [['label', 'incoming'], ['op', '·'], ['mono', 'jpmc'], ['op', '·'], ['mono', 'jun 2026']],
    },
    {
      tag: 'OK', href: 'projects',
      segs: [['label', 'home stack'], ['op', '·'], ['mono', 'agents + tools'], ['op', '·'], ['ok', 'always on']],
    },
    {
      tag: '..', pending: true, href: 'about',
      segs: [['label', 'mission'], ['op', '·'], ['ink', 'ship things that outlast me']],
    },
  ]

  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= lines.length) return
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 280 : 105)
    return () => clearTimeout(t)
  }, [shown, lines.length])

  return (
    <div className="px-6 md:px-10 -mt-6 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-[1120px] mx-auto"
      >
        <Panel title="STATUS.LIVE" meta="SYSTEM CHECK">
          <div className="font-mono" style={{ fontSize: '12.5px', lineHeight: 1.95 }}>
            {lines.slice(0, shown).map((line, i) => {
              const interactive = !!line.href
              const Tag = interactive ? 'button' : 'div'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Tag
                    onClick={interactive ? () => scrollToId(line.href) : undefined}
                    className={`group w-full text-left flex flex-wrap items-center gap-x-1.5 -mx-2 px-2 rounded-sm transition-colors ${
                      interactive ? 'hover:bg-[rgba(109,213,255,0.05)] cursor-pointer' : 'cursor-default'
                    }`}
                    style={{ background: 'transparent', border: 0, paddingTop: 1, paddingBottom: 1 }}
                  >
                    <span style={{ color: COLORS.bracket }} className={interactive ? 'group-hover:text-cyan transition-colors' : ''}>[</span>
                    <span
                      style={{
                        color: line.pending ? COLORS.pending : COLORS.ok,
                        minWidth: '1.6ch',
                        display: 'inline-block',
                        textAlign: 'center',
                      }}
                    >
                      {line.tag}
                    </span>
                    <span style={{ color: COLORS.bracket }} className={interactive ? 'group-hover:text-cyan transition-colors' : ''}>]</span>
                    {line.segs.map(([kind, t], j) => (
                      <span
                        key={j}
                        style={{
                          color:
                            kind === 'op'    ? COLORS.op    :
                            kind === 'label' ? COLORS.label :
                            kind === 'ok'    ? COLORS.ok    :
                            kind === 'ink'   ? COLORS.ink   :
                                               COLORS.text,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    {interactive && (
                      <span
                        className="ml-auto pl-3 text-muted opacity-0 group-hover:opacity-60 transition-opacity"
                        style={{ fontSize: '10.5px', letterSpacing: '0.14em' }}
                      >
                        cd ./{line.href} →
                      </span>
                    )}
                  </Tag>
                </motion.div>
              )
            })}
            {shown >= lines.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-1.5 mt-2 px-2"
              >
                <span style={{ color: COLORS.bracket }}>$</span>
                <span style={{ color: COLORS.text }} className="opacity-60">_</span>
                <span className="blink" style={{ color: COLORS.label }}>▋</span>
              </motion.div>
            )}
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}
