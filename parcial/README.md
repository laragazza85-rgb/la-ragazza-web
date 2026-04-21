# Modulo CMS Parcial (UI + API)

Implementacion para convertir el frontend estatico en una aplicacion funcional de gestion de reservas, con UI admin en Astro y backend API en Express + SQLite.

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
    db/                # Se crea automaticamente (parcial.db)
    src/
      app.mjs
      server.mjs
      bootstrap.mjs
      config/
      db/
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
SESSION_SECRET=un-secreto-seguro
PARCIAL_DB_PATH=/ruta/absoluta/parcial.db
ADMIN_EMAIL=admin@laragazza.local
ADMIN_PASSWORD=Admin1234!
NODE_ENV=development
```

> En produccion (`NODE_ENV=production`) la cookie de sesion se emite con `Secure=true`, por lo que debe existir HTTPS en el proxy/reverse proxy.

## 3) Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

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

- Passwords hasheadas con algoritmo bcrypt (`bcryptjs`).
- Sesiones por cookie (`express-session`) con `HttpOnly` + `SameSite` + `Secure` en produccion.
- Login y registro por email (sin username).
- Un usuario tiene un solo rol (`users.role_id`).
- Reservas permiten `comentarios` (ocasion especial, alergias, notas).
- Usuario normal solo ve/modifica/elimina sus reservas.
- Admin ve todas y puede cambiar estado (`pending`, `confirmed`, `cancelled`, `completed`).
- Solicitudes de rol tienen `justification` + `status` + `is_active`.
- Usuario solo puede editar/eliminar solicitudes activas.
- Admin puede cambiar estado de solicitud (`active`, `approved`, `rejected`, `cancelled`).

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

Incluye pruebas de:
- bloqueo sin sesion,
- aislamiento de reservas por usuario,
- permisos admin para cambiar estado,
- comentarios en reservas,
- ciclo de vida de solicitudes de rol activas/no activas,
- cierre de sesion,
- validacion de metodos HTTP no permitidos.
