import { CREW } from '../content/crew.js'
import Glass from '../glass/Glass.jsx'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'

/*
  crew (DESIGN.md 6.7): the head in the rail, the four entries as rows on one glass sheet. The
  title in Inter 600 16, the dates tabular, the rest in Inter 14. Strings
  are split on their own " · " separators and nothing is reworded; a string
  that does not split cleanly renders whole.
*/
function split(e) {
  if (!e.title) return null
  const segs = e.text.split(' · ')
  if (segs[0] !== e.title) return null
  let when = null
  const body = []
  for (const s of segs.slice(1)) {
    if (e.dates && s.startsWith(e.dates)) {
      when = e.dates
      const rest = s.slice(e.dates.length).replace(/^\.\s*/, '')
      if (rest) body.push(rest)
    } else body.push(s)
  }
  return { when, body }
}

export default function Crew() {
  return (
    <Section id="crew" field="crew" rail>
      <SectionHead id="crew" line={CREW.intro.text} rail />
      <Glass tier="sheet" className="crew-sheet sec-body">
        <ul className="crew-rows">
          {CREW.entries.map((e) => {
            const p = split(e)
            return (
              <li key={e.id} id={e.id} className="crew-row">
                {p ? (
                  <>
                    <h3 className="crew-title">{e.title}</h3>
                    {p.when && <p className="crew-when">{p.when}</p>}
                    {p.body.map((b) => (
                      <p key={b} className="crew-text">
                        {b}
                      </p>
                    ))}
                  </>
                ) : (
                  <p className="crew-text">{e.text}</p>
                )}
              </li>
            )
          })}
        </ul>
      </Glass>
    </Section>
  )
}
