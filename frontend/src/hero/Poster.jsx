import { HERO } from '../content/identity.js'
import Frieze, { Room } from './Frieze.jsx'

/*
  The poster alone, on a small clay band (the 404 and the kit's "poster only" sample): the same rooms
  and pictures as the home page, no canvas, nothing mounted. data-band is left off so the frieze host
  never looks at it.
*/
export default function Poster({ className = '', alt = HERO.sceneAlt.text }) {
  return (
    <Frieze band="still" className={`frieze--poster ${className}`.trim()} data-band={undefined}>
      <div className="poster-stage">
        <Room alt={alt} />
      </div>
    </Frieze>
  )
}
