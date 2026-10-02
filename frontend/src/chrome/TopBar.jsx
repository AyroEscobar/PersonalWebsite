import { HERO } from '../content/identity.js'
import { CHROME } from '../content/meta.js'
import { planoTime, useMinute } from '../lib/clock.js'
import { toggleQuiet, useQuiet } from '../lib/mode.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by B (PLAN.md 3.1, 4.7, 4.12). Replace this file.

  Contract: default export TopBar, no props. Renders the one <header>.
  Focus order inside: name, clock chip, quiet, search (QA step 10).
  Height is var(--topbar-h); html scroll-padding-top already accounts for it.
*/
export default function TopBar() {
  const now = useMinute()
  const quiet = useQuiet()
  const t = now ? planoTime(now) : null
  return (
    <header className="fixed inset-x-0 top-0 z-bar h-topbar bg-night/90 hair-b">
      <div className="flex h-full items-center justify-between gap-4 px-pad">
        <a href="#origin" className="link-quiet whitespace-nowrap font-bold">
          {HERO.name.text}
        </a>
        <div className="flex items-center gap-3">
          <span className="mono whitespace-nowrap text-dim">
            {CHROME.clockPlace.text} ·{' '}
            {t ? <time dateTime={t.datetime}>{t.text}</time> : <span>{CHROME.clockPlaceholder.text}</span>}
          </span>
          <button type="button" className="btn-text target-44 hidden md:inline-flex" aria-pressed={quiet} onClick={toggleQuiet}>
            {quiet ? CHROME.quietOn.text : CHROME.quiet.text}
          </button>
        </div>
      </div>
    </header>
  )
}
