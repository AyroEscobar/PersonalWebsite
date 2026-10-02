import { Section } from '../ui/Section.jsx'
import { ORIGIN } from '../content/identity.js'
import { HEADSHOT } from '../media/headshot.js'
import StopHead from './StopHead.jsx'
import { Highlight } from './text.jsx'

/*
  origin (PLAN.md 3.3). A's Hero comes in as children, first. Then his own
  words: the line about the level he is aiming at, whose "that" answers the
  hero's invisible systems right above it (r2 U7), the "whole map" sentence
  set large with its middle line lit, the no-shortcut line as the one real
  highway sign on the site (T9), then the off-hours line, the vitals beside
  the duotone photo, and his origin paragraph last, so on a phone no screen
  holds more than two "trying"s.
*/

// The line inside the pull quote that gets the light. Styling only; the text is verbatim.
const MAP_LINE = 'That sentence is the whole map.'

export default function Origin({ id, children }) {
  return (
    <Section id={id}>
      {children}
      <div className="page">
        <div className="page-grid">
          <div className="text-col">
            <StopHead id={id} />
            <div className="origin-body">
              <p className="t-lead origin-para origin-level">{ORIGIN.level.text}</p>
              <blockquote className="origin-pull">
                <p>
                  <Highlight text={ORIGIN.pull.text} phrase={MAP_LINE} className="lit" />
                </p>
              </blockquote>
              <p className="sign">
                <span>{ORIGIN.closer.text}</span>
              </p>
              <p className="origin-off">{ORIGIN.offHours.text}</p>
              <div className="origin-id">
                <picture className="origin-photo">
                  <source type="image/avif" srcSet={HEADSHOT.avif} sizes="(min-width: 720px) 200px, 112px" />
                  <img
                    src={HEADSHOT.src}
                    srcSet={HEADSHOT.webp}
                    sizes="(min-width: 720px) 200px, 112px"
                    width={HEADSHOT.width}
                    height={HEADSHOT.height}
                    alt={HEADSHOT.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <dl className="vitals">
                  {ORIGIN.vitals.map((v) => (
                    // UT Dallas is in Richardson: the map flares it as the row reaches the reading line.
                    <div key={v.id} data-flare={v.id === 'vital-school' ? 'richardson' : undefined}>
                      <dt className="label">{v.label}</dt>
                      <dd>{v.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="t-lead origin-para origin-last">{ORIGIN.paragraph.text}</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
