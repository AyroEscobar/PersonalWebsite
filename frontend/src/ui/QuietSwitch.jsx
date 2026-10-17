import { CHROME } from '../content/meta.js'
import { toggleQuiet, useQuiet } from '../lib/mode.js'
import { useHydrated } from '../lib/hydrated.js'

/*
  The quiet switch: the poster instead of the live scene. The word "quiet" in the label face,
  role="switch" with aria-checked, underlined when on, persisted (ae.quiet) and applied before first
  paint by the boot script. On, the scene is unmounted and the poster stays (every plate is already
  solid). `pressed` forces a look for the kit (inert).
*/
export default function QuietSwitch({ pressed, className = '' }) {
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
      className={['tog', 'quiet', kit && 'kit-static', className].filter(Boolean).join(' ')}
      onClick={kit ? undefined : toggleQuiet}
      tabIndex={kit ? -1 : undefined}
    >
      {CHROME.quiet.text}
    </button>
  )
}
