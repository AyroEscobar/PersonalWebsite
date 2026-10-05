import Glass from '../glass/Glass.jsx'
import { EMAIL } from '../content/constants.js'
import { SIGNAL } from '../content/signal.js'

/*
  The link row (DESIGN.md 5.9): one glass row at r-3 with 4px padding,
  items 36px (44 on phones) at r-3 minus 4. Email first, then the channels.
  `states` (kit only) maps a channel id to 'hover' | 'focus' | 'active';
  `label` names the landmark when a page has more than one row.
*/
const LINKS = [{ id: 'channel-email', label: SIGNAL.emailLabel.text, href: `mailto:${EMAIL}` }, ...SIGNAL.channels]

export default function LinkRow({ links = LINKS, states = {}, label = SIGNAL.elsewhere.text, className = '' }) {
  return (
    <Glass as="nav" tier="thick" lens="row" spec className={`linkrow ${className}`.trim()} aria-label={label}>
      {links.map((l) => (
        <a key={l.id} href={l.href} className={states[l.id] ? `is-${states[l.id]}` : undefined}>
          {l.label}
        </a>
      ))}
    </Glass>
  )
}
