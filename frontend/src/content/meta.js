import { item, ui } from './item.js'
import { CANONICAL, GITHUB, LINKEDIN } from './constants.js'

/*
  Head tags, chrome words, the footer and the 404 (COPY.md 3.1, 3.7).
  The Vite plugin in vite.config.js writes the <head> from HEAD below, so
  index.html never holds copy of its own.
*/

export const HEAD = {
  title: item('meta-title', 'Ayro Escobar', ['identity-name']),
  description: item(
    'meta-description',
    'Computer science student at UT Dallas. Founder of Esvo Technologies, Co-founder and Founding Engineer at Viaere. Internships at JPMorgan Chase and RBC Capital Markets.',
    ['identity-student', 'ven-esvo', 'ven-viaere-bio', 'exp-jpm-2026', 'exp-rbc'],
  ),
  siteName: item('meta-site-name', 'Ayro Escobar', ['identity-name']),
  canonical: CANONICAL,
  themeColor: { light: '#C47D45', dark: '#141110' },
  ogImage: {
    href: `${CANONICAL}og.png`,
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: item('meta-og-alt', 'Ayro Escobar. A black-figure silhouette pushing a white boulder along the frieze of a Greek vase.', ['identity-name']),
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
  quietTip: ui('quiet-tip', 'poster instead of the live scene'),
  themeLight: ui('theme-light', 'light'),
  themeDark: ui('theme-dark', 'dark'),
  themeDarkLabel: ui('theme-dark-label', 'dark theme'),
  themeLightLabel: ui('theme-light-label', 'light theme'),
  themeAnnounceDark: ui('theme-announce-dark', 'dark theme'),
  themeAnnounceLight: ui('theme-announce-light', 'light theme'),
  menuOpen: ui('menu-open', 'menu'),
  menuClose: ui('menu-close', 'close'),
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
  noTracking: ui('footer-no-tracking', 'no cookies, no analytics.'),
  source: ui('footer-source', 'site source'),
  kit: ui('footer-kit', 'the kit'),
  credit: ui('footer-credit', '3D figure:'),
  creditBy: ui('footer-credit-by', 'by'),
  fonts: ui('footer-fonts', 'type: Cinzel, EB Garamond and Marcellus SC,'),
  fontsLicence: ui('footer-fonts-licence', 'SIL Open Font License'),
}

export const NOT_FOUND = {
  title: ui('nf-title', 'not found, Ayro Escobar'),
  line: ui('nf-line', 'nothing here.'),
  home: ui('nf-home', 'back home'),
}
