import Glass from '../glass/Glass.jsx'

/*
  A lens resting on one line of type (DESIGN.md 1.1, 4.3): the line, and a
  clear glass rod one line tall over it, wider by 0.24em on each side. In
  Chrome the rod really magnifies the words under it (src/glass/lens.js);
  elsewhere the loupe draws a magnified copy. Decorative: the words stay in
  the line for every reader.

    <LensLine>where my family never has</LensLine>
*/
export default function LensLine({ children, className = '' }) {
  return (
    <span className={`lens-line ${className}`.trim()}>
      {children}
      <Glass as="span" tier="clear" lens="lens" className="lens-static" aria-hidden="true">
        <span className="caustic" />
        <span className="loupe" />
      </Glass>
    </span>
  )
}
