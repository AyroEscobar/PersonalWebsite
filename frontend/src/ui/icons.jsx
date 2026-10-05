/*
  The icon set: 16px, 2px stroke, currentColor, one family (DESIGN.md 5.3).
  Decorative everywhere: every control that has one also has a visible word.
*/
const Svg = ({ children, className = 'ic' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

export const Mail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
)
export const ArrowDown = (p) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </Svg>
)
export const ArrowOut = (p) => (
  <Svg {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Svg>
)
export const Copy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </Svg>
)
export const Check = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)
export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)
