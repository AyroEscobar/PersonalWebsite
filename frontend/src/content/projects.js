import { ESVO, VIAERE } from './constants.js'

/*
  Work: the only two projects on the site. Esvo first (his
  company), Viaere second. Every line is the live site's own words; the card
  fields inherit the card's facts. Never clients, numbers, counts or customers.
*/

export const PROJECTS = [
  {
    id: 'card-esvo',
    name: 'Esvo Technologies',
    title: 'Founder',
    headline: 'Whatever your business needs, built to fit.',
    blurb:
      'Custom software, AI agents, automation, integrations and websites, for any kind of business. We can also run it for you: hosting, fixes and improvements as you grow.',
    link: 'esvotech.com',
    href: ESVO,
    facts: ['ven-esvo', 'ven-esvo-site', 'ln-esvo'],
  },
  {
    id: 'card-viaere',
    name: 'Viaere',
    title: 'Co-founder, Founding Engineer',
    headline: 'Your entire flight operation, optimized in one place.',
    blurb: 'Maintenance-first fleet operations for flight schools, charter operators, clubs, and managed owners. Scheduling, dispatch, and billing built in.',
    link: 'viaere.com',
    href: VIAERE,
    facts: ['ven-viaere', 'ven-viaere-bio', 'ven-viaere-tagline', 'ln-viaere'],
  },
]
