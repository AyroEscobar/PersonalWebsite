import { Fragment } from 'react'
import Glass from '../glass/Glass.jsx'

/*
  The reading sentence (DESIGN.md 1.1, 6.1): his whole-map sentence in the
  italic serif, with hand-set line breaks and a clear glass lens resting on
  one line.

    <ReadingSentence id="sentence" text="I am trying ..." d={[6, 11, 16, 21]} m={[4, 9, 13, 17, 21]} />

    text   the sentence; every word renders as its own span (.w), so the lens
           can measure lines and the loupe can copy words without touching the DOM
    d      word indexes a line ends after from 820px up (five lines at 1440)
    m      word indexes a line ends after from 360 to 819px (six lines at 390)
    lens   render the stand-in lens (default true)

  The stand-in is CSS only, so it is there at first paint: it spans the
  longest line plus --lens-pad each side, is 1.15 lines tall (52px on
  phones) and rests on line 2. Under reduced motion it rests on the last
  line. The page's reader (src/hero/nav.js) takes over from its exact box.
  Decorative: the words stay in the sentence for every reader.
*/
export default function ReadingSentence({ text, d = [], m = [], id, className = '', lens = true }) {
  const words = text.split(' ')
  const style = { '--lens-last-d': d.length, '--lens-last-m': m.length }
  return (
    <p id={id} className={`sentence reading ${className}`.trim()} style={style} data-words="1">
      {words.map((w, i) => {
        const brk = [d.includes(i) && 'd', m.includes(i) && 'm'].filter(Boolean).join(' ')
        return (
          <Fragment key={i}>
            <span className="w">{w}</span>
            {i < words.length - 1 && ' '}
            {brk && <br className={brk} />}
          </Fragment>
        )
      })}
      {lens && (
        <Glass as="span" tier="clear" lens="lens" className="lens-static lens-static--reading" aria-hidden="true">
          <span className="caustic" />
          <span className="loupe" />
        </Glass>
      )}
    </p>
  )
}
