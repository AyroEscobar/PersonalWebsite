import { FOOTER } from '../content/meta.js'
import { MAP } from '../content/places.js'
import { REPO } from '../content/constants.js'
import { BUILD_DATE, BUILD_SHA } from '../lib/build.js'
import { dateShort } from '../lib/format.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by B (PLAN.md 3.9, 4.14). Replace this file.

  Contract: default export Footer, no props. Renders the one <footer>.
  BuildStamp reads BUILD_SHA and BUILD_DATE from src/lib/build.js.
  VisitStamp is client-only (ui/ClientOnly) and omitted when the APIs are missing.
*/
export default function Footer() {
  return (
    <footer className="page hair-t pb-[calc(var(--bottombar-h)+32px)] pt-8">
      <div className="mono flex flex-col gap-2 text-dim">
        <p>{FOOTER.line.text}</p>
        <p>
          {FOOTER.build.text} {BUILD_SHA} · {dateShort(BUILD_DATE)}
        </p>
        <p>{MAP.attribution.text}</p>
        <p>{FOOTER.noTracking.text}</p>
        <p>
          <a href={REPO}>{FOOTER.source.text}</a>
        </p>
      </div>
    </footer>
  )
}
