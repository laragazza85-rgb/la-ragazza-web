# Hardening web: inyeccion SQL y XSS

Este documento explica, con evidencia de codigo, como La Ragazza Web maneja dos riesgos obligatorios del hardening web:

- Prevencion de inyeccion SQL mediante consultas parametrizadas o su equivalente en Supabase.
- Proteccion XSS mediante validacion de entrada, rechazo de markup peligroso y escape antes de renderizar.

La aplicacion usa Astro para el sitio y el panel admin, Express para la API del modulo Parcial, Supabase Auth para autenticacion y Supabase/Postgres como base de datos.

## 1. Prevencion de inyeccion SQL

### Riesgo que se controla

La inyeccion SQL ocurre cuando una aplicacion concatena entrada del usuario dentro de una consulta SQL textual. Por ejemplo, un patron inseguro seria construir una consulta asi:

```js
`SELECT * FROM bookings WHERE id = '${req.params.id}'`
```

Si el valor viene del usuario, ese string puede alterar la semantica del SQL. La defensa clasica es usar sentencias preparadas, donde la consulta y los valores viajan separados.

### Enfoque usado por este proyecto

Este backend no usa SQL manual ni un driver directo con `prepare()`, porque la capa de acceso a datos esta hecha con el cliente oficial de Supabase. En este contexto, el equivalente practico a una sentencia preparada es usar el Supabase Query Builder:

- `.from("tabla")`
- `.select(...)`
- `.insert({...})`
- `.update({...})`
- `.delete()`
- `.eq("columna", valor)`
- `.in("columna", valores)`

Los valores no se concatenan dentro de strings SQL escritos por la aplicacion. Se pasan como parametros a la API de Supabase/PostgREST, y Supabase/Postgres se encargan de ejecutar la operacion sin que el usuario pueda convertir su entrada en SQL arbitrario.

### Evidencia en el codigo

Archivos principales:

- `parcial/api/src/repositories/bookingRepository.mjs`
- `parcial/api/src/repositories/roleRequestRepository.mjs`
- `parcial/api/src/lib/supabase.mjs`

Ejemplos reales del patron seguro:

```js
supabase
  .from("bookings")
  .insert({
    user_id: userId,
    client_name: nombreCliente,
    booking_time: bookingTime,
    party_size: numeroPersonas,
    comments: comentarios,
    status
  })
  .select(BOOKING_SELECT)
  .single();
```

```js
supabase
  .from("bookings")
  .select(BOOKING_SELECT)
  .eq("user_id", userId)
  .order("booking_time", { ascending: true });
```

```js
supabase
  .from("role_change_requests")
  .update({ requested_role: requestedRole, justification })
  .eq("id", id)
  .select(REQUEST_SELECT)
  .single();
```

En esos ejemplos, `userId`, `nombreCliente`, `comentarios`, `requestedRole`, `justification` e `id` pueden venir de un flujo de usuario, pero no se interpolan dentro de SQL textual.

### Validacion antes de consultar

La proteccion contra inyeccion SQL no reemplaza la validacion de dominio. Por eso, antes de llamar a los repositorios, los servicios normalizan y validan el payload.

Archivos principales:

- `parcial/api/src/services/bookingService.mjs`
- `parcial/api/src/services/roleRequestService.mjs`

Reservas:

- Convierte `numero_personas` a numero.
- Convierte `fecha` + `hora` en `bookingTime`.
- Rechaza reservas sin nombre, fecha u hora.
- Rechaza `numero_personas` no entero o menor/equal a cero.
- Rechaza comentarios demasiado largos.
- Rechaza fechas invalidas o reservas en el pasado.
- Rechaza HTML markup en `nombre_cliente` y `comentarios`.

Solicitudes de rol:

- Normaliza `requested_role` a minusculas.
- Rechaza roles fuera del conjunto permitido: `customer`, `staff`, `admin`.
- Rechaza justificaciones vacias, muy cortas o demasiado largas.
- Rechaza HTML markup en `justification`.

