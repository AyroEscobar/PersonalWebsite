import { useEffect } from 'react'
import Neck from '../chrome/Neck.jsx'
import Footer from '../chrome/Footer.jsx'
import Frieze, { Room } from '../hero/Frieze.jsx'
import Poster from '../hero/Poster.jsx'
import Button from '../ui/Button.jsx'
import ProjectCard from '../ui/ProjectCard.jsx'
import ExperienceList from '../ui/ExperienceList.jsx'
import ThemeSwitch from '../ui/ThemeSwitch.jsx'
import QuietSwitch from '../ui/QuietSwitch.jsx'
import CopyEmail from '../ui/CopyEmail.jsx'
import LinkRow from '../ui/LinkRow.jsx'
import SceneControls from '../ui/SceneControls.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import { SectionTitle } from '../ui/Section.jsx'
import { KIT } from '../content/kit.js'
import { HERO, SKIP } from '../content/identity.js'
import { PROJECTS } from '../content/projects.js'
import { EXPERIENCE } from '../content/work.js'
import { NOT_FOUND } from '../content/meta.js'
import { SIGNAL } from '../content/signal.js'
import { startFriezeHost } from '../lib/frieze-host.js'

/*
  The kit (/kit). Every component in every state, with the production CSS and the real content modules,
  on the slip; the live frieze runs in the band at the top (the poster in the still tier). The forcing
  classes (.is-hover, .is-focus, .is-press) exist only for this page; forced-state specimens are inert
  so the keyboard walk only meets live controls. Fallbacks use .sim-* classes and say "simulated".
*/
const S = KIT.states

function Group({ id, title, sim = false, children }) {
  return (
    <section className="kit-group" aria-labelledby={`kit-${id}`}>
      <h2 id={`kit-${id}`} className="kit-h">
        {title}
        {sim && <span className="kit-sim">{KIT.simulated.text}</span>}
      </h2>
      {children}
    </section>
  )
}

const Cell = ({ label, children, className = '' }) => (
  <figure className={`kit-cell ${className}`.trim()}>
    {children}
    <figcaption className="kit-cap">{label}</figcaption>
  </figure>
)

// the palette, as tokens.css names it (rgb and roles are in tokens.css)
const COLOURS = [
  ['slip', '#F1E3CF'],
  ['slip-2', '#F7EDDD'],
  ['clay', '#C47D45'],
  ['clay-lit', '#E09249'],
  ['gloss', '#141110'],
  ['gloss-2', '#1E1916'],
  ['gloss-3', '#241C17'],
  ['foot-dark', '#0D0B0A'],
  ['cream', '#EFE4CC'],
  ['aged', '#C8B491'],
  ['umber', '#3A2E26'],
  ['red', '#6A3227'],
  ['white', '#F4EAD2', true],
]
const TYPE = [
  ['display', 'kit-t-display'],
  ['section', 'kit-t-section'],
  ['text', 'kit-t-text'],
  ['italic', 'kit-t-italic'],
  ['label', 'kit-t-label'],
]

