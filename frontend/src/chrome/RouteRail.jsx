import { SECTIONS } from '../content/sections.js'
import { CHROME } from '../content/meta.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by B (PLAN.md 4.5). Replace this file.

  Contract: default export RouteRail, no props. Renders
  <nav aria-label="Sections"><ol><li><a href="#id">label</a>... in SECTIONS order,
  with aria-current on the stop in view. Desktop: 72px left rail
  (var(--rail-w)). Phones: the 56px bottom bar (var(--bottombar-h)).
*/
export default function RouteRail() {
  return (
    <nav aria-label={CHROME.sectionsNav.text} className="fixed bottom-0 left-0 z-rail lg:top-topbar lg:bottom-auto">
      <ol className="flex gap-1 bg-night/90 p-2 lg:flex-col">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="link-quiet mono inline-flex min-h-[44px] items-center px-2">
              {s.label.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
