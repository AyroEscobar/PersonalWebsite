import Glass from '../glass/Glass.jsx'

/*
  <Button> (DESIGN.md 5.3): 40px pills (44 on phones), Inter 600 14.

    variant   'primary' (the ink pill, one per control group) | 'glass' | 'ghost'
    href      renders a link; otherwise a <button type="button">
    icon      a leading icon component; trailing puts it after the label
    busy      loading: aria-busy, a spinner replaces the icon, the label turns into
              busyLabel (the present participle) without changing width
    disabled  opacity .45, not-allowed, no press
    state     kit only: 'hover' | 'focus' | 'active' forces that look
*/
export default function Button({
  variant = 'primary',
  href,
  icon: Icon,
  trailing = false,
  busy = false,
  busyLabel,
  disabled = false,
  state,
  className = '',
  children,
  ...rest
}) {
  const As = href && !disabled ? 'a' : 'button'
  const cls = [
    'btn',
    variant !== 'glass' && `btn--${variant}`,
    Icon && trailing && 'btn--trailing',
    !Icon && 'btn--text-only',
    state && `is-${state}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const props = {
    className: cls,
    'aria-busy': busy ? 'true' : undefined,
    ...(As === 'a' ? { href } : { type: 'button', disabled: disabled || undefined }),
    ...(As === 'a' && disabled ? { 'aria-disabled': 'true' } : {}),
    ...rest,
  }
  const inner = (
    <>
      {Icon && !trailing && <Icon />}
      {!trailing && <span className="spin" aria-hidden="true" />}
      <span className="btn-label">
        <span className="idle">{children}</span>
        {busyLabel && <span className="busy">{busyLabel}</span>}
      </span>
      {Icon && trailing && <Icon />}
    </>
  )
  if (variant === 'glass') {
    return (
      <Glass as={As} tier="thick" pill spec lens="btn" {...props}>
        {inner}
      </Glass>
    )
  }
  return <As {...props}>{inner}</As>
}
