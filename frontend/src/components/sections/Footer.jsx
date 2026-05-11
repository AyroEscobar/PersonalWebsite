const serifItalic = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

export default function Footer() {
  return (
    <footer className="py-10 px-6 max-w-[900px] mx-auto">
      <div
        className="flex items-center justify-center mb-6 text-[#9e451d]"
        style={{ ...serifItalic, fontSize: '18px', opacity: 0.55, letterSpacing: '0.4em' }}
      >
        ✦ ✦ ✦
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <a
          href="https://github.com/AyroEscobar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6b5645] hover:text-[#9e451d] transition-colors"
          style={{ ...serifItalic, fontSize: '14px' }}
        >
          Built by Ayro Escobar
        </a>
        <span
          className="text-[#6b5645]"
          style={{ ...serifItalic, fontSize: '13px', opacity: 0.8 }}
        >
          RBC NYC → MD7 → JPMC · before twenty-five
        </span>
      </div>
    </footer>
  )
}
