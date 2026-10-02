import { Section, SectionHeading } from '../ui/Section.jsx'
import StatusChip from '../ui/StatusChip.jsx'
import { STACK, WORK } from '../content/work.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.5, 4.8). Replace this file.
  Contract: default export Work({ id }).
*/
export default function Work({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <SectionHeading id={id} />
          <p className="mono mt-4 text-dim">{WORK.intro.text}</p>
          <ol reversed className="mt-8 flex flex-col gap-6">
            {WORK.plates.map((p) => (
              <li key={p.id}>
                <article aria-labelledby={`${p.id}-h`} className={`plate rule-l is-lit p-6 state-${p.state}`}>
                  <h3 id={`${p.id}-h`} className="t-h3">
                    {p.org}
                  </h3>
                  <p className="mt-1">{p.role}</p>
                  <p className="mono mt-2 text-dim">
                    {p.place} · {p.dates}
                  </p>
                  <p className="mt-3">
                    <StatusChip status={p.status} />
                  </p>
                  {p.debrief.map((d) => (
                    <p key={d.id} className="mt-3 text-dim">
                      {d.text}
                    </p>
                  ))}
                  {p.origin && <p className="mt-3">{p.origin.text}</p>}
                  {p.desks && (
                    <ol className="mt-4 flex flex-col gap-3">
                      {p.desks.map((d) => (
                        <li key={d.id}>
                          <h4 className="font-bold">{d.name}</h4>
                          <p className="text-dim">{d.text}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              </li>
            ))}
          </ol>
          <h3 className="t-h3 mt-12">{STACK.heading.text}</h3>
          <dl className="mono mt-4 grid grid-cols-1 gap-y-1 md:grid-cols-[auto_1fr] md:gap-x-6">
            {STACK.rows.map((r) => (
              <div key={r.id} className="contents">
                <dt className="text-dim">{r.label}</dt>
                <dd className="mb-2 md:mb-0">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  )
}
