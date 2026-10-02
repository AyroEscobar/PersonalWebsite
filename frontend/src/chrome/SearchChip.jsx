import { useRef } from 'react'
import { CHROME } from '../content/meta.js'
import { useHydrated } from '../lib/hydrated.js'
import { openJump, prefetchJump } from './jump.js'

/*
  The search chip (PLAN.md 3.1, 4.6). Visible text "search", so speech users
  can say it, with the shortcut as a quiet <kbd>. Pointer-down warms the
  chunk; the click opens the list with focus already in its input.

    <SearchChip />               top bar chip with the shortcut
    <SearchChip bare />          bottom bar and 404: the word only

  It needs JavaScript, so without it the chip is not drawn (.js-only).
*/
const isMac = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

export default function SearchChip({ bare = false, className = '' }) {
  const ref = useRef(null)
  const hydrated = useHydrated()
  // Prerender says the Mac shortcut; other platforms get theirs once hydrated.
  const ctrl = CHROME.searchShortcutCtrl?.text
  const shortcut = hydrated && ctrl && !isMac() ? ctrl : CHROME.searchShortcut.text
  return (
    <button
      ref={ref}
      type="button"
      className={`search-chip js-only ${bare ? 'is-bare' : 'btn-text target-44'} ${className}`.trim()}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onPointerDown={prefetchJump}
      onFocus={prefetchJump}
      onClick={() => openJump({ instant: false, opener: ref.current })}
      data-chrome="search"
    >
      <svg className="search-mark" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="7" cy="7" r="4.6" />
        <path d="M10.4 10.4 14 14" />
      </svg>
      <span>{CHROME.search.text}</span>
      {!bare && (
        <kbd className="search-kbd" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}
