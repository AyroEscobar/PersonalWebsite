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
      'An AI interviewer that runs STAR format behavioral rounds with live speech ' +
      'recognition, backed by a Supabase database. The analytics dashboard scores every ' +
      'answer on pace, filler words, and structure.',
    tech: ['Next.js', 'React', 'Supabase', 'Gemini API'],
    live: 'https://interview-lens.com',
  },
  {
    id: 'aviation',
    year: '2025',
    title: 'Aviation',
    tagline: 'Maintenance and flight log for pilots',
    status: 'BUILDING',
    category: 'Startup',
    description:
      'A web app for general aviation aircraft owners. Log flights, track maintenance, ' +
      'and catch compliance deadlines before they come due, replacing the paper logbook.',
    tech: ['React', 'Flask', 'Postgres'],
  },
  {
    id: 'request',
    year: '2025',
    title: 'ReQuest',
    tagline: 'Recycle, donate, or dispose by photo',
    status: 'SHIPPED',
    category: 'ACM UTD',
    description:
      'Point your camera at an item and ReQuest tells you where to recycle, sell, donate, ' +
      'or dispose of it. Crowdsourced locations and geolocation search turn good intentions ' +
      'into a real destination.',
    tech: ['React Native', 'OpenAI API', 'Firebase'],
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
      'An AI journaling app for women in unsafe relationships. It tracks emotional change ' +
      'over time and gives a safety read from a risk model built on the DSM-5.',
    tech: ['React', 'Node', 'MongoDB'],
    github: 'https://github.com/AyroEscobar/HackAI2025',
  },
]
