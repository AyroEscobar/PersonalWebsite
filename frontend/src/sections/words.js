import { ui } from '../content/item.js'

/*
  UI words for the content sections and the specimens (PLAN.md 3.3 to 3.8,
  4.8 to 4.11). Owned by C.

  Every string here is a label or a description of an illustration. None of
  them is a claim about Ayro: claims live in src/content/*.js with fact ids.
  Specimen descriptions only restate what the build card's own fact already
  says, and the Viaere one says out loud that it is an illustration.

  Built with ui() so this file can move into src/content/ unchanged
  (requests-C.md asks FOUNDATION to fold it in or add it to check-content).
*/

export const W = {
  to: ui('w-to', 'to'),
  present: ui('w-present', 'present'),
  notPublic: ui('w-not-public', 'not public'),
  now: ui('w-now', 'now'),
  lane: ui('w-lane', 'lane'),
  item: ui('w-item', 'item'),
  from: ui('w-from', 'from'),
  until: ui('w-until', 'until'),
  inWords: ui('w-in-words', 'in words'),
  copySelected: ui('w-copy-selected', 'selected'),
  copySelectedStatus: ui('w-copy-selected-status', 'email selected, press command or control C to copy'),
  stripScroll: ui('w-strip-scroll', 'timeline, scrolls sideways'),
}

/*
  Specimens (PLAN.md 4.9). `label` is the role="img" summary, `words` the
  always-visible text equivalent inside "in words".
*/
export const SPEC = {
  viaere: {
    label: ui(
      'spec-viaere-label',
      'Illustration: four status lamps, ok, soon, due and red, above a 100-hour window with three aircraft marked A, B and C.',
    ),
    words: ui(
      'spec-viaere-words',
      'An illustration, not real data. Four lamps read ok, soon, due and red. Below them, a 100-hour window holds three aircraft, A, B and C. Bunched together, all three come due at the same time. Rebalance spreads them evenly across the window, the way the spacing engine does, so they come due one at a time. Nothing is red.',
    ),
    lamps: {
      ok: ui('spec-viaere-ok', 'ok'),
      soon: ui('spec-viaere-soon', 'soon'),
      due: ui('spec-viaere-due', 'due'),
      red: ui('spec-viaere-red', 'red'),
    },
    marks: [ui('spec-viaere-a', 'A'), ui('spec-viaere-b', 'B'), ui('spec-viaere-c', 'C')],
    start: ui('spec-viaere-start', '0 h'),
    end: ui('spec-viaere-end', '100 h'),
    rebalance: ui('spec-viaere-rebalance', 'rebalance'),
    reset: ui('spec-viaere-reset', 'reset'),
    bunched: ui('spec-viaere-bunched', 'bunched: all three due together'),
    spread: ui('spec-viaere-spread', 'rebalanced: spread across the window'),
  },
  'circle-method': {
    label: ui(
      'spec-circle-label',
      'The circle method on eight players: one fixed in the center, seven on a ring, with the current round drawn as four chords.',
    ),
    words: ui(
      'spec-circle-words',
      'The circle method on eight players. H stays fixed in the center and plays the player on the line out from the center. The other six pair off along the three chords that cross that line. Each round the pattern turns one step around the ring. After seven rounds every one of the 28 pairs has met exactly once, so the rounds are a one-factorization of K8.',
    ),
    players: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((p) => ui(`spec-circle-${p.toLowerCase()}`, p)),
    round: ui('spec-circle-round', 'round'),
    of: ui('spec-circle-of', 'of'),
    vs: ui('spec-circle-vs', 'v'),
    met: ui('spec-circle-met', 'pairs met'),
    allMet: ui('spec-circle-all-met', 'every pair met exactly once'),
    next: ui('spec-circle-next', 'next round'),
    again: ui('spec-circle-again', 'start over'),
  },
  'hint-ladder': {
    label: ui('spec-hint-label', 'A ladder of four hint levels with a top rung, the solution, that is never written.'),
    words: ui(
      'spec-hint-words',
      'A ladder of hint levels. Each press of hint climbs one rung. The top rung would be the solution, and the coach never writes it.',
    ),
    levels: [1, 2, 3, 4].map((n) => ui(`spec-hint-level-${n}`, `level ${n}`)),
    top: ui('spec-hint-top', 'solution: never written'),
    idle: ui('spec-hint-idle', 'stuck? ask for a hint'),
    hint: ui('spec-hint-hint', 'hint'),
    again: ui('spec-hint-again', 'start over'),
  },
  meters: {
    label: ui('spec-meters-label', 'A still waveform of a spoken answer above three unnumbered meters: pace, filler words and structure.'),
    words: ui(
      'spec-meters-words',
      'A still waveform of a spoken answer, with three meters under it for pace, filler words and structure. The meters carry no numbers. Illustration only.',
    ),
    meters: [ui('spec-meters-pace', 'pace'), ui('spec-meters-filler', 'filler words'), ui('spec-meters-structure', 'structure')],
  },
  route: {
    label: ui('spec-route-label', 'A route line with four stops, the last one a phone.'),
    words: ui(
      'spec-route-words',
      'A route line with four stops: food, an activity, a reservation, and a phone at the end for the voice AI that calls ahead.',
    ),
    stops: [
      ui('spec-route-food', 'food'),
      ui('spec-route-activity', 'activity'),
      ui('spec-route-reserve', 'reserve'),
      ui('spec-route-call', 'call ahead'),
    ],
  },
  reticle: {
    label: ui('spec-reticle-label', 'A camera reticle over an item, with four routes it can resolve to: recycle, sell, donate and dispose.'),
    words: ui(
      'spec-reticle-words',
      'A camera reticle over an item. Each scan resolves the item to one of four routes: recycle, sell, donate or dispose.',
    ),
    routes: [
      ui('spec-reticle-recycle', 'recycle'),
      ui('spec-reticle-sell', 'sell'),
      ui('spec-reticle-donate', 'donate'),
      ui('spec-reticle-dispose', 'dispose'),
    ],
    idle: ui('spec-reticle-idle', 'aim at an item'),
    scanning: ui('spec-reticle-scanning', 'scanning'),
    result: ui('spec-reticle-result', 'route:'),
    scan: ui('spec-reticle-scan', 'scan'),
  },
  'week-strip': {
    label: ui('spec-week-label', 'Seven dim dots, one for each day of the week.'),
    words: ui('spec-week-words', 'Seven days of the week as dim dots. Illustration only.'),
    days: ['m', 't', 'w', 't', 'f', 's', 's'].map((d, i) => ui(`spec-week-${i}`, d)),
  },
}
