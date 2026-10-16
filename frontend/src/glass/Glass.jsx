/*
  <Glass>: the one frosted-glass primitive. The only place the material's class names are typed;
  the material itself is src/styles/glass.css.

    <Glass pill scrim as="a" href="...">...</Glass>

    tier    'thick', the only tier (v4 has no clear glass and no lens)
    pill    the pill modifier: radius 999, its own void base
    scrim   a local void pool under copy
    radius  'panel' | 'card' | 'pill'   a radius token
    as      the element; everything else passes through

  It renders the .scrim layer when asked, then children.
*/
// `tier` is swallowed so an old caller never writes it to the DOM; every surface is thick
export default function Glass({ as: As = 'div', tier: _tier = 'thick', pill = false, scrim = false, radius, className = '', style, children, ref, ...rest }) {
  const cls = ['glass', 'glass--thick', pill && 'glass--pill', className].filter(Boolean).join(' ')
  const st = radius ? { ...style, '--g-r': `var(--r-${radius})` } : style
  return (
    <As ref={ref} className={cls} style={st} {...rest}>
      {scrim && <span className="scrim" aria-hidden="true" />}
      {children}
    </As>
  )
}
