/*
  The one icon: a 10 px outward arrow, 1.2 stroke, currentColor. Decorative: every link that has it
  also has a visible word.
*/
export const ArrowOut = ({ className = 'arr' }) => (
  <svg className={className} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
    <path d="M2.5 7.5l5-5M3.5 2.5h4v4" />
  </svg>
)
