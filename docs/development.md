# Development Guide

Practical guide to run, edit, build, and troubleshoot `la-ragazza-web`.

---

## 1) Scope

This repository contains **only the public Astro frontend**.

The custom admin dashboard, API routes, middleware for admin hostnames, PostgreSQL access, and Express backend were moved to a separate repository: `la-ragazza-admin`.

That means this repo no longer contains or requires:

- `src/pages/admin`
- `src/pages/api`
- `src/server`
- admin-specific middleware
- embedded Express server
- `DATABASE_URL`

---

## 2) Prerequisites

- Node.js 20+
- pnpm
- Optional: Docker or Podman with compose compatibility

---

## 3) Local Setup (Native)

Install dependencies and run the public website:

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

## 4) Local Setup (Containerized)

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

## 5) How to Edit Content

Most business content is stored as static JSON in `src/data`.

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
- `labels.json` - reusable interface labels

### Menu update checklist

1. Edit both locale files (`es` and `en`).
2. Keep stable `id` values for categories and items.
3. Ensure each item has `id`, `name`, and `price`.
4. Validate pages in both languages.

---

## 6) Reviews Update Workflow (CSV -> JSON)

Reviews UI reads:

- `src/data/reviews/reviews.json`

Source spreadsheet is:

- `src/data/reviews/reviews_spreadsheet - reviews.csv`

Conversion logic exists in:

- `src/utils/csv_to_json.ts`
- `src/utils/normalizeReviews.ts`

Suggested process:

1. Update the CSV file.
2. Run your conversion flow or update the JSON directly if that is your current workflow.
3. Verify generated JSON and site output.
4. Rebuild before committing.

---

## 7) Environment Variables

Template:

- `.env.example`

Primary variable used by this frontend:

- `PUBLIC_SITE_URL`

This is used for sitemap generation and absolute canonical URLs.

---

## 8) Build and Release Workflow

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

## 9) Troubleshooting

### `curl: (56) Recv failure: Connection reset by peer` on `localhost:4321`

Usually means the dev server is not actually running on `4321` (or another process holds that port).

Check listeners:

```bash
ss -ltnp | grep ':4321\|:8080'
```

Stop the stack and restart clean:

```bash
make down
make dev
```

If needed, stop orphan local processes:

```bash
pkill -f "astro dev"
```

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

## 10) Suggested Daily Workflow

1. Start dev environment (`pnpm dev` or `make dev`).
2. Edit locale data and/or components.
3. Validate critical routes:
   - `/es/`
   - `/en/`
   - `/es/menu`
   - `/en/menu`
   - `/es/gallery`
   - `/en/gallery`
4. Run a production build check.
5. Optionally run a prod-like container check.
6. Commit with a scoped message.

---

## 11) Useful File References

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

## 12) Related Docs

- Project overview: `README.md`
- Technical architecture: `docs/architecture.md`
- Website request/data flow: `docs/website-workflow.md`

---

## 13) Admin / Backend Note

If you need to work on the CMS, custom admin UI, Astro admin API routes, middleware for admin hostnames, or PostgreSQL-backed content management, use the separate repository:

- `la-ragazza-admin`
