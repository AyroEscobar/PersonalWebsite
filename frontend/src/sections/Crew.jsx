import { Section } from '../ui/Section.jsx'
import { CREW } from '../content/crew.js'
import { BUILDS } from '../content/builds.js'
import StopHead from './StopHead.jsx'
import { Figures } from './text.jsx'
import { onStopClick } from '../chrome/route.js'

/*
  crew (PLAN.md 3.7): the people part, as a timetable. Dates in the left
  column, the role as the heading, the Hackcon talk title set large in
  sodium. The date column is visual; screen readers get the date right after
  the heading instead, so heading navigation never skips it. The last line
  ("Competed at ...") links each project it names to its card in builds.

  The content strings are split on their own " · " separators and nothing is
  reworded: a string that does not split cleanly renders whole.
*/

function split(e) {
  if (!e.title) return null
  const segs = e.text.split(' · ')
  if (segs[0] !== e.title) return null
  let when = null
  let talk = null
  const body = []
  for (const s of segs.slice(1)) {
    if (e.dates && s.startsWith(e.dates)) {
      when = e.dates
      const rest = s.slice(e.dates.length).replace(/^\.\s*/, '')
      if (rest) body.push(rest)
    } else if (/^".+"$/.test(s)) talk = s.slice(1, -1)
    else body.push(s)
  }
  return { when, talk, body }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const CARD_IN_PARENS = new RegExp(`\\((${BUILDS.cards.map((c) => esc(c.title)).join('|')})\\)`, 'g')
const cardId = (title) => BUILDS.cards.find((c) => c.title === title)?.id

/** "(Gaia)" becomes a link to the Gaia card. Same characters, same order. */
function Linked({ text }) {
  const out = []
  let last = 0
  for (const m of text.matchAll(CARD_IN_PARENS)) {
    out.push(text.slice(last, m.index), '(')
    out.push(
      <a key={m.index} href={`#${cardId(m[1])}`} onClick={(e) => onStopClick(e, cardId(m[1]))}>
        {m[1]}
      </a>,
    )
    out.push(')')
    last = m.index + m[0].length
  }
  if (!out.length) return text
  out.push(text.slice(last))
  return out
}

export default function Crew({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id}>
            <p className="mono c-intro">{CREW.intro.text}</p>
          </StopHead>
          <ul className="crew">
            {CREW.entries.map((e) => {
              const p = split(e)
              if (!p) {
                return (
                  <li key={e.id} className="crew-row crew-row--plain">
                    <span aria-hidden="true" />
                    <p className="crew-body">
                      <Linked text={e.text} />
                    </p>
                  </li>
                )
              }
              return (
                <li key={e.id} className="crew-row">
                  <p className="crew-when mono" aria-hidden="true">
                    {p.when}
                  </p>
                  <div>
                    <h3 className="crew-title">{e.title}</h3>
                    {p.when && <p className="sr-only">{p.when}</p>}
                    {p.talk && (
                      <p className="crew-talk">
                        {'“'}
                        {p.talk}
                        {'”'}
                      </p>
                    )}
                    {p.body.map((b, i) => (
                      <p key={i} className="crew-body">
                        <Figures text={b} />
                      </p>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Section>
  )
}
