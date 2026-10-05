import Eyebrow from './Eyebrow.jsx'
import { SIGNAL } from '../content/signal.js'

/*
  <LinkRow> (DESIGN.md 5.12): the "elsewhere" eyebrow then GitHub · LinkedIn · Instagram as 16/540
  ink links with a cyan .55 underline 4 px below, brightening to cyan on hover; rel="me noopener".
  `states` (kit only) maps a channel id to 'hover' | 'focus'.
*/
export default function LinkRow({ states = {}, className = '' }) {
  const kit = Object.keys(states).length > 0
  return (
    <p className={`elsewhere ${className}`.trim()}>
      <Eyebrow as="span" className="elsewhere-label">
        {SIGNAL.elsewhere.text}
      </Eyebrow>
      {SIGNAL.channels.map((c) => (
        <a key={c.id} href={c.href} rel="me noopener" className={states[c.id] ? `is-${states[c.id]}` : undefined} tabIndex={kit ? -1 : undefined}>
          {c.label}
        </a>
      ))}
    </p>
  )
}
