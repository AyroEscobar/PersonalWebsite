import { Section } from '../ui/Section.jsx'
import { SIGNAL } from '../content/signal.js'
import StopHead from './StopHead.jsx'
import SignalLine from './SignalLine.jsx'
import PosterBand from '../grid/PosterBand.jsx'

/*
  signal (PLAN.md 3.8): his open-inbox line, the SignalLine, the four
  channels as exit plates (name plus the address it goes to, so it prints
  and reads honestly), and the closer, once on the whole site, set on a
  short band of the night map lit only by the beacon over Plano (r2 U6).
*/
// The readable host and path of a link: https://www.linkedin.com/in/x reads linkedin.com/in/x
const hostOf = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export default function Signal({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id} />
          <p className="t-lead signal-para">{SIGNAL.paragraph.text}</p>
          <SignalLine />
          <ul className="channels">
            {SIGNAL.channels.map((c) => (
              <li key={c.id}>
                <a className="ch plate plate-hover" href={c.href}>
                  <span className="ch-text">
                    <span className="ch-name">{c.label}</span>
                    <span className="ch-host mono">{hostOf(c.href)}</span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
          <PosterBand>
            <p className="closer">{SIGNAL.closer.text}</p>
          </PosterBand>
        </div>
      </div>
    </Section>
  )
}
