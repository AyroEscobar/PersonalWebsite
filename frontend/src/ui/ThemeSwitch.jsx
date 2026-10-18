import { CHROME } from '../content/meta.js'
import { announce } from '../lib/announce.js'
import { toggleTheme, useTheme } from '../lib/mode.js'
import { useHydrated } from '../lib/hydrated.js'

/*
  The theme switch: one button that reads "light · dark", the current one underlined. aria-pressed is
  true when the dark theme (red-figure) is on, and its name is "dark theme". The underline follows
  html[data-theme] in CSS, so it is right before hydration too. A switch writes data-theme, ae.theme
  and the theme-color meta, swaps the posters (CSS) and the scene's inks (a uniform write, no
  recompile; while the scene runs it is a kiln, a heat front through the painting), and is announced.
  `pressed` forces a look for the kit (inert). `before(flip)` lets the phone's menu sheet close first and
  then flip, so the kiln is seen happening to the painting, not behind the sheet.
*/
export default function ThemeSwitch({ pressed, className = '', before }) {
  const theme = useTheme()
  const hydrated = useHydrated()
  const kit = pressed !== undefined
  const dark = kit ? !!pressed : theme === 'dark'
  const flip = () => {
    const next = toggleTheme()
    announce(next === 'dark' ? CHROME.themeAnnounceDark.text : CHROME.themeAnnounceLight.text)
  }
  const onClick = () => (before ? before(flip) : flip())
  return (
    <button
      type="button"
      className={['tog', 'tog--theme', kit && (dark ? 'is-dark' : 'is-light'), className].filter(Boolean).join(' ')}
      aria-pressed={hydrated || kit ? dark : false}
      aria-label={CHROME.themeDarkLabel.text}
      onClick={kit ? undefined : onClick}
      tabIndex={kit ? -1 : undefined}
    >
      <span className="tog-l">{CHROME.themeLight.text}</span>
      <span className="ip" aria-hidden="true">
        ·
      </span>
      <span className="tog-d">{CHROME.themeDark.text}</span>
    </button>
  )
}
