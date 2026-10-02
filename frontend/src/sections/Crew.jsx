import { Section, SectionHeading } from '../ui/Section.jsx'
import { CREW } from '../content/crew.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.7). Replace this file.
  Contract: default export Crew({ id }).
*/
export default function Crew({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <SectionHeading id={id} />
          <p className="mono mt-4 text-dim">{CREW.intro.text}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {CREW.entries.map((e) => (
              <li key={e.id} className="rule-l is-lit state-past pl-4">
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
