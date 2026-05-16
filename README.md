# La Ragazza Web — Architecture, Security & API Reference

This README documents the full architecture, security hardening, API contract and database model for La Ragazza Web. It is intended as a single, authoritative source to (a) generate architecture/security diagrams, (b) drive code reviews, and (c) support audits and student deliverables.

Table of contents
- Project summary
- High-level architecture (components & dataflow)
- Frontend (public site + admin UI)
- Backend API (Parcial module)
- Database schema (Supabase/Postgres) — enums, tables, constraints, triggers, RLS
- Security model (auth, RLS, prepared-statement equivalence, CSP/headers, XSS defenses)
- API reference (endpoints, payloads, responses)
- Developer workflow (run, build, test, env)
- Migration & deployment notes
- Evidence & student checklist (what to show for rubric)
- Diagram guidance (elements to include)
- Next steps & recommendations
- Changelog of security-hardening changes

---------------------------------------------------------------------------
Project summary
---------------------------------------------------------------------------

La Ragazza Web is a bilingual Astro website (Spanish/English) for a family restaurant with:
- Static-first public site built with Astro.
- Admin UI (pages served by Astro) for managing bookings and role requests.
- An isolated “Parcial” API: Express + Supabase (Postgres) used as the application backend.
- Authentication via Supabase Auth (GoTrue).
- Data persisted in Supabase/Postgres with Row Level Security (RLS) policies controlling data access.
- Focus on security: query builder usage (no raw SQL in app code), validation-on-entry, RLS, HTTP security headers (Helmet), and XSS hardening in the admin panel.

Repository layout (high-level)
- `src/` — public site pages, layouts, components, localized JSON content.
- `public/` — static JS used by admin UI (`common.js`, `bookings.js`, `requests.js`, `entityCrudPage.js`, etc.).
- `parcial/api/src/` — Express API server (routes, services, repositories, utils, middleware).
- `docs/` — architecture and development docs, now containing `docs/security-hardening-student.md`.
- `package.json` — project scripts (see Developer workflow section).

---------------------------------------------------------------------------
High-level architecture & dataflow
---------------------------------------------------------------------------

Components
- Public site (Astro): static pages generated at build-time from local JSON content (`src/data/*`). Minimal runtime JS.
- Admin UI (Astro pages under `src/pages/admin`): uses client-side Supabase browser client to authenticate admin users, obtains JWT and calls the Parcial API.
- Parcial API (Express): authoritative app server that consumes user JWTs to create server Supabase clients, enforces business logic and validation, and performs data updates/queries via Supabase query builder.
- Database (Supabase/Postgres): tables `profiles`, `bookings`, `role_change_requests`. RLS policies provide per-row access control.

Request flow
1. Admin logs in via Supabase Auth (browser).
2. Browser obtains an access token and sets up `window.__adminSupabase` (admin client).
3. Admin UI calls `fetch('/api/...')` endpoints from `public/admin/*.js`; `common.js` attaches the Bearer token to requests.
4. Parcial API resolves Bearer token and creates `createServerSupabaseClient(accessToken)` to query the DB under the context of the user (RLS applies).
5. For privileged actions (applying roles), Parcial can use `createServiceSupabaseClient()` with `SUPABASE_SERVICE_ROLE_KEY` from environment — fallback path is explicit and auditable.

Network diagram (suggested view)
- Client browser (public user / admin) → CDN / static site (Astro) → Admin UI (browser) → Parcial API (Express) → Supabase (Postgres + Auth + Storage)
- Include arrows for JWT flow and for service-key privileged operations.

---------------------------------------------------------------------------
Frontend: public site & admin UI
---------------------------------------------------------------------------

Public site
- Framework: Astro (server-side build).
- Content: Local JSON files in `src/data/{es,en}`.
- Danger points: previously `set:html` injection on hero title; now replaced by safe text-splitting and explicit `<br />` insertion to avoid direct HTML injection.
- Files of interest:
	- `src/pages/[lang]/index.astro` — hero content; now safe.
	- `src/layouts/Layout.astro` — meta, JSON-LD injection (system-generated JSON-LD only).