### Capas adicionales

Ademas del query builder, Supabase/Postgres aplica Row Level Security (RLS). Esto no es una defensa contra SQL injection por si sola, pero reduce impacto: incluso una consulta valida se ejecuta bajo las politicas del usuario autenticado.

Flujo resumido:

1. El admin inicia sesion con Supabase Auth.
2. El navegador envia `Authorization: Bearer <access_token>` a la API.
3. `requireAuth` valida el token y crea un cliente Supabase con ese contexto.
4. El servicio valida el payload.
5. El repositorio ejecuta una consulta con Query Builder.
6. Supabase aplica RLS sobre la operacion.

### Como auditar que se cumple

Comandos utiles:

```bash
rg -n "query\\(|execute\\(|raw\\(|sql`|SELECT|INSERT|UPDATE|DELETE" parcial/api/src
```

El resultado esperado es que no existan consultas SQL crudas construidas por la aplicacion. Los accesos deben pasar por repositorios con Supabase Query Builder.

Tambien se puede ejecutar:

```bash
pnpm parcial:test
```

La suite valida el comportamiento base de la API y las defensas XSS agregadas.

## 2. Proteccion XSS

### Riesgo que se controla

XSS ocurre cuando datos controlados por el usuario llegan al navegador y se interpretan como HTML o JavaScript. Por ejemplo, si un usuario guarda este comentario:

```html
<script>alert(1)</script>
```

y luego el panel lo inserta con `innerHTML` sin escape, el navegador podria ejecutarlo.

### Estrategia usada

El proyecto usa defensa en dos puntos:

1. **Validacion de entrada en backend:** campos libres no pueden contener `<` ni `>`, lo que bloquea etiquetas HTML antes de persistirlas.
2. **Escape de salida en frontend:** cualquier dato dinamico que se renderiza en una plantilla HTML pasa por `escapeHtml()`.

Esto es intencionalmente redundante. Si un dato viejo ya existe en la base o entra por otro canal, el escape de salida sigue protegiendo el navegador.

### Validacion de entrada en backend

Archivo principal:

- `parcial/api/src/utils/xss.mjs`

La utilidad central es:

```js
export function assertNoHtmlMarkup(fields) {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (HTML_MARKUP_PATTERN.test(String(value ?? ""))) {
      throw new HttpError(400, `${fieldName} no puede contener etiquetas HTML.`);
    }
  }
}
```

Esta funcion rechaza campos que contengan caracteres de markup HTML:

- `<`
- `>`

Se aplica en:

- `parcial/api/src/services/bookingService.mjs`
- `parcial/api/src/services/roleRequestService.mjs`

Campos protegidos:

- `nombre_cliente`
- `comentarios`
- `justification`

Ejemplo de payload rechazado en reservas:

```json
{
  "nombre_cliente": "<img src=x onerror=alert(1)>",
  "fecha": "2099-01-01",
  "hora": "19:30",
  "numero_personas": 2,
  "comentarios": "Mesa tranquila"
}
```

Ejemplo de payload rechazado en solicitudes:

```json
{
  "requested_role": "staff",
  "justification": "Necesito acceso <script>alert(1)</script>"
}
```

### Escape de salida en el admin

Archivo principal:

- `public/admin/common.js`

La funcion `escapeHtml()` convierte caracteres especiales en entidades HTML:

```js
export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

Esto hace que una entrada como:

```html
<img src=x onerror="alert(1)">
```

se renderice como texto:

```html
&lt;img src=x onerror=&quot;alert(1)&quot;&gt;
```

El navegador ya no la interpreta como una etiqueta, sino como contenido textual.

### Donde se aplica el escape

Reservas:

- `public/admin/bookings.js`

Campos escapados:

- `booking.id`
- `booking.nombre_cliente`
- `booking.fecha`
- `booking.hora`
- `booking.comentarios`
- `booking.status_name`

