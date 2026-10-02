import { item, ui } from './item.js'
import { AGE } from './constants.js'

/*
  Hero (PLAN.md 3.2, rendered by A) and the origin body (3.3, rendered by C).
  Final copy. Builders render it; they do not rewrite it. Changes go through
  requests-<X>.md.
*/

export const HERO = {
  eyebrow: item('hero-eyebrow', 'software engineer · plano, texas', ['identity-role', 'identity-hometown']),
  name: item('hero-name', 'Ayro Escobar', ['identity-name']),
  deck: item(
    'hero-deck',
    'cs at ut dallas. co-founder, engineering, at viaere. software engineer at md7.',
    ['identity-student', 'ven-viaere-bio', 'exp-md7'],
  ),
  lead: item(
    'hero-lead',
    "the hunger came from realizing how much of the world runs on invisible systems. somebody wrote the code that settles every trade, gets your food to the door, routes messages around the world, and tells an ambulance which street to take to your house. that's the part i fell in love with.",
    ['voice-invisible-systems'],
    { verbatim: 'voice-invisible-systems' },
  ),
  level: item(
    'hero-level',
    "i'm trying to be the kind of engineer who can build that. work that quietly holds itself up, doesn't need a human in the loop, doesn't sleep when i do. that's the level i'm aiming at.",
    ['voice-level'],
    { verbatim: 'voice-level' },
  ),
}

export const ORIGIN = {
  paragraph: item(
    'origin-paragraph',
    `${AGE}, in cs at ut dallas. trying to live this all the way out. take the engineering as far as i can, build as much as i can, stay curious about anything that gets made. mostly that's software, but the rest counts too. just trying to be a good engineer and put together work i'd be proud to show.`,
    ['voice-hero', 'identity-age'],
    { verbatim: 'voice-hero' },
  ),
  pull: item(
    'origin-pull',
    'I am trying to build a life where my family never has to worry about money, and ship a few things that outlast me along the way. That sentence is the whole map. Every role I take and every hour I spend gets weighed against it.',
    ['voice-the-map'],
    { verbatim: 'voice-the-map' },
  ),
  closer: item(
    'origin-closer',
    'The cost of doing the work is doing the work. There is no shortcut.',
    ['voice-no-shortcut'],
    { verbatim: 'voice-no-shortcut' },
  ),
  offHours: item(
    'origin-off-hours',
    "music is always on while i work. when i'm burnt out i recover with minecraft videos, anime, or the distractible podcast.",
    ['identity-interests'],
  ),
  vitals: [
    { id: 'vital-base', label: 'base', value: 'Plano, Texas', facts: ['identity-hometown'] },
    {
      id: 'vital-school',
      label: 'school',
      value: 'B.S. Computer Science, The University of Texas at Dallas',
      facts: ['edu-degree'],
    },
    { id: 'vital-languages', label: 'languages', value: 'English, Spanish', facts: ['identity-languages'] },
    { id: 'vital-status', label: 'status', value: 'US citizen', facts: ['identity-citizenship'] },
  ],
  photoAlt: item('origin-photo-alt', 'Ayro Escobar standing in a snowy park', ['identity-name']),
}

export const SKIP = ui('skip-link', 'skip to content')
