import Field from '../field/Field.jsx'
import Glass from '../glass/Glass.jsx'
import Masthead from '../ui/Masthead.jsx'
import QuietSwitch from '../ui/QuietSwitch.jsx'
import LensNav from '../ui/LensNav.jsx'
import LensLine from '../ui/LensLine.jsx'
import Button from '../ui/Button.jsx'
import Chip from '../ui/Chip.jsx'
import BuildCard from '../ui/BuildCard.jsx'
import NowList from '../ui/NowList.jsx'
import WorkPlate from '../ui/WorkPlate.jsx'
import Stack from '../ui/Stack.jsx'
import Receipt from '../ui/Receipt.jsx'
import LinkRow from '../ui/LinkRow.jsx'
import CopyEmail from '../ui/CopyEmail.jsx'
import ToastRegion, { ToastView } from '../ui/Toast.jsx'
import SectionHead from '../ui/SectionHead.jsx'
import ContactCard from '../ui/ContactCard.jsx'
import Footer from '../chrome/Footer.jsx'
import { ArrowDown, ArrowOut, Copy, Mail } from '../ui/icons.jsx'
import { KIT } from '../content/kit.js'
import { SKIP, HERO, ORIGIN } from '../content/identity.js'
import { BUILDS } from '../content/builds.js'
import { WORK } from '../content/work.js'
import { NOW } from '../content/now.js'
import { SIGNAL } from '../content/signal.js'
import { sectionById } from '../content/sections.js'

/*
  The kit (/kit, DESIGN.md 5.15). Every component in every state on one
  page, with the production CSS and the real content modules. Rows are
  variants, columns are states, each cell labelled (prototype b's matrix).
  The forcing classes (.is-hover, .is-focus, .is-active, .is-loading) exist
  only for this page; forced-state specimens are inert so the keyboard walk
  only meets live controls. The fallback row uses .sim-* classes and says
  SIMULATED. Each group sits over its own field, because glass needs
  something to bend.
*/

const S = KIT.states
const card = (id) => BUILDS.cards.find((c) => c.id === id)
const plate = (id) => WORK.plates.find((p) => p.id === id)
const B = (c, d, x, y, a) => ({ c, d, x, y, a, dm: d * 1.5, xm: x, ym: y })

// The material line: his words, from ORIGIN.level, behind the glass.
const LEVEL = ORIGIN.level.text
const HOLDS = 'work that quietly holds itself up'
const holds = LEVEL.includes(HOLDS) ? HOLDS : LEVEL.split('.')[0]
const LINE2 = 'where my family never has'
const line2 = ORIGIN.pull.text.includes(LINE2) ? LINE2 : ''

// Each group's light sits behind its glass: two to four deep blobs, pulled in under the surfaces.
const FIELDS = {
  // the clear swatch is the hero's lens, so it sits over the hero's lighter peach, not a deep blob
  material: [{ ...B('peach', 50, 12, 55), dm: 80, xm: 20, ym: 40 }, { ...B('butter-d', 46, 40, 35), xm: 92, ym: 30 }, { ...B('sky-d', 50, 66, 60), xm: 10, ym: 80 }, { ...B('lilac-d', 48, 92, 45), xm: 90, ym: 80 }],
  // the lens is the hero's: it reads over the hero's own lighter field, never a deep blob (saturate 200% turns one neon)
  nav: [{ ...B('peach', 52, 14, 30), ym: 14 }, { ...B('butter', 46, 50, 20), xm: 100, ym: 40 }, B('sky', 52, 86, 40), { ...B('rose', 44, 40, 70, 0.6), ym: 50 }, B('lilac-d', 40, 30, 96, 0.7)],
  buttons: [B('sky-d', 50, 14, 55), B('peach-d', 46, 46, 45), B('lilac-d', 50, 80, 60), B('butter-d', 36, 100, 20, 0.8)],
  chips: [B('butter-d', 50, 22, 45), B('lilac-d', 48, 72, 45), B('peach-d', 36, 96, 90, 0.85)],
  cards: [B('peach-d', 54, 8, 30), B('butter-d', 46, 40, 20), B('sky-d', 54, 70, 30), B('lilac-d', 50, 20, 80), B('rose-d', 48, 86, 80)],
  lists: [B('lilac-d', 54, 14, 20), B('sky-d', 50, 46, 60), B('peach-d', 52, 82, 30), B('butter-d', 46, 76, 85), B('rose-d', 44, 12, 85)],
  bits: [B('sky-d', 50, 14, 45), B('butter-d', 46, 46, 40), B('rose-d', 48, 80, 50)],
  contact: [B('peach-d', 56, 22, 50), B('butter-d', 50, 52, 46), B('rose-d', 44, 80, 60, 0.85)],
  fallbacks: [B('sky-d', 46, 12, 50), B('peach-d', 44, 38, 40), B('lilac-d', 46, 64, 60), B('butter-d', 44, 90, 40)],
  tokens: [B('butter-d', 44, 20, 40, 0.8), B('sky-d', 44, 80, 60, 0.8)],
}

