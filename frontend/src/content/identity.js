import { item, ui } from './item.js'
import { EMAIL } from './constants.js'

/*
  The hero (COPY.md 3.2). Builders render it; they do not rewrite it.
  The theme line is the only theme line on the site: 11 px, lowercase, once,
  in the hero's lower-left corner.
*/

export const HERO = {
  sceneAlt: ui('scene-alt', 'A figure pushing a huge boulder up a mountain slope at night, lit by neon.'),
  eyebrow: item('hero-eyebrow', 'Software engineer · Plano, Texas', ['identity-role', 'identity-hometown']),
  name: item('hero-name', 'Ayro Escobar', ['identity-name']),
  role: item('hero-role', 'Co-founder and Founding Engineer at Viaere. Founder of Esvo Technologies.', ['ven-viaere-bio', 'ven-esvo']),
  line: item(
    'hero-line',
    'I build software that has to hold up in the real world, for the hangar floor and the trading floor.',
    ['ven-viaere-tagline', 'ven-viaere-bio', 'exp-rbc'],
  ),
  email: { id: 'hero-email', label: 'email me', href: `mailto:${EMAIL}`, facts: ['ln-email'] },
  work: ui('hero-work', 'see the work', { href: '#check-out' }),
  theme: item('hero-theme', 'uphill, on purpose.', ['voice-typing-lines', 'voice-no-shortcut']),
}

export const SKIP = ui('skip-link', 'skip to content')
