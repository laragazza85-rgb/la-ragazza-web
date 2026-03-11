# La Ragazza Web

Official website for La Ragazza, a family-run Italian restaurant in Villavicencio, Colombia.

This main README is intentionally short and focused on project overview.
For implementation details, see the dedicated docs:

- `docs/architecture.md`
- `docs/development.md`
- `docs/website-workflow.md`

---

## What This Project Is

`la-ragazza-web` is a bilingual Astro website (`es` and `en`) that presents the restaurant's identity, menu, gallery, reviews, and contact channels.

Core traits:

- Static-first site built with Astro
- Content managed from local JSON files
- SEO-oriented metadata and structured data
- Deployment target aligned with Vercel
- Optional Docker workflows for local/staging parity

---

## Why This Project Exists

This project was built to give La Ragazza a modern, maintainable web presence that:

- communicates the brand story and family tradition,
- makes menu and contact information easy to update,
- supports both Spanish and English audiences,
- performs well as a static site,
- stays simple for future developers to maintain.

---

## High-Level Structure

- `src/pages` - route entrypoints (`/es`, `/en`, and section pages)
- `src/components` - UI and section building blocks
- `src/data` - editable business content by locale
- `src/layouts` - shared page shell and metadata wiring
- `src/utils` - helpers (SEO, currency, review conversion)
- `public` - static assets (favicon, OG image, llms profile)
- Docker/Compose/Make files - reproducible local workflows

---

## Documentation Map

### Architecture

Read `docs/architecture.md` for:

- rendering model and data flow,
- routing and i18n behavior,
- layout/component internals,
- SEO implementation,
- caveats and technical notes.

### Development

Read `docs/development.md` for:

- local setup (native and containerized),
- content editing workflows,
- reviews CSV -> JSON process,
- build and release routines,
- troubleshooting commands.

### Website Workflow

Read `docs/website-workflow.md` for:

- complete end-to-end request flow (user → CDN → static file),
- language detection and redirect layers,
- page-by-page data flow,
- component assembly and layout tree,
- partial contact form validation flow,
- full build process step by step,
- Vercel deployment workflow,
- Docker local/staging workflow,
- content editing workflow,
- reviews CSV → JSON pipeline,
- SEO generation flow,
- design system tokens,
- complete route map and file dependency map.

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:4321`.

For more complete setup and Docker commands, use `docs/development.md`.