Solicitudes:

- `public/admin/requests.js`

Campos escapados:

- `request.id`
- `request.requester_email`
- `request.requested_role`
- `request.justification`
- `request.status`

El patron es:

```js
`<td>${escapeHtml(valorDinamico)}</td>`
```

Los mensajes de estado usan `textContent`, no `innerHTML`, mediante `showMessage()` en `public/admin/common.js`. Asignar texto con `textContent` no ejecuta HTML.

### Uso controlado de innerHTML

El admin todavia usa `innerHTML` para construir filas de tabla y para iconos SVG hardcodeados. Esto no es automaticamente inseguro si se cumplen estas reglas:

- La estructura HTML viene del codigo del sistema.
- Todo campo de usuario dentro de esa estructura pasa por `escapeHtml()`.
- Los mensajes simples usan `textContent`.
- Los valores de formularios se asignan con `.value`, no con HTML.

Ejemplos seguros:

```js
form.comentarios.value = item.comentarios ?? "";
```

```js
showMessage(statusElement, error.message, true);
```

El primer ejemplo asigna valor a un control de formulario. El segundo termina en `textContent`.

### Pruebas automatizadas

Archivo:

- `parcial/api/tests/xss.test.mjs`

Casos cubiertos:

- Rechazo de HTML markup en `nombre_cliente`.
- Rechazo de HTML markup en `comentarios`.
- Rechazo de HTML markup en `justification`.
- Verificacion de que `escapeHtml()` codifica texto peligroso antes del render.

Comando:

```bash
pnpm parcial:test
```

Resultado esperado:

- La suite debe pasar.
- Deben aparecer los tests de XSS junto con los tests base de API.

## 3. Estado actual de cumplimiento

### Requisito: prevencion de inyecciones SQL

Estado: **cumple**.

Motivos:

- No hay SQL crudo construido con entrada de usuario en `parcial/api/src`.
- La capa de repositorios usa Supabase Query Builder.
- La capa de servicios valida y normaliza antes de consultar.
- RLS limita el alcance de las operaciones en la base.

### Requisito: proteccion XSS

Estado: **cumple con defensa en capas**.

Motivos:

- El backend rechaza HTML markup en campos libres persistentes.
- El frontend admin escapa datos dinamicos antes de insertarlos en plantillas HTML.
- Los mensajes simples usan `textContent`.
- Los formularios asignan datos con `.value`.
- Hay pruebas automatizadas para entrada maliciosa y escape de salida.

## 4. Archivos que se deben mostrar como evidencia

SQL injection:

- `parcial/api/src/repositories/bookingRepository.mjs`
- `parcial/api/src/repositories/roleRequestRepository.mjs`
- `parcial/api/src/lib/supabase.mjs`

Validacion y XSS backend:

- `parcial/api/src/utils/xss.mjs`
- `parcial/api/src/services/bookingService.mjs`
- `parcial/api/src/services/roleRequestService.mjs`

Escape XSS frontend:

- `public/admin/common.js`
- `public/admin/bookings.js`
- `public/admin/requests.js`
- `public/admin/entityCrudPage.js`

Pruebas:

- `parcial/api/tests/api.test.mjs`
- `parcial/api/tests/xss.test.mjs`

## 5. Resumen para sustentacion

La aplicacion evita inyeccion SQL porque no construye SQL manualmente con datos del usuario. Todas las operaciones pasan por el Query Builder de Supabase, que separa estructura de consulta y valores, equivalente al objetivo de las sentencias preparadas en este stack.

La aplicacion evita XSS combinando validacion de entrada y escape de salida. El backend rechaza etiquetas HTML en campos libres antes de persistirlas, y el admin convierte caracteres peligrosos en entidades HTML antes de renderizar cualquier dato dinamico. Esto protege tanto datos nuevos como datos existentes que pudieran venir de otro canal.
