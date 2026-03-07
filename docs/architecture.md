# Architecture Guide

Technical architecture for `la-ragazza-web`.

Use this document to understand how routing, data, components, SEO, and rendering work together.

---

## 1) Stack and Runtime Model

- Framework: Astro 5
- Styling: Tailwind CSS v4 (`@tailwindcss/vite`)
- Build output: static site (`astro build`)
- Locales: `es` and `en`
- Content source: local JSON files in `src/data`

The project is static-first: route HTML is generated at build time and served as static assets.

---

## 2) Project Structure (Architecture View)

- `src/pages` - route entrypoints
- `src/layouts` - global page shell
- `src/components/ui` - reusable UI parts (header, footer, cards)
- `src/components/sections` - section-level page blocks
- `src/data` - locale content and reviews data
- `src/i18n` - translation dictionary + helpers
- `src/utils` - SEO, formatting, data conversion helpers
- `public` - static public files

---

## 3) Routing and i18n Behavior

### Astro i18n config

`astro.config.mjs` configures:

- `defaultLocale: 'es'`
- `locales: ['es', 'en']`
- `routing.prefixDefaultLocale: false`

### Route files

Main localized pages are under `src/pages/[lang]`:

- `index.astro`
- `about.astro`
- `menu.astro`
- `gallery.astro`

Each uses `getStaticPaths()` to build both locales.

### Root (`/`) behavior

There are three root redirect layers:

1. `vercel.json` permanent redirect `/ -> /es/`
2. `src/pages/index.astro` static fallback redirect
3. `middleware.ts` language-based redirect logic

This works but is partially redundant by design.

---

## 4) Rendering and Data Flow

1. Build process resolves localized static paths.
2. Each page imports locale-specific data (`src/data/es/*.json`, `src/data/en/*.json`).
3. Page composes section components.
4. `src/layouts/Layout.astro` injects metadata, links, and shared UI.
5. Astro emits static output into `dist/`.

---

## 5) Layout System

`src/layouts/Layout.astro` is the global shell and contains:

- global stylesheet import,
- `<Header />` inclusion,
- canonical/hreflang/x-default handling,
- Open Graph and Twitter metadata,
- Restaurant JSON-LD injection,
- font loading strategy,
- analytics snippets,
- reveal animation observer for `.reveal` elements.

---

## 6) Component Architecture

### UI components (`src/components/ui`)

- `Header.astro` - locale navigation, mobile menu script, reservation CTA
- `LanguageSwitcher.astro` - locale path switch
- `Footer.astro` - localized footer + year
- `MenuCard.astro` - menu item visual contract
- `GalleryItem.astro` - image/video media card
- `ReviewCard.astro` - single review slide

### Section components (`src/components/sections`)

- `Hero.astro` - top hero per locale
- `MenuSection.astro` - category renderer
- `Reviews.astro` - review carousel and CTA
- `Contact.astro` - location/family/WhatsApp/social block

---

## 7) Content Architecture

### Locale content

- Spanish: `src/data/es`
- English: `src/data/en`

Files per locale:

- `hero.json`
- `about.json`
- `menu.json`
- `gallery.json`
- `contact.json`
- `labels.json`

### Reviews content

- Runtime source: `src/data/reviews/reviews.json`
- Editable/import source: `src/data/reviews/reviews_spreadsheet - reviews.csv`

---

## 8) SEO Architecture

SEO logic is centralized in `src/utils/seo.ts` and consumed by `Layout.astro`.

Implemented concerns:

- canonical URL generation,
- `hreflang` alternates,
- `x-default` URL,
- structured data (`Restaurant` schema),
- social metadata (OG + Twitter).

Additional SEO assets:

- `src/pages/robots.txt.ts`
- sitemap generation via `@astrojs/sitemap`
- `PUBLIC_SITE_URL` in `astro.config.mjs`

---

## 9) Styling Architecture

`src/styles/global.css` defines:

- Tailwind v4 entry,
- custom design tokens via `@theme`,
- global body baseline,
- mobile header override.

Typography is built around Cinzel and Lora.
Brand palette is mapped to `ragazza-*` custom color tokens.

---

## 10) Infrastructure Architecture (Local/Prod-like)

- `Dockerfile` - multi-stage build: dependencies, Astro build, Nginx runtime
- `docker/nginx.conf` - static file serving + `/healthz`
- `docker-compose.dev.yml` - hot reload dev workflow
- `docker-compose.prod.yml` - prod-like local runtime
- `Makefile` - command wrappers

This container architecture is mainly for local/staging parity; Vercel deploys are source-driven.

---

## 11) Technical Caveats

Observed caveats in current codebase:

- About page contains empty image `src` placeholders.
- Footer text includes `Restaurate` (likely typo).
- `src/utils/assets.ts` contains placeholder logic not used by current menu rendering.
- Sauce option values differ between `src/types/menu.ts` and English menu data (`red/white` vs Spanish enum values).
- Root redirect logic is duplicated across config/page/middleware.

---

## 12) Related Docs

- Project overview: `README.md`
- Developer operations and workflows: `docs/development.md`

