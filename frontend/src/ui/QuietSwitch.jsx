import { CHROME } from '../content/meta.js'
import { toggleQuiet, useQuiet } from '../lib/mode.js'
import { useHydrated } from '../lib/hydrated.js'

/*
  The quiet switch (DESIGN.md 4.5): solid panels instead of glass. A 26x16 knob and the word
  "quiet", role="switch" with aria-checked, persisted (ae.quiet), applied before first paint by
  the boot script. Quiet does not stop the scene; "motion off" in the footer does.
  `pressed` forces a look for the kit (inert).
*/
export default function QuietSwitch({ pressed, state, className = '' }) {
  const quiet = useQuiet()
  const hydrated = useHydrated()
  const kit = pressed !== undefined
  const on = kit ? !!pressed : quiet
  return (
    <button
      type="button"
      role="switch"
      aria-checked={hydrated || kit ? on : false}
      title={CHROME.quietTip.text}
      className={['quiet', state && `is-${state}`, kit && 'kit-static', className].filter(Boolean).join(' ')}
      onClick={kit ? undefined : toggleQuiet}
      tabIndex={kit ? -1 : undefined}
    >
      <span className="quiet-knob" aria-hidden="true" />
      <span>{CHROME.quiet.text}</span>
    </button>
  )
}
