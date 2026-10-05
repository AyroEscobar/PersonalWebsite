import { headingId, sectionById } from '../content/sections.js'

/*
  <SectionHead id="now" line="ship things that outlast me" /> (DESIGN.md 5.12):
  the section word in Instrument Serif italic as the <h2>, and a lowercase
  italic line beside it (under it on phones) as a <p>. 40px on phones and
  tablets, 64px from 1100px up, where the word is display type that echoes
  the sentence.

    rail   from 1100px up the head is a column of its own: the word over its
           line, held under the nav while its section scrolls past (a Section
           with `rail` lays it beside the content)
*/
export default function SectionHead({ id, word, line, as: As = 'h2', rail = false }) {
  const s = sectionById(id)
  const text = word ?? s?.heading?.text ?? s?.label.text ?? id
  return (
    <div className={`sec-head ${rail ? 'sec-head--rail' : ''}`.trim()}>
      <As id={s ? headingId(id) : undefined} className="sec-word">
        {text}
      </As>
      {line && <p className="sec-line">{line}</p>}
    </div>
  )
}
