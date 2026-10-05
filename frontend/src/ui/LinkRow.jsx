import Glass from '../glass/Glass.jsx'
import { EMAIL } from '../content/constants.js'
import { SIGNAL } from '../content/signal.js'

/*
  The link row (DESIGN.md 5.9): one glass row at r-3 with 4px padding,
  items 36px (44 on phones) at r-3 minus 4. Email first, then the channels;
  the contact card passes the channels alone (its address and copy button
  sit right above the row).
  `states` (kit only) maps a channel id to 'hover' | 'focus' | 'active';
  `label` names the landmark when a page has more than one row.

  On phones the row keeps one deliberate shape: every item on one line when
  they fit, otherwise an even grid (two by two for four items, three over
  two for five), never a lone item on a line of its own. The wrapper is the
  size container that decides it (components.css 5.9); on wider screens it
  is display: contents, so the row lays out as if it were not there.
*/
const LINKS = [{ id: 'channel-email', label: SIGNAL.emailLabel.text, href: `mailto:${EMAIL}` }, ...SIGNAL.channels]

export default function LinkRow({ links = LINKS, states = {}, label = SIGNAL.elsewhere.text, className = '' }) {
  return (
    <div className="linkrow-fit" data-n={links.length}>
      <Glass as="nav" tier="thick" lens="row" spec className={`linkrow ${className}`.trim()} aria-label={label}>
        {links.map((l) => (
          <a key={l.id} href={l.href} className={states[l.id] ? `is-${states[l.id]}` : undefined}>
            {l.label}
          </a>
        ))}
      </Glass>
    </div>
  )
}
