/*
  <Glass>: the one liquid-glass primitive (DESIGN.md 4). The only place the
  material's class names are typed; the material itself is src/styles/glass.css.

    <Glass tier="thick" pill lens="btn" spec as="a" href="...">...</Glass>

    tier    'clear' | 'thick' | 'sheet'      the variant (4.2, 12.1)
    pill    the pill modifier on thick: buttons, the link row, the quiet switch
    lens    a lens preset from src/glass/lens.js ('lens', 'nav', 'dock', 'btn',
            'row', 'card', 'ruler'); Chrome bends the backdrop through it
    spec    the pointer specular (fine pointers) and the press glow
    scrim   a local light pool under copy
    radius  a radius token step (1 to 5, or 'full')
    as      the element; everything else passes through

  It renders the inner layers the material needs: .ring (the bright edge),
  .spec when asked, .scrim when asked, then children.
*/
export default function Glass({
  as: As = 'div',
  tier = 'thick',
  pill = false,
  lens,
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
    <As ref={ref} className={cls} style={st} data-lens-preset={lens} data-spec={spec ? '' : undefined} {...rest}>
      <span className="ring" aria-hidden="true" />
      {spec && <span className="spec" aria-hidden="true" />}
      {scrim && <span className="scrim" aria-hidden="true" />}
      {children}
    </As>
  )
}