Admin UI (client code)
- Browser Supabase client is injected in `src/layouts/AdminLayout.astro` (script defines `window.__adminSupabase`).
- `public/admin/common.js` — helper functions including `escapeHtml()`, `apiRequest()`, `getSession()`, `applyRoleVisibility()`.
- `public/admin/entityCrudPage.js` — generic CRUD renderer originally used `innerHTML`; now uses `replaceChildren()` for empty state and keeps `innerHTML` only for trusted, escaped templates.
- `public/admin/requests.js` and `public/admin/bookings.js` — per-entity render logic. All user-sourced fields used in templates are passed through `escapeHtml()` and dynamic attributes (e.g. `data-id`) are escaped.

XSS mitigations applied
- Avoid `set:html` with untrusted content (public hero title fixed).
- Centralized `escapeHtml()` used for all admin field display.
- Replaced raw `innerHTML` for empty state with DOM API (`createElement`, `textContent`).
- Escaped dynamic attribute values (IDs) before embedding in templates.

---------------------------------------------------------------------------
Backend API: Parcial (Express + Supabase)
---------------------------------------------------------------------------

Overview
- Entry point: `parcial/api/src/server.mjs` → `parcial/api/src/app.mjs`.
- Security middleware:
	- `helmet()` middleware applied in `app.mjs`.
	- `requireAuth` middleware uses `parcial/api/src/lib/supabase.mjs` to validate and translate Bearer token into `req.auth` containing `{ accessToken, supabase, user }`.
- Services and repositories:
	- `parcial/api/src/services/*` — validate and normalize incoming payload (business rules).
	- `parcial/api/src/repositories/*` — talk to Supabase client to perform `.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`, `.in()`. No raw SQL is constructed in application code.

Prepared statements / SQL injection defense
- The app uses Supabase JS SDK query builder exclusively. This provides parameterized queries and prevents string-interpolated SQL at app layer.
- Repositories call patterns: `supabase.from('table').select(...).eq('col', value)` etc.
- Important files: `parcial/api/src/repositories/bookingRepository.mjs`, `parcial/api/src/repositories/roleRequestRepository.mjs`, `parcial/api/src/lib/supabase.mjs`.

Privileged operations
- For actions requiring elevated privileges (e.g., applying an approved role), there is a safe service-client path:
	- `createServiceSupabaseClient()` reads `SUPABASE_SERVICE_ROLE_KEY` from `parcial/api/src/config/env.mjs`.
	- This client is used only in audited places (e.g., `roleRequestRepository.applyApprovedRole()`), not arbitrarily.

Business logic & validation
- Services perform strong validation prior to DB calls:
	- `parcial/api/src/services/bookingService.mjs` — normalizes `fecha`/`hora` into `booking_time`, checks integer `numero_personas`, enforces future time window, comment length limits.
	- `parcial/api/src/services/roleRequestService.mjs` — normalizes and validates `requested_role`, justification length limits and allowed set.
- Repositories expect validated inputs, minimizing need for runtime sanitization.

HTTP security headers
- Helmet is enabled in `parcial/api/src/app.mjs`. CSP is currently disabled in that middleware because the API primarily returns JSON (not HTML). Helmet still sets:
	- `X-DNS-Prefetch-Control`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and others by default.
- For admin HTML pages served by Astro, a stricter CSP could be applied at CDN/nginx edge if desired.

---------------------------------------------------------------------------
Database model (Supabase/Postgres)
---------------------------------------------------------------------------

Design principles
- Use Postgres enums for domain constraints.
- Enforce constraints (length, non-nullability, check constraints) at DB level.
- RLS policies provide row-level authorization; trust but verify via policies.
- Use triggers to maintain `updated_at` timestamps.

Recommended schema (already planned / to apply in Supabase)
- Enums:
	- `booking_status_enum`: ('pending','confirmed','cancelled','completed','no_show')
	- `role_request_status_enum`: ('active','approved','rejected','cancelled')
	- `user_role_enum`: ('customer','staff','admin')

