# La Ragazza Web

Official website for La Ragazza, a family-run Italian restaurant in Villavicencio, Colombia.

This main README is intentionally short and focused on project overview.
For implementation details, see the dedicated docs:

- `docs/architecture.md`
- `docs/development.md`
- `docs/website-workflow.md`

---

## What This Project Is

`la-ragazza-web` is a bilingual Astro website (`es` and `en`) that presents the restaurant's identity, menu, gallery, reviews, contact channels, and an internal admin panel.

Core traits:

- Static-first public site built with Astro
- Admin UI built with Astro pages and shared design tokens
- Local JSON content for the public site
- Express + SQLite CMS for reservations and role requests
- SEO-oriented metadata and structured data
- Deployment target aligned with Vercel
- Optional Docker workflows for local/staging parity

---

## Quick Start

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts:
- Astro on `http://localhost:4321`
- Parcial API on `http://localhost:3001`

Then open:
- `http://localhost:4321`
- `http://localhost:4321/admin/login`
- `http://localhost:4321/admin/signup`
- `http://localhost:4321/admin`

If you only want one side:
- `pnpm dev:web` for Astro only
- `pnpm parcial:dev` for the API only

---

## Repository Scope

This repository contains the public website plus the integrated admin/CMS module.

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
