import { useEffect, useState } from 'react'
import Glass from '../glass/Glass.jsx'
import { Check } from './icons.jsx'
import { listeners } from './toast-bus.js'

/*
  The toast (DESIGN.md 5.11): one role="status" region, bottom right on wide
  screens, bottom centre above the dock on phones. Glass thick at r-3, 44px,
  a check and one word. Enters from 8px below (@starting-style), leaves in
  150 ms, dismisses itself after 2.4 s, and the timer pauses while the tab
  is hidden.

    toast('copied')      from anywhere (src/ui/toast-bus.js)
    <ToastRegion />      once per page
    <ToastView text />   the toast alone, for the kit
*/
export function ToastView({ text, leaving = false }) {
  return (
    <Glass tier="thick" className="toast" data-leaving={leaving ? '' : undefined}>
      <Check />
      <span>{text}</span>
    </Glass>
  )
}

export default function ToastRegion() {
  const [t, setT] = useState(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const on = (next) => {
      setLeaving(false)
      setT(next)
    }
    listeners.add(on)
    return () => listeners.delete(on)
  }, [])

  useEffect(() => {
    if (!t) return
    let left = 2400
    let start = performance.now()
    let timer = 0
    let gone = 0
    const run = () => {
      start = performance.now()
      timer = window.setTimeout(() => {
        setLeaving(true)
        gone = window.setTimeout(() => setT(null), 150)
      }, left)
    }
    const vis = () => {
      if (document.hidden) {
        window.clearTimeout(timer)
        left -= performance.now() - start
      } else run()
    }
    run()
    document.addEventListener('visibilitychange', vis)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(gone)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [t])

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {t && <ToastView key={t.id} text={t.text} leaving={leaving} />}
    </div>
  )
}
