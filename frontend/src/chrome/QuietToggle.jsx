import { CHROME } from '../content/meta.js'
import { toggleQuiet, useQuiet } from '../lib/mode.js'
import { useHydrated } from '../lib/hydrated.js'

/*
  QuietToggle (PLAN.md 4.12). The recruiter view and the WCAG 2.2.2 pause
  control, as a visible word. Same DOM, same content: no canvas, no first
  paint, no horizon tint, no beacon cycle, no specimen motion, contrast up.
  The choice is stored per viewer (lib/store.js setMode).

  The label is driven by html[data-mode] in CSS, not by React state, so a
  visitor who chose quiet last time sees "quiet: on" in the prerendered
  paint instead of a flip at hydration. aria-pressed follows once hydrated.

    <QuietToggle />                 top bar chip: "quiet" / "quiet: on"
    <QuietToggle variant="link" />  footer: "quiet mode", pressed or not
    <QuietToggle variant="row" />   the phone stops sheet
*/
export default function QuietToggle({ variant = 'chip', className = '' }) {
  const quiet = useQuiet()
  const hydrated = useHydrated()
  // Every variant needs JavaScript to do anything, so none is drawn without it (.js-only).
  const cls =
    variant === 'link'
      ? 'quiet-toggle js-only quiet-link'
      : variant === 'row'
        ? 'quiet-toggle js-only quiet-row'
        : 'quiet-toggle js-only btn-text target-44 quiet-chip'
  return (
    <button
      type="button"
      className={`${cls} ${className}`.trim()}
      aria-pressed={hydrated ? quiet : undefined}
      onClick={toggleQuiet}
      data-chrome="quiet"
    >
      <span className="quiet-lamp" aria-hidden="true" />
      {variant === 'link' ? (
        <span>{CHROME.quietMode.text}</span>
      ) : (
        <>
          <span className="quiet-off">{CHROME.quiet.text}</span>
          <span className="quiet-on">{CHROME.quietOn.text}</span>
        </>
      )}
    </button>
  )
}
