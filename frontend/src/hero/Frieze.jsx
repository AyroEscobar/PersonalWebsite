/*
  The frieze: a band of the pot's clay with the man and the boulder on the painter's ground line, a
  running meander under it. Two on the home page: band="hero" (the shoulder frieze, with the plate that
  says who he is) and band="contact" (the same figure further up the line). The clay is CSS (the radial
  burnish and the faint wheel rings in components.css), so is the ground line, so both are there before
  any script and never move.

    <Frieze band="hero" as="section" ...>  .frieze-art (the one canvas lands here, src/lib/frieze-host.js)
      ...children                          the plate, a <Room />, the theme line
    </Frieze>                              then the meander as the band's bottom edge

  <Room> is the composition box (src/scene/comp.js BOX; aspect, foot point and poster size mirrored in
  tokens.css and POSTER below, check-content holds them equal): the ground line through the foot point
  at 14 degrees, and the poster per theme (the light and the dark vase, each with a phone cut under
  960 px), contain and bottom aligned, so the canvas lands on the poster pixel for pixel. The boot script
  preloads the one poster this visitor sees, so both pictures are lazy and only one is ever fetched.
*/
const POSTER = {
  w: 1600,
  h: 1040,
  mw: 960,
  mh: 624,
  src: (theme, m = false, ext = 'avif') => `/poster/frieze-${theme}${m ? '-m' : ''}.${ext}`,
}
const PHONE = '(max-width: 959.98px)'

export function PosterPicture({ theme, alt = '', priority = false }) {
  return (
    <picture className={`poster poster--${theme}`}>
      <source media={PHONE} type="image/avif" srcSet={POSTER.src(theme, true)} width={POSTER.mw} height={POSTER.mh} />
      <source media={PHONE} type="image/webp" srcSet={POSTER.src(theme, true, 'webp')} width={POSTER.mw} height={POSTER.mh} />
      <source type="image/avif" srcSet={POSTER.src(theme)} />
      <img src={POSTER.src(theme, false, 'webp')} width={POSTER.w} height={POSTER.h} alt={alt} decoding="async" loading="lazy" fetchPriority={priority ? 'high' : undefined} />
    </picture>
  )
}

export function Room({ alt = '', priority = false, className = '' }) {
  return (
    <div className={`stage ${className}`.trim()}>
      <div className="room">
        <div className="ground" aria-hidden="true" data-deco="" />
        <PosterPicture theme="light" alt={alt} priority={priority} />
        <PosterPicture theme="dark" alt={alt} priority={priority} />
      </div>
    </div>
  )
}

export default function Frieze({ band, as: As = 'div', className = '', meander = true, children, ...rest }) {
  return (
    <As className={`frieze frieze--${band} ${className}`.trim()} data-band={band} {...rest}>
      <div className="frieze-art" aria-hidden="true" />
      {children}
      {meander && <div className="meander" aria-hidden="true" data-deco="" />}
    </As>
  )
}
