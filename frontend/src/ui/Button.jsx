import { ArrowOut } from './icons.jsx'

/*
  <Button>: square, 1 px border, 48 px tall (small 36), the label face (Marcellus SC 16, small 14).

    variant   'fill' (the accent: the coffee chat, the 404's way home; it turns to ink on hover) |
              'line' (1 px ink: email, copy; on hover it fills with ink from its left edge, 160 ms)
              ('primary' and 'glass', v4's names, map to fill and line)
    size      'md' | 'sm'
    icon      'out': a trailing 10 px outward arrow
    href      renders a link; otherwise a <button type="button">
    disabled  opacity .55, no pointer
    state     kit only: 'hover' | 'focus' | 'press' forces that look
*/
const VARIANT = { primary: 'fill', glass: 'line' }

export default function Button({ variant = 'fill', size = 'md', icon, href, disabled = false, state, className = '', children, ...rest }) {
  const As = href && !disabled ? 'a' : 'button'
  const v = VARIANT[variant] || variant
  const cls = ['btn', `btn--${v}`, size === 'sm' && 'btn--sm', state && `is-${state}`, className].filter(Boolean).join(' ')
  const props = {
    className: cls,
    ...(As === 'a' ? { href } : { type: 'button', disabled: disabled || undefined }),
    ...(As === 'a' && disabled ? { 'aria-disabled': 'true' } : {}),
    ...rest,
  }
  return (
    <As {...props}>
      <span className="btn-label">{children}</span>
      {icon === 'out' && <ArrowOut />}
    </As>
  )
}
