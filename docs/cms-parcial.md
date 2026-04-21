# Arquitectura CMS Parcial

Este modulo mantiene separacion entre UI y API, sin modificar la navegacion publica del sitio.

## Objetivo

Agregar autenticacion y gestion de reservas/solicitudes de rol con estilo visual consistente al proyecto Astro principal.

## Decisiones de arquitectura

1. **UI en Astro (mismo look and feel del sitio)**
   - Rutas: `/admin/login`, `/admin/signup`, `/admin`, `/admin/reservas`, `/admin/solicitudes`.
   - Layout dedicado: `src/layouts/AdminLayout.astro`.
   - Estilos: `src/styles/global.css` + `src/styles/admin.css`.
   - Scripts publicos desacoplados por vista (`auth.js`, `home.js`, `bookings.js`, `requests.js`, `nav.js`).

2. **API aislada en `parcial/api`**
   - Express + SQLite + sesiones + reglas de negocio.
   - Rutas protegidas en `/api/*`.
   - Contrato HTTP con `405 Method Not Allowed` para metodos no soportados.

3. **Modelo SQLite**
   - `user_roles`, `users`, `booking_status`, `bookings`.
   - `bookings.comentarios` para notas de ocasion especial.
   - `role_change_requests` con `justification`, `status`, `is_active`.

4. **Seguridad base correcta**
   - Password hash con bcrypt (`bcryptjs`).
   - Sesiones con cookie `HttpOnly`, `SameSite=Lax`, `Secure` en produccion.
   - Regeneracion de sesion al hacer login/signup.
   - Autorizacion por rol y por propiedad del recurso.

5. **Reglas clave**
   - Usuario normal: solo sus reservas y sus solicitudes de rol.
   - Admin: todas las reservas/solicitudes y cambio de estados.
   - Solicitudes no activas (`is_active = 0`) no son editables/eliminables por usuario.

## Flujo funcional

- `GET /admin/login` y `GET /admin/signup` para autenticacion separada.
- `GET /admin` como centro de control (saludo por email y accesos rapidos).
- `GET /admin/reservas` con CRUD y cambio de estado por admin.
- `GET /admin/solicitudes` con CRUD por usuario (solo activas) + `PATCH status` por admin.

## Integracion local

- Levantar API: `pnpm parcial:dev`.
- Levantar Astro: `pnpm dev`.
- Proxy dev configurado en `astro.config.mjs` para `/api` -> `http://localhost:3001`.
