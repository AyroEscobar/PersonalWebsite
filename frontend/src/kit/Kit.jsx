import Stage from '../hero/Stage.jsx'
import Poster from '../hero/Poster.jsx'
import Glass from '../glass/Glass.jsx'
import Wordmark from '../ui/Wordmark.jsx'
import NavPill from '../ui/NavPill.jsx'
import Button from '../ui/Button.jsx'
import Panel from '../ui/Panel.jsx'
import ProjectCard from '../ui/ProjectCard.jsx'
import ExperienceList from '../ui/ExperienceList.jsx'
import QuietSwitch from '../ui/QuietSwitch.jsx'
import CopyEmail from '../ui/CopyEmail.jsx'
import LinkRow from '../ui/LinkRow.jsx'
import SceneControls from '../ui/SceneControls.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Footer from '../chrome/Footer.jsx'
import { KIT } from '../content/kit.js'
import { HERO, SKIP } from '../content/identity.js'
import { PROJECTS } from '../content/projects.js'
import { EXPERIENCE } from '../content/work.js'
import { NOT_FOUND } from '../content/meta.js'
import { SIGNAL } from '../content/signal.js'

/*
  The kit (/kit, DESIGN.md 5.14). Every component in every state over the live scene (the
  still poster in the still tier), with the production CSS and the real content modules. The
  forcing classes (.is-hover, .is-focus, .is-press) exist only for this page; forced-state
  specimens are inert so the keyboard walk only meets live controls. Fallbacks use .sim-*
  classes and say "simulated".
*/
const S = KIT.states

function Group({ id, title, sim = false, bare = false, children }) {
  return (
    <section className={`kit-group ${bare ? 'kit-group--bare' : ''}`.trim()} aria-labelledby={`kit-${id}`}>
      {bare ? (
        <>
          <h2 id={`kit-${id}`} className="kit-h kit-h--bare">
            {title}
            {sim && <span className="kit-sim">{KIT.simulated.text}</span>}
          </h2>
          {children}
        </>
      ) : (
        <Panel reveal={false} className="kit-panel">
          <h2 id={`kit-${id}`} className="kit-h">
            {title}
            {sim && <span className="kit-sim">{KIT.simulated.text}</span>}
          </h2>
          {children}
        </Panel>
      )}
    </section>
  )
}

const Cell = ({ label, children, className = '' }) => (
  <figure className={`kit-cell ${className}`.trim()}>
    {children}
    <figcaption className="kit-cap">{label}</figcaption>
  </figure>
)

const COLOURS = [
  ['void', '#070B16', ''],
  ['plate', '#10172A', ''],
  ['ink', '#F2F5FA', `18.0:1 ${KIT.tokens.onVoid.text}`],
  ['ink-2', '#C5CFDE', `12.5:1 ${KIT.tokens.onVoid.text}`],
  ['cyan', '#9AD2FF', `12.2:1 ${KIT.tokens.onVoid.text}`],
  ['magenta', '#8A7F9E', KIT.tokens.sceneOnly.text],
  ['sky', '#12304A', KIT.tokens.sceneOnly.text],
  ['dawn', '#A9D8F0', KIT.tokens.sceneOnly.text],
]
const TYPE = [
  ['name', 'name'],
  ['section', 'sec-title'],
  ['card-name', 'card-name'],
  ['role', 'role'],
  ['lead', 'oneline'],
  ['body', 'card-body'],
  ['line', 'exp-sample'],
  ['btn', 'btn-sample'],
  ['eyebrow', 'eyebrow'],
  ['label', 'theme-sample'],
  ['mono', 'mono-sample'],
]

