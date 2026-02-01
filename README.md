# Ayro's Personal Website

A modern, interactive personal portfolio website showcasing my journey as a developer, hackathon enthusiast, and community leader.

**Status:** Under Development

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- Framer Motion (animations)
- Three.js + React Three Fiber (3D graphics)
- React Router

**Backend**
- Firebase (Firestore)

## Features

- Interactive 3D particle hero section
- Smooth scroll animations
- Hackathon map showcase
- Skills & technology grid
- Testimonials section
- Responsive design

## Project Structure

```
PersonalWebsite/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/      # Route pages
│   │   │   └── sections/   # Page sections
│   │   ├── firebase/       # Firebase config
│   │   └── hooks/          # Custom hooks
│   └── ...
└── backend/           # API (coming soon)
```

## Getting Started

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Or from root
npm run dev
```

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and fill in your Firebase credentials.

---

Built by Ayro Escobar
