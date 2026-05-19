# Ayro Escobar // Personal Website

Personal site and portfolio. Currently being redesigned on the `retro-revamp` branch.

## Status: work in progress

`retro-revamp` is an active rebuild of the site into a dark mission control theme called OPERATOR. It is not finished and it is not merged to `master`. Production at ayroescobar.com still runs the previous design.

**Done**

- Full theme rebuild: dark OPERATOR look, JetBrains Mono and Space Grotesk
- Boot sequence intro
- Hero: glitch in name, live status eyebrow, personal brand paragraph
- Home sections rebuilt as console panels: profile, status, experience with the expandable RBC desk log, stack matrix, build log, contact
- Content rewritten from the resume and verified info

**In progress and next**

- Personal section (DISPATCH) is pulled, waiting on real content
- Command palette, deeper polish, OG image, favicon
- Remaining routes (`/review`, `/admin`) still on the old theme
- Do not merge to `master` until the redesign is approved

## Tech

- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, Three.js
- Backend: Firebase Firestore

## Run it locally

```bash
cd frontend
npm install
npm run dev
```

Serves on http://localhost:5173

## Picking this up on another machine

```bash
git fetch origin
git checkout retro-revamp
cd frontend && npm install
npm run dev
```

## Environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the Firebase credentials.

---

Built by Ayro Escobar
