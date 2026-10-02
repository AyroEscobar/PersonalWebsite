import { useId } from 'react'

/*
  The lit node: a sodium point on a road stroke, the favicon's mark at text
  size. Decorative; the text beside it carries the meaning. The glow is a
  pre-blurred radial gradient (PLAN.md 2.4), never a filter.
*/
export default function NodeMark({ className = '', lit = true }) {
  const g = `nm-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg className={`nodemark ${lit ? 'is-lit' : ''} ${className}`.trim()} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={g} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="nodemark-stop" stopOpacity="0.5" />
          <stop offset="1" className="nodemark-stop" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="nodemark-road" d="M5.2 16C6.3 12.6 7.2 10.2 8 8s1.9-5 3-8" />
      <circle className="nodemark-glow" cx="8" cy="8" r="8" fill={`url(#${g})`} />
      <circle className="nodemark-core" cx="8" cy="8" r="2.6" />
    </svg>
  )
}
