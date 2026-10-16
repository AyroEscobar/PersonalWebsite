import { item, ui } from './item.js'
import { CANONICAL, GITHUB, LINKEDIN } from './constants.js'

/*
  Head tags, chrome words, the footer and the 404 (COPY.md 3.1, 3.7).
  The Vite plugin in vite.config.js writes the <head> from HEAD below, so
  index.html never holds copy of its own.
*/

export const HEAD = {
  title: item('meta-title', 'Ayro Escobar, software engineer', ['identity-name', 'identity-role']),
  description: item(
    'meta-description',
    'Software engineer in Plano, Texas. Co-founder and Founding Engineer at Viaere, Founder of Esvo Technologies, CS at UT Dallas.',
    ['identity-role', 'identity-hometown', 'ven-viaere-bio', 'ven-esvo', 'identity-student'],
  ),
  siteName: item('meta-site-name', 'Ayro Escobar', ['identity-name']),
  canonical: CANONICAL,
  themeColor: '#070B16',
  ogImage: {
    href: `${CANONICAL}og.png`,
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: item('meta-og-alt', 'Ayro Escobar, software engineer. A figure pushing a huge boulder up a mountain slope at night, lit by neon.', [
      'identity-name',
      'identity-role',
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
  pause: ui('scene-pause', 'pause the scene'),
  play: ui('scene-play', 'play the scene'),
  motionOff: ui('scene-motion-off', 'motion off'),
  motionOn: ui('scene-motion-on', 'motion on'),
  reducedTip: ui('scene-reduced-tip', 'reduced motion is on'),
}

export const FOOTER = {
  line: item('footer-line', 'Ayro Escobar · Plano, Texas', ['identity-name', 'identity-hometown']),
  build: ui('footer-build', 'build'),
  visitPrefix: ui('footer-visit', 'this visit:'),
  visitPaint: ui('footer-visit-paint', 'first paint'),
  visitSuffix: ui('footer-visit-suffix', 'on your device'),
  noTracking: ui('footer-no-tracking', 'no cookies, no analytics.'),
  source: ui('footer-source', 'site source'),
  kit: ui('footer-kit', 'the kit'),
  credit: ui('footer-credit', '3D figure:'),
  creditBy: ui('footer-credit-by', 'by'),
}

export const NOT_FOUND = {
  title: ui('nf-title', 'not found, Ayro Escobar'),
  line: ui('nf-line', 'nothing here.'),
  home: ui('nf-home', 'back home'),
}
