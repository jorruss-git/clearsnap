# ClearSnap v2.0

## What is this?
ClearSnap.app is a free online image tools site: background remover, image resizer, format converter, HEIC converter, batch processor, and crop tool.

## Architecture
- **Frontend**: Astro (static site generation) + Preact islands for interactive tool components
- **Backend**: FastAPI (Python) — background removal only via `rembg`
- **Deployment**: Docker Compose — nginx serves static files + proxies `/api/` to Python

### Key principle: Client-side first
5 of 6 tools run **entirely in the browser** via Canvas API. Only the background remover calls the server. This means:
- True privacy for resize/crop/convert/HEIC/batch (files never leave the browser)
- Minimal server load (only bg removal needs CPU)
- No CORS/security concerns for client-side tools

## Tech Stack
- **Astro 5.x** — static HTML generation, zero JS by default
- **Preact** — lightweight (3KB) React-compatible islands for interactive tools
- **TypeScript** — strict mode
- **Canvas API** — client-side resize, crop, format convert
- **heic2any** — client-side HEIC decoding (lazy-loaded)
- **JSZip** — client-side ZIP creation for batch tool
- **FastAPI + rembg** — server-side background removal
- **slowapi** — rate limiting on API
- **nginx** — static file serving + API reverse proxy + SSL
- **Docker Compose** — two services: frontend (nginx) + api (FastAPI)

## Project Structure
```
clearsnap/
├── frontend/          # Astro project
│   └── src/
│       ├── layouts/   # Base.astro (shared head, nav, footer)
│       ├── pages/     # One .astro file per tool page
│       ├── components/# Astro components + Preact islands (tools/)
│       ├── lib/       # canvas.ts, heic.ts, download.ts, validate.ts, analytics.ts
│       └── styles/    # global.css with design tokens
├── api/               # FastAPI — single /api/remove endpoint
├── nginx/             # nginx config
├── scripts/           # ops.sh deployment helpers
└── docker-compose.yml
```

## Commands
```bash
# Frontend development
cd frontend && npm install && npm run dev

# Build for production
cd frontend && npm run build

# Docker deployment
docker compose up -d --build

# Ops shortcuts
./scripts/ops.sh status|logs|restart|deploy|ssl-renew
```

## URL Structure
Each tool has its own page for SEO:
- `/` — Landing page (tool hub)
- `/background-remover`
- `/resize`
- `/convert`
- `/heic-converter`
- `/batch`
- `/crop`

## Design System
Warm palette with CSS custom properties defined in `frontend/src/styles/global.css`:
- Accent: `#ff7a59` (coral)
- Fonts: Work Sans (sans) + Fraunces (serif), self-hosted as woff2
- Dark mode via `[data-theme="dark"]` on `<html>`

## TODOs for Implementation
- [ ] Wire Preact tool components into `.astro` pages (uncomment imports, add `client:load`)
- [ ] Port crop tool drag/resize logic from v1 (toolsite1/static/app.js lines 620-755, 978-1070)
- [ ] Download and add self-hosted font woff2 files to `public/fonts/`
- [ ] Replace `GA_MEASUREMENT_ID` placeholder with real GA4 ID
- [ ] Create unique AdSense slot IDs in dashboard, replace `PLACEHOLDER_*` values
- [ ] Add OG image to `public/images/og-default.png`
- [ ] Test all tools end-to-end in browser
- [ ] Run Lighthouse audit (target 90+ on all metrics)
