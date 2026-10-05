import { BUILDS } from '../content/builds.js'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import BuildCard from '../ui/BuildCard.jsx'

/* builds (DESIGN.md 6.6): the two wide cards side by side, then the half cards in a 3 by 2 grid. */
export default function Builds() {
  const wide = BUILDS.cards.filter((c) => c.layout === 'wide')
  const half = BUILDS.cards.filter((c) => c.layout !== 'wide')
  return (
    <Section id="builds" field="builds">
      <SectionHead id="builds" line={BUILDS.intro.text} />
      <div className="cards cards--wide">
        {wide.map((c) => (
          <BuildCard key={c.id} card={c} />
        ))}
      </div>
      <div className="cards cards--half">
        {half.map((c) => (
          <BuildCard key={c.id} card={c} />
        ))}
      </div>
      <p className="builds-note">{BUILDS.also.text}</p>
      <p className="builds-note">
        <a href={BUILDS.thisSite.href}>{BUILDS.thisSite.text}</a>
      </p>
    </Section>
  )
}