export default function Kit() {
  useEffect(() => startFriezeHost(), [])
  const esvo = PROJECTS[0]
  const viaere = PROJECTS[1]
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <Neck wordmarkHref="/" hrefBase="/" />
      <main id="main" tabIndex={-1} className="kit-main">
        <Frieze band="hero" className="kit-band">
          <div className="kit-band-inner">
            <header className="plate kit-head">
              <a className="kit-back" href="/">
                {KIT.back.text}
              </a>
              <h1 className="kit-word">{KIT.word.text}</h1>
              <p className="kit-line">{KIT.line.text}</p>
            </header>
            <Room alt={HERO.sceneAlt.text} />
          </div>
        </Frieze>

        <div className="wrap kit-body">
          <Group id="tokens" title={KIT.groups.tokens.text}>
            <p className="kit-sub">{KIT.tokens.color.text}</p>
            <ul className="kit-swatches">
              {COLOURS.map(([t, hex, sceneOnly]) => (
                <li key={t}>
                  <span className="kit-swatch" style={{ background: `var(--${t})` }} />
                  <span className="kit-cap">
                    {t} <span className="tnum">{hex}</span>
                    {sceneOnly && <> · {KIT.tokens.sceneOnly.text}</>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="kit-sub">{KIT.tokens.type.text}</p>
            <div className="kit-type">
              {TYPE.map(([t, cls]) => (
                <p key={t} className={`${cls} kit-type-row`}>
                  <span className="kit-cap kit-type-tag">{t}</span>
                  {HERO.name.text}
                </p>
              ))}
            </div>
          </Group>

          <Group id="plates" title={KIT.groups.plates.text} sim>
            <div className="kit-row kit-row--plates">
              {[
                ['', KIT.plates.plate.text, 'plate'],
                ['', KIT.plates.panel.text, 'card'],
                ['sim-contrast', KIT.plates.contrast.text, 'plate'],
                ['sim-forced', KIT.plates.forced.text, 'plate'],
              ].map(([cls, label, kind]) => (
                <Cell key={label} label={label} className={cls}>
                  <div className={`${kind === 'plate' ? 'plate' : 'card'} kit-sample-plate`}>
                    <p className="card-title">{viaere.title}</p>
                    <p className="card-name">{viaere.name}</p>
                    <p className="card-head">{viaere.headline}</p>
                  </div>
                </Cell>
              ))}
            </div>
          </Group>

          <Group id="buttons" title={KIT.groups.buttons.text}>
            {[
              ['fill', HERO.coffee],
              ['line', HERO.email],
            ].map(([v, b]) => (
              <div key={v}>
                <p className="kit-sub">{KIT.variants[v].text}</p>
                <div className="kit-row" inert>
                  {[['rest', {}], ['hover', { state: 'hover' }], ['focus', { state: 'focus' }], ['press', { state: 'press' }], ['disabled', { disabled: true }]].map(([k, p]) => (
                    <Cell key={k} label={S[k].text}>
                      <Button variant={v} href={b.href} {...p}>
                        {b.label}
                      </Button>
                    </Cell>
                  ))}
                  <Cell label={S.small.text}>
                    <Button variant={v} size="sm" href={b.href}>
                      {b.label}
                    </Button>
                  </Cell>
                </div>
              </div>
            ))}
          </Group>

          <Group id="card" title={KIT.groups.card.text}>
            <div className="kit-cards">
              <Cell label={S.rest.text}>
                <ProjectCard card={esvo} />
              </Cell>
              <Cell label={S.focusWithin.text}>
                <div inert>
                  <ProjectCard card={viaere} state="focus" />
                </div>
              </Cell>
            </div>
          </Group>

          <Group id="experience" title={KIT.groups.experience.text}>
            <ExperienceList lines={EXPERIENCE} />
          </Group>

          <Group id="nav" title={KIT.groups.nav.text}>
            <div className="kit-stack" inert>
              <Cell label={KIT.nav.desktop.text} className="kit-neck-cell">
                <div className="kit-neck frieze">
                  <Neck fixed={false} active="check-out" className="kit-neck-sample" hrefBase="/" />
                </div>
              </Cell>
              <Cell label={KIT.nav.scrolled.text} className="kit-neck-cell">
                <div className="kit-neck">
                  <Neck fixed={false} active="experience" scrolled className="kit-neck-sample" hrefBase="/" />
                </div>
              </Cell>
              <Cell label={`${KIT.nav.phone.text}, ${S.open.text}`} className="kit-neck-cell kit-neck-cell--phone">
                <div className="kit-neck kit-neck--phone">
                  <Neck fixed={false} active="stack" open className="kit-neck-sample neck--phone" hrefBase="/" />
                </div>
              </Cell>
              <div className="kit-row">
                <Cell label={KIT.nav.themeLight.text}>
                  <ThemeSwitch pressed={false} />
                </Cell>
                <Cell label={KIT.nav.themeDark.text}>
                  <ThemeSwitch pressed />
                </Cell>
                <Cell label={KIT.nav.switchOff.text}>
                  <QuietSwitch pressed={false} />
                </Cell>
                <Cell label={KIT.nav.switchOn.text}>
                  <QuietSwitch pressed />
                </Cell>
              </div>
            </div>
          </Group>

          <Group id="ornament" title={KIT.groups.ornament.text}>
            <div className="kit-stack">
              <Cell label={KIT.ornament.meander.text}>
                <div className="frieze kit-orn">
                  <div className="meander" aria-hidden="true" />
                </div>
              </Cell>
              <Cell label={KIT.ornament.tongues.text}>
                <div className="frieze kit-orn kit-orn--tongues">
                  <div className="tongues" aria-hidden="true" />
                </div>
              </Cell>
              <Cell label={KIT.ornament.numerals.text}>
                <div className="kit-numerals">
                  <SectionTitle id="check-out" as="p" className="kit-numeral" />
                  <SectionTitle id="contact" as="p" className="kit-numeral" />
                </div>
              </Cell>
            </div>
          </Group>

          <Group id="contact" title={KIT.groups.contact.text}>
            <div className="kit-stack" inert>
              <Cell label={S.rest.text}>
                <CopyEmail idPrefix="kit-rest" />
              </Cell>
              <Cell label={S.hover.text}>
                <CopyEmail idPrefix="kit-hover" state="hover" />
              </Cell>
              <Cell label={S.copied.text}>
                <CopyEmail idPrefix="kit-copied" copied />
              </Cell>
              <Cell label={`${S.rest.text} · ${S.hover.text} · ${S.focus.text}`}>
                <LinkRow states={{ 'channel-linkedin': 'hover', 'channel-instagram': 'focus' }} />
              </Cell>
              <Cell label={KIT.chrome.closer.text}>
                <p className="closer">{SIGNAL.closer.text}</p>
              </Cell>
            </div>
          </Group>

          <Group id="controls" title={KIT.groups.controls.text}>
            <div className="kit-row kit-row--foot" inert>
              <Cell label={S.rest.text}>
                <div className="kit-foot-box">
                  <SceneControls tier="full" paused={false} motion="on" />
                </div>
              </Cell>
              <Cell label={S.hover.text}>
                <div className="kit-foot-box">
                  <SceneControls tier="full" paused={false} motion="on" state="hover" />
                </div>
              </Cell>
              <Cell label={S.paused.text}>
                <div className="kit-foot-box">
                  <SceneControls tier="full" paused motion="on" />
                </div>
              </Cell>
              <Cell label={S.off.text}>
                <div className="kit-foot-box">
                  <SceneControls tier="still" paused={false} motion="off" />
                </div>
              </Cell>
              <Cell label={S.still.text}>
                <div className="kit-foot-box">
                  <SceneControls tier="still" paused={false} motion="on" />
                </div>
              </Cell>
            </div>
          </Group>

          <Group id="stage" title={KIT.groups.stage.text}>
            <p className="kit-sub">{KIT.stage.note.text}</p>
            <div className="kit-row kit-row--stage">
              <Cell label={S.posterOnly.text}>
                <Poster className="kit-poster" alt="" />
              </Cell>
              <Cell label={`${S.light.text} · ${S.dark.text}`}>
                <div className="kit-themes">
                  <div className="kit-theme kit-theme--light">
                    <Poster className="kit-poster" alt="" />
                  </div>
                  <div className="kit-theme kit-theme--dark">
                    <Poster className="kit-poster" alt="" />
                  </div>
                </div>
              </Cell>
            </div>
          </Group>

          <Group id="chrome" title={KIT.groups.chrome.text}>
            <div className="kit-stack">
              <Cell label={KIT.chrome.skip.text}>
                <span className="skip-link kit-skip">{SKIP.text}</span>
              </Cell>
              <Cell label={KIT.chrome.notFound.text}>
                <div className="kit-nf" inert>
                  <p className="nf-line">{NOT_FOUND.line.text}</p>
                  <p className="nf-actions">
                    <Button variant="fill" href="/">
                      {NOT_FOUND.home.text}
                    </Button>
                  </p>
                </div>
              </Cell>
              <Cell label={KIT.chrome.footer.text}>
                <div className="kit-footer-sample" inert>
                  <Footer kit controls={<SceneControls tier="full" paused={false} motion="on" />} />
                </div>
              </Cell>
            </div>
          </Group>
          <Eyebrow className="kit-end">{KIT.word.text}</Eyebrow>
        </div>
      </main>
      <Footer kit />
    </>
  )
}
