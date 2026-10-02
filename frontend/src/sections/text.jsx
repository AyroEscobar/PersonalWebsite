import { monthLong, monthRange, monthYear } from '../lib/format.js'
import { W } from '../content/sections-ui.js'

/*
  Small renderers for content strings. None of them changes a word: they
  only add structure (<time>, emphasis on figures, dim separators). Each one
  falls back to the plain string when the structure would not reproduce it
  exactly, so the text on the page is always the text in src/content.
*/

// A figure in running text: 4,000+  60+  70%  2 hours  1 of 10. Not "13F", "K8" or a year.
// No lookbehind (older iOS Safari cannot parse it): group 1 is the character before.
const FIGURE = /(^|[^\w.,-])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\+|%)?)(?![\w-])/g
const YEAR = /^(19|20)\d\d$/

/** Running text with its figures set as tabular, brighter numerals. */
export function Figures({ text }) {
  const out = []
  let last = 0
  for (const m of text.matchAll(FIGURE)) {
    const fig = m[2]
    if (YEAR.test(fig)) continue
    const at = m.index + m[1].length
    if (at > last) out.push(text.slice(last, at))
    out.push(
      <span key={at} className="fig">
        {fig}
      </span>,
    )
    last = at + fig.length
  }
  if (!out.length) return text
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** "a · b · c" with the separators dimmed. The dots stay in the text. */
export function Dotted({ text }) {
  const parts = text.split(' · ')
  if (parts.length === 1) return text
  return parts.map((p, i) => (
    <span key={i}>
      {i > 0 && <span className="sep"> · </span>}
      {p}
    </span>
  ))
}

/**
 * A month range with machine-readable <time> elements:
 *   <time datetime="2026-01">January</time> to <time datetime="2026-04">April 2026</time>
 * Renders `text` as is when the structured form would read differently.
 */
export function MonthSpan({ start, end, text }) {
  if (!start || monthRange(start, end) !== text) return text
  const sameYear = end && start.slice(0, 4) === end.slice(0, 4)
  return (
    <>
      <span className="span-from">
        <time dateTime={start}>{sameYear ? monthLong(start) : monthYear(start)}</time>
      </span>
      <span className="span-to">
        {` ${W.to.text} `}
        {end ? <time dateTime={end}>{monthYear(end)}</time> : W.present.text}
      </span>
    </>
  )
}

/** Wrap one exact phrase of a verbatim string, or return the string untouched. */
export function Highlight({ text, phrase, className }) {
  const i = text.indexOf(phrase)
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <span className={className}>{phrase}</span>
      {text.slice(i + phrase.length)}
    </>
  )
}
