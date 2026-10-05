import { NOW } from '../content/now.js'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import NowList from '../ui/NowList.jsx'

/* now (DESIGN.md 6.4): the section head and the now list, MD7, Viaere, MLH, UT Dallas. */
export default function Now() {
  return (
    <Section id="now" field="now">
      <SectionHead id="now" line={NOW.mission.text} />
      <div className="col-narrow">
        <NowList />
      </div>
    </Section>
  )
}
