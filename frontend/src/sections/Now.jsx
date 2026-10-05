import { NOW } from '../content/now.js'
import Section from '../ui/Section.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import NowList from '../ui/NowList.jsx'

/* now (DESIGN.md 6.4): the section head in the rail and the now list, MD7, Viaere, MLH, UT Dallas. */
export default function Now() {
  return (
    <Section id="now" field="now" rail>
      <SectionHead id="now" line={NOW.mission.text} rail />
      <div className="sec-body">
        <NowList />
      </div>
    </Section>
  )
}