function Group({ id, title, field, sim = false, children, className = '' }) {
  return (
    <section className={`kit-group ${className}`.trim()} aria-labelledby={`kit-${id}`}>
      {field && <Field blobs={FIELDS[field]} />}
      <div className="page on-field">
        <h2 id={`kit-${id}`} className="kit-label">
          {title}
          {sim && <span className="kit-sim">{KIT.simulated.text}</span>}
        </h2>
        {children}
      </div>
    </section>
  )
}

const Cap = ({ children }) => <p className="kit-cap">{children}</p>

function Cell({ label, children, className = '' }) {
  return (
    <div className={`kit-cell ${className}`.trim()}>
      <div className="kit-specimen">{children}</div>
      <Cap>{label}</Cap>
    </div>
  )
}

/* ---------- buttons: 3 variants by 6 states ---------- */
const BTN_STATES = [
  ['rest', {}],
  ['hover', { state: 'hover' }],
  ['focus', { state: 'focus' }],
  ['active', { state: 'active' }],
  ['disabled', { disabled: true }],
  ['loading', { busy: true }],
]
const BTN_VARIANTS = [
  ['primary', { icon: Copy, label: SIGNAL.copyEmail.text, busyLabel: SIGNAL.copyingEmail.text }],
  ['glass', { icon: ArrowOut, label: KIT.sample.button.text, busyLabel: KIT.sample.buttonBusy.text }],
  ['ghost', { icon: ArrowOut, label: KIT.sample.ghost.text, busyLabel: KIT.sample.ghostBusy.text }],
]

