import { Section } from '../ui/Section.jsx'
import { ORIGIN } from '../content/identity.js'
import { HEADSHOT } from '../media/headshot.js'
import StopHead from './StopHead.jsx'
import { Highlight } from './text.jsx'

/*
  origin (PLAN.md 3.3). A's Hero comes in as children, first. Then his own
  words: the paragraph, the line about the level he is aiming at (moved here
  from the hero in r1, T16), the "whole map" sentence set large with its
  middle line lit, the no-shortcut line as the one real highway sign on the
  site (T9), the off-hours line, and the vitals beside the duotone photo.
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
              <p className="t-lead origin-para">{ORIGIN.paragraph.text}</p>
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
                    <div key={v.id}>
                      <dt className="label">{v.label}</dt>
                      <dd>{v.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
