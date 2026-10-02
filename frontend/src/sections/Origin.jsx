import { Section, SectionHeading } from '../ui/Section.jsx'
import { ORIGIN } from '../content/identity.js'
import { HEADSHOT } from '../media/headshot.js'

/*
  PLACEHOLDER by FOUNDATION. Owned by C (PLAN.md 3.3). Replace this file.

  Contract: default export Origin({ id, children }). Renders the #origin
  <Section>, with children (A's Hero) first, then the origin body.
*/
export default function Origin({ id, children }) {
  return (
    <Section id={id}>
      {children}
      <div className="page">
        <div className="page-grid">
          <div className="text-col">
            <SectionHeading id={id} />
            <p className="t-body measure mt-8">{ORIGIN.paragraph.text}</p>
            <blockquote className="t-h3 measure mt-8">{ORIGIN.pull.text}</blockquote>
            <p className="t-body measure mt-6">{ORIGIN.closer.text}</p>
            <p className="t-body measure mt-6 text-dim">{ORIGIN.offHours.text}</p>
            <div className="mt-8 flex flex-wrap items-start gap-8">
              <dl className="mono grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                {ORIGIN.vitals.map((v) => (
                  <div key={v.id} className="contents">
                    <dt className="text-dim">{v.label}</dt>
                    <dd>{v.value}</dd>
                  </div>
                ))}
              </dl>
              <picture>
                <source type="image/avif" srcSet={HEADSHOT.avif} sizes={HEADSHOT.sizes} />
                <img
                  src={HEADSHOT.src}
                  srcSet={HEADSHOT.webp}
                  sizes={HEADSHOT.sizes}
                  width={HEADSHOT.width}
                  height={HEADSHOT.height}
                  alt={HEADSHOT.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-[180px] rounded-sm"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
