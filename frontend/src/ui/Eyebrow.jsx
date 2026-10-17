/*
  Eyebrow: the label face (Marcellus SC) 14 px, tracking 0.08em, --ink-2. "A few things I've built" and
  "elsewhere" use it.
*/
export default function Eyebrow({ as: As = 'p', className = '', children, ...rest }) {
  return (
    <As className={`eyebrow ${className}`.trim()} {...rest}>
      {children}
    </As>
  )
}
