import { item, ui } from './item.js'

/*
  The work section (PLAN.md 3.5): ReleasePlates newest first, the RBC
  DeskBranch, and the StackPlate. Rendered by C.

  Plate fields inherit the plate's facts. `status` is the visible word,
  `state` picks the light: 'now' is LED, 'past' is sodium.
  JPMorgan has no debrief on purpose (questions.md #1, #6).
*/

export const WORK = {
  intro: ui('work-intro', 'dated, newest first. the dates do the talking.'),
  statusWords: {
    active: ui('status-active', 'active'),
    complete: ui('status-complete', 'complete'),
  },
  desksLabel: ui('desks-label', 'six desks'),
  plates: [
    {
      id: 'plate-md7',
      org: 'MD7',
      role: 'Software Engineer (contract)',
      place: 'Allen, Texas',
      dates: 'May 2026 to present',
      start: '2026-05',
      end: null,
      status: 'active',
      state: 'now',
      node: 'allen',
      facts: ['exp-md7'],
      debrief: [
        item(
          'md7-debrief',
          'Clean executive dashboards that replace Power BI, shipped directly with the CTO, with real ownership over architecture and ship cadence.',
          ['exp-md7-public-work'],
        ),
      ],
    },
    {
      id: 'plate-jpm',
      org: 'JPMorgan Chase',
      role: 'Software Engineer Intern, CIB',
      place: 'Plano, Texas',
      dates: 'June to August 2026',
      start: '2026-06',
      end: '2026-08',
      status: 'complete',
      state: 'past',
      node: 'plano',
      facts: ['exp-jpm-2026'],
      debrief: [],
    },
    {
      id: 'plate-rbc',
      org: 'RBC Capital Markets',
      role: 'Software Engineer Intern, AidenEdge rotational program',
      place: 'New York City',
      dates: 'January to April 2026',
      start: '2026-01',
      end: '2026-04',
      status: 'complete',
      state: 'past',
      node: 'nyc',
      facts: ['exp-rbc'],
      debrief: [item('rbc-debrief', 'Inaugural cohort, 1 of 10 interns. Six trading-floor desks in four months.', ['exp-rbc'])],
      origin: item(
        'rbc-origin',
        'The door opened at Hack the North, where someone from RBC saw something in me.',
        ['exp-rbc-origin'],
      ),
      desks: [
        {
          id: 'desk-rates-fx',
          name: 'Rates Trading and FX Algorithms',
          text: "An AI code review agent trained on 4,000+ pull request comments from the desk's two strongest engineers. It runs as a first pass before human review.",
          facts: ['exp-rbc-desk-rates-fx'],
        },
        {
          id: 'desk-rates-compression',
          name: 'Rates Trading',
          text: 'A trade compression tool that decomposes compression swaps into their true underlying risks.',
          facts: ['exp-rbc-desk-rates-compression'],
        },
        {
          id: 'desk-qis',
          name: 'Quantitative Investment Strategies',
          text: 'An autonomous multi-agent platform, built with the Digital and AI Innovation team, that parallelizes research, analysis and report generation across 60+ quant strategies, cutting processing from 2 hours to 10 minutes per strategy. Integrated into RBC internal systems.',
          facts: ['exp-rbc-desk-qis'],
        },
        {
          id: 'desk-aidi',
          name: 'AI and Digital Innovation',
          text: 'Audited 4,700+ internal AI agents into 12 centralized workflows, surfacing a 70% redundancy rate and trimming prompt logic to cut token waste.',
          facts: ['exp-rbc-desk-aidi'],
        },
        {
          id: 'desk-cross-asset',
          name: 'Cross-Asset Sales',
          text: "An AI editorial QA agent for the desk's flagship research brief, a global markets digest read by 1,500+ employees including executives. It reviews every issue before it sends.",
          facts: ['exp-rbc-desk-cross-asset'],
        },
        {
          id: 'desk-aag',
          name: 'Alternative Asset Group',
          text: 'An automated SEC filing pipeline that pulls 20 credit reports in 5 minutes, down from about an hour, comparing N-CSR and 13F filings into structured storage.',
          facts: ['exp-rbc-desk-aag'],
        },
      ],
    },
    {
      id: 'plate-mlh',
      org: 'Major League Hacking',
      role: 'Coach',
      place: 'contract, hybrid',
      dates: 'June 2025 to present',
      start: '2025-06',
      end: null,
      status: 'active',
      state: 'now',
      node: null,
      facts: ['exp-mlh-coach'],
      debrief: [
        item(
          'mlh-debrief-ghw',
          'Supports Global Hack Week live streams. Built a CSV to Google Sheet automation the MLH team ran weekly.',
          ['exp-mlh-ghw'],
        ),
        item(
          'mlh-debrief-hackcon',
          'Spoke at Hackcon 2026, MLH\'s annual conference for hackathon organizers: "Planning for Chaos".',
          ['exp-mlh-hackcon'],
        ),
      ],
    },
  ],
}

export const STACK = {
  heading: ui('stack-heading', 'stack'),
  rows: [
    {
      id: 'stack-languages',
      label: 'languages',
      value: 'Java (strongest), TypeScript, JavaScript, Python, C++, SQL',
      facts: ['sk-languages'],
    },
    {
      id: 'stack-frameworks',
      label: 'frameworks',
      value: 'React, Next.js, Node.js, Spring Boot, Tailwind, React Native and Expo',
      facts: ['sk-frameworks'],
    },
    {
      id: 'stack-cloud',
      label: 'cloud and data',
      value: 'AWS, PostgreSQL, Supabase, Firebase, MongoDB, Kafka, GraphQL, Git, Vercel',
      facts: ['sk-cloud-data'],
    },
    {
      id: 'stack-ai',
      label: 'ai systems',
      value: 'AI agents and multi-agent systems, built on the RBC desks and in my own system. Claude Code daily.',
      facts: ['sk-ai'],
    },
    {
      id: 'stack-cert',
      label: 'certification',
      value: 'AWS Certified Cloud Practitioner',
      facts: ['edu-cert-aws-ccp'],
    },
  ],
}
