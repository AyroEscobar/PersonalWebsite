import { Section, SectionHeading } from '../ui/Section.jsx'
import { BUILDS } from '../content/builds.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.6, 4.9). Replace this file.
  Contract: default export Builds({ id }). Specimens mount through ui/DeferredMount.
*/
export default function Builds({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <SectionHeading id={id} />
          <p className="mono mt-4 text-dim">{BUILDS.intro.text}</p>
          <div className="mt-8 flex flex-col gap-6">
            {BUILDS.cards.map((c) => (
              <article key={c.id} aria-labelledby={`${c.id}-h`} className="plate plate-hover rule-l p-6">
                <h3 id={`${c.id}-h`} className="t-h3">
                  {c.title}
                </h3>
                <p className="mono mt-1 text-dim">{c.meta}</p>
                {c.body.map((b) => (
                  <p key={b.id} className="mt-3">
                    {b.text}
                  </p>
                ))}
                {c.stack && (
                  <p className="mono mt-3 text-dim">
                    {BUILDS.stackLabel.text}: {c.stack}
                  </p>
                )}
                {c.links.length > 0 && (
                  <p className="mt-3 flex gap-4">
                    {c.links.map((l) => (
                      <a key={l.href} href={l.href}>
                        {l.label}
                      </a>
                    ))}
                  </p>
                )}
              </article>
            ))}
          </div>
          <p className="mono mt-8 text-dim">{BUILDS.also.text}</p>
          <p className="mono mt-2 text-dim">
            <a href={BUILDS.thisSite.href}>{BUILDS.thisSite.text}</a>
          </p>
        </div>
      </div>
    </Section>
  )
}
