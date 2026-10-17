import Eyebrow from './Eyebrow.jsx'
import { SIGNAL } from '../content/signal.js'

/*
  <LinkRow>: the "elsewhere" eyebrow, then GitHub · LinkedIn · Instagram as ink links with interpuncts
  between them; rel="me noopener". `states` (kit only) maps a channel id to 'hover' | 'focus'.
  data-short is the address without its scheme, which print shows in place of the label (print.css).
*/
const short = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
export default function LinkRow({ states = {}, className = '' }) {
  const kit = Object.keys(states).length > 0
  return (
    <p className={`elsewhere ${className}`.trim()}>
      <Eyebrow as="span" className="elsewhere-label">
        {SIGNAL.elsewhere.text}
      </Eyebrow>
      {SIGNAL.channels.map((c, i) => (
        <span key={c.id} className="elsewhere-item">
          {i > 0 && (
            <span className="ip" aria-hidden="true">
              ·
            </span>
          )}
          <a href={c.href} data-short={short(c.href)} rel="me noopener" className={states[c.id] ? `is-${states[c.id]}` : undefined} tabIndex={kit ? -1 : undefined}>
            {c.label}
          </a>
        </span>
      ))}
    </p>
  )
}
