import META from '../data/dfw-nodes.json'
import { NODES } from '../content/places.js'
import './grid.css'

/*
  NodeTag (PLAN.md 4.4). Owned by A, used by C (ReleasePlate headers and the
  phone section heads, where the map does not follow you down the page).

    <NodeTag node="allen" />                 state from content/places.js
    <NodeTag node="nyc" state="lit-past" />  lit-now (LED), lit-past (sodium), dim

  A 48 x 20 px crop of the real limited-access roads around the node
  (dfw-nodes.json, cut by scripts/build-grid.mjs), the node lit in the
  middle, and the city name in mono. Off-grid nodes (nyc, waterloo) are
  framed on the Texas node their line leaves from, with the line running off
  the edge of the sprite toward the city.

  It is an image with a name ("Allen, Texas"), not a control. Static: there
  is nothing to reduce under reduced motion.
*/

const { w: W, h: H, paths } = META.tags

function exitLine(deg) {
  // From the center of the sprite to its edge along the bearing (x10 units).
  const rad = (deg * Math.PI) / 180
  const ux = Math.sin(rad)
  const uy = -Math.cos(rad)
  const cx = W * 5
  const cy = H * 5
  const t = Math.min(ux ? Math.abs(cx / ux) : Infinity, uy ? Math.abs(cy / uy) : Infinity)
  const ex = Math.round(cx + ux * t)
  const ey = Math.round(cy + uy * t)
  return { d: `M${cx} ${cy}L${ex} ${ey}`, ex, ey }
}

export default function NodeTag({ node, state, className = '' }) {
  const info = NODES[node]
  if (!info) return null
  const lit = state ?? info.state
  const off = META.offgrid[node]
  const exit = off ? exitLine(off.deg) : null
  const d = paths[node] ?? ''
  return (
    <span className={`node-tag ${className}`.trim()} data-state={lit} role="img" aria-label={info.a11y}>
      <svg
        className="node-tag-map"
        viewBox={`0 0 ${W * 10} ${H * 10}`}
        width={W}
        height={H}
        aria-hidden="true"
        focusable="false"
      >
        <path className="node-tag-roads" d={d} />
        {exit ? (
          <>
            <path className="node-tag-exit" d={exit.d} />
            <circle className="node-tag-from" cx={W * 5} cy={H * 5} r="18" />
            <circle className="node-tag-dot" cx={exit.ex} cy={exit.ey} r="26" />
          </>
        ) : (
          <>
            <circle className="node-tag-halo" cx={W * 5} cy={H * 5} r="60" />
            <circle className="node-tag-dot" cx={W * 5} cy={H * 5} r="26" />
          </>
        )}
      </svg>
      <span className="node-tag-name" aria-hidden="true">
        {info.text}
      </span>
    </span>
  )
}
