import DeferredMount from '../ui/DeferredMount.jsx'
import { BUILDS } from '../content/builds.js'
import { SPEC, W } from './words.js'
import { Dotted } from './text.jsx'

/*
  BuildCard (PLAN.md 4.9): title, meta, body, stack, and links as visible
  words ("visit", "source"), never a stretched whole-card link. Hover and
  focus-within raise the plate and light its rule; nothing tilts.

  The specimen is a tiny true diagram of what the thing does. Its code is a
  lazy chunk (all seven are about 5 KB gz) that mounts on the first idle
  moment after load, so a keyboard user never tabs past a control that has
  not arrived yet. Until then a frame of the exact same size holds the
  space, so nothing shifts. Its text equivalent ("in words") is always in
  the HTML.
*/

const LOADERS = {
  viaere: () => import('./specimens/Viaere.jsx'),
  'circle-method': () => import('./specimens/CircleMethod.jsx'),
  'hint-ladder': () => import('./specimens/HintLadder.jsx'),
  meters: () => import('./specimens/Meters.jsx'),
  route: () => import('./specimens/Route.jsx'),
  reticle: () => import('./specimens/Reticle.jsx'),
  'week-strip': () => import('./specimens/WeekStrip.jsx'),
}

// Specimens with a control bar under the drawing (the bar is part of the reserved size).
const INTERACTIVE = new Set(['viaere', 'circle-method', 'hint-ladder', 'reticle'])

export default function BuildCard({ card: c }) {
  const h = `${c.id}-h`
  return (
    <article id={c.id} aria-labelledby={h} data-layout={c.layout} className="build plate plate-hover rule-l state-past">
      <div className="build-text">
        <h3 id={h} className="build-title">
          {c.title}
        </h3>
        <p className="build-meta mono">
          <Dotted text={c.meta} />
        </p>
        <div className="build-body">
          {c.body.map((b) => (
            <p key={b.id} className={b.id.endsWith('-tagline') ? 'build-tagline' : undefined}>
              {b.text}
            </p>
          ))}
        </div>
        {c.stack && (
          <p className="build-stack">
            <span className="label">{BUILDS.stackLabel.text}</span>
            <span className="mono">{c.stack}</span>
          </p>
        )}
        {c.links.length > 0 && (
          <p className="build-links mono">
            {c.links.map((l) => (
              <a key={l.href} href={l.href} aria-describedby={h}>
                {l.label}
                <Arrow />
              </a>
            ))}
          </p>
        )}
      </div>
      {c.specimen && LOADERS[c.specimen] && <Specimen kind={c.specimen} />}
    </article>
  )
}

function Specimen({ kind }) {
  const spec = SPEC[kind]
  const frame = (
    <>
      <div className="spec-stage" />
      {INTERACTIVE.has(kind) && <div className="spec-bar" />}
    </>
  )
  return (
    <figure className="spec build-spec" data-spec={kind}>
      <DeferredMount
        as="div"
        className="spec-frame"
        when="load"
        load={LOADERS[kind]}
        fallback={frame}
        props={{ spec }}
      />
      <details className="spec-words">
        <summary className="mono">{W.inWords.text}</summary>
        <p>{spec.words.text}</p>
      </details>
    </figure>
  )
}

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 8 8 2M3.5 2H8v4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
