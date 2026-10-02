import grid from '../data/dfw-grid.json'
import { posterArt } from './posterArt.js'
import { MAP } from '../content/places.js'
import { FRAMES } from './camera.js'

/*
  GridPoster (PLAN.md 4.1). Owned by A. The night map as one inline SVG,
  rendered at build time and never re-rendered.

  The prerender (and `vite dev`) draws the artwork from dfw-grid.json with
  posterArt(). In the production client bundle that branch is dead code, so
  neither the geometry nor the graph code ships to the browser: on its first
  render the client reads back the markup the server already put in the page.
  React never compares innerHTML while hydrating, and if anything above ever
  forces a client re-render, the poster is rebuilt from that same copy.

  Everything that moves (camera, highlights, the first paint) is CSS driven
  from attributes on the NightGrid wrapper, so this component has no state.

    <GridPoster variant="hero" />             the hero map (NightGrid frames it)
    <GridPoster variant="404" frame="signal" />
                                              a standalone copy with its own ids
                                              (the 404 page, B), centered on the
                                              frame's point at the frame's zoom;
                                              size it with className
*/

const cache = new Map()

function artFor(variant) {
  if (cache.has(variant)) return cache.get(variant)
  let html = ''
  if (import.meta.env.SSR || import.meta.env.DEV) {
    html = posterArt(grid, { id: variant })
  } else if (typeof document !== 'undefined') {
    html = document.querySelector(`.ng-cam[data-variant="${variant}"]`)?.innerHTML ?? ''
  }
  cache.set(variant, html)
  return html
}

function standaloneVars(frame) {
  const f = FRAMES[frame] ?? FRAMES.signal
  return { '--ng-cx-s': `${-Math.round(f.at[0])}px`, '--ng-cy-s': `${-Math.round(f.at[1])}px`, '--ng-z-s': f.z }
}

export default function GridPoster({ variant = 'hero', frame = 'signal', label = MAP.ariaLabel.text, className = '' }) {
  const standalone = variant !== 'hero'
  return (
    <svg
      className={`ng-svg ${className}`.trim()}
      role="img"
      aria-label={label}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      data-standalone={standalone ? '' : undefined}
      style={standalone ? standaloneVars(frame) : undefined}
    >
      <g
        className="ng-cam"
        data-variant={variant}
        dangerouslySetInnerHTML={{ __html: artFor(variant) }}
        suppressHydrationWarning
      />
    </svg>
  )
}
