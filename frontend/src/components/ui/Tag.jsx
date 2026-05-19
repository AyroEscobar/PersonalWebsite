// Tech / label chip.

export default function Tag({ children, className = '' }) {
  return <span className={`tag ${className}`}>{children}</span>
}
