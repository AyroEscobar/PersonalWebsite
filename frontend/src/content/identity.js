import { item, ui } from './item.js'
import { COFFEE, EMAIL, GITHUB, LINKEDIN } from './constants.js'

/*
  The hero: who he is in five seconds. The eyebrow says what he is now, the h1 his name, then three
  lines (his company, Viaere, the internships), the one line (desktop only; the roles already say
  it on a phone), two ways to reach him and two links. Builders render it; they do not rewrite it.
  The theme line is the only theme line on the site: 11 px, lowercase, once, in the hero's
  lower-left corner.
*/

export const HERO = {
  sceneAlt: ui('scene-alt', 'A figure pushing a huge glass boulder up a mountain slope at night.'),
  eyebrow: item('hero-eyebrow', 'Computer science student at UT Dallas', ['identity-student']),
  name: item('hero-name', 'Ayro Escobar', ['identity-name']),
  roles: [
    item('hero-role-esvo', 'Founder of Esvo Technologies, custom software and websites for any kind of business.', ['ven-esvo', 'ven-esvo-site']),
    item('hero-role-viaere', 'Co-founder and Founding Engineer at Viaere, flight operations software built beside the hangar floor.', [
      'ven-viaere',
      'ven-viaere-bio',
      'ven-viaere-tagline',
    ]),
    item('hero-role-internships', 'Internships at JPMorgan Chase and RBC Capital Markets.', ['exp-jpm-2026', 'exp-rbc']),
  ],
  line: item(
    'hero-line',
    'I build software that has to hold up in the real world, for the hangar floor and the trading floor.',
    ['ven-viaere-tagline', 'ven-viaere-bio', 'exp-rbc'],
  ),
  coffee: { id: 'hero-coffee', label: 'Grab a coffee chat', href: COFFEE, facts: ['ln-coffee'] },
  email: { id: 'hero-email', label: 'Email me', href: `mailto:${EMAIL}`, facts: ['ln-email'] },
  links: [
    { id: 'hero-linkedin', label: 'LinkedIn', href: LINKEDIN, facts: ['ln-linkedin'] },
    { id: 'hero-github', label: 'GitHub', href: GITHUB, facts: ['ln-github'] },
  ],
  theme: item('hero-theme', 'uphill, on purpose.', ['voice-typing-lines', 'voice-no-shortcut']),
}

export const SKIP = ui('skip-link', 'skip to content')
