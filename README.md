# ayroescobar.com

My personal site. One page, prerendered, built around a night map of the Dallas highway grid: past work glows sodium, current work glows LED white, and you can ping the grid.

## Stack

- React 19.3, Vite 7, Tailwind 3.4
- Prerendered with `react-dom/static`, so the page paints before any script runs
- Raw WebGL2 for the one animated layer, lazy and optional; no three.js
- Overpass and Overpass Mono, self-hosted variable fonts
- No cookies, no analytics, no third-party requests

## Run it

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # check-content, vite build, ssr build, prerender, budget
npm run preview    # serves dist the way Vercel does (headers, 404, compression)
```

## How it holds together

| Path | What lives there |
|---|---|
| `frontend/src/content/` | Every visible string, each one tagged with where the fact comes from |
| `frontend/src/styles/tokens.css` | The palette, type scale and motion timings |
| `frontend/src/lib/` | Store, render tiers, quiet mode, Plano clock, sun position, formatting |
| `frontend/src/ui/` | Shared pieces: section contract, status chip, lazy mount, announcer |
| `frontend/src/grid`, `hero`, `chrome`, `sections` | The map, the hero, the navigation and live panels, the sections |
| `frontend/scripts/` | Build, prerender, content checks, budgets, image and OG pipelines, QA |
| `frontend/tools/` | Local-only tooling (Lighthouse, axe, sharp, mapshaper); `npm run tools` |

Rules are code, not good intentions. The build fails on copy with no source, en or em dashes, banned words, private details, off-palette colors, contrast under the floor, or a blown bundle budget. `node scripts/qa.mjs` from the repo root runs the full headless check: every route at 390, 768, 1440 and 1920, axe, keyboard order, reduced motion, Lighthouse and the bundle report.

Quiet mode (`?quiet`, or the `quiet` button) is the same page with the motion off and the contrast up.

Road data: US Census Bureau TIGER/Line 2024, public domain. Fonts: SIL Open Font License, licenses in `frontend/src/assets/fonts/`.
