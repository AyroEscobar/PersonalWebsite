// ASCII-style proficiency / progress bar.

const COL = {
  cyan: '#6dd5ff', amber: '#ffb86b', green: '#6ee7a3',
  magenta: '#d99cff', yellow: '#f5d76e', red: '#ff6b8a',
}

export default function Bar({ value = 0, blocks = 22, accent = 'cyan' }) {
  const pct = Math.min(100, Math.max(0, value))
  const filled = Math.round((pct / 100) * blocks)
  return (
    <span
      className="font-mono"
      style={{ fontSize: '10px', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}
      aria-hidden="true"
    >
      <span style={{ color: COL[accent] || COL.cyan }}>{'█'.repeat(filled)}</span>
      <span style={{ color: '#1f2532' }}>{'█'.repeat(Math.max(0, blocks - filled))}</span>
    </span>
  )
}
