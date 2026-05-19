// BUILD.LOG, the source of truth. Firestore can augment this list.

export const PROJECTS = [
  {
    id: 'interview-lens',
    year: '2025',
    title: 'Interview-Lens',
    tagline: 'AI mock interview coach',
    status: 'LIVE',
    category: 'Startup',
    description:
      'An AI interviewer that runs STAR format behavioral rounds with real time speech ' +
      'recognition. A Supabase backend spanning 9 tables and 30+ functions powers auth, ' +
      'a referral system, and the question bank. The analytics dashboard tracks 7 metrics: ' +
      'speech pace, filler words, and response structure among them.',
    tech: ['Next.js', 'React', 'Supabase', 'Gemini API', 'WebSpeech API'],
    live: 'https://interview-lens.com',
  },
  {
    id: 'aviation',
    year: '2025',
    title: 'Aviation',
    tagline: 'Maintenance and flight log for GA pilots',
    status: 'BUILDING',
    category: 'Startup',
    description:
      'A web app for general aviation aircraft owners. Log flights, track maintenance and ' +
      'inspections, and get compliance alerts before things come due. It replaces the paper ' +
      'logbook for owners who spend $10K to $30K a year keeping an aircraft legal to fly.',
    tech: ['Python', 'Flask', 'React', 'Postgres'],
  },
  {
    id: 'request',
    year: '2025',
    title: 'ReQuest',
    tagline: 'Recycle, donate, dispose, by photo',
    status: 'SHIPPED',
    category: 'ACM UTD',
    description:
      'A React Native app that identifies where to recycle, sell, donate, or dispose of an ' +
      'item from a single photo. Crowdsourced locations through Firebase, geolocation search, ' +
      'and environmental impact tracking turn good intentions into an actual destination.',
    tech: ['React Native', 'OpenAI API', 'Firebase', 'Tailwind'],
    github: 'https://github.com/acm-projects/ReQuest',
  },
  {
    id: 'gaia',
    year: '2025',
    title: 'Gaia',
    tagline: 'Safety journaling for at risk users',
    status: 'HACKATHON',
    category: 'HackAI',
    description:
      'An AI journaling app for women in potentially harmful relationships. Users log ' +
      'experiences, track emotional change over time, and get a safety read from a risk ' +
      'model built on the DSM-5 question format. Built at HackAI.',
    tech: ['React', 'Node', 'MongoDB', 'Gemini API'],
    github: 'https://github.com/AyroEscobar/HackAI2025',
  },
  {
    id: 'overnight-press',
    year: '2026',
    title: 'Overnight Press',
    tagline: 'AI coloring book factory',
    status: 'BUILDING',
    category: 'Venture',
    description:
      'An end to end print on demand pipeline. Local SDXL render on a Mac Mini runs all the ' +
      'way through to KDP upload, Pinterest auto posting, and AI written marketing copy. A ' +
      'book factory that keeps producing while I sleep.',
    tech: ['Python', 'SDXL', 'Playwright', 'KDP'],
  },
  {
    id: 'viralengine',
    year: '2025',
    title: 'ViralEngine',
    tagline: 'One video, every platform',
    status: 'TOOL',
    category: 'Tool',
    description:
      'A local pipeline that takes one raw video and auto transcribes it, captions it, scores ' +
      'it, exports a cut per platform, writes AI hashtags, and posts to YouTube Shorts, Reels, ' +
      'and TikTok. All of it from a single command.',
    tech: ['Python', 'FFmpeg', 'Whisper', 'Claude API'],
    github: 'https://github.com/AyroEscobar/ai_video_editor',
  },
]
