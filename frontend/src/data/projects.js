// BUILD.LOG — the source of truth. Firestore can augment this list.

export const PROJECTS = [
  {
    id: 'interview-lens',
    year: '2025',
    title: 'Interview-Lens',
    tagline: 'AI mock-interview coach',
    status: 'LIVE',
    category: 'Startup',
    description:
      'An AI interviewer running STAR-format behavioral rounds with real-time speech ' +
      'recognition. 9-table Supabase backend with 30+ functions; analytics dashboard ' +
      'tracking 7 metrics — speech pace, filler words, response structure.',
    tech: ['Next.js', 'React', 'Supabase', 'Gemini API', 'WebSpeech API'],
    live: 'https://interview-lens.com',
  },
  {
    id: 'surveillance-saas',
    year: '2026',
    title: 'Surveillance Platform',
    tagline: 'SaaS for a helicopter operator',
    status: 'IN-DEV',
    category: 'Startup',
    description:
      'Founding engineer (#3) on an AI-powered surveillance platform for a helicopter ' +
      'company — the first real SaaS deal. Software for small businesses, monthly ' +
      'recurring, built to compound.',
    tech: ['React', 'Node', 'Postgres', 'Computer Vision'],
  },
  {
    id: 'finance-service',
    year: '2026',
    title: 'Finance Service',
    tagline: 'Autonomous personal finance',
    status: 'ONGOING',
    category: 'Tool',
    description:
      'A 24/7 service that parses bank email alerts into Postgres — income, spend, ' +
      'transfers — with billing-anomaly detection, weekly reports, and a live ' +
      'mission-control dashboard. Zero manual tracking.',
    tech: ['Node', 'PostgreSQL', 'Gmail API', 'Telegram'],
    github: 'https://github.com/AyroEscobar',
  },
  {
    id: 'aviation',
    year: '2025',
    title: 'Aviation',
    tagline: 'Maintenance & flight log for GA pilots',
    status: 'IN-DEV',
    category: 'Startup',
    description:
      'A web app for general-aviation aircraft owners — log flights, track maintenance ' +
      'and inspections, get compliance alerts before things come due. Replacing paper ' +
      'logbooks for owners who spend $10–30K/year keeping their aircraft legal.',
    tech: ['Python', 'Flask', 'React', 'Postgres'],
  },
  {
    id: 'request',
    year: '2025',
    title: 'ReQuest',
    tagline: 'Recycle, donate, dispose — by photo',
    status: 'SHIPPED',
    category: 'ACM UTD',
    description:
      'A React Native app that identifies where to recycle, sell, donate, or dispose ' +
      'of items from a photo — with crowdsourced locations, geolocation search, and ' +
      'environmental-impact tracking.',
    tech: ['React Native', 'OpenAI API', 'Firebase', 'Tailwind'],
    github: 'https://github.com/acm-projects/ReQuest',
  },
  {
    id: 'gaia',
    year: '2025',
    title: 'Gaia',
    tagline: 'Safety journaling for at-risk users',
    status: 'HACKATHON',
    category: 'HackAI',
    description:
      'An AI journaling app for women in potentially harmful relationships — log ' +
      'experiences, track emotional change, and assess safety with a DSM-5-based risk ' +
      'model. Built at HackAI.',
    tech: ['React', 'Node', 'MongoDB', 'Gemini API'],
    github: 'https://github.com/AyroEscobar/HackAI2025',
  },
  {
    id: 'overnight-press',
    year: '2026',
    title: 'Overnight Press',
    tagline: 'AI coloring-book factory',
    status: 'IN-DEV',
    category: 'Venture',
    description:
      'An end-to-end print-on-demand pipeline — local SDXL render on a Mac Mini ' +
      'through to KDP upload, Pinterest auto-posting, and AI marketing copy. A book ' +
      'factory that runs while I sleep.',
    tech: ['Python', 'SDXL', 'Playwright', 'KDP'],
  },
  {
    id: 'viralengine',
    year: '2025',
    title: 'ViralEngine',
    tagline: 'One video → every platform',
    status: 'TOOL',
    category: 'Tool',
    description:
      'A local pipeline that takes one raw video and auto-transcribes, captions, ' +
      'scores, exports per-platform, writes AI hashtags, and posts to YouTube Shorts, ' +
      'Reels, and TikTok — in a single command.',
    tech: ['Python', 'FFmpeg', 'Whisper', 'Claude API'],
    github: 'https://github.com/AyroEscobar/ai_video_editor',
  },
]
