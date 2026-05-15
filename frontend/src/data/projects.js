// Hardcoded projects — the source of truth.
// Firestore can augment this list, but these always render.

export const PROJECTS = [
  {
    id: 'aviation',
    title: 'Aviation',
    tagline: 'Maintenance & flight log for GA pilots',
    description:
      'A web app for general-aviation aircraft owners — log flights, track maintenance ' +
      'and inspections, get compliance alerts before things come due, and replace spreadsheets ' +
      'and paper logbooks. Built with co-founders; target market spends $10–30K/year operating ' +
      'their aircraft and will pay for software that keeps them legal.',
    tech: ['Python', 'Flask', 'React', 'Postgres'],
    category: 'Startup',
    status: 'In development',
  },
  {
    id: 'viralengine',
    title: 'ViralEngine',
    tagline: 'AI video pipeline → multi-platform autopost',
    description:
      'A local pipeline that takes a single raw video and automatically processes, transcribes, ' +
      'adds animated subtitles + background music, generates platform-specific exports, writes ' +
      'AI captions/hashtags, and posts to YouTube Shorts, Instagram Reels, and TikTok — in one command.',
    tech: ['Python', 'FFmpeg', 'Claude API', 'Whisper'],
    github: 'https://github.com/AyroEscobar/ai_video_editor',
    category: 'Tool',
  },
  {
    id: 'expense-tracker',
    title: 'Expense Tracker',
    tagline: 'Personal finance dashboard',
    description:
      'Tracks income, expenses, debts, and savings goals with a clean pastel UI. ' +
      'Dashboard shows monthly cash flow and savings rate; debts have due dates and payment ' +
      'progress; goals have target dates and weekly breakdowns. Built it because I wanted it.',
    tech: ['Python', 'Flask', 'SQLite'],
    category: 'Personal',
  },
  {
    id: 'interviewlens',
    title: 'InterviewLens',
    tagline: 'Technical interview coaching, instrumented',
    description:
      'A practice surface for technical interviews — structured problem sets, AI-graded mock ' +
      'rounds, and pattern recognition over your weak spots. Made after coaching dozens of ' +
      'students through ACM TIP and noticing the same blind spots in everyone.',
    tech: ['React', 'Node', 'Claude API'],
    category: 'Tool',
  },
  {
    id: 'mlh-automation',
    title: 'MLH Sheet Pipeline',
    tagline: 'CSV → Google Sheet automation',
    description:
      'A small but real piece of infrastructure for the MLH team — automated CSV-to-Sheet ' +
      'updates that previously took an hour of manual work per event. Now used by the team weekly.',
    tech: ['Python', 'Google Sheets API'],
    category: 'Internal tool',
  },
  {
    id: 'this-site',
    title: 'This Site',
    tagline: 'The site you are reading',
    description:
      'Built this in React + Vite with a vintage-magazine aesthetic — antique paper, burnt ' +
      'sienna, italic serif everything. The whole point: feel comfortable, not like every other ' +
      'developer portfolio. Source on GitHub if you want to see how it works.',
    tech: ['React', 'Vite', 'Tailwind', 'Framer Motion'],
    github: 'https://github.com/AyroEscobar',
    category: 'Personal',
  },
]