- `profiles` (maps to `auth.users`):
	- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
	- `email TEXT NOT NULL` (email format CHECK)
	- `role user_role_enum NOT NULL DEFAULT 'customer'`
	- `created_at`, `updated_at`

- `bookings`:
	- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
	- `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT`
	- `client_name TEXT NOT NULL`
	- `booking_time TIMESTAMPTZ NOT NULL`
	- `party_size SMALLINT NOT NULL`
	- `comments TEXT DEFAULT ''`
	- `status booking_status_enum NOT NULL DEFAULT 'pending'`
	- `created_at`, `updated_at`
	- Constraints: `check_party_size`, `check_future_booking`, `check_name_length`

- `role_change_requests`:
	- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
	- `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
	- `requested_role user_role_enum NOT NULL`
	- `justification TEXT NOT NULL`
	- `status role_request_status_enum NOT NULL DEFAULT 'active'`
	- Constraints: justification length, unique active requests

Triggers & functions
- `handle_updated_at()` — sets `NEW.updated_at = NOW()` before update.
- `handle_new_user()` — optional trigger on `auth.users` to auto-create a `profiles` entry.
- Use `SECURITY DEFINER` for functions if necessary and carefully audit privileges.

Row Level Security (RLS) — essential policies (examples)
- `profiles`: users can select their own profile; admin/staff have broader view.
- `bookings`:
	- Users can SELECT where `auth.uid() = user_id`.
	- Staff/Admin SELECTs allowed via helper `public.is_staff_or_admin()`.
	- INSERT: `WITH CHECK (auth.uid() = user_id)` so users can only create bookings for themselves.
	- UPDATE: Users can update pending bookings they own; staff/admin can update any booking.
- `role_change_requests`:
	- Users can SELECT/INSERT own requests.
	- Admin can SELECT/UPDATE all requests (policy existence check using `auth.uid()`).

Indexing strategy
- `profiles` index on `LOWER(email)` and `role`.
- `bookings` indexes on `user_id`, composite `(status, booking_time DESC)`, partial index for active bookings `WHERE status IN ('pending','confirmed')`.
- `role_change_requests` index on `status` (active).

---------------------------------------------------------------------------
API reference (Parcial)
---------------------------------------------------------------------------

Base: `/api` (served by `parcial/api/src/app.mjs`)

Authentication:
- All API routes under `/api/*` use `requireAuth` middleware and expect `Authorization: Bearer <access_token>` header set by admin browser client.
- `parcial/api/src/lib/supabase.mjs` resolves token and profile.

Endpoints (summary)
Bookings:
- POST `/api/bookings`
	- Body: { nombre_cliente, fecha, hora, numero_personas, comentarios }
	- Response: { booking }
- GET `/api/bookings` (admin/staff=all; customer=own)
	- Response: { bookings: [...] }
- GET `/api/bookings/:id`
	- Response: { booking }
- PUT `/api/bookings/:id`
	- Body: fields same as create + optionally `status` for staff/admin
	- Response: { booking }
- DELETE `/api/bookings/:id`
	- Response: 204
- PATCH `/api/bookings/:id/status`
	- Body: { status } (staff/admin)
	- Response: { booking }

Role Requests:
- POST `/api/role-requests`
	- Body: { requested_role, justification }
	- Response: { roleRequest }
- GET `/api/role-requests` (admin=all, user=own)
	- Response: { roleRequests: [...] }
- GET `/api/role-requests/:id`
	- Response: { roleRequest }
- PUT `/api/role-requests/:id`
	- Body: { requested_role, justification }
	- Response: { roleRequest }
- DELETE `/api/role-requests/:id`
	- Response: 204
- PATCH `/api/role-requests/:id/status`
	- Body: { status } (admin only) — If approved, repository may call service client to update `profiles.role`.

Error semantics
- Uses `HttpError` wrapper to emit appropriate status codes (401, 403, 404, 409, 400).
- Responses for errors include `{ error: 'message' }` or JSON error from Supabase forwarded if present.

Payload normalization & validation
- Services normalize incoming form values (string trimming, numeric conversion).
- Booking service converts `fecha` + `hora` → `booking_time` (ISO/TIMESTAMPTZ) and validates ranges.
- Role request service enforces justification length and allowed roles.

---------------------------------------------------------------------------
Security & hardening — summary of controls
---------------------------------------------------------------------------

Layered defenses implemented:
1. Authentication & Authorization:
	 - Supabase Auth for login/signup.
	 - JWT passed from browser to API (Bearer token).
	 - `requireAuth` middleware resolves user and profile, and attaches `req.auth` to requests.
2. Row Level Security (RLS):
	 - RLS policies on `profiles`, `bookings`, and `role_change_requests` limit visible/modify-able rows.
3. Input validation:
	 - Strong validation in service layer (`parcial/api/src/services/*`) — length, format, domain checks.
4. Query safety:
	 - Use Supabase JS SDK query builder exclusively in repositories (`.select`, `.insert`, `.update`, `.eq`, `.in`).
	 - No raw SQL string concatenation in application code — equivalent to “prepared statements”.
5. Least privilege for privileged actions:
	 - `createServiceSupabaseClient()` uses service role key only in audited code paths (e.g. updating a user role after request approval).
6. HTTP security headers:
	 - `helmet()` middleware applied for multiple secure headers.
7. XSS controls:
	 - `escapeHtml()` centralized in `public/admin/common.js`.
	 - Avoid `set:html` for untrusted content; replaced the hero `set:html` with safe splitting.
	 - Use DOM APIs instead of `innerHTML` for non-templated content.
8. Logging & monitoring:
	 - Console logs in service/repository important flows. Consider shipping to a log aggregator in production.
9. CI/Dev checks (recommended):
	 - Lint rule or grep check that fails on `innerHTML` usage without escape, or raw SQL in `parcial/api/src/**`.

---------------------------------------------------------------------------
Developer workflow — run, build, test
---------------------------------------------------------------------------

Environment
- Required env variables (local .env):
	- `PARCIAL_PORT=3001`
	- `SUPABASE_URL=https://<project>.supabase.co`
	- `SUPABASE_ANON_KEY=<anon-key>`
	- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>` (only needed if falling back to privileged operations)
	- `NODE_ENV=development`

Install
```bash
pnpm install
```

Dev (both sides)
```bash
# start the API and site with dev flows configured in package.json
pnpm dev
# or separately:
pnpm dev:web      # Astro site only (port 4321)
pnpm parcial:dev  # Parcial API only (port 3001)
```

Build
```bash
pnpm build
```

Run Parcial tests
```bash
pnpm parcial:test
```

Notes
- Dev proxy: `astro.config.mjs` proxies `/api` to `http://localhost:3001` in dev. Use the admin UI at `http://localhost:4321/admin` which will call `/api/*`.

---------------------------------------------------------------------------
Migration & deployment notes
---------------------------------------------------------------------------

Applying the schema to Supabase
- Use the SQL migration fragment provided in the security/migration notes to create enums, tables, triggers, and policies.
- Suggested approach:
	1. Run a SQL migration in Supabase Studio or via `supabase` CLI against your project.
	2. Verify RLS policies are enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
	3. Seed a test user in `auth.users` (or sign up via admin UI) and ensure `profiles` row exists (trigger `handle_new_user()` can help).
	4. Test queries from the browser and API with scope checks.

Deployment
- Static site deploy: Vercel or any static hosting.
- API: can be containerized (Dockerfile present) or run as serverless if adapting Express to serverless environment.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is stored securely (secrets manager or environment variables in the host) and not exposed to client.

---------------------------------------------------------------------------
Evidence & student checklist (for rubric)
---------------------------------------------------------------------------

What to include as proof that the project meets the security requirements (preferred order):
1. Proof of prepared-statement equivalent
	 - Demonstrate repository code using Supabase query builder:
		 - `parcial/api/src/repositories/bookingRepository.mjs` — show `.insert()`/`.update()` and `.eq()` usage.
		 - `parcial/api/src/repositories/roleRequestRepository.mjs` — show `.update(...).eq('id', id)` patterns.
	 - Explain the reasoning: the client binds parameters; no SQL string concatenation occurs.
2. Proof of input validation
	 - Show `parcial/api/src/services/bookingService.mjs` and `roleRequestService.mjs` where inputs are normalized and validated (length, allowed sets).
3. Proof of HTTP headers security
	 - Show `parcial/api/src/app.mjs` where `helmet()` is applied and list which relevant headers it enforces.
4. Proof of XSS mitigations
	 - Show `public/admin/common.js` (`escapeHtml`), and examples in `public/admin/requests.js`, `bookings.js` where `escapeHtml()` is used.
	 - Show the fixed `src/pages/[lang]/index.astro` before/after and explain why `set:html` is unsafe for untrusted content.
5. Demonstration steps
	 - Run `pnpm parcial:test` (backend tests).
	 - Run `pnpm build` and open the built pages to inspect rendered HTML (verify no raw unescaped content).
6. Optional CI checks (recommended to include in rubric)
	 - A CI step that runs a script searching for `innerHTML`/`set:html` or raw SQL keywords in `parcial/api/src/**` and fails the pipeline on matches.

File references you should attach in the student deliverable
- `parcial/api/src/repositories/bookingRepository.mjs`
- `parcial/api/src/repositories/roleRequestRepository.mjs`
- `parcial/api/src/lib/supabase.mjs`
- `parcial/api/src/services/bookingService.mjs`
- `parcial/api/src/services/roleRequestService.mjs`
- `parcial/api/src/app.mjs`
- `public/admin/common.js`
- `public/admin/entityCrudPage.js`
- `public/admin/requests.js`
- `public/admin/bookings.js`
- `src/pages/[lang]/index.astro`
- `docs/security-hardening-student.md` (narrative explanation already added)

---------------------------------------------------------------------------
Diagram guidance (what to draw)
---------------------------------------------------------------------------

At minimum, produce:
1. Component diagram:
	 - Browser (user/admin), CDN/static host, Astro static pages (public), Astro admin pages, Parcial API (Express), Supabase (Auth + Postgres + Storage).
2. Sequence diagram (admin booking flow):
	 - Admin browser → signIn via Supabase → receives JWT → admin UI fetch `/api/bookings` with Bearer → Parcial resolves token, creates server supabase client → applies service logic → DB query executed under RLS → response.
3. Data model ER diagram:
	 - `profiles` (1) — (N) `bookings`
	 - `profiles` (1) — (N) `role_change_requests`
	 - Include key constraints, enums, fields used in policies.
4. Security overlay:
	 - Mark boundaries where RLS applies, where CSP/Helmet applies, and where service-key privileged operations occur.
5. Deployment diagram:
	 - Where secrets live (service role key) (Vercel, container, serverless), and monitoring/logging flows.



---------------------------------------------------------------------------

Install and run:
```bash
pnpm install
pnpm dev         # runs both site + Parcial API (dev/web and parcial:dev are also available)
```

Build & test:
```bash
pnpm build
pnpm parcial:test
```

---------------------------------------------------------------------------
Appendix B — Notes for auditors / reviewers
---------------------------------------------------------------------------

- Look for raw SQL strings in `parcial/api/src/**`. There should be none — repositories use Supabase query builder.
- Check that `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client (only used server-side).
- Check RLS policies in Supabase Studio for `bookings` and `role_change_requests`.
- Review `docs/security-hardening-student.md` for a student-facing narrative explaining the logic and where to show evidence.

---------------------------------------------------------------------------
Contact & references
---------------------------------------------------------------------------

- Code entry points:
	- API: `parcial/api/src/app.mjs`, `parcial/api/src/server.mjs`
	- Repositories: `parcial/api/src/repositories/*`
	- Services: `parcial/api/src/services/*`
	- Admin JS: `public/admin/*.js`
	- Student doc: `docs/security-hardening-student.md`

If you want, I can:
- Replace the repository `README.md` with this content (I can create or patch that file).
- Produce a Mermaid/PlantUML diagram skeleton for each recommended diagram (component, sequence, ER).
- Add the CI checks that fail on `innerHTML`/raw SQL usage and show a minimal GitHub Actions workflow.
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
