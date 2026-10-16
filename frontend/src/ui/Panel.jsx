import Glass from '../glass/Glass.jsx'

/*
  <Panel>: the section surface, a frosted plate with a flat scrim under the copy and a 1px hairline.
  Hero 540 px, experience 600, stack 620, contact 520 (all min(width, 100%)). Padding 40/40/36.
  States: rest · entering (.reveal → .in, 240 ms, 16 px rise) · quiet (the plate).

    <Panel variant="hero" reveal>...</Panel>
*/
export default function Panel({ variant, reveal = true, state, className = '', children, ...rest }) {
  const cls = ['panel', variant && `panel--${variant}`, reveal && 'reveal', state === 'entering' && 'is-entering', state === 'in' && 'in', className].filter(Boolean).join(' ')
  return (
    <Glass scrim radius="panel" className={cls} {...rest}>
      {children}
    </Glass>
  )
}
