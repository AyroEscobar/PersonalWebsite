import Glass from '../glass/Glass.jsx'
import { ArrowDown, ArrowOut } from './icons.jsx'

/*
  <Button> (DESIGN.md 5.1, 5.2): 44px pills, Mona 15/600 wdth 104.

    variant   'primary' (cyan fill, void ink: the email button and nothing else) | 'glass' (thick glass pill)
    size      'md' (44) | 'sm' (40, 14px text: the card links, "copy", the scene controls)
    icon      'down' | 'out' | none, a trailing 14px (12px small) icon
    href      renders a link; otherwise a <button type="button">
    disabled  opacity .45, no pointer
    state     kit only: 'hover' | 'focus' | 'press' forces that look
*/
const ICONS = { down: ArrowDown, out: ArrowOut }

export default function Button({ variant = 'primary', size = 'md', icon, href, disabled = false, state, className = '', children, ...rest }) {
  const As = href && !disabled ? 'a' : 'button'
  const Icon = icon ? ICONS[icon] : null
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', state && `is-${state}`, className].filter(Boolean).join(' ')
  const props = {
    className: cls,
    ...(As === 'a' ? { href } : { type: 'button', disabled: disabled || undefined }),
    ...(As === 'a' && disabled ? { 'aria-disabled': 'true' } : {}),
    ...rest,
  }
  const inner = (
    <>
      <span className="btn-label">{children}</span>
      {Icon && <Icon />}
    </>
  )
  if (variant === 'glass') {
    return (
      <Glass as={As} tier="thick" pill spec {...props}>
        {inner}
      </Glass>
    )
  }
  return <As {...props}>{inner}</As>
}
