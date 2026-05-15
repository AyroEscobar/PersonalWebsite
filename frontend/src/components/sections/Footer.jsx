const serifItalic = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }

export default function Footer() {
  return (
    <footer className="py-10 px-6 max-w-[900px] mx-auto">
      <div
        className="flex items-center justify-center mb-7 text-[#9c8a72]"
        style={{ ...serifItalic, fontSize: '14px', opacity: 0.7, letterSpacing: '0.5em' }}
        aria-hidden="true"
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
          Set by hand, in React.
        </a>
        <span
          className="text-[#9c8a72]"
          style={{ ...serifItalic, fontSize: '13px', opacity: 0.85, letterSpacing: '0.04em' }}
        >
          Vol. <span style={{ fontVariant: 'small-caps' }}>i</span> · MMXXVI
        </span>
        <span
          className="text-[#6b5645]"
          style={{ ...serifItalic, fontSize: '13px', opacity: 0.85 }}
        >
          RBC NYC → MD7 → JPMC
        </span>
      </div>
    </footer>
  )
}
