import { ui } from './item.js'

/*
  Experience (COPY.md 3.4): one line each, newest first. The org on its own
  line, then the details with middle dots, then the receipt where facts.json
  has one. Dates use "to"; "present" where true. Nothing about 2027.
*/

export const W = {
  to: ui('w-to', 'to'),
  present: ui('w-present', 'present'),
}

export const EXPERIENCE = [
  {
    id: 'line-md7',
    org: 'MD7',
    details: 'Software Engineer (contract) · Allen, Texas · May 2026 to present.',
    note: 'Executive dashboards shipped directly with the CTO.',
    facts: ['exp-md7', 'exp-md7-public-work'],
  },
  {
    id: 'line-jpm',
    org: 'JPMorgan Chase',
    details: 'Software Engineer Intern, CIB · Plano, Texas · June to August 2026.',
    facts: ['exp-jpm-2026'],
  },
  {
    id: 'line-rbc',
    org: 'RBC Capital Markets',
    details: 'Software Engineer Intern · New York · January to April 2026.',
    note: 'Inaugural AidenEdge cohort, 1 of 10 interns, six trading-floor desks in four months.',
    facts: ['exp-rbc'],
  },
  {
    id: 'line-mlh',
    org: 'Major League Hacking',
    details: 'Coach · June 2025 to present.',
    note: 'Spoke at Hackcon 2026, "Planning for Chaos".',
    facts: ['exp-mlh-coach', 'exp-mlh-hackcon'],
  },
  {
    id: 'line-hackutd',
    org: 'HackUTD',
    details: 'Tech team · 2025 to 2026.',
    note: 'Co-maintained HackPortal, the registration, check-in and judging platform.',
    facts: ['com-hackutd'],
  },
  {
    id: 'line-utd',
    org: 'UT Dallas',
    details: 'B.S. Computer Science, in progress · AWS Certified Cloud Practitioner.',
    facts: ['edu-degree', 'identity-student', 'edu-cert-aws-ccp'],
  },
]
