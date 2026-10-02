import { useId } from 'react'

/*
  The lit node (r1 M10): a sodium point where two roads meet, the favicon's
  mark at text size. Two plain strokes and one dot, so it still reads at
  16 px. Decorative; the text beside it carries the meaning. The glow is a
  pre-blurred radial gradient (PLAN.md 2.4), never a filter.
*/
export default function NodeMark({ className = '', lit = true }) {
  const g = `nm-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg className={`nodemark ${lit ? 'is-lit' : ''} ${className}`.trim()} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="nodemark-stop" stopOpacity="0.55" />
          <stop offset="1" className="nodemark-stop" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="nodemark-road" d="M1 12.5 15 4.5M8 8.5 11.5 15.5" />
      <circle className="nodemark-glow" cx="8" cy="8.5" r="7.5" fill={`url(#${g})`} />
      <circle className="nodemark-core" cx="8" cy="8.5" r="2.9" />
    </svg>
  )
}
