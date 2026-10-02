import grid from '../data/dfw-grid.json'
import { bandArt } from './posterArt.js'

/*
  PosterBand (r2 U6). Owned by A. A short band of the night map that closes
  the page: every road again, unlit, and nothing alive but the obstruction
  beacon over Plano, so the page opens and closes on the city. On phones,
  where the hero map scrolls away, it is the second time the map appears.

  The roads are <use> references to the hero poster's own paths, so the band
  adds a few hundred bytes, not a second copy of the geometry. Like
  GridPoster, the markup is made in the prerender and read back on the
  client, so the graph code never ships. Decoration only (aria-hidden); the
  beacon blinks only where motion is allowed (motion.css .beacon).
*/
let cached = null
function art() {
  if (cached != null) return cached
  if (import.meta.env.SSR || import.meta.env.DEV) cached = bandArt(grid, { id: 'hero' })
  else if (typeof document !== 'undefined') cached = document.querySelector('.cb-cam')?.innerHTML ?? ''
  else cached = ''
  return cached
}

const [PX, PY] = grid.nodes.plano

export default function PosterBand({ children }) {
  return (
    <div className="closer-band">
      <svg className="cb-map" aria-hidden="true" focusable="false" data-deco="">
        <g className="cb-cam" style={{ '--cb-x': `${-PX}px`, '--cb-y': `${-PY}px` }} dangerouslySetInnerHTML={{ __html: art() }} suppressHydrationWarning />
      </svg>
      <span className="cb-beacon beacon" aria-hidden="true" data-deco="" />
      {children}
    </div>
  )
}
