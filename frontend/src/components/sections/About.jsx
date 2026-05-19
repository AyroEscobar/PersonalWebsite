import Section from '../ui/Section'
import { Panel } from '../ui/Panel'
import pfp from '../../assets/pfp-web.jpg'

const FACTS = [
  { k: 'AGE',    v: '20' },
  { k: 'ORIGIN', v: 'Plano, Texas' },
  { k: 'EDU',    v: 'UT Dallas · CS · 2027' },
  { k: 'LANGS',  v: 'English · Spanish' },
  { k: 'STATUS', v: 'US Citizen' },
]

export default function About() {
  return (
    <Section id="about" code="SECTION 01 // PROFILE" title="Operator profile" intro="WHO IS RUNNING THIS">
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
        <Panel title="OPERATOR.PROFILE" accent="cyan" glow>
          <div className="space-y-4 text-dim" style={{ fontSize: '14px', lineHeight: 1.85 }}>
            <p>
              <span className="text-cyan">▸ </span>
              I'm a software engineer out of <span className="text-ink">Plano, Texas</span>,
              twenty years old, studying Computer Science at{' '}
              <span className="text-ink">UT Dallas</span> with a 2027 graduation. The long
              timeline is not a slow walk. It is back to back internships I refused to skip.
            </p>
            <p>
              I went <span className="text-ink">RBC New York</span> →{' '}
              <span className="text-ink">MD7</span> → <span className="text-ink">JP Morgan</span>{' '}
              before I turned twenty one. Alongside that I built a 24/7 multi-agent system
              that runs my life: finances, health, the news I read, the briefing I wake up
              to. It runs on Claude and the OpenClaw runtime, so I can spend my attention on
              the work that actually moves things.
            </p>
            <p>
              I want to be financially free, take care of my family, and ship things that
              outlast me, all before I turn twenty five. That sentence is the whole map.
              Every role, every hour, gets weighed against it.
            </p>
          </div>

          <div className="mt-6 border-l-2 border-cyan/40 pl-4 py-1">
            <p className="text-ink" style={{ fontSize: '13.5px', lineHeight: 1.75 }}>
              "The cost of doing the work is doing the work. There is no shortcut."
            </p>
            <p className="eyebrow mt-2">LOG ENTRY · MAY 2026</p>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="ID.BADGE" accent="cyan" scan bodyClass="p-0">
            <img
              src={pfp}
              alt="Ayro Escobar"
              loading="lazy"
              className="w-full block"
              style={{
                aspectRatio: '4 / 5',
                objectFit: 'cover',
                filter: 'grayscale(0.45) contrast(1.06) brightness(0.9)',
              }}
            />
          </Panel>

          <Panel title="VITALS" accent="amber">
            <div className="space-y-2.5">
              {FACTS.map((f) => (
                <div key={f.k} className="flex items-center gap-3">
                  <span className="eyebrow">{f.k}</span>
                  <span className="flex-1 border-b border-dashed border-line" />
                  <span className="text-ink" style={{ fontSize: '12.5px' }}>{f.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Section>
  )
}
