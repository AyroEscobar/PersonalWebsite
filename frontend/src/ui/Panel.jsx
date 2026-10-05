import Glass from '../glass/Glass.jsx'

/*
  <Panel> (DESIGN.md 5.4): the section surface, thick glass with a local scrim under the copy.
  Hero 520 px, experience 600, stack 660, contact 520 (all min(width, 100%)). Padding 36/34/34.
  States: rest · entering (.reveal → .in, 240 ms, 16 px rise) · quiet (the plate). Its rim faces the rock.

    <Panel variant="hero" reveal>...</Panel>
*/
export default function Panel({ variant, reveal = true, state, className = '', children, ...rest }) {
  const cls = ['panel', variant && `panel--${variant}`, reveal && 'reveal', state === 'entering' && 'is-entering', state === 'in' && 'in', className].filter(Boolean).join(' ')
  return (
    <Glass tier="thick" scrim radius="panel" className={cls} {...rest}>
      {children}
    </Glass>
  )
}
