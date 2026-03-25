# ClearSnap v2.0 — Handover

## Session: 2026-03-25

### What Was Done
Complete project scaffold for the ClearSnap v2.0 rewrite. Created on Windows, to be implemented on Mac.

**Created from scratch:**
- Full Astro project structure with Preact integration and sitemap
- `Base.astro` layout with proper SEO (OG tags, Twitter cards, schema.org, canonical URLs)
- `Navbar.astro` with links to all 6 tool pages (active state via aria-current)
- `Footer.astro` with tool links
- `ThemeToggle.astro` with localStorage persistence and FOUC prevention
- `ToolPage.astro` — shared tool page template with ad slots, features grid, FAQ with schema.org, and related tools section
- `AdSlot.astro` — reusable ad unit component
- 7 page routes: landing + 6 tools, each with unique title, meta description, Schema.org, features, FAQ, and related tools content
- `robots.txt` endpoint pointing to sitemap
- `global.css` — complete design system ported from v1 with improvements (CSS variables, self-hosted font declarations, dark mode, all component styles)
- 5 TypeScript library modules: `canvas.ts` (resize/crop/convert), `heic.ts` (lazy-loaded HEIC decoding), `download.ts`, `validate.ts`, `analytics.ts`
- 8 Preact components: `Uploader`, `ImagePreview`, `BackgroundRemover`, `Resizer`, `Converter`, `HeicConverter`, `BatchProcessor`, `CropTool`
- Hardened `api/server.py` — single `/api/remove` endpoint with rate limiting (slowapi), CORS, async processing via ProcessPoolExecutor
- Docker infrastructure: `Dockerfile.frontend` (multi-stage Node build → nginx), `api/Dockerfile`, `docker-compose.yml` with healthchecks and memory limits
- nginx config with security headers (CSP, X-Frame-Options, etc.), caching rules, and API proxy
- `ops.sh` with status/logs/restart/deploy/ssl-renew commands
- `CLAUDE.md` with full architecture documentation

### What's Next
1. **On Mac**: `cd frontend && npm install && npm run dev` to start development
2. **Copy assets**: Get logo/favicon files from toolsite1 into `frontend/public/images/`
3. **Download fonts**: Get Work Sans + Fraunces woff2 files into `frontend/public/fonts/`
4. **Wire up components**: Uncomment Preact component imports in each `.astro` page, add `client:load`
5. **Port crop tool**: The drag/resize selection UI needs the pointer event logic from v1 `app.js`
6. **Test all tools**: Upload real images, verify resize/crop/convert/HEIC/batch work client-side
7. **GA4 + AdSense**: Create GA4 property, replace measurement ID placeholder; create AdSense ad units once approved
8. **Deploy**: Push to VPS, `docker compose up -d --build`
9. **Submit to Google**: Add to Search Console, submit sitemap, reapply for AdSense

### Key Decisions Made
- **Astro + Preact** over Next.js (simpler, no Node runtime in prod, perfect Lighthouse scores)
- **Client-side processing** for 5/6 tools (Canvas API, heic2any, JSZip) — true privacy
- **Server-side bg removal only** — @imgly/background-removal requires COOP/COEP headers that break AdSense
- **Dropped GIF/BMP** output (Canvas can't produce them; JPG/PNG/WebP covers 99.9% of use cases)
- **50MB file limit** for client-side tools, 10MB for background remover
- **Flat URLs** (`/resize`, `/crop`) for better SEO over nested `/tools/resize`
- **300-500 words per page** with features + FAQ for AdSense publisher content approval
