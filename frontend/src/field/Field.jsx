/*
  <Field preset="now" />: the bright light behind the glass (DESIGN.md 3, 12.3).
  One layer per section, under every content layer; styles in field.css.

  A blob is { c, d, x, y, a?, dur?, delay?, dx?, dy?, dm?, xm?, ym? }:
    c       field colour token (--f-<c>): peach, butter, sky, lilac, rose, core,
            or the deeper -d set for sections with content glass
    d       diameter in vmax; x and y the centre in percent of the layer
    a       alpha, mixed in oklch so midtones never grey
    dm xm ym  phone overrides (diameter in vmax, centre in percent)
    dur delay dx dy   the drift (20 to 30 s, alternate, staggered)

  The hero preset follows DESIGN.md 3.2; the section presets put two or
  three deeper blobs behind each section's glass so nothing below the hero
  reads as cream paper (12.3, 12.6). Pages tune positions by passing blobs.
*/

const B = (c, d, x, y, more = {}) => ({ c, d, x, y, ...more })

const FIELDS = {
  // the first screen (3.2): peach under the first lines, butter overhead, sky right, lilac low
  // right, rose under the middle of the sentence, and a deeper core under line 2 for the lens
  hero: [
    B('peach', 62, 16, 30, { dur: 26, delay: -6, dx: 5, dy: 4, dm: 92, xm: 0, ym: 30 }),
    B('butter', 54, 44, -2, { dur: 22, delay: -12, dx: -4, dy: 5, dm: 80, xm: 86, ym: -6 }),
    B('sky', 62, 82, 42, { dur: 28, delay: -3, dx: -6, dy: 3, dm: 84, xm: 104, ym: 46 }),
    B('lilac', 54, 66, 100, { dur: 24, delay: -16, dx: -5, dy: -4, dm: 80, xm: 64, ym: 92 }),
    B('rose', 52, 50, 62, { a: 0.7, dur: 30, delay: -9, dx: 6, dy: -3, dm: 76, xm: 46, ym: 56 }),
    B('core', 34, 32, 34, { a: 0.38, dur: 25, delay: -13, dx: 4, dy: -2, dm: 56, xm: 22, ym: 24 }),
    B('sky', 40, 100, 2, { a: 0.75, dur: 27, delay: -20, dx: -3, dy: 3, dm: 60, xm: 108, ym: 0 }),
    B('butter', 40, 4, 96, { a: 0.7, dur: 23, delay: -7, dx: 4, dy: -3, dm: 60, xm: -6, ym: 70 }),
  ],
  // the origin body: light under his pull paragraphs, deeper colour behind the origin card
  origin: [
    B('rose', 44, 18, 40, { a: 0.5, dur: 27, delay: -4, dm: 70, xm: 10, ym: 24 }),
    B('sky-d', 42, 86, 30, { dur: 25, delay: -11, dm: 70, xm: 96, ym: 62 }),
    B('lilac-d', 38, 66, 74, { a: 0.85, dur: 29, delay: -7, dm: 64, xm: 30, ym: 84 }),
    B('butter-d', 30, 96, 88, { a: 0.8, dur: 23, delay: -15, dm: 50, xm: 100, ym: 100 }),
  ],
  now: [
    B('sky-d', 46, 86, 34, { dur: 27, delay: -5, dm: 70, xm: 96, ym: 30 }),
    B('peach-d', 42, 14, 72, { dur: 25, delay: -14, dm: 70, xm: 0, ym: 74 }),
    B('butter-d', 30, 52, 108, { a: 0.8, dur: 29, delay: -8, dm: 50 }),
  ],
  work: [
    B('lilac-d', 46, 84, 22, { dur: 26, delay: -7, dm: 70, xm: 100, ym: 14 }),
    B('peach-d', 44, 12, 52, { dur: 24, delay: -11, dm: 70, xm: 0, ym: 46 }),
    B('sky-d', 40, 70, 88, { dur: 28, delay: -2, dm: 70, xm: 100, ym: 82 }),
  ],
  builds: [
    B('butter-d', 46, 18, 16, { dur: 21, delay: -17, dm: 70, xm: 0, ym: 10 }),
    B('lilac-d', 46, 88, 44, { dur: 29, delay: -2, dm: 70, xm: 100, ym: 40 }),
    B('rose-d', 40, 34, 82, { a: 0.85, dur: 27, delay: -4, dm: 70, xm: 10, ym: 76 }),
  ],
  crew: [
    B('sky-d', 42, 12, 40, { dur: 26, delay: -9, dm: 70, xm: 0 }),
    B('butter-d', 40, 84, 64, { dur: 23, delay: -3, dm: 70, xm: 100 }),
  ],
  signal: [
    B('peach-d', 50, 36, 46, { a: 0.75, dur: 25, delay: -6, dm: 80, xm: 20 }),
    B('butter-d', 46, 62, 56, { a: 0.75, dur: 22, delay: -15, dm: 80, xm: 80 }),
    B('rose-d', 30, 20, 80, { a: 0.6, dur: 28, delay: -1, dm: 60 }),
  ],
}

const colour = ({ c, a }) => (a != null && a < 1 ? `color-mix(in oklch, var(--f-${c}) ${Math.round(a * 100)}%, transparent)` : `var(--f-${c})`)

function blobStyle(b) {
  const st = { '--c': colour(b), '--d': `${b.d}vmax`, '--x': `${b.x}%`, '--y': `${b.y}%` }
  if (b.dm != null) st['--dm'] = `${b.dm}vmax`
  if (b.xm != null) st['--xm'] = `${b.xm}%`
  if (b.ym != null) st['--ym'] = `${b.ym}%`
  if (b.dur) st['--dur'] = `${b.dur}s`
  if (b.delay) st['--delay'] = `${b.delay}s`
  if (b.dx != null) st['--dx'] = `${b.dx}vmax`
  if (b.dy != null) st['--dy'] = `${b.dy}vmax`
  return st
}

export default function Field({ preset, blobs, grid = false, className = '' }) {
  const list = blobs ?? FIELDS[preset] ?? []
  const cls = ['field', preset === 'hero' && 'field--hero', className].filter(Boolean).join(' ')
  return (
    <div className={cls} aria-hidden="true" data-deco="">
      {list.map((b, i) => (
        <i key={i} className="blob" style={blobStyle(b)} />
      ))}
      {grid && <div className="field-grid" />}
    </div>
  )
}
