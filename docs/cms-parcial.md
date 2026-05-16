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
   - Express + Supabase + reglas de negocio.
   - Rutas protegidas en `/api/*`.
   - Contrato HTTP con `405 Method Not Allowed` para metodos no soportados.

3. **Modelo Supabase/Postgres**
   - `profiles` extendiendo `auth.users`.
   - `bookings` con `booking_time`, `party_size`, `comments`, `status`.
   - `role_change_requests` con `requested_role`, `justification`, `status`.

4. **Seguridad base correcta**
   - Supabase Auth para login/signup/logout.
   - JWT del usuario enviado a la API en el header `Authorization`.
   - RLS como capa principal de autorizacion.
   - Validacion extra por rol y propiedad del recurso donde aporta UX.

5. **Reglas clave**
   - Usuario normal: solo sus reservas y sus solicitudes de rol.
   - Staff y admin: acceso ampliado a reservas.
   - Admin: cambio de estado de solicitudes de rol.
   - Solicitudes no activas no son editables/eliminables por usuario.

## Flujo funcional

- `GET /admin/login` y `GET /admin/signup` para autenticacion separada.
- `GET /admin` como centro de control (saludo por email y accesos rapidos).
- `GET /admin/reservas` con CRUD y cambio de estado por admin.
- `GET /admin/solicitudes` con CRUD por usuario (solo activas) + `PATCH status` por admin.

## Integracion local

- Levantar API: `pnpm parcial:dev`.
- Levantar Astro: `pnpm dev`.
- Proxy dev configurado en `astro.config.mjs` para `/api` -> `http://localhost:3001`.
