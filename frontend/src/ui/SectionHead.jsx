import { headingId, sectionById } from '../content/sections.js'

/*
  <SectionHead id="now" line="ship things that outlast me" /> (DESIGN.md 5.12):
  the section word in Instrument Serif italic 40 as the <h2>, and a lowercase
  italic line beside it (under it on phones) as a <p>.
*/
export default function SectionHead({ id, word, line, as: As = 'h2' }) {
  const s = sectionById(id)
  const text = word ?? s?.heading?.text ?? s?.label.text ?? id
  return (
    <div className="sec-head">
      <As id={s ? headingId(id) : undefined} className="sec-word">
        {text}
      </As>
      {line && <p className="sec-line">{line}</p>}
    </div>
  )
}
