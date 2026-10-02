import { item } from './item.js'

/*
  The crew section (PLAN.md 3.7). Rendered by C.
  Hackathons use the word "competed". Never "won" or "placed".
  HackUTD is past tense (he left the role Sep 22, 2026).
*/

export const CREW = {
  intro: item(
    'crew-intro',
    'the people part. hackathons changed my trajectory, so i work on them.',
    ['exp-rbc-origin', 'com-hackutd', 'exp-mlh-coach'],
  ),
  entries: [
    item(
      'crew-hackcon',
      'Speaker, MLH Hackcon 2026 · "Planning for Chaos" · August 21 to 23, 2026. Attended Hackcon 2025 and 2026.',
      ['exp-mlh-hackcon'],
      { title: 'Speaker, MLH Hackcon 2026', dates: 'August 21 to 23, 2026', start: '2026-08-21', end: '2026-08-23' },
    ),
    item(
      'crew-hackutd',
      'HackUTD tech team · February 2025 to September 2026 · Co-maintained HackPortal, the registration, check-in and live-judging platform, and helped run HackUTD 2025 end to end. HackUTD calls itself North America\'s largest 24-hour hackathon, with 1,200+ participants.',
      ['com-hackutd', 'com-hackutd-scale'],
      { title: 'HackUTD tech team', dates: 'February 2025 to September 2026', start: '2025-02', end: '2026-09' },
    ),
    item(
      'crew-acm',
      'Technical Interview Prep Officer, ACM UTD Education Division · 2025 · Led Java data structures and algorithms prep, arrays through dynamic programming, for a cohort, plus mock interviews with personal feedback.',
      ['com-acm'],
      { title: 'Technical Interview Prep Officer, ACM UTD Education Division', dates: '2025', start: '2025', end: '2025' },
    ),
    item(
      'crew-competed',
      'Competed at HackAI 2025 (Gaia), Hack the North 2025 (Routed) and Hack the North 2026.',
      ['com-hackathons-competed'],
    ),
  ],
}
