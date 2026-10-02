/*
  Content contract (PLAN.md 3 and 4.0).

  Every visible string on the site lives in src/content/*.js and is traceable:
    item(id, text, facts)  a claim about Ayro, backed by public facts.json ids
    ui(id, text)           a label or UI word that makes no claim

  Objects that carry `facts` pass them down to their plain string fields
  (org, role, place, dates, ...). scripts/check-content.mjs walks every export
  and fails the build on a visible string with no facts and no ui flag, an
  unknown or non-public fact id, a dash, a banned word, or a denylist hit.

  Keys that are never rendered as text are listed in NON_VISIBLE below.
  `verbatim: '<fact id>'` asserts the text is his exact quote from facts.json.
*/

export const item = (id, text, facts, extra = {}) => ({ id, text, facts, ...extra })

export const ui = (id, text, extra = {}) => ({ id, text, ui: true, ...extra })

export const NON_VISIBLE = new Set([
  'id', 'href', 'url', 'src', 'node', 'nodes', 'state', 'start', 'end', 'lane',
  'kind', 'specimen', 'layout', 'datetime', 'facts', 'ui', 'verbatim', 'offgrid',
  'frame', 'tz', 'mailto', 'section', 'group', 'command', 'shortcut', 'startExact',
  'endExact', 'focus', 'updated', 'lat', 'lon', 'keywords', 'exit', 'width',
  'height', 'tone', 'canonical', 'themeColor', 'type', 'sameAs', 'from',
])
