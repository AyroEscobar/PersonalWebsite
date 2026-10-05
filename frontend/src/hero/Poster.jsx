import { HERO } from '../content/identity.js'
import { POSTER } from './Stage.jsx'

/*
  The poster alone (the 404 and the kit's "poster only" sample): the same <picture> as the stage,
  no canvas, nothing mounted.
*/
export default function Poster({ className = '', eager = false }) {
  return (
    <div className={`stage stage--poster ${className}`.trim()} aria-hidden="true">
      <picture className="poster">
        <source media="(max-aspect-ratio: 9/10)" type="image/avif" srcSet={POSTER.phone.avif} />
        <source media="(max-aspect-ratio: 9/10)" type="image/webp" srcSet={POSTER.phone.webp} />
        <source type="image/avif" srcSet={POSTER.land.avif} />
        <img src={POSTER.land.webp} width={POSTER.land.w} height={POSTER.land.h} alt={HERO.sceneAlt.text} decoding="async" loading={eager ? undefined : 'lazy'} />
      </picture>
    </div>
  )
}
