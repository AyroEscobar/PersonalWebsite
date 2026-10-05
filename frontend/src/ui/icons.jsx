/*
  The icon set: 14 px (12 px in small buttons), 1.6 stroke, currentColor, one family.
  Decorative everywhere: every control that has one also has a visible word.
*/
const Svg = ({ children, className = 'ic' }) => (
  <svg className={className} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

export const ArrowDown = (p) => (
  <Svg {...p}>
    <path d="M7 2v9M3 7.5 7 11.5 11 7.5" />
  </Svg>
)
export const ArrowOut = (p) => (
  <Svg {...p}>
    <path d="M4 10 10 4M5 4h5v5" />
  </Svg>
)
export const MenuLines = (p) => (
  <Svg {...p} className="ic ic--menu">
    <path d="M2 4.5h10M2 9.5h10" />
  </Svg>
)