function ButtonMatrix() {
  return (
    <div className="kit-matrix" inert>
      <div className="kit-mrow kit-mhead" aria-hidden="true">
        <span />
        {BTN_STATES.map(([k]) => (
          <span key={k} className="kit-cap">
            {S[k].text}
          </span>
        ))}
      </div>
      {BTN_VARIANTS.map(([v, p]) => (
        <div key={v} className="kit-mrow">
          <span className="kit-mname">{KIT.variants[v].text}</span>
          {BTN_STATES.map(([k, st]) => (
            <div key={k} className="kit-mcell">
              <Button variant={v} icon={p.icon} busyLabel={p.busyLabel} {...st}>
                {p.label}
              </Button>
              <span className="kit-cap kit-mcap">{S[k].text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ---------- the fallbacks, side by side ---------- */
function FallbackSpecimen() {
  return (
    <div className="kit-fb-stack">
      <p className="sentence kit-fb-line">
        <LensLine>{holds.split(' ').slice(0, 3).join(' ')}</LensLine>
      </p>
      <Glass tier="sheet" className="kit-fb-sheet">
        <div className="chips">
          <Chip status="now" />
          <Chip>{BUILDS.cards[0].meta.split(' · ')[1]}</Chip>
        </div>
        <p className="card-body">{NOW.mission.text}</p>
      </Glass>
      <div className="btn-group">
        <Button variant="primary" icon={Mail}>
          {SIGNAL.emailLabel.text}
        </Button>
        <Button variant="glass" icon={ArrowDown}>
          {KIT.sample.work.text}
        </Button>
      </div>
    </div>
  )
}

export default function Kit() {
  const pool = card('build-pool')
  const rbc = plate('plate-rbc')
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <main id="main" tabIndex={-1} className="kit">
        {/* ---------- header ---------- */}
        <header className="kit-top">
          <Field blobs={[B('peach', 60, 14, 10), B('butter', 50, 50, -10), B('sky', 56, 92, 30), B('rose', 40, 46, 70, 0.45)]} className="field--hero" />
          <div className="page on-field">
            <Masthead />
            <div className="kit-intro">
              <h1 className="kit-word voice">{KIT.word.text}</h1>
              <p className="kit-line voice">{KIT.line.text}</p>
              <p className="kit-back">
                <a href="/">{KIT.back.text}</a>
              </p>
            </div>
          </div>
        </header>

        {/* ---------- the material ---------- */}
        <Group id="material" title={KIT.groups.material.text} field="material">
          <div className="kit-material">
            <p className="kit-material-words voice" aria-hidden="true">
              {holds}
            </p>
            <div className="kit-swatches">
              <div className="kit-swatch-cell">
                <Glass tier="clear" lens="lens" className="kit-swatch kit-swatch--clear" />
                <Cap>{KIT.material.clear.text}</Cap>
              </div>
              <div className="kit-swatch-cell">
                <Glass tier="thick" lens="card" spec className="kit-swatch" />
                <Cap>{KIT.material.thick.text}</Cap>
              </div>
              <div className="kit-swatch-cell">
                <Glass tier="sheet" spec className="kit-swatch" />
                <Cap>{KIT.material.sheet.text}</Cap>
              </div>
              <div className="kit-swatch-cell">
                <Glass tier="clear" lens="nav" className="kit-swatch kit-swatch--bar lens-nav is-pill" />
                <Cap>{KIT.material.bar.text}</Cap>
              </div>
            </div>
          </div>
        </Group>

        {/* ---------- 5.1 the lens nav ---------- */}
        <Group id="nav" title={KIT.groups.nav.text} field="nav">
          <div className="kit-nav">
            <Cell label={KIT.nav.lens.text} className="kit-cell--lens">
              <p className="sentence kit-lens-sentence">{line2 && <LensLine>{line2}</LensLine>}</p>
            </Cell>
            <div className="kit-nav-row">
              <Cell label={KIT.nav.pill.text}>
                <LensNav state="pill" active="now" aria-label={KIT.nav.pill.text} />
              </Cell>
              <Cell label={KIT.nav.states.text}>
                <div inert>
                  <LensNav state="pill" active="origin" states={{ now: 'hover', work: 'focus', builds: 'active' }} aria-label={KIT.nav.states.text} />
                </div>
              </Cell>
              <Cell label={KIT.nav.dock.text} className="kit-cell--dock">
                <LensNav state="dock" active="work" aria-label={KIT.nav.dock.text} />
              </Cell>
            </div>
          </div>
        </Group>

        {/* ---------- 5.2 masthead and the quiet switch ---------- */}
        <Group id="masthead" title={KIT.groups.masthead.text} field="chips">
          <div className="kit-row kit-row--masthead">
            <div className="kit-mast">
              <Masthead quiet={false} />
            </div>
            <div className="kit-cells" inert>
              <Cell label={S.rest.text}>
                <QuietSwitch state="" pressed={false} tip={false} />
              </Cell>
              <Cell label={S.hover.text}>
                <QuietSwitch state="hover" pressed={false} tip={false} />
              </Cell>
              <Cell label={S.focus.text}>
                <QuietSwitch state="focus" pressed={false} tip={false} />
              </Cell>
              <Cell label={S.active.text}>
                <QuietSwitch state="active" pressed={false} tip={false} />
              </Cell>
              <Cell label={S.pressed.text}>
                <QuietSwitch state="" pressed tip={false} />
              </Cell>
            </div>
          </div>
        </Group>

        {/* ---------- 5.3 buttons ---------- */}
        <Group id="buttons" title={KIT.groups.buttons.text} field="buttons">
          <ButtonMatrix />
          <div className="kit-spill" inert>
            <div className="btn-group">
              <Button variant="glass" icon={ArrowDown} state="active" style={{ '--mx': '78%', '--my': '60%' }}>
                {KIT.sample.work.text}
              </Button>
              <Button variant="glass" icon={ArrowOut} className="is-spill" style={{ '--mx': '-14px', '--my': '24px' }}>
                {KIT.sample.button.text}
              </Button>
            </div>
            <Cap>{S.spill.text}</Cap>
          </div>
        </Group>

        {/* ---------- 5.4 chips, 5.8 receipts, 5.12 section head ---------- */}
        <Group id="chips" title={KIT.groups.chips.text} field="chips">
          <div className="kit-row">
            <Glass tier="sheet" className="kit-panel">
              <div className="chips">
                <Chip status="now" />
                <Chip status="past" />
              </div>
              <Cap>{KIT.chips.status.text}</Cap>
              <div className="chips">
                <Chip>{BUILDS.cards[1].meta.split(' · ')[1]}</Chip>
                <Chip>{BUILDS.cards[1].meta.split(' · ')[0]}</Chip>
                <Chip>{BUILDS.cards[2].meta}</Chip>
                <Chip word>{BUILDS.cards[0].meta.split(' · ')[0]}</Chip>
              </div>
              <Cap>{KIT.chips.plain.text}</Cap>
            </Glass>
            <div>
              <h3 className="kit-label kit-label--sub">{KIT.groups.head.text}</h3>
              <SectionHead word={sectionById('now').label.text} line={NOW.mission.text} as="p" />
            </div>
          </div>
        </Group>

        <Group id="receipts" title={KIT.groups.receipt.text} field="bits">
          <Glass tier="sheet" className="kit-panel kit-receipts">
            <Receipt value={pool.receipt.value} label={pool.receipt.label} facts={pool.facts} />
            <Receipt value={rbc.receipt.value} label={rbc.receipt.label} facts={rbc.facts} />
            {rbc.desks
              .filter((d) => d.receipt)
              .map((d) => (
                <Receipt key={d.id} value={d.receipt.value} label={d.receipt.label} facts={d.facts} />
              ))}
          </Glass>
        </Group>

        {/* ---------- 5.5 card ---------- */}
        <Group id="card" title={KIT.groups.card.text} field="cards">
          <div className="kit-cards">
            <Cell label={`${KIT.card.glass.text}, ${S.rest.text}`}>
              <BuildCard card={card('build-viaere')} />
            </Cell>
            <Cell label={`${KIT.card.glass.text}, ${S.hover.text}`}>
              <BuildCard card={card('build-neetcode')} state="hover" />
            </Cell>
            <Cell label={KIT.card.focus.text}>
              <BuildCard card={card('build-pool')} state="focus" />
            </Cell>
            <Cell label={KIT.card.base.text}>
              <BuildCard card={card('build-gaia')} base />
            </Cell>
          </div>
        </Group>

        {/* ---------- 5.6 now, 5.7 plates ---------- */}
        <Group id="lists" title={`${KIT.groups.now.text}, ${KIT.groups.plate.text}`} field="lists">
          <div className="kit-lists">
            <div className="kit-col">
              <NowList />
              <WorkPlate plate={plate('plate-jpm')} />
              <Stack />
            </div>
            <div className="kit-col">
              <WorkPlate plate={rbc} open />
              <Cap>{`${WORK.desksLabel.text}, ${S.open.text}`}</Cap>
            </div>
          </div>
        </Group>

        {/* ---------- 5.9 link row, 5.10 tooltip, 5.11 toast ---------- */}
        <Group id="bits" title={`${KIT.groups.linkrow.text}, ${KIT.groups.tooltip.text}, ${KIT.groups.toast.text}`} field="bits">
          <div className="kit-bits">
            <Cell label={S.rest.text}>
              <LinkRow />
            </Cell>
            <Cell label={KIT.linkrow.legend.text}>
              <div inert>
                <LinkRow states={{ 'channel-github': 'hover', 'channel-linkedin': 'focus', 'channel-instagram': 'active' }} />
              </div>
            </Cell>
            <Cell label={`${KIT.groups.tooltip.text}, ${S.shown.text}`} className="kit-cell--tip">
              <div inert>
                <CopyEmail tipOpen />
              </div>
            </Cell>
            <Cell label={`${KIT.groups.toast.text}, ${S.shown.text}`}>
              <ToastView text={SIGNAL.copied.text} />
            </Cell>
          </div>
        </Group>

        {/* ---------- 5.13 contact card ---------- */}
        <Group id="contact" title={KIT.groups.contact.text} field="contact">
          <ContactCard idPrefix="kit-contact" />
        </Group>

        {/* ---------- 4.4 fallbacks ---------- */}
        <Group id="fallbacks" title={KIT.groups.fallbacks.text} field="fallbacks" sim>
          <div className="kit-fallbacks" inert>
            {[
              ['sim-noblur', KIT.fallbacks.noblur.text],
              ['sim-reduced', KIT.fallbacks.reduced.text],
              ['sim-contrast', KIT.fallbacks.contrast.text],
              ['sim-forced', KIT.fallbacks.forced.text],
            ].map(([cls, label]) => (
              <div key={cls} className="kit-fb">
                <div className={cls}>
                  <FallbackSpecimen />
                </div>
                <Cap>{label}</Cap>
              </div>
            ))}
          </div>
        </Group>

        {/* ---------- tokens ---------- */}
        <Group id="tokens" title={KIT.groups.tokens.text} field="tokens">
          <div className="kit-tokens">
            <div>
              <h3 className="kit-label kit-label--sub">{KIT.tokens.color.text}</h3>
              <ul className="kit-swatchlist">
                {['base', 'ink', 'ink-2', 'ink-3', 'accent', 'ok'].map((t) => (
                  <li key={t}>
                    <span className="kit-chipcolor" style={{ background: `var(--${t})` }} />
                    <span className="kit-cap">{t}</span>
                  </li>
                ))}
              </ul>
              <h3 className="kit-label kit-label--sub">{KIT.tokens.field.text}</h3>
              <ul className="kit-swatchlist">
                {['peach', 'butter', 'sky', 'lilac', 'rose', 'peach-d', 'butter-d', 'sky-d', 'lilac-d', 'rose-d'].map((t) => (
                  <li key={t}>
                    <span className="kit-chipcolor kit-chipcolor--field" style={{ background: `radial-gradient(closest-side, var(--f-${t}), transparent 96%)` }} />
                    <span className="kit-cap">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="kit-label kit-label--sub">{KIT.tokens.type.text}</h3>
              <p className="kit-type-serif voice">{KIT.tokens.serifSample.text}</p>
              <p className="kit-type-sans">{KIT.tokens.sansSample.text}</p>
              <ul className="kit-scale">
                {['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((t) => (
                  <li key={t} style={{ fontSize: `var(--t-${t})` }}>
                    <span className="kit-cap">{t}</span> {HERO.name.text}
                  </li>
                ))}
              </ul>
              <h3 className="kit-label kit-label--sub">{KIT.tokens.radius.text}</h3>
              <ul className="kit-radii">
                {['1', '2', '3', '4', '5', 'full'].map((r) => (
                  <li key={r}>
                    <span className="kit-radius" style={{ borderRadius: `var(--r-${r})` }} />
                    <span className="kit-cap">{r}</span>
                  </li>
                ))}
              </ul>
              <h3 className="kit-label kit-label--sub">{KIT.tokens.space.text}</h3>
              <ul className="kit-space">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <li key={n}>
                    <span className="kit-spacebar" style={{ width: `var(--s-${n})` }} />
                    <span className="kit-cap">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Group>

        <section className="kit-group kit-group--footer" aria-labelledby="kit-footer">
          <div className="page">
            <h2 id="kit-footer" className="kit-label">
              {KIT.groups.footer.text}
            </h2>
          </div>
        </section>
      </main>
      <Footer className="kit-footer" />
      <ToastRegion />
    </>
  )
}
