/*
  <Glass>: the one liquid-glass primitive (DESIGN.md 4). The only place the
  material's class names are typed; the material itself is src/styles/glass.css.

    <Glass tier="thick" pill spec scrim as="a" href="...">...</Glass>

    tier    'thick' | 'clear'      every surface is thick; the nav pill is clear
    pill    the pill modifier: radius 999, rim 1.5px
    spec    the pointer specular (fine pointers) follows --mx, --my
    scrim   a local void pool under copy (inset 12, radius --r-inner)
    radius  'panel' | 'card' | 'chip' | 'pill'   a radius token
    as      the element; everything else passes through

  It renders the inner layers the material needs: .ring (clear only),
  .spec when asked, .scrim when asked, then children.
*/
export default function Glass({
  as: As = 'div',
  tier = 'thick',
  pill = false,
  spec = false,
  scrim = false,
  radius,
  className = '',
  style,
  children,
  ref,
  ...rest
}) {
  const cls = ['glass', `glass--${tier}`, pill && 'glass--pill', className].filter(Boolean).join(' ')
  const st = radius ? { ...style, '--g-r': `var(--r-${radius})` } : style
  return (
    <As ref={ref} className={cls} style={st} data-spec={spec ? '' : undefined} {...rest}>
      {tier === 'clear' && <span className="ring" aria-hidden="true" />}
      {spec && <span className="spec" aria-hidden="true" />}
      {scrim && <span className="scrim" aria-hidden="true" />}
      {children}
    </As>
  )
}
