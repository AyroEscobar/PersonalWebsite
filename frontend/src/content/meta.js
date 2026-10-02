import { item, ui } from './item.js'
import { CANONICAL, GITHUB, LINKEDIN } from './constants.js'

/*
  Head tags (PLAN.md 9), chrome words (3.1, 3.9, 3.10, 4.6, 4.12) and the
  404. The Vite plugin in vite.config.js writes the <head> from HEAD below,
  so index.html never holds copy of its own.
*/

export const HEAD = {
  title: item('meta-title', 'Ayro Escobar, software engineer', ['identity-name', 'identity-role']),
  description: item(
    'meta-description',
    'Software engineer from Plano, Texas. CS at UT Dallas. Co-founder, Engineering, at Viaere.',
    ['identity-role', 'identity-hometown', 'identity-student', 'ven-viaere-bio'],
  ),
  siteName: item('meta-site-name', 'Ayro Escobar', ['identity-name']),
  canonical: CANONICAL,
  themeColor: '#0B1226',
  ogImage: {
    href: `${CANONICAL}og.png`,
    width: 1200,
    height: 630,
    type: 'image/png',
    // Provisional until B's og.html puts the lit grid in the image. Then B asks
    // FOUNDATION to switch to: "Ayro Escobar, software engineer, Plano, Texas,
    // on a night map of Dallas highways".
    alt: item('meta-og-alt', 'Ayro Escobar, software engineer, Plano, Texas', [
      'identity-name',
      'identity-role',
      'identity-hometown',
    ]),
  },
  person: {
    name: 'Ayro Escobar',
    jobTitle: 'Software Engineer',
    homeLocation: 'Plano, TX',
    affiliation: 'The University of Texas at Dallas',
    sameAs: [GITHUB, LINKEDIN],
    facts: ['identity-name', 'identity-role', 'identity-hometown', 'edu-degree', 'ln-github', 'ln-linkedin'],
  },
}

export const CHROME = {
  clockPlace: ui('clock-place', 'plano'),
  clockPlaceholder: ui('clock-placeholder', '--:-- ct'),
  quiet: ui('quiet-off', 'quiet'),
  quietOn: ui('quiet-on', 'quiet: on'),
  quietMode: ui('quiet-mode', 'quiet mode'),
  search: ui('search', 'search'),
  searchShortcut: ui('search-shortcut', '⌘K'),
  searchShortcutCtrl: ui('search-shortcut-ctrl', 'ctrl K'),
  sectionsNav: ui('nav-sections', 'Sections'),
  stopsSheet: ui('stops-sheet', 'all stops'),
  next: ui('stop-next', 'next'),
  close: ui('close', 'close'),
  sky: {
    night: ui('sky-night', 'night'),
    dawn: ui('sky-dawn', 'dawn'),
    day: ui('sky-day', 'day'),
    golden: ui('sky-golden', 'golden hour'),
    dusk: ui('sky-dusk', 'dusk'),
  },
}

export const FOOTER = {
  line: item('footer-line', 'Ayro Escobar · Plano, Texas', ['identity-name', 'identity-hometown']),
  build: ui('footer-build', 'build'),
  visitPrefix: ui('footer-visit', 'this visit:'),
  visitPaint: ui('footer-visit-paint', 'first paint'),
  visitSuffix: ui('footer-visit-suffix', 'on your device'),
  noTracking: ui('footer-no-tracking', 'no cookies, no analytics.'),
  print: ui('footer-print', 'print'),
  source: ui('footer-source', 'source'),
}

export const NOT_FOUND = {
  title: ui('nf-title', 'signal lost · Ayro Escobar'),
  heading: ui('nf-heading', 'signal lost'),
  line: ui('nf-line', 'nothing is lit at this address.'),
  home: ui('nf-home', 'back to the grid'),
  search: ui('nf-search', 'search'),
}

export const JUMP = {
  label: ui('jump-label', 'search the page'),
  placeholder: ui('jump-placeholder', 'type to search'),
  empty: ui('jump-empty', 'nothing lit for that'),
  results: ui('jump-results', 'results'),
  result: ui('jump-result', 'result'),
  hints: [
    ui('jump-hint-move', 'move', { keys: ['↑', '↓'] }),
    ui('jump-hint-run', 'run', { keys: ['enter'] }),
    ui('jump-hint-close', 'close', { keys: ['esc'] }),
  ],
  groups: {
    recent: ui('jump-group-recent', 'recent'),
    sections: ui('jump-group-sections', 'sections'),
    roles: ui('jump-group-roles', 'roles'),
    builds: ui('jump-group-builds', 'builds'),
    channels: ui('jump-group-channels', 'channels'),
    commands: ui('jump-group-commands', 'commands'),
  },
  commands: {
    quietOn: ui('cmd-quiet-on', 'quiet mode on'),
    quietOff: ui('cmd-quiet-off', 'quiet mode off'),
    print: ui('cmd-print', 'print'),
    copyEmail: ui('cmd-copy-email', 'copy email'),
    viewSource: ui('cmd-view-source', 'view source'),
    shortcutsOff: ui('cmd-shortcuts-off', 'keyboard shortcuts: off'),
    shortcutsOn: ui('cmd-shortcuts-on', 'keyboard shortcuts: on'),
  },
}
