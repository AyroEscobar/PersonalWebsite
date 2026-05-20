import Section from '../ui/Section'
import { Panel } from '../ui/Panel'
import pfp from '../../assets/pfp-web.jpg'

const VITALS = [
  { k: 'LANGS',    v: 'English · Spanish' },
  { k: 'STATUS',   v: 'US Citizen' },
  { k: 'FOCUS',    v: 'ai · automation · full stack' },
  { k: 'MUSIC',    v: 'always on' },
  { k: 'LEARNING', v: 'whatever’s next' },
]

export default function About() {
  return (
    <Section id="about" code="SECTION 01 // PROFILE" title="Operator profile" intro="WHO IS RUNNING THIS">
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
        <Panel title="OPERATOR.PROFILE" accent="cyan" glow>
          <div className="space-y-4 text-dim" style={{ fontSize: '14px', lineHeight: 1.85 }}>
            <p>
              <span className="text-cyan">▸ </span>
              the hunger came from realizing how much of the world runs on
              invisible systems. somebody wrote the code that settles every
              trade, gets your food to the door, routes messages around the
              world, and tells an ambulance which street to take to your
              house. that's the part i fell in love with.
            </p>
            <p>
              i'm trying to be the kind of engineer who can build that. work
              that quietly holds itself up, doesn't need a human in the loop,
              doesn't sleep when i do.{' '}
              <span className="text-ink">that's the level i'm aiming at.</span>
            </p>
            <p>
              outside of code: music while i work, and a stubborn need to
              learn whatever i don't know yet. when i'm burnt out, i recover
              on minecraft videos, anime, or the Distractible podcast.
            </p>
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
              {VITALS.map((f) => (
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
