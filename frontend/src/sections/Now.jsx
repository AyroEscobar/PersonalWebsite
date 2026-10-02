import { Section } from '../ui/Section.jsx'
import { NOW, PROGRAM } from '../content/now.js'
import { BUILD_DATE } from '../lib/build.js'
import { isStale, monthShort } from '../lib/format.js'
import StopHead from './StopHead.jsx'
import ProgramStrip from './ProgramStrip.jsx'
import { NowBoard } from './slots.js'
import { Dotted } from './text.jsx'

/*
  now (PLAN.md 3.4). B's NowBoard is the section's header plate; under it,
  the ProgramStrip runs wide, folded behind "what ran at the same time"
  (r1 T17); the strip and its table open together. Until the NowBoard file exists, NowLines
  renders the same lines with the same staleness rule, so the section never
  ships empty.
*/
export default function Now({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id} />
          {NowBoard ? <NowBoard variant="section" /> : <NowLines />}
        </div>
        {/* Folded by default until Ayro says the overlap is fine to show (questions.md #41, r1 T17). */}
        <details className="ps-fold c-wide">
          <summary className="ps-summary">{PROGRAM.summary.text}</summary>
          <ProgramStrip />
        </details>
      </div>
    </Section>
  )
}

function NowLines() {
  const stale = isStale(NOW.updated, BUILD_DATE)
  return (
    <>
      <ul className={`plate now-list ${stale ? 'state-past' : 'state-now'}`}>
        {NOW.lines.map((l) => (
          <li key={l.id}>
            <span className="now-lamp" aria-hidden="true" />
            <span>
              <Dotted text={l.text} />
            </span>
          </li>
        ))}
        <li className="state-past">
          <span className="now-lamp" aria-hidden="true" />
          <span className="now-mission">{NOW.mission.text}</span>
        </li>
      </ul>
      <p className="mono now-updated">
        {(stale ? NOW.stalePrefix : NOW.freshPrefix).text} {monthShort(NOW.updated)}
      </p>
    </>
  )
}
