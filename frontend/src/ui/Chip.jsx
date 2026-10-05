/*
  <Chip> (DESIGN.md 5.3): 30px, radius 14, Mona 13/480 ink-2, never interactive and never
  focusable. The two long chips wrap, never truncate. States: rest · hover (kit: state="hover").
*/
export default function Chip({ state, className = '', children }) {
  return <span className={['chip', state && `is-${state}`, className].filter(Boolean).join(' ')}>{children}</span>
}
