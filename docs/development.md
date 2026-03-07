# Development Guide

Practical guide to run, edit, build, and troubleshoot `la-ragazza-web`.

---

## 1) Prerequisites

- Node.js 20+
- pnpm
- Optional: Docker or Podman with compose compatibility

---

## 2) Local Setup (Native)

Install dependencies and run dev server:

```bash
pnpm install
pnpm dev
```

Open:

- `http://localhost:4321`

Build and preview locally:

```bash
pnpm build
pnpm preview
```

---

## 3) Local Setup (Containerized)

### Development container (hot reload)

```bash
make dev
```

Useful commands:

```bash
make logs
make ps
make shell
make down
```

### Production-like container

```bash
make prod-up
make prod-ps
make prod-logs
make prod-down
```

If `8080` is occupied:

```bash
PORT=8081 make prod-up
```

---

## 4) How to Edit Content

Most business content is JSON in `src/data`.

### Locale folders

- `src/data/es`
- `src/data/en`

Keep structure aligned across both locales.

### File responsibilities

- `hero.json` - home subtitle, hero CTAs, card labels
- `about.json` - about/story page text blocks
- `menu.json` - categories, dishes, prices, notes
- `gallery.json` - gallery header + media entries
- `contact.json` - location/family/WhatsApp text
- `labels.json` - small reusable labels

### Menu update checklist

1. Edit both locale files (`es` and `en`).
2. Keep stable `id` values for categories/items.
3. Ensure each item has `id`, `name`, `price`.
4. Validate pages in both languages.

---

## 5) Reviews Update Workflow (CSV -> JSON)

Reviews UI reads:

- `src/data/reviews/reviews.json`

Source spreadsheet is:

- `src/data/reviews/reviews_spreadsheet - reviews.csv`

Conversion logic exists in:

- `src/utils/csv_to_json.ts`
- `src/utils/normalizeReviews.ts`

Suggested process:

1. Update CSV file.
2. Run the conversion script with your TS runtime setup.
3. Verify generated JSON and site output.
4. Rebuild before committing.

---

## 6) Environment Variables

Template:

- `.env.example`

Primary variable currently used:

- `PUBLIC_SITE_URL`

Used by Astro config and SEO URL generation for canonical/sitemap consistency.

---

## 7) Build and Release Workflow

### Local validation

```bash
pnpm build
```

Optional prod parity check:

```bash
make prod-up
```

### Vercel behavior

Current setup is source-driven in Vercel.
Docker files are for local/staging parity and alternative hosting workflows.

---

## 8) Troubleshooting

### Port already in use (prod container)

Symptom: bind error on `0.0.0.0:8080`.

Use another port:

```bash
PORT=8081 make prod-up
```

### Podman + Fedora permission issue (`EACCES` on `/app/...`)

`docker-compose.dev.yml` uses `.:/app:Z` to support SELinux relabeling.

### Compose command not found or Docker alias behavior

On Fedora, `docker` can be backed by Podman (`podman-docker`).
Use `make` targets to avoid command drift.

---

## 9) Suggested Daily Workflow

1. Start dev environment (`pnpm dev` or `make dev`).
2. Edit locale data and/or components.
3. Validate critical routes:
   - `/es/`
   - `/en/`
   - `/es/menu`
   - `/en/menu`
   - `/es/gallery`
   - `/en/gallery`
4. Run production build check.
5. Optionally run prod-like container check.
6. Commit with scoped message.

---

## 10) Useful File References

### Tooling and infra

- `Makefile`
- `Dockerfile`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `docker/nginx.conf`

### Core app

- `src/layouts/Layout.astro`
- `src/pages/[lang]/index.astro`
- `src/pages/[lang]/menu.astro`
- `src/pages/[lang]/gallery.astro`
- `src/pages/[lang]/about.astro`

### Data

- `src/data/es/*`
- `src/data/en/*`
- `src/data/reviews/reviews.json`

---

## 11) Related Docs

- Project overview: `README.md`
- Technical architecture: `docs/architecture.md`

