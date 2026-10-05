import Glass from '../glass/Glass.jsx'
import CopyEmail from './CopyEmail.jsx'
import LinkRow from './LinkRow.jsx'
import { SIGNAL } from '../content/signal.js'

/*
  The contact card (DESIGN.md 5.13): glass thick at r-5, padding 32, max
  560, with a scrim under the copy and the pointer specular. His contact
  paragraph renders unchanged: its first clause (up to the question mark)
  in the italic serif, the rest in Inter 16. Then the address as text with
  the copy button, and the link row.
  `wide` (from 900px up): his words on the left, the address and the link
  row on the right, for a card that fills a section column.
*/
function split(text) {
  const i = text.indexOf('?')
  return i < 0 ? [text, ''] : [text.slice(0, i + 1), text.slice(i + 1)]
}

export default function ContactCard({ copyState, copyBusy, tipOpen, linkStates, idPrefix = 'contact', wide = false }) {
  const [voice, rest] = split(SIGNAL.paragraph.text)
  const addressId = `${idPrefix}-address`
  return (
    <Glass tier="thick" lens="card" spec scrim className={`contact ${wide ? 'contact--wide' : ''}`.trim()}>
      <p>
        <span className="contact-voice">{voice}</span>
        {rest && <span className="contact-body">{rest}</span>}
      </p>
      <div className="contact-email">
        <a id={addressId} className="contact-address" href={SIGNAL.email.mailto}>
          {SIGNAL.email.text}
        </a>
        <CopyEmail addressId={addressId} state={copyState} busy={copyBusy} tipOpen={tipOpen} />
      </div>
      <LinkRow states={linkStates} />
    </Glass>
  )
}
