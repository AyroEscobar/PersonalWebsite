import { Section } from '../ui/Section.jsx'
import { BUILDS } from '../content/builds.js'
import StopHead from './StopHead.jsx'
import BuildCard from './BuildCard.jsx'

/*
  builds (PLAN.md 3.6): eight cards in content order. On desktop the grid
  runs wide (two columns, Viaere and the pool scheduler across both); on
  phones it is one column. The two closing lines follow in mono.
*/
export default function Builds({ id }) {
  return (
    <Section id={id} className="page">
      <div className="page-grid">
        <div className="text-col">
          <StopHead id={id}>
            <p className="mono c-intro">{BUILDS.intro.text}</p>
          </StopHead>
        </div>
        <div className="c-wide">
          <ul className="builds-grid">
            {BUILDS.cards.map((c) => (
              <li key={c.id} data-layout={c.layout}>
                <BuildCard card={c} />
              </li>
            ))}
          </ul>
          <div className="builds-after mono">
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
