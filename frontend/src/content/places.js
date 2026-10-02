import { item, ui } from './item.js'

/*
  Grid nodes (PLAN.md 3.2, 4.1, 4.3). City level only, never finer.
  Node ids are fixed: plano, richardson, allen, dallas, nyc, waterloo.

  state  'lit-now'  LED, current chapters (Plano, Richardson, Allen)
         'lit-past' sodium, past chapters (the off-grid links)
         'dim'      orientation only (Dallas)
  kind   'node' (on the Texas grid) | 'offgrid' (a line off the map edge)
*/
export const NODES = {
  plano: item('node-plano', 'plano', ['identity-hometown', 'exp-jpm-2026'], {
    kind: 'node',
    state: 'lit-now',
    a11y: 'Plano, Texas',
  }),
  richardson: item('node-richardson', 'richardson', ['edu-degree'], {
    kind: 'node',
    state: 'lit-now',
    a11y: 'Richardson, Texas',
  }),
  allen: item('node-allen', 'allen', ['exp-md7'], {
    kind: 'node',
    state: 'lit-now',
    a11y: 'Allen, Texas',
  }),
  dallas: ui('node-dallas', 'dallas', {
    kind: 'node',
    state: 'dim',
    a11y: 'Dallas, Texas',
  }),
  nyc: item('node-nyc', 'new york city', ['exp-rbc'], {
    kind: 'offgrid',
    state: 'lit-past',
    exit: 'east',
    a11y: 'New York City',
  }),
  waterloo: item('node-waterloo', 'waterloo', ['exp-rbc-origin', 'com-hackathons-competed', 'com-htn-waterloo'], {
    kind: 'offgrid',
    state: 'lit-past',
    exit: 'north',
    a11y: 'Waterloo, Ontario',
  }),
}

export const NODE_IDS = Object.keys(NODES)

// The only labels allowed on the map (acceptance 19). QA fails on any other label.
export const ALLOWED_MAP_LABELS = Object.values(NODES).map((n) => n.text)

export const MAP = {
  ariaLabel: ui('map-aria', 'Dallas area highway map with Plano, Richardson and Allen lit'),
  hint: ui('map-hint', 'tap the grid to ping it'),
  // The map key: past light and present light (r1 T4).
  legend: ui('map-legend', 'map key'),
  then: ui('map-legend-then', 'then'),
  now: ui('map-legend-now', 'now'),
  ping: ui('map-ping', 'ping'),
  pinged: ui('map-pinged', 'pinged from plano'),
  pingedFrom: ui('map-pinged-from', 'pinged from'),
  attribution: ui('map-attribution', 'road data: US Census Bureau TIGER/Line 2024, public domain'),
}
