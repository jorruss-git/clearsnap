# Session Handover

**Date:** 2026-03-25
**Scope:** Wire up scaffold into working app — fonts, components, crop tool, GA4
**Status:** In Progress

---

## What We Worked On

Took the v2.0 scaffold (created on Windows) and turned it into a working dev build on Mac. Downloaded self-hosted fonts, wired all 6 Preact tool components into their Astro pages, implemented the full interactive crop tool, fixed the landing page logo, added GA4 tracking, and improved the background remover error handling.

### Changes

| Area | Description |
|------|-------------|
| Fonts | Downloaded Work Sans (400/500/600) + Fraunces (600) woff2 from Google Fonts into `public/fonts/` |
| Pages | Uncommented Preact imports and replaced placeholder divs with `client:load` components on all 6 tool pages |
| Crop Tool | Full rewrite with drag-to-select, move, 8-handle resize, aspect ratio presets (Free, 1:1, 4:3, 3:4, 16:9, 9:16), auto-init on image load |
| Landing Page | Fixed logo aspect ratio — was 140x140 (squished), now 83x140 matching the 500x847 source |
| GA4 | Replaced `GA_MEASUREMENT_ID` placeholder with real ID `G-GBM8NRV9ZD` in Base.astro |
| Background Remover | Added dev proxy (`/api` -> `localhost:8000`) in astro.config.mjs; improved error message when API is unreachable |

---

## Bugs Fixed

| Bug | Fix |
|-----|-----|
| Logo squished on landing page | Changed width from 140 to 83 to match source aspect ratio |
| "Something went wrong" on background remover | Added clear "API server not running" message + Vite dev proxy |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Added "Free" as default crop preset | Better UX — users expect unconstrained crop by default |
| Used same variable font file for all Work Sans weights | Google Fonts serves a single variable woff2 for the latin subset |

---

## Next Steps

1. **Deploy to VPS** — need SSH access; Hostinger MCP server configured but requires Claude Code restart to activate
2. **Add OG image** — `public/images/og-default.png` for social sharing previews
3. **AdSense** — submit finished site for approval, then replace `PLACEHOLDER_*` slot IDs
4. **Test all tools end-to-end** in browser with real images
5. **Run Lighthouse audit** — target 90+ on all metrics
6. **Submit to Google Search Console** — add sitemap

### Known Issues

- Background remover requires FastAPI server running (`api/server.py`) — only tool that needs backend
- VPS SSH key attached via Hostinger API — connect with: `ssh -i ~/.ssh/id_ed25519 root@76.13.29.227` (blocked on port 22 at current network, try from home)
- VPS runs **CloudPanel** (not raw Docker) — may deploy via CloudPanel instead of docker-compose

---

## Files Modified

```
frontend/
├── public/fonts/
│   ├── WorkSans-Regular.woff2      (new)
│   ├── WorkSans-Medium.woff2       (new)
│   ├── WorkSans-SemiBold.woff2     (new)
│   └── Fraunces-SemiBold.woff2     (new)
├── src/
│   ├── layouts/Base.astro           (GA4 ID)
│   ├── components/tools/
│   │   ├── CropTool.tsx             (full rewrite)
│   │   └── BackgroundRemover.tsx    (error handling)
│   └── pages/
│       ├── index.astro              (logo fix)
│       ├── resize.astro             (wired component)
│       ├── background-remover.astro (wired component)
│       ├── convert.astro            (wired component)
│       ├── heic-converter.astro     (wired component)
│       ├── batch.astro              (wired component)
│       └── crop.astro               (wired component)
└── astro.config.mjs                 (dev proxy)
```

---

*End of Handover*
