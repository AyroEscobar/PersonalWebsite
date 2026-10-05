import Glass from '../glass/Glass.jsx'
import Tooltip from './Tooltip.jsx'
import { CHROME } from '../content/meta.js'
import { toggleQuiet, useQuiet } from '../lib/mode.js'
import { useHydrated } from '../lib/hydrated.js'

/*
  The quiet switch (DESIGN.md 5.2, 4.4.2): solid panels instead of glass.
  It sets html[data-transparency], which Safari needs because it ignores
  prefers-reduced-transparency, and remembers the choice (ae.quiet).
  A 32px glass pill (44 on phones) with a 14px knob and the word "quiet".

  The pressed look is driven by html[data-transparency] in CSS before
  hydration (so a returning visitor never sees it flip); aria-pressed
  follows once hydrated. `state` and `pressed` force a look for the kit.
*/
export default function QuietSwitch({ state, pressed, tip = true, tipOpen = false }) {
  const quiet = useQuiet()
  const hydrated = useHydrated()
  const kit = state !== undefined || pressed !== undefined
  const on = kit ? !!pressed : quiet
  const btn = (
    <Glass
      as="button"
      type="button"
      tier="thick"
      pill
      spec
      className={['quiet', state && `is-${state}`, kit && on && 'is-pressed'].filter(Boolean).join(' ')}
      aria-pressed={hydrated || kit ? on : undefined}
      onClick={kit ? undefined : toggleQuiet}
      tabIndex={kit ? -1 : undefined}
      data-kit={kit ? '' : undefined}
    >
      <span className="quiet-track" aria-hidden="true">
        <span className="quiet-knob" />
      </span>
      <span>{CHROME.quiet.text}</span>
    </Glass>
  )
  return tip ? (
    <Tooltip label={CHROME.quietTip.text} open={tipOpen} below>
      {btn}
    </Tooltip>
  ) : (
    btn
  )
}
