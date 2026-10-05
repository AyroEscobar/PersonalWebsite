import { FOOTER } from '../content/meta.js'
import { BUILD_DATE, BUILD_SHA } from '../lib/build.js'

/*
  BuildStamp (DESIGN.md 5.13): "build a1b2c3d 2026-10-05", the short commit and the day this
  page was built, injected by Vite at build time, identical in the prerender and the client.
*/
export default function BuildStamp() {
  return (
    <span className="stamp">
      {FOOTER.build.text} <span className="tnum">{BUILD_SHA}</span> <time dateTime={BUILD_DATE}>{BUILD_DATE}</time>
    </span>
  )
}
