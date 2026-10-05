import Glass from '../glass/Glass.jsx'
import { ORIGIN } from '../content/identity.js'
import { HEADSHOT } from '../media/headshot.js'

/*
  The origin card (DESIGN.md 6.3, 12.1): one glass sheet beside his two
  pull paragraphs. The headshot round at 128px with a lit rim, his origin
  paragraph in Inter 16, the vitals as a small two-column <dl>, and the
  off-hours line. The photo is lazy and below the fold, so it is never the
  LCP and never shifts anything (it has its box before it loads).
*/
export default function ProfileCard({ className = '' }) {
  return (
    <Glass tier="sheet" spec className={`profile ${className}`.trim()}>
      <div className="profile-head">
        <picture className="profile-photo">
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
          />
        </picture>
        <dl className="vitals">
          {ORIGIN.vitals.map((v) => (
            <div key={v.id} className="vital">
              <dt>{v.label}</dt>
              <dd>{v.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="profile-text">{ORIGIN.paragraph.text}</p>
      <p className="profile-off">{ORIGIN.offHours.text}</p>
    </Glass>
  )
}
