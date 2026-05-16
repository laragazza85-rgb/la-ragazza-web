# Modulo CMS Parcial (UI + API)

Implementacion para convertir el frontend estatico en una aplicacion funcional de gestion de reservas, con UI admin en Astro y backend API en Express + Supabase.

## 1) Estructura

```text
src/
  pages/admin/
    index.astro
    login.astro
    signup.astro
    reservas.astro
    solicitudes.astro
  layouts/
    AdminLayout.astro
  components/ui/
    AdminHeader.astro
  styles/
    admin.css

public/
  admin/
    auth.js
    common.js
    home.js
    nav.js
    bookings.js
    requests.js

parcial/
  api/
    src/
      app.mjs
      server.mjs
      bootstrap.mjs
      config/
      lib/
      middleware/
      repositories/
      routes/
      services/
      utils/
    tests/
      api.test.mjs
```

## 2) Variables de entorno API

```bash
PARCIAL_PORT=3001
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=development
```

> La autenticacion se gestiona con Supabase Auth desde el navegador. La API solo consume el JWT del usuario para hablar con Supabase y aplicar RLS.

## 3) Endpoints

### Bookings
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `PATCH /api/bookings/:id/status` (solo admin)

### Role Requests
- `POST /api/role-requests`
- `GET /api/role-requests`
- `GET /api/role-requests/:id`
- `PUT /api/role-requests/:id`
- `DELETE /api/role-requests/:id`
- `PATCH /api/role-requests/:id/status` (solo admin)

> La API responde `405 Method Not Allowed` en metodos no soportados para rutas expuestas.

### UI Astro
- `GET /admin/login`
- `GET /admin/signup`
- `GET /admin`
- `GET /admin/reservas`
- `GET /admin/solicitudes`

## 4) Reglas de negocio

- Supabase Auth maneja signup/login/logout.
- La API usa el JWT del usuario para consultar Supabase con RLS.
- `profiles` extiende `auth.users` y guarda `email` + `role`.
- Reservas usan `booking_time` como `TIMESTAMPTZ` y exponen `fecha`/`hora` en el contrato del panel.
- Usuario normal solo ve/modifica/elimina sus reservas.
- Staff y admin pueden ver el panel de reservas de otros usuarios; solo admin gestiona solicitudes de rol de terceros.
- Solicitudes de rol tienen `requested_role`, `justification` y `status`.
- Las políticas RLS son la fuente principal de autorización.

## 5) Ejecutar local

En una terminal:

```bash
pnpm parcial:dev
```

En otra terminal:

```bash
pnpm dev
```

Abrir:
- `http://localhost:4321/admin/login`
- `http://localhost:4321/admin/signup`
- `http://localhost:4321/admin`

> `astro.config.mjs` incluye proxy dev `/api -> http://localhost:3001` para consumir la API sin CORS manual.

## 6) Probar API

```bash
pnpm parcial:test
```

Incluye pruebas de humo sobre el arranque de la API, `401` sin bearer token y manejo base de rutas protegidas.
