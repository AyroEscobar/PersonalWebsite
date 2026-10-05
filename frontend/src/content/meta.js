import { item, ui } from './item.js'
import { CANONICAL, GITHUB, LINKEDIN } from './constants.js'

/*
  Head tags, chrome words and the 404 (DESIGN.md 5.2, 5.14, 6.9, 6.10).
  The Vite plugin in vite.config.js writes the <head> from HEAD below, so
  index.html never holds copy of its own.
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
  themeColor: '#FBF9F4',
  ogImage: {
    href: `${CANONICAL}og.png`,
    width: 1200,
    height: 630,
    type: 'image/png',
    // og.html builds the card from the hero's own night grid (scripts/og.mjs).
    alt: item('meta-og-alt', 'Ayro Escobar, software engineer, Plano, Texas, on a night map of Dallas highways', [
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
  quiet: ui('quiet-off', 'quiet'),
  quietTip: ui('quiet-tip', 'solid panels instead of glass'),
  sectionsNav: ui('nav-sections', 'sections'),
  home: ui('chrome-home', 'home'),
}

export const FOOTER = {
  line: item('footer-line', 'Ayro Escobar · Plano, Texas', ['identity-name', 'identity-hometown']),
  build: ui('footer-build', 'build'),
  visitPrefix: ui('footer-visit', 'this visit:'),
  visitPaint: ui('footer-visit-paint', 'first paint'),
  visitSuffix: ui('footer-visit-suffix', 'on your device'),
  noTracking: ui('footer-no-tracking', 'no cookies, no analytics.'),
  print: ui('footer-print', 'print as resume'),
  // Says whose source it is, on its own and to a screen reader (r2 N17).
  source: ui('footer-source', 'site source'),
}

export const NOT_FOUND = {
  title: ui('nf-title', 'not found, Ayro Escobar'),
  line: ui('nf-line', 'nothing here.'),
  home: ui('nf-home', 'back home'),
}

