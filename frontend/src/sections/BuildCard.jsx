import DeferredMount from '../ui/DeferredMount.jsx'
import { BUILDS } from '../content/builds.js'
import { SPEC, W } from '../content/sections-ui.js'
import { Dotted } from './text.jsx'

/*
  Builds, in two tiers (PLAN.md 4.9, r1 T10).

    <BuildFeature card />   Viaere and the pool scheduler: a full-width row,
                            the words on the left and a big specimen on the
                            right, on plain night (no frame, no dot grid)
    <BuildRow card />       the other six as a departures board: title,
                            meta, one line, links; a row whose specimen is a
                            true diagram opens it under the row ("see it")

  Links are visible words ("visit", "source"), never a stretched whole-row
  link. A specimen's code is a lazy chunk that mounts on the first idle
  moment after load; until then a frame of the same size holds its place,
  so nothing shifts. Its text equivalent is always in the HTML.
*/

const LOADERS = {
  viaere: () => import('./specimens/Viaere.jsx'),
  'circle-method': () => import('./specimens/CircleMethod.jsx'),
  'hint-ladder': () => import('./specimens/HintLadder.jsx'),
  reticle: () => import('./specimens/Reticle.jsx'),
}

function Links({ links, h }) {
  if (!links.length) return null
  return (
    <p className="build-links">
      {links.map((l) => (
        <a key={l.href} href={l.href} aria-describedby={h}>
          {l.label}
          <Arrow />
        </a>
      ))}
    </p>
  )
}

export function BuildFeature({ card: c }) {
  const h = `${c.id}-h`
  return (
    <article id={c.id} aria-labelledby={h} tabIndex={-1} className="build build--feature rule-l state-past">
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
        <Links links={c.links} h={h} />
      </div>
      {c.specimen && LOADERS[c.specimen] && <Specimen kind={c.specimen} title={c.title} />}
    </article>
  )
}

export function BuildRow({ card: c }) {
  const h = `${c.id}-h`
  const spec = c.specimen && LOADERS[c.specimen] ? c.specimen : null
  return (
    <article id={c.id} aria-labelledby={h} tabIndex={-1} className="ix-row">
      <div className="ix-name">
        <h3 id={h} className="ix-title">
          {c.title}
        </h3>
        <p className="ix-meta mono">
          <Dotted text={c.meta} />
        </p>
      </div>
      <div className="ix-what">
        {c.body.map((b) => (
          <p key={b.id}>{b.text}</p>
        ))}
        {c.stack && <p className="ix-stack mono">{c.stack}</p>}
      </div>
      <Links links={c.links} h={h} />
      {spec && (
        <details className="ix-see">
          <summary>
            {W.seeIt.text}
            <span className="sr-only">: {c.title}</span>
          </summary>
          <Specimen kind={spec} title={c.title} />
        </details>
      )}
    </article>
  )
}

// Specimens with a control bar under the drawing (the bar is part of the reserved size).
const INTERACTIVE = new Set(['viaere', 'circle-method', 'hint-ladder', 'reticle'])

function Specimen({ kind, title }) {
  const spec = SPEC[kind]
  const frame = (
    <>
      <div className="spec-stage" />
      {INTERACTIVE.has(kind) && <div className="spec-bar" />}
    </>
  )
  return (
    <figure className="spec build-spec" data-spec={kind}>
      <DeferredMount as="div" className="spec-frame" when="load" load={LOADERS[kind]} fallback={frame} props={{ spec }} />
      <details className="spec-words">
        <summary>
          {W.inWords.text}
          <span className="sr-only">: {title}</span>
        </summary>
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
