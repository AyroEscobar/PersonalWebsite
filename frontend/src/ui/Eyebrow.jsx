/*
  Eyebrow (DESIGN.md 5.13): 12 px caps cyan 600, 0.14em. The "elsewhere" label uses the same class.
*/
export default function Eyebrow({ as: As = 'p', className = '', children, ...rest }) {
  return (
    <As className={`eyebrow ${className}`.trim()} {...rest}>
      {children}
    </As>
  )
}
