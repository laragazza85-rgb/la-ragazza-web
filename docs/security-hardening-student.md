# Seguridad y endurecimiento del backend y del panel

Este documento resume la lógica de seguridad aplicada en el módulo Parcial de La Ragazza. La intención es explicar por qué las decisiones reducen el riesgo, y no solo listar cambios de código.

## 1. Sentencias preparadas y protección frente a inyecciones SQL

En este proyecto el backend no usa PDO ni MySQLi porque la base real es Supabase/Postgres. El equivalente funcional de una sentencia preparada es usar el cliente oficial de Supabase con su query builder, que construye consultas parametrizadas sin concatenar SQL manual en la capa de aplicación.

La evidencia principal está en estas piezas:

- [parcial/api/src/repositories/bookingRepository.mjs](/home/juanglc/la-ragazza-web/parcial/api/src/repositories/bookingRepository.mjs)
- [parcial/api/src/repositories/roleRequestRepository.mjs](/home/juanglc/la-ragazza-web/parcial/api/src/repositories/roleRequestRepository.mjs)
- [parcial/api/src/lib/supabase.mjs](/home/juanglc/la-ragazza-web/parcial/api/src/lib/supabase.mjs)

La lógica es la siguiente:

1. El repositorio recibe valores ya normalizados desde la capa de servicio.
2. Los filtros y escrituras se hacen con llamadas tipo `.eq()`, `.in()`, `.insert()` y `.update()`.
3. No se interpolan strings SQL en el código de negocio.
4. El acceso a datos queda además limitado por RLS en Supabase, por lo que incluso una consulta válida solo devuelve o modifica lo que la política permite.

Esto es importante porque la protección no depende de confiar en que el usuario mande valores “buenos”, sino en que el backend nunca construye SQL textual con entrada directa.

## 2. Validación antes de persistir

La seguridad no depende solo del repositorio. Antes de llegar a la base de datos, los servicios validan los campos que vienen del usuario:

- [parcial/api/src/services/bookingService.mjs](/home/juanglc/la-ragazza-web/parcial/api/src/services/bookingService.mjs)
- [parcial/api/src/services/roleRequestService.mjs](/home/juanglc/la-ragazza-web/parcial/api/src/services/roleRequestService.mjs)

Ahí se comprueban longitud, formato, pertenencia a catálogos permitidos y reglas de negocio como “no crear reservas en el pasado” o “solo roles válidos”.

La idea es simple:

- si el dato no cumple el dominio esperado, se rechaza antes de escribir;
- si el dato sí cumple, entra a la base por una ruta parametrizada;
- si la base también lo limita con constraints y RLS, la defensa queda en capas.

## 3. Encabezados de seguridad

El backend activa [helmet](/home/juanglc/la-ragazza-web/parcial/api/src/app.mjs), lo que centraliza varios encabezados de seguridad HTTP sin tener que escribirlos uno por uno.

La lectura correcta de esta decisión es:

- el API no expone HTML público, así que no necesita una política CSP de páginas complejas;
- aun así, sí conviene que el servidor aplique cabeceras defensivas estándar;
- Helmet reduce la superficie de ataques relacionados con tipos de contenido, framing y metadatos del navegador.

En esta implementación, CSP está desactivado en el middleware porque la API devuelve JSON y no actúa como sitio HTML principal. La defensa relevante aquí es el conjunto de encabezados estándar de Helmet aplicado en un único punto de entrada.

## 4. Protección XSS

La protección XSS se aborda en dos niveles:

### En el admin

Las utilidades comunes del panel están en [public/admin/common.js](/home/juanglc/la-ragazza-web/public/admin/common.js). Allí ya existe `escapeHtml()`, que convierte caracteres especiales a entidades HTML antes de inyectarlos en plantillas.

Los renders de tablas en:

- [public/admin/entityCrudPage.js](/home/juanglc/la-ragazza-web/public/admin/entityCrudPage.js)
- [public/admin/requests.js](/home/juanglc/la-ragazza-web/public/admin/requests.js)
- [public/admin/bookings.js](/home/juanglc/la-ragazza-web/public/admin/bookings.js)

siguen la lógica de escapar todo dato dinámico que se inserta dentro de `innerHTML`. La regla mental es esta: `innerHTML` solo debe recibir estructura controlada por el sistema; cualquier campo que venga de usuario o de la base debe escaparse o renderizarse con nodos DOM normales.

### En el frontend público

El home público tenía un caso sensible en [src/pages/[lang]/index.astro](/home/juanglc/la-ragazza-web/src/pages/[lang]/index.astro), donde el título se estaba inyectando como HTML. Ese patrón es más riesgoso porque abre la puerta a que contenido editorial se convierta en markup ejecutable.

La solución lógica es tratar ese contenido como texto, y solo permitir una variante explícita y controlada del formato si realmente hace falta, por ejemplo saltos de línea previamente definidos por el sistema.

## 5. Conclusión

La seguridad aquí no se apoya en una sola técnica. El diseño combina:

- consultas parametrizadas con Supabase;
- validación de entrada en servicios;
- restricciones y RLS en la base;
- encabezados de seguridad con Helmet;
- escape explícito de HTML en el panel;
- eliminación de inserciones HTML innecesarias en el frontend público.

Esa combinación es la que realmente reduce el riesgo de inyección SQL y XSS en este proyecto.
