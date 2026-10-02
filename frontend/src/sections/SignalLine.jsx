import { useEffect, useRef, useState } from 'react'
import { SIGNAL } from '../content/signal.js'
import { announce } from '../lib/announce.js'
import { useReducedMotion } from '../lib/mode.js'
import { W } from './words.js'

/*
  SignalLine (PLAN.md 4.11). The address as big visible text (a mailto link,
  so a tap on a phone opens mail), a copy button and a write link.

  Copy sends a 6px sodium packet down a short stretch of road to a node
  labeled "plano, tx", linear, 720ms; the node lights when it lands, the
  button reads "copied" for 2s and a polite status says "email copied".
  Reduced motion or quiet mode: no packet, the words change at once.
  No Clipboard API (or it is refused): the address is selected instead and
  the status says how to finish the copy. Nothing claims a copy that did
  not happen.
*/

const TRAVEL_MS = 720
const at = SIGNAL.email.text.indexOf('@')
const HOLD_MS = 2000

export default function SignalLine() {
  const [phase, setPhase] = useState('idle') // idle | sending | copied | selected
  const addr = useRef(null)
  const timers = useRef([])
  const reduced = useReducedMotion()

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms))

  const onCopy = async () => {
    clear()
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SIGNAL.email.text)
        ok = true
      }
    } catch {
      ok = false
    }

    if (!ok) {
      const sel = window.getSelection?.()
      if (sel && addr.current) sel.selectAllChildren(addr.current)
      setPhase('selected')
      announce(W.copySelectedStatus.text)
      later(() => setPhase('idle'), HOLD_MS * 2)
      return
    }

    announce(SIGNAL.copiedStatus.text)
    // Already moving, or no motion wanted: land at once.
    if (reduced || phase === 'sending' || phase === 'copied') {
      setPhase('copied')
      later(() => setPhase('idle'), HOLD_MS)
      return
    }
    setPhase('sending')
    later(() => setPhase('copied'), TRAVEL_MS)
    later(() => setPhase('idle'), TRAVEL_MS + HOLD_MS)
  }

  const label =
    phase === 'copied' ? SIGNAL.copied.text : phase === 'selected' ? W.copySelected.text : SIGNAL.copy.text

  return (
    <div className="sl" data-phase={phase}>
      <a ref={addr} className="sl-addr" href={SIGNAL.email.mailto}>
        {/* If it has to wrap, it wraps after the @, never mid-word. */}
        {at > 0 ? (
          <>
            {SIGNAL.email.text.slice(0, at + 1)}
            <wbr />
            {SIGNAL.email.text.slice(at + 1)}
          </>
        ) : (
          SIGNAL.email.text
        )}
      </a>
      <div className="sl-row">
        <button
          type="button"
          className="btn-text sl-btn sl-copy mono no-js:hidden"
          onClick={onCopy}
          data-done={phase === 'copied' ? '' : undefined}
        >
          {label}
        </button>
        <a className="btn-text sl-btn mono" href={SIGNAL.email.mailto}>
          {SIGNAL.write.text}
        </a>
        <span className="sl-road" aria-hidden="true">
          <span className="sl-way">
            <span className="sl-packet" />
          </span>
          <span className="sl-node" />
          <span className="sl-label mono">{SIGNAL.packetLabel.text}</span>
        </span>
      </div>
    </div>
  )
}
