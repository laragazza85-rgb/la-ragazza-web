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

If you also want the standalone Express backend at the same time, use:

```bash
pnpm dev:full
```

Or run it separately:

```bash
pnpm dev:api
```

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

Primary variables:

- `PUBLIC_SITE_URL`
- `DATABASE_URL` (native local run)
- `DATABASE_URL_DOCKER` (containerized run via `make dev`)

Used by Astro config, API routes, and DB connectivity.

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

### `curl: (56) Recv failure: Connection reset by peer` on `localhost:4321`

Usually means the dev server is not actually running on `4321` (or another process holds that port).

Check listeners:

```bash
ss -ltnp | grep ':4321\|:4322\|:4001'
```

Stop the stack and restart clean:

```bash
make down
make dev
```

If needed, stop orphan local processes:

```bash
pkill -f "astro dev"
pkill -f "server/express/index.ts"
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

### `connect ECONNREFUSED 169.254.x.x:5432`

That means the app container is trying to reach PostgreSQL on an unreachable host alias.

Use the bundled dev database service:

```bash
make down
make dev
```

Then verify both services are healthy:

```bash
docker compose -f docker-compose.dev.yml ps
```

`web` should connect to `db:5432` by default in containerized mode.

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

---

## 12) Admin Dashboard (Section 1 Foundation)

### What was added

- SSR mode with Node adapter in `astro.config.mjs`.
- Host-aware middleware in `src/middleware.ts`.
- Admin UI shell in `src/layouts/AdminLayout.astro` and `src/pages/admin/index.astro`.
- Astro API endpoint in `src/pages/api/admin/health.ts`.
- Express backend in `server/express/index.ts` and `server/express/routes/admin.ts`.
- Shared DB health logic in `src/server/admin/health.ts` and `src/server/db/client.ts`.

### Local host mapping

Add this line to `/etc/hosts`:

```bash
127.0.0.1 admin.localhost
```

Then run:

```bash
pnpm install
pnpm dev
```

Open:

- `http://admin.localhost:4321/admin`
- `http://localhost:4321/admin`

### Required env vars

Use `.env.example` as template:

- `DATABASE_URL`
- `ADMIN_API_PORT`
- `PUBLIC_SITE_URL`

### Production note

For production, point `admin.la-ragazza-web.com` DNS to the same SSR service and route hostnames at the reverse proxy/load balancer level.

---

## 13) Admin Dashboard (Section 2: Home CRUD)

### New Astro API routes

- `GET /api/admin/home`
- `GET /api/admin/home/:locale`
- `PUT /api/admin/home/:locale`

These routes connect to PostgreSQL through `src/server/admin/homePageTranslations.ts`.

### New admin pages

- `src/pages/admin/home/index.astro` (listado por idioma)
- `src/pages/admin/home/[locale].astro` (formulario de edicion)

### Quick test flow

1. Open `http://localhost:4321/admin/home`.
2. Enter locale editor (`es` or `en`).
3. Update one field and save.
4. Confirm success message and refresh page.

---

## 14) Admin Dashboard (Section 3: About CRUD)

### New Astro API routes

- `GET /api/admin/about`
- `GET /api/admin/about/:locale`
- `PUT /api/admin/about/:locale`

These routes connect to PostgreSQL through `src/server/admin/aboutTranslations.ts`.

### New admin pages

- `src/pages/admin/about/index.astro` (listado por idioma)
- `src/pages/admin/about/[locale].astro` (edicion de cabecera, filosofia, personas y parrafos)

### Quick test flow

1. Open `http://localhost:4321/admin/about`.
2. Enter locale editor (`es` or `en`).
3. Update one field in page and one paragraph in a person.
4. Save and refresh `/es/about` or `/en/about` to verify content.

---

## 15) Admin Dashboard (Section 4: Contact CRUD)

### New Astro API routes

- `GET /api/admin/contact`
- `GET /api/admin/contact/:locale`
- `PUT /api/admin/contact/:locale`

These routes connect to PostgreSQL through `src/server/admin/contactProfile.ts`.

### New admin pages

- `src/pages/admin/contact/index.astro` (listado por idioma)
- `src/pages/admin/contact/[locale].astro` (edicion de perfil global + traducciones)

### Quick test flow

1. Open `http://localhost:4321/admin/contact`.
2. Enter locale editor (`es` or `en`).
3. Update one global field (`streetAddress`) and one translated field (`uiTitle`).
4. Save and refresh `/es/` or `/en/` to verify Contact section changes.
