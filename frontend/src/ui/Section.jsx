import { headingId, sectionById } from '../content/sections.js'

/*
  The section contract: every section renders
    <section id={id} aria-labelledby="{id}-h"> ... <h2 id="{id}-h"> ...
  (the hero is #top, labelled by its h1). The prerender, the scroll anchors and QA rely on it.

  <Section id> lays the belly out: a .wrap with the title and the body. From 1100 px up it is a two
  column grid, the title in a 300 px column that sticks under the neck (the numeral above it), the
  content in the other; under 1100 the title sits above the content. `grid={false}` keeps the title
  above at every width (Contact, whose frieze band is its own architecture).

  <SectionTitle id>: the Roman numeral in the accent and an interpunct (decorative), a hidden
  "Section n." so a screen reader hears the order, then the word, then a trailing hairline.
*/
export function SectionTitle({ id, as: As = 'h2', className = '' }) {
  const s = sectionById(id)
  return (
    <As id={headingId(id)} className={`sec-title ${className}`.trim()}>
      <span className="num" aria-hidden="true">
        {s.numeral.text}
        <span className="ip">·</span>
      </span>
      <span className="sr-only">{s.sr.text} </span>
      <span className="sec-word">{s.label.text}</span>
    </As>
  )
}

export default function Section({ id, labelledBy, grid = true, className = '', children, after = null, ...rest }) {
  return (
    <section id={id} aria-labelledby={labelledBy ?? headingId(id)} className={`sec ${className}`.trim()} {...rest}>
      <div className={`wrap ${grid ? 'sec-inner' : 'sec-flat'}`}>
        <SectionTitle id={id} />
        {children != null && <div className="sec-body">{children}</div>}
      </div>
      {after}
    </section>
  )
}
