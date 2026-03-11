# Express Admin Backend

Backend API for the custom admin dashboard.

## Endpoints

- `GET /health` -> Express service health
- `GET /admin/health` -> Admin route health
- `GET /admin/db-health` -> PostgreSQL connectivity health
- `GET /admin/home-translations` -> List home translations (`home_page_translation`)
- `GET /admin/home-translations/:locale` -> Get one locale (`es` | `en`)
- `PUT /admin/home-translations/:locale` -> Update one locale
- `GET /admin/about-translations` -> List about translations (`about_page_translation`)
- `GET /admin/about-translations/:locale` -> Get one locale (`es` | `en`) with people/paragraphs
- `PUT /admin/about-translations/:locale` -> Update page + people/paragraphs for one locale

## Local Run

```bash
pnpm dev:api
```

Default port: `4001` (override with `ADMIN_API_PORT`).

## Environment

- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_API_PORT`: API port (optional)

