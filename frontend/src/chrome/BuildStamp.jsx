import { FOOTER } from '../content/meta.js'
import { BUILD_DATE, BUILD_SHA } from '../lib/build.js'
import { dateShort } from '../lib/format.js'

/*
  BuildStamp (DESIGN.md 5.14): "build a1b2c3d, Oct 2, 2026", the short
  commit and the day this page was built, injected by Vite at build time,
  identical in the prerender and the client. Tabular Inter, no monospace.
*/
export default function BuildStamp({ className = '' }) {
  return (
    <p className={`stamp ${className}`.trim()}>
      {FOOTER.build.text} <span className="tnum">{BUILD_SHA}</span>, <time dateTime={BUILD_DATE}>{dateShort(BUILD_DATE)}</time>
    </p>
  )
}
