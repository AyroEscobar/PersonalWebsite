import { item, ui } from './item.js'
import { NOW_UPDATED } from './constants.js'

/*
  The now section (PLAN.md 3.4): NowBoard lines (B renders the board, C the
  section) and the ProgramStrip overlap timeline (C).

  Staleness: if the build date is more than STALE_AFTER_DAYS past `updated`,
  the board reads `last updated <Mon YYYY>` and LED drops to sodium.
  Use isStale() and monthShort() from src/lib/format.js.
*/

export const NOW = {
  updated: NOW_UPDATED,
  boardPlace: ui('now-board-place', 'plano'),
  freshPrefix: ui('now-fresh', 'updated'),
  stalePrefix: ui('now-stale', 'last updated'),
  lines: [
    {
      id: 'now-md7',
      text: 'Software Engineer (contract), MD7 · Allen, Texas · May 2026 to present',
      role: 'Software Engineer (contract)',
      org: 'MD7',
      place: 'Allen, Texas',
      dates: 'May 2026 to present',
      node: 'allen',
      state: 'now',
      facts: ['exp-md7'],
    },
    {
      id: 'now-viaere',
      text: 'Co-founder, Engineering, Viaere',
      role: 'Co-founder, Engineering',
      org: 'Viaere',
      node: null,
      state: 'now',
      facts: ['ven-viaere-bio'],
    },
    {
      id: 'now-mlh',
      text: 'Coach, Major League Hacking · since June 2025',
      role: 'Coach',
      org: 'Major League Hacking',
      dates: 'since June 2025',
      node: null,
      state: 'now',
      facts: ['exp-mlh-coach'],
    },
    {
      id: 'now-utd',
      text: 'CS at UT Dallas · Richardson, Texas',
      role: 'CS',
      org: 'UT Dallas',
      place: 'Richardson, Texas',
      node: 'richardson',
      state: 'now',
      facts: ['identity-student', 'edu-degree'],
    },
  ],
  mission: item('now-mission', 'ship things that outlast me', ['voice-mission'], { tone: 'sodium' }),
}

/*
  ProgramStrip: Jan 2025 to the build month, four lanes. Months are 'YYYY-MM'.
  end: null means "to present". startExact/endExact false means the month is
  not public: draw that edge dotted and never print a month for it.
*/
export const PROGRAM = {
  from: '2025-01',
  caption: ui('program-caption', "what ran at the same time. dotted edges mean the month isn't public."),
  tableCaption: ui('program-table-caption', 'Overlap of school, work, ventures and community, January 2025 to now'),
  lanes: [
    { id: 'school', label: ui('lane-school', 'school') },
    { id: 'work', label: ui('lane-work', 'work') },
    { id: 'ventures', label: ui('lane-ventures', 'ventures') },
    { id: 'community', label: ui('lane-community', 'community') },
  ],
  blocks: [
    { id: 'pg-utd', lane: 'school', label: 'UT Dallas', start: '2025-01', startExact: false, end: null, endExact: true, state: 'now', facts: ['identity-student'] },
    { id: 'pg-rbc', lane: 'work', label: 'RBC', start: '2026-01', startExact: true, end: '2026-04', endExact: true, state: 'past', facts: ['exp-rbc'] },
    { id: 'pg-md7', lane: 'work', label: 'MD7', start: '2026-05', startExact: true, end: null, endExact: true, state: 'now', facts: ['exp-md7'] },
    { id: 'pg-jpm', lane: 'work', label: 'JPMorgan Chase CIB', start: '2026-06', startExact: true, end: '2026-08', endExact: true, state: 'past', facts: ['exp-jpm-2026'] },
    { id: 'pg-viaere', lane: 'ventures', label: 'Viaere', start: '2026-01', startExact: false, end: null, endExact: true, state: 'now', facts: ['ven-viaere', 'ven-viaere-dates'] },
    { id: 'pg-hackutd', lane: 'community', label: 'HackUTD tech team', start: '2025-02', startExact: true, end: '2026-09', endExact: true, state: 'past', facts: ['com-hackutd'] },
    { id: 'pg-mlh', lane: 'community', label: 'MLH coach', start: '2025-06', startExact: true, end: null, endExact: true, state: 'now', facts: ['exp-mlh-coach'] },
    { id: 'pg-acm', lane: 'community', label: 'ACM UTD', start: '2025-01', startExact: false, end: '2025-12', endExact: false, state: 'past', facts: ['com-acm'] },
  ],
}
