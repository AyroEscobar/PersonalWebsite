import { Section, SectionHeading } from '../ui/Section.jsx'
import { SIGNAL } from '../content/signal.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.8, 4.11). Replace this file.
  Contract: default export Signal({ id }). The closer appears exactly once on the site.
*/
export default function Signal({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <SectionHeading id={id} />
          <p className="t-lead measure mt-8">{SIGNAL.paragraph.text}</p>
          <p className="mono mt-6">
            <a href={SIGNAL.email.mailto}>{SIGNAL.email.text}</a>
          </p>
          <ul className="mt-6 flex flex-wrap gap-6">
            {SIGNAL.channels.map((c) => (
              <li key={c.id}>
                <a href={c.href}>{c.label}</a>
              </li>
            ))}
          </ul>
          <p className="t-h3 mt-12">{SIGNAL.closer.text}</p>
        </div>
      </div>
    </Section>
  )
}