export default function Kit() {
  const esvo = PROJECTS[0]
  const viaere = PROJECTS[1]
  return (
    <>
      <a className="skip-link" href="#main">
        {SKIP.text}
      </a>
      <header className="top">
        <Wordmark />
        <NavPill />
      </header>
      <main id="main" tabIndex={-1} className="kit-main">
        <Stage />
        <header className="kit-head">
          <a className="kit-back" href="/">
            {KIT.back.text}
          </a>
          <h1 className="kit-word">{KIT.word.text}</h1>
          <p className="oneline">{KIT.line.text}</p>
        </header>

        {/* 1. tokens */}
        <Group id="tokens" title={KIT.groups.tokens.text}>
          <p className="kit-sub">{KIT.tokens.color.text}</p>
          <ul className="kit-swatches">
            {COLOURS.map(([t, hex, note]) => (
              <li key={t}>
                <span className="kit-swatch" style={{ background: `var(--${t})` }} />
                <span className="kit-cap">
                  {t} <span className="tnum">{hex}</span>
                  {note && <> · {note}</>}
                </span>
              </li>
            ))}
          </ul>
          <p className="kit-sub">{KIT.tokens.type.text}</p>
          <div className="kit-type">
            {TYPE.map(([t, cls]) => (
              <p key={t} className={`${cls} kit-type-row`} data-token={`--t-${t}`}>
                <span className="kit-cap kit-type-tag">{`--t-${t}`}</span>
                {HERO.name.text}
              </p>
            ))}
          </div>
          <div className="kit-row kit-row--tokens">
            <div>
              <p className="kit-sub">{KIT.tokens.radius.text}</p>
              <ul className="kit-radii">
                {['panel', 'card', 'inner', 'pill'].map((r) => (
                  <li key={r}>
                    <span className="kit-radius" style={{ borderRadius: `var(--r-${r})` }} />
                    <span className="kit-cap">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kit-sub">{KIT.tokens.space.text}</p>
              <ul className="kit-space">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <li key={n}>
                    <span className="kit-spacebar" style={{ width: `var(--s-${n})` }} />
                    <span className="kit-cap">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kit-sub">{KIT.tokens.elevation.text}</p>
              <ul className="kit-elev">
                {['rest', 'raised', 'inner'].map((e) => (
                  <li key={e}>
                    <span className="kit-elev-box" style={{ boxShadow: `var(--e-${e})` }} />
                    <span className="kit-cap">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Group>

        {/* 2. glass */}
        <Group id="glass" title={KIT.groups.glass.text} bare sim>
          <div className="kit-glass">
            {[
              ['', `${KIT.glass.thick.text}, ${S.rest.text}`],
              ['sim-entering', `${KIT.glass.thick.text}, ${S.entering.text}`],
              ['sim-reduced', KIT.glass.reduced.text],
              ['sim-noblur', KIT.glass.noblur.text],
              ['sim-contrast', KIT.glass.contrast.text],
              ['sim-forced', KIT.glass.forced.text],
              ['sim-lite', KIT.glass.lite.text],
            ].map(([cls, label]) => (
              <Cell key={label} label={label} className={cls}>
                <Panel reveal={false} state={cls === 'sim-entering' ? 'entering' : undefined} className="kit-sample-panel">
                  <Eyebrow>{viaere.title}</Eyebrow>
                  <p className="card-name">{viaere.name}</p>
                  <p className="card-head">{viaere.headline}</p>
                </Panel>
              </Cell>
            ))}
            <Cell label={KIT.glass.clear.text}>
              <Glass tier="clear" pill className="kit-clear-sample" />
            </Cell>
          </div>
        </Group>

        {/* 3. buttons */}
        <Group id="buttons" title={KIT.groups.buttons.text}>
          <p className="kit-sub">{KIT.variants.primary.text}</p>
          <div className="kit-row" inert>
            {[['rest', {}], ['hover', { state: 'hover' }], ['focus', { state: 'focus' }], ['press', { state: 'press' }], ['disabled', { disabled: true }]].map(([k, p]) => (
              <Cell key={k} label={S[k].text}>
                <Button variant="primary" href={HERO.coffee.href} {...p}>
                  {HERO.coffee.label}
                </Button>
              </Cell>
            ))}
          </div>
          <p className="kit-sub">{KIT.variants.glass.text}</p>
          <div className="kit-row" inert>
            {[['rest', {}], ['hover', { state: 'hover' }], ['focus', { state: 'focus' }], ['press', { state: 'press' }], ['disabled', { disabled: true }]].map(([k, p]) => (
              <Cell key={k} label={S[k].text}>
                <Button variant="glass" href={HERO.email.href} {...p}>
                  {HERO.email.label}
                </Button>
              </Cell>
            ))}
            <Cell label={S.small.text}>
              <Button variant="glass" size="sm" icon="out" href={viaere.href}>
                {viaere.link}
              </Button>
            </Cell>
          </div>
        </Group>

        {/* 5. card */}
        <Group id="card" title={KIT.groups.card.text} bare>
          <div className="kit-cards">
            <Cell label={S.rest.text}>
              <ProjectCard card={esvo} reveal={false} />
            </Cell>
            <Cell label={S.hover.text}>
              <div inert>
                <ProjectCard card={viaere} state="hover" reveal={false} />
              </div>
            </Cell>
            <Cell label={S.focusWithin.text}>
              <div inert>
                <ProjectCard card={esvo} state="focus" reveal={false} />
              </div>
            </Cell>
            <Cell label={S.quiet.text} className="sim-reduced">
              <div inert>
                <ProjectCard card={viaere} reveal={false} />
              </div>
            </Cell>
          </div>
        </Group>

        {/* 6. experience list */}
        <Group id="experience" title={KIT.groups.experience.text}>
          <ExperienceList lines={EXPERIENCE} />
        </Group>

        {/* 7. nav pill */}
        <Group id="nav" title={KIT.groups.nav.text} bare>
          <div className="kit-stack" inert>
            <Cell label={`${KIT.nav.desktop.text}: ${S.rest.text}, ${S.active.text}, ${S.hover.text}, ${S.focus.text}`}>
              <NavPill fixed={false} active="check-out" states={{ experience: 'hover', stack: 'focus' }} className="kit-nav" />
            </Cell>
            <div className="kit-row">
              <Cell label={`${KIT.nav.phone.text}, ${S.closed.text}`}>
                <NavPill fixed={false} active="experience" className="kit-nav kit-nav--phone" />
              </Cell>
              <Cell label={`${KIT.nav.phone.text}, ${S.open.text}`}>
                <NavPill fixed={false} active="experience" open className="kit-nav kit-nav--phone" />
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

        {/* 8. copy email and link row */}
        <Group id="contact" title={KIT.groups.contact.text}>
          <div className="kit-stack" inert>
            <Cell label={S.rest.text}>
              <CopyEmail idPrefix="kit-rest" />
            </Cell>
            <Cell label={S.hover.text}>
              <CopyEmail idPrefix="kit-hover" state="hover" />
            </Cell>
            <Cell label={S.focus.text}>
              <CopyEmail idPrefix="kit-focus" state="focus" />
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

        {/* 9. scene controls */}
        <Group id="controls" title={KIT.groups.controls.text}>
          <div className="kit-row" inert>
            <Cell label={S.rest.text}>
              <SceneControls tier="full" paused={false} motion="on" />
            </Cell>
            <Cell label={S.hover.text}>
              <SceneControls tier="full" paused={false} motion="on" state="hover" />
            </Cell>
            <Cell label={S.focus.text}>
              <SceneControls tier="full" paused={false} motion="on" state="focus" />
            </Cell>
            <Cell label={S.paused.text}>
              <SceneControls tier="full" paused motion="on" />
            </Cell>
            <Cell label={S.off.text}>
              <SceneControls tier="still" paused={false} motion="off" />
            </Cell>
            <Cell label={S.still.text}>
              <SceneControls tier="still" paused={false} motion="on" />
            </Cell>
          </div>
        </Group>

        {/* 10. stage */}
        <Group id="stage" title={KIT.groups.stage.text}>
          <p className="kit-sub">{KIT.stage.note.text}</p>
          <div className="kit-row">
            <Cell label={S.posterOnly.text}>
              <div className="kit-stage-sample">
                <Poster />
              </div>
            </Cell>
            <Cell label={S.canvasOn.text}>
              <div className="kit-stage-sample kit-stage-sample--on">
                <Poster />
                <span className="kit-stage-on" />
              </div>
            </Cell>
            <Cell label={S.lost.text}>
              <div className="kit-stage-sample kit-stage-sample--lost">
                <Poster />
              </div>
            </Cell>
          </div>
        </Group>

        {/* 11. footer, skip link, 404 */}
        <Group id="chrome" title={KIT.groups.chrome.text} bare>
          <div className="kit-stack">
            <Cell label={KIT.chrome.skip.text}>
              <span className="skip-link kit-skip">{SKIP.text}</span>
            </Cell>
            <Cell label={KIT.chrome.notFound.text}>
              <div className="kit-nf" inert>
                <Panel variant="nf" reveal={false}>
                  <p className="sec-title">{NOT_FOUND.line.text}</p>
                  <p className="nf-actions">
                    <Button variant="primary" href="/">
                      {NOT_FOUND.home.text}
                    </Button>
                  </p>
                </Panel>
              </div>
            </Cell>
            <Cell label={KIT.chrome.footer.text}>
              <div className="kit-footer-sample">
                <Footer kit controls={<SceneControls tier="full" paused={false} motion="on" />} />
              </div>
            </Cell>
          </div>
        </Group>
      </main>
      <Footer kit />
    </>
  )
}
