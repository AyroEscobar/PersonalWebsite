import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

const CHANNELS = [
  { href: 'https://github.com/AyroEscobar', Icon: FaGithub, label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/ayroescobar/', Icon: FaLinkedin, label: 'LinkedIn' },
  { href: 'mailto:ayro.escobar@gmail.com', Icon: MdEmail, label: 'Email' },
  { href: 'https://www.instagram.com/ayro.afk/', Icon: FaInstagram, label: 'Instagram' },
]

export default function Footer() {
  return (
    <footer className="px-6 md:px-10 pb-10 pt-4">
      <div className="max-w-[1120px] mx-auto">
        <div className="h-px bg-border mb-5" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-cyan" style={{ fontSize: '12px' }}>◇</span>
            <span className="eyebrow" style={{ letterSpacing: '0.14em' }}>
              OPERATOR.AYRO
            </span>
            <span className="text-muted">·</span>
            <span className="eyebrow">BUILD v2.0</span>
            <span className="text-muted">·</span>
            <span className="eyebrow text-green" style={{ letterSpacing: '0.14em' }}>ONLINE</span>
          </div>

          <div className="flex items-center gap-4">
            {CHANNELS.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                aria-label={label}
                className="text-dim hover:text-cyan transition-colors"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>

          <span className="eyebrow" style={{ opacity: 0.7 }}>
            RBC NYC → MD7 → JPMC · MMXXVI
          </span>
        </div>
      </div>
    </footer>
  )
}
