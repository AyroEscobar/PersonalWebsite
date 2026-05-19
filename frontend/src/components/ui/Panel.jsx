// Mission-control panel — bordered card with a bracketed terminal header.

const ACCENT = {
  cyan: 'text-cyan', amber: 'text-amber', green: 'text-green',
  magenta: 'text-magenta', yellow: 'text-yellow', red: 'text-red',
}

export function PanelHeader({ title, meta, accent = 'cyan' }) {
  return (
    <div className="flex items-center gap-2.5 px-4 h-9 border-b border-border select-none">
      <span className="text-muted text-xs">[</span>
      <span
        className={`${ACCENT[accent] || ACCENT.cyan} font-mono`}
        style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em' }}
      >
        {title}
      </span>
      <span className="flex-1 h-px bg-line" />
      {meta && (
        <span className="eyebrow" style={{ letterSpacing: '0.14em' }}>{meta}</span>
      )}
      <span className="text-muted text-xs">]</span>
    </div>
  )
}

export function Panel({
  title, meta, accent = 'cyan',
  glow = false, scan = false,
  className = '', bodyClass = 'p-5',
  children, ...rest
}) {
  return (
    <div
      className={`panel ${glow ? 'panel-glow' : ''} ${scan ? 'scanlines' : ''} ${className}`}
      {...rest}
    >
      {title && <PanelHeader title={title} meta={meta} accent={accent} />}
      <div className={bodyClass}>{children}</div>
    </div>
  )
}

export default Panel
