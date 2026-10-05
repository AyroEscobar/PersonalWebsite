import { W } from '../content/sections-ui.js'

/*
  <Chip> (DESIGN.md 5.4): a 28px pill that is never interactive.

    <Chip status="now" />    a status chip: a hairline enters from its left
    <Chip status="past" />   (accent for now, ink-3 for past), word in italic serif
    <Chip>2026</Chip>        plain: numbers in tabular Inter 13
    <Chip word>single file</Chip>   plain, a word in italic serif
*/
export default function Chip({ status, word = false, className = '', children }) {
  if (status) {
    const text = children ?? (status === 'now' ? W.now.text : W.past.text)
    return (
      <span className={`chip chip--${status} ${className}`.trim()}>
        <span className="chip-word">{text}</span>
      </span>
    )
  }
  return <span className={`chip ${className}`.trim()}>{word ? <span className="chip-word">{children}</span> : children}</span>
}
