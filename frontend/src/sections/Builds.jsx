import { Section } from '../ui/Section.jsx'
import { BUILDS } from '../content/builds.js'
import StopHead from './StopHead.jsx'
import { BuildFeature, BuildRow } from './BuildCard.jsx'

/*
  builds (PLAN.md 3.6, r1 T10): two feature rows across the full width
  (Viaere and the pool scheduler, each with its specimen), then the other
  six as a departures board, one line each. The two closing lines follow,
  in sans.
*/
export default function Builds({ id }) {
  const features = BUILDS.cards.filter((c) => c.layout === 'wide')
  const rows = BUILDS.cards.filter((c) => c.layout !== 'wide')
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id}>
            <p className="c-intro">{BUILDS.intro.text}</p>
          </StopHead>
        </div>
        <div className="c-wide">
          <ul className="builds-features">
            {features.map((c) => (
              <li key={c.id}>
                <BuildFeature card={c} />
              </li>
            ))}
          </ul>
          <ul className="builds-index">
            {rows.map((c) => (
              <li key={c.id}>
                <BuildRow card={c} />
              </li>
            ))}
          </ul>
          <div className="builds-after">
            <p>{BUILDS.also.text}</p>
            <p>
              <a href={BUILDS.thisSite.href}>{BUILDS.thisSite.text}</a>
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
