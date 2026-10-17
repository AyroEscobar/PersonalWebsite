import { useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import { EMAIL } from '../content/constants.js'
import { SIGNAL } from '../content/signal.js'

/*
  <CopyEmail>: the address as a 20 px mailto link between two hairlines, a small square "copy" button
  at the right (aria-label "copy email"), and a role="status" aria-live="polite" span that reads
  "email copied" for 1.8 s while the button reads "copied". Clipboard API with the textarea fallback.
  States: rest · hover · focus · copied.
*/
export default function CopyEmail({ copied: forcedCopied, state, idPrefix = 'contact' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const kit = forcedCopied !== undefined
  const done = kit ? !!forcedCopied : copied
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      const t = document.createElement('textarea')
      t.value = EMAIL
      t.setAttribute('readonly', '')
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      try {
        document.execCommand('copy')
      } catch {
        /* nothing more to try */
      }
      t.remove()
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="email-row">
      <a id={`${idPrefix}-email`} className={['email', state && `is-${state}`].filter(Boolean).join(' ')} href={SIGNAL.email.mailto}>
        {SIGNAL.email.text}
      </a>
      <Button variant="line" size="sm" className="copy" aria-label={SIGNAL.copyEmail.text} onClick={kit ? undefined : copy} state={state} tabIndex={kit ? -1 : undefined}>
        {done ? SIGNAL.copied.text : SIGNAL.copy.text}
      </Button>
      <span className="copied" role="status" aria-live="polite">
        {done ? SIGNAL.copiedStatus.text : ''}
      </span>
    </div>
  )
}
