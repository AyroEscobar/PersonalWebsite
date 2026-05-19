import { useState, useEffect, useCallback } from 'react'

const LINES = [
  { t: 'OPERATOR.SYS v2.0  //  AYRO ESCOBAR', c: '#6b7689' },
  { t: '> initializing kernel ............. OK', c: '#6ee7a3' },
  { t: '> mounting /sections .............. OK', c: '#6ee7a3' },
  { t: '> linking build.log ............... OK', c: '#6ee7a3' },
  { t: '> auth handshake .................. OK', c: '#6ee7a3' },
  { t: '> OPERATOR ........ AYRO ESCOBAR', c: '#6dd5ff' },
  { t: '> CLEARANCE ....... GRANTED', c: '#6dd5ff' },
  { t: '> SYSTEM ONLINE', c: '#ffb86b' },
]

export default function Boot({ onDone }) {
  const [n, setN] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const skip = useCallback(() => { setN(LINES.length); setLeaving(true) }, [])

  // Reveal a line at a time, then hold briefly.
  useEffect(() => {
    if (n < LINES.length) {
      const id = setTimeout(() => setN(v => v + 1), n === 0 ? 360 : 215)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setLeaving(true), 640)
    return () => clearTimeout(id)
  }, [n])

  // Fade out, then hand control back.
  useEffect(() => {
    if (!leaving) return
    const id = setTimeout(onDone, 520)
    return () => clearTimeout(id)
  }, [leaving, onDone])

  // Any key / click skips.
  useEffect(() => {
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [skip])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-bg scanlines"
      style={{
        transition: 'opacity .5s ease',
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      role="status"
      aria-label="System boot"
    >
      <div className="w-full max-w-[540px] px-7">
        {LINES.slice(0, n).map((l, i) => (
          <div
            key={i}
            className="font-mono"
            style={{ fontSize: '12.5px', lineHeight: 2.05, color: l.c }}
          >
            {l.t}
          </div>
        ))}
        {n < LINES.length && (
          <span className="blink font-mono text-cyan" style={{ fontSize: '12.5px' }}>▋</span>
        )}
        <div className="mt-6 eyebrow" style={{ opacity: 0.45 }}>
          press any key to skip
        </div>
      </div>
    </div>
  )
}
