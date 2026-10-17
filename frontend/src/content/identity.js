import { item, ui } from './item.js'
import { AGE, COFFEE, EMAIL, GITHUB, LINKEDIN } from './constants.js'

/*
  The hero: who he is in five seconds. The h1 is his name, then one line in his voice (his age and
  his school, the way his own emails open), three short lines for what he is (his company, Viaere,
  the internships), then "A few things I've built": three results in his own words, the figure in
  each one set strong. Then two ways to reach him and two links. Builders render it; they do not
  rewrite it. The theme line is the only theme line on the site: 12 px, lowercase, once, on the clay
  in the hero's lower-left corner (lower right inside the frieze on a phone).
*/

export const HERO = {
  sceneAlt: ui('scene-alt', 'A black-figure silhouette pushing a white boulder along the frieze of a Greek vase.'),
  name: item('hero-name', 'Ayro Escobar', ['identity-name']),
  intro: item('hero-intro', `I'm ${AGE} and I study computer science at UT Dallas.`, ['identity-age', 'identity-student']),
  roles: [
    item('hero-role-esvo', 'Founder of Esvo Technologies', ['ven-esvo']),
    item('hero-role-viaere', 'Co-founder and Founding Engineer at Viaere', ['ven-viaere', 'ven-viaere-bio']),
    item('hero-role-internships', 'Internships at JPMorgan Chase and RBC Capital Markets', ['exp-jpm-2026', 'exp-rbc']),
  ],
  built: {
    label: ui('hero-built-label', "A few things I've built"),
    items: [
      item('hero-built-800k', 'Software that saved a company more than $800K in a single month', ['built-800k'], { strong: '$800K' }),
      item('hero-built-160h', 'A store system that saves the team 160+\u00a0hours of work every week', ['built-store-160h'], { strong: '160+\u00a0hours' }),
      item('hero-built-seconds', 'A tool that turned a 2\u00a0to\u00a04\u00a0hour task into a few seconds', ['built-2to4h'], { strong: 'a few seconds' }),
    ],
  },
  coffee: { id: 'hero-coffee', label: 'Grab a coffee chat', href: COFFEE, facts: ['ln-coffee'] },
  email: { id: 'hero-email', label: 'Email me', href: `mailto:${EMAIL}`, facts: ['ln-email'] },
  links: [
    { id: 'hero-linkedin', label: 'LinkedIn', href: LINKEDIN, facts: ['ln-linkedin'] },
    { id: 'hero-github', label: 'GitHub', href: GITHUB, facts: ['ln-github'] },
  ],
  theme: item('hero-theme', 'uphill, on purpose.', ['voice-typing-lines', 'voice-no-shortcut']),
}

export const SKIP = ui('skip-link', 'skip to content')
