import { item, ui } from './item.js'
import { INTERVIEW_LENS, REPO, VIAERE } from './constants.js'

/*
  The builds section (PLAN.md 3.6). Rendered by C as BuildCards, in this order.
  Card fields inherit the card's facts. `links` use visible words only
  ('visit', 'source'). `specimen` names the file in src/sections/specimens/.
  `layout: 'wide'` spans the full grid on desktop.

  Never shown: the forked repo, the do-not-feature repos, and any private
  repo (facts.json prj-*). No counts on Viaere, ever.
*/

const visit = (href) => ({ label: 'visit', href })
const source = (href) => ({ label: 'source', href })

export const BUILDS = {
  intro: ui('builds-intro', 'things i shipped and can show.'),
  cards: [
    {
      id: 'build-viaere',
      title: 'Viaere',
      meta: 'co-founder, engineering · viaere.com',
      facts: ['ven-viaere', 'ln-viaere'],
      body: [
        item(
          'viaere-what',
          'Maintenance-first fleet operations software for anyone who flies aircraft for a living: flight schools, charter operators, flying clubs and managed owners.',
          ['ven-viaere'],
        ),
        item('viaere-tagline', "Know what's red before you walk into the hangar.", ['ven-viaere-tagline']),
        item(
          'viaere-product',
          'Four-tier status instead of a binary alert. A spacing engine that keeps every aircraft evenly spread across its 100-hour window. Squawks with a real lifecycle, work orders with item-by-item sign-offs and an audit trail, and history that never disappears. Every release is reviewed against a working fleet before it ships.',
          ['ven-viaere-product'],
        ),
      ],
      stack: null,
      links: [visit(VIAERE)],
      specimen: 'viaere',
      layout: 'wide',
    },
    {
      id: 'build-pool',
      title: 'Pool Tournament Scheduler',
      meta: 'cs 4302, ut dallas · july 2026',
      facts: ['prj-pool-tournament'],
      body: [
        item(
          'pool-what',
          'A single-file web app that schedules and simulates an eight-ball tournament. Circle-method round robin framed as a one-factorization of K_n with a live verification panel, Elo-driven match simulation, seeded single or double elimination, an 18-step guided walkthrough, and just over 100,000 assertions run against the exact algorithm block that ships.',
          ['prj-pool-tournament'],
        ),
      ],
      stack: null,
      links: [source('https://github.com/AyroEscobar/pool-tournament-system')],
      specimen: 'circle-method',
      layout: 'wide',
    },
    {
      id: 'build-neetcode',
      title: 'neetcode-coach',
      meta: 'may 2026',
      facts: ['prj-neetcode-coach'],
      body: [
        item(
          'neetcode-what',
          'A Socratic NeetCode 150 coach in Java that runs inside Claude Code. It escalates hints in levels and never writes the solution.',
          ['prj-neetcode-coach'],
        ),
      ],
      stack: null,
      links: [source('https://github.com/AyroEscobar/neetcode-coach')],
      specimen: 'hint-ladder',
      layout: 'half',
    },
    {
      id: 'build-interview-lens',
      title: 'Interview-Lens',
      meta: 'built with a team · interview-lens.com',
      facts: ['ven-interview-lens', 'ln-interview-lens'],
      body: [
        item(
          'interview-lens-what',
          'An AI mock interview coach that runs STAR-format behavioral rounds with live speech recognition, backed by Supabase. An analytics dashboard scores every answer on pace, filler words and structure.',
          ['ven-interview-lens'],
        ),
      ],
      stack: null,
      links: [visit(INTERVIEW_LENS)],
      specimen: 'meters',
      layout: 'half',
    },
    {
      id: 'build-system',
      title: 'A system that runs my days',
      meta: 'private · built on claude',
      facts: ['prj-247-system'],
      body: [
        item(
          'system-what',
          'A personal multi-agent system on a Mac mini. It watches my finances, tracks my health, curates news, files notes and writes the briefing I wake up to.',
          ['prj-247-system'],
        ),
      ],
      stack: null,
      links: [],
      specimen: 'week-strip',
      layout: 'half',
    },
    {
      id: 'build-routed',
      title: 'Routed',
      meta: 'hack the north 2025, with a hackutd team',
      facts: ['prj-routed'],
      body: [
        item(
          'routed-what',
          'A trip planner that pairs recommendations with action: routes by food and activities, reservations through partner sites, and a voice AI that calls ahead.',
          ['prj-routed'],
        ),
      ],
      stack: 'Next.js, Firebase, Google Maps API, Cua with the Anthropic API',
      links: [source('https://github.com/AyroEscobar/HTN2025')],
      specimen: 'route',
      layout: 'half',
    },
    {
      id: 'build-request',
      title: 'ReQuest',
      meta: 'acm utd projects, team build',
      facts: ['prj-request', 'prj-team-builds'],
      body: [
        item(
          'request-what',
          'Point your camera at an item and it tells you where to recycle, sell, donate or dispose of it, with crowdsourced locations and geolocation search.',
          ['prj-request'],
        ),
      ],
      stack: 'React Native, OpenAI API, Firebase',
      links: [source('https://github.com/acm-projects/ReQuest')],
      specimen: 'reticle',
      layout: 'half',
    },
    {
      id: 'build-gaia',
      title: 'Gaia',
      meta: 'hackai 2025, with a team',
      facts: ['prj-gaia', 'prj-team-builds'],
      body: [
        item(
          'gaia-what',
          'An AI journaling app for women in unsafe relationships. It tracks emotional change over time and gives a safety read from a risk model built on the DSM-5.',
          ['prj-gaia'],
        ),
      ],
      stack: 'React, Node, MongoDB',
      links: [source('https://github.com/AyroEscobar/HackAI2025')],
      specimen: null,
      layout: 'half',
    },
  ],
  also: item(
    'builds-also',
    "also on github: HackUTDDiscordBot, a Python bot for HackUTD's Discord servers (2025).",
    ['prj-hackutd-bot'],
  ),
  thisSite: item(
    'builds-this-site',
    'this site: react, vite, tailwind and raw webgl2, prerendered. source on github.',
    ['prj-personal-website'],
    { href: REPO },
  ),
  stackLabel: ui('builds-stack-label', 'stack'),
  illustration: ui('specimen-illustration', 'illustration'),
}
