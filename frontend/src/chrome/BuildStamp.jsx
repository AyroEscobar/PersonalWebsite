import { FOOTER } from '../content/meta.js'
import { BUILD_DATE, BUILD_SHA } from '../lib/build.js'
import { dateShort } from '../lib/format.js'

/*
  BuildStamp (PLAN.md 4.14). "build a1b2c3d · Oct 2, 2026": the short commit
  and the day this page was built, injected by Vite at build time, identical
  in the prerender and the client. A real number, not decoration.
*/
export default function BuildStamp({ className = '' }) {
  return (
    <p className={`stamp ${className}`.trim()}>
      <span className="stamp-key">{FOOTER.build.text}</span> <code className="stamp-sha">{BUILD_SHA}</code>
      <span aria-hidden="true"> · </span>
      <time dateTime={BUILD_DATE}>{dateShort(BUILD_DATE)}</time>
    </p>
  )
}
