import { Section, SectionHeading } from '../ui/Section.jsx'
import { NOW, PROGRAM } from '../content/now.js'
import { BUILD_DATE } from '../lib/build.js'
import { isStale, monthShort } from '../lib/format.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.4), with B's NowBoard.
  Replace this file. Contract: default export Now({ id }).
*/
export default function Now({ id }) {
  const stale = isStale(NOW.updated, BUILD_DATE)
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <SectionHeading id={id} />
          <ul className={`mt-8 flex flex-col gap-2 ${stale ? 'state-past' : 'state-now'}`}>
            {NOW.lines.map((l) => (
              <li key={l.id} className="rule-l is-lit pl-4">
                {l.text}
              </li>
            ))}
            <li className="rule-l is-lit state-past pl-4 text-sodium">{NOW.mission.text}</li>
          </ul>
          <p className="mono mt-4 text-dim">
            {(stale ? NOW.stalePrefix : NOW.freshPrefix).text} {monthShort(NOW.updated)}
          </p>
          <p className="mono mt-8 text-dim">{PROGRAM.caption.text}</p>
        </div>
      </div>
    </Section>
  )
}
