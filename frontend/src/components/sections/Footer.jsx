export default function Footer() {
  return (
    <footer className="py-8 px-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <a
          href="https://github.com/AyroEscobar"
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-[12px] text-[#8a93a3] hover:text-[#64ffda] transition-colors"
        >
          Built by Ayro Escobar
        </a>
        <span className="mono text-[11px] text-[#8a93a3] opacity-70">
          RBC NYC → MD7 → JPMC · before 25
        </span>
      </div>
    </footer>
  )
}
