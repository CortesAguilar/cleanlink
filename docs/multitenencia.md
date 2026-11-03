# Multi-tenencia en CleanLink

## Qué es un tenant

Cada **proveedor** (persona, equipo o empresa) es un tenant. Tiene **una sola cuenta** y una vista de gestión donde solo ve y edita **sus** datos: servicios y destacados, precios por m², ajustes por tipo de espacio, m² máximos, personas y horario.

Los clientes no son tenants (se aíslan por usuario) y el admin de plataforma (equipo de CleanLink) es el único acceso que cruzaría tenants, y solo para reportes.

## Estrategia: un esquema por tenant en una base de datos compartida

```
Base de datos cleanlink (SQL Server / Azure SQL)
│
├── core                          ← compartido, dueño dbo
│   ├── Usuario                   cuentas (contraseña con bcrypt)
│   ├── Tenant                    registro: nombre, tipo, ciudad, schema_name, db_user
│   ├── Servicio, TipoEspacio     catálogos globales (lectura para todos los tenants)
│   └── sp_crear_tenant, sp_aplicar_plantilla_tenant, sp_eliminar_tenant
│
├── tnt_brillo_total              ← tenant A   (usuario de BD: usr_brillo_total)
│   ├── Perfil                    personas, horario, m² máximos
│   ├── ProveedorServicio         servicios, precio por m², destacados
│   └── AjusteEspacio             factor por tipo de espacio
│
├── tnt_cuadrilla_hernandez       ← tenant B   (usr_cuadrilla_hernandez)
└── tnt_<nuevo>                   ← se crea al dar de alta un tenant
```

Todos los esquemas de tenant tienen **las mismas tablas** (una plantilla). El código de la API es el mismo para todos: escribe `SELECT * FROM ProveedorServicio` **sin esquema**, y SQL Server lo resuelve en el esquema del tenant que está consultando.

### ¿Por qué esquema por tenant y no una columna `tenant_id`?

| | Esquema por tenant (elegido) | Tablas compartidas + `tenant_id` |
|---|---|---|
| Aislamiento | Lo impone SQL Server con **permisos**: el usuario de A no tiene permisos sobre el esquema de B | Depende de que cada consulta lleve el `WHERE tenant_id` correcto (o de RLS) |
| Si el código tiene un error | La BD responde **error 229 (permiso denegado)** | Un `WHERE` olvidado filtra datos de otros tenants |
| Ver los datos de un tenant | Un esquema = todos sus datos | Filtrar en cada tabla |
| Costo | Más objetos; un cambio de tabla se aplica a cada esquema | Una sola tabla por entidad |

Para el número de proveedores de CleanLink, el costo extra es bajo y el aislamiento queda garantizado por la base de datos, no solo por la aplicación.

## Mecanismos de seguridad (3 capas)

### 1. El tenant sale del token, nunca de la petición

- Contraseñas con **bcrypt**; al iniciar sesión se firma un **JWT de 7 días** con `sub` (usuario), `tipoCuenta` y `tenantId`. Código: [`backend/src/auth.js`](../backend/src/auth.js).
- El middleware `requireTenant` verifica la firma, comprueba en `core.Tenant` que el tenant **pertenece a esa cuenta** y obtiene su `schema_name` y `db_user`.
- Las rutas de gestión (`/api/tenant/...`) **no tienen ningún parámetro** para elegir tenant. Si alguien manda `?tenantId=1` o `"tenantId": 1` en el body, se ignora. Código: [`backend/src/routes.js`](../backend/src/routes.js).

### 2. La base de datos impone el aislamiento con permisos

Al dar de alta un tenant, `core.sp_crear_tenant` ([`003_tenants.sql`](../backend/database/migrations/003_tenants.sql)) hace, en **una transacción**:

1. Inserta la cuenta (`core.Usuario`) y el registro (`core.Tenant`).
2. `CREATE SCHEMA tnt_<slug> AUTHORIZATION dbo` y crea las tablas de la plantilla.
3. `CREATE USER usr_<slug> WITHOUT LOGIN WITH DEFAULT_SCHEMA = tnt_<slug>` → un usuario que **no puede iniciar sesión** por sí mismo.
4. `GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::tnt_<slug>` → permisos **solo sobre su esquema**.
5. Lo agrega a `rol_tenant` → `SELECT` en los catálogos globales y nada más de `core`.

El esquema es propiedad de `dbo`, no del tenant: su usuario no puede alterar tablas ni dar permisos.

Cada consulta de un tenant se ejecuta con su identidad ([`backend/src/db.js`](../backend/src/db.js), `tenantDb` / `withTenant`):

```sql
EXECUTE AS USER = 'usr_<tenant>';
BEGIN TRY   EXEC sp_executesql <consulta>, <parámetros>   END TRY
BEGIN CATCH REVERT; THROW; END CATCH;
REVERT;
```

Así, aunque una consulta apuntara por error a `tnt_otro.ProveedorServicio`, SQL Server responde **error 229: permiso denegado**.

### 3. Las conexiones nunca quedan con la identidad de un tenant

La API usa un pool de conexiones compartido. Las pruebas automatizadas detectaron que, si una consulta falla de cierta forma, SQL Server puede abortarla antes del `REVERT` y la conexión volvería al pool "siendo" el tenant. Se cubrió con:

- La consulta va en un `sp_executesql` anidado dentro de `TRY/CATCH`, así cualquier error (incluso de compilación) pasa por el `REVERT`.
- Una consulta de tenant no puede contener `EXECUTE AS` / `REVERT` / `SETUSER`.
- **Red de seguridad del pool** (`SafePool`): antes de prestar una conexión verifica con `SELECT USER_NAME()` que no tenga identidad `usr_*`; si la tiene, la descarta.

Los identificadores (`tnt_*`, `usr_*`) los genera el servidor a partir del nombre (sin acentos ni símbolos), se validan con una restricción `CHECK` y una expresión regular, y se usan con `QUOTENAME`.

## Admin de plataforma (equipo de CleanLink)

Es el **único acceso que cruza tenants**, y con el mínimo necesario:

- Entra con una cuenta `tipo_cuenta = 'admin'` creada directo en la base (semilla), nunca desde el registro.
- `GET /api/admin/tenants` exige sesión de admin, confirmada en `core.Usuario` (`requireAdmin` en [`auth.js`](../backend/src/auth.js)).
- Ve el **registro de tenants** de `core`: nombre, tipo, ubicación, correo, si está verificado, fecha de alta, su esquema y su usuario de BD (y cuántas tablas tiene el esquema, un metadato de SQL Server).
- **No** ve los datos privados: la consulta no usa `EXECUTE AS` ni toca ningún `tnt_*`, y el admin no puede usar `/api/tenant` (403).

Pantalla: `/admin` ([`admin-view.tsx`](../frontend/src/components/admin-view.tsx)).

## Verificación de correo

Al dar de alta un tenant se envía un correo de confirmación con **Azure Communication Services Email** (dominio administrado por Azure, remitente `DoNotReply@…azurecomm.net`):

1. `POST /api/tenants` crea el tenant (queda **Sin verificar**) y genera un token aleatorio de 32 bytes. En `core.VerificacionCorreo` solo se guarda su **hash SHA-256**; vence en 24 h y sirve una sola vez.
2. El correo trae el enlace `APP_URL/verificar?token=…`. La página llama a `POST /api/auth/verify-email`, que marca el token como usado y pone `verificado = 1` en la cuenta y en el tenant.
3. Mientras no verifique, el proveedor **sí entra** a su vista, pero ve el aviso "Confirma tu correo" (no puede publicar) y puede **reenviar** el correo (máximo uno por minuto).
4. Si el envío falla, el alta no falla: se puede reenviar desde la vista. Sin `ACS_CONNECTION_STRING` (desarrollo) el enlace se imprime en la consola de la API.

Código: [`verification.js`](../backend/src/verification.js), [`email.js`](../backend/src/email.js).

## Pruebas automatizadas

`npm test` en `backend/` corre dos archivos.

[`backend/test/aislamiento.test.js`](../backend/test/aislamiento.test.js) crea dos tenants temporales y comprueba que:

1. Cada alta crea un esquema y un usuario de BD distintos.
2. Cada tenant ve solo sus datos y SQL Server responde con su identidad.
3. Un `tenantId` en la URL o en el body se ignora (lectura y escritura).
4. La BD niega a C leer/escribir el esquema de A y las tablas de `core` (**error 229**).
5. C no puede hacerse pasar por el usuario de BD de A (error 15517).
6. Tras errores, todas las conexiones del pool vuelven a la identidad de la aplicación.
7. Sin token, con token alterado, con token de otra cuenta o con cuenta de cliente → 401/403.

[`backend/test/admin-verificacion.test.js`](../backend/test/admin-verificacion.test.js) comprueba que solo el admin ve la lista de tenants (401/403 para los demás), que el admin no entra a los datos privados de un tenant, que un enlace inventado no verifica, que el reenvío respeta el minuto de espera y que un enlace válido verifica la cuenta y el tenant una sola vez.

## Guion de la demo

Preparación (una vez): `npm run db:setup` y `npm run db:seed` en `backend/`. Para repetir la demo desde cero: `npm run db:seed -- --reset` (borra los tenants que no son de la semilla).

Cuentas de la semilla (las 3 usan la contraseña de `SEED_PASSWORD` en `backend/.env`, que no se sube al repositorio):

- Tenant A: `brillo.total@demo.cleanlink.mx` (empresa, verificado)
- Tenant B: `cuadrilla.hernandez@demo.cleanlink.mx` (equipo, verificado)
- Admin de plataforma: `admin@demo.cleanlink.mx`

1. **Tenant A**: `/login` → `/mi-negocio`. Mostrar sus servicios y el recuadro "Tu espacio en la base de datos" (esquema `tnt_brillo_total`, SQL Server respondió como `usr_brillo_total`).
2. **Tenant B**: cerrar sesión, entrar con B → datos distintos, esquema `tnt_cuadrilla_hernandez`.
3. **Admin**: entrar con el admin → `/admin` lista A y B con su esquema y usuario de BD. Explicar que ve el registro, no los datos privados.
4. **Alta en vivo del tenant C** (puede hacerla el profesor con su correo): "Crear cuenta" → `/registro/proveedor` → llenar → entra a su vista **Sin verificar**, con el aviso. Le llega el correo de Azure (revisar spam) → "Confirmar mi correo" → `/verificar` → la vista pasa a **Verificado**. En `/admin` aparece C con su esquema nuevo. Agregarle un servicio o cambiar un precio y guardar.
5. **Intento de cruzar tenants**:
   - API: con la sesión de C, pedir `GET /api/tenant?tenantId=<id de A>` → responde con C.
   - BD: correr [`backend/database/demo/aislamiento.sql`](../backend/database/demo/aislamiento.sql) → esquemas y permisos de cada tenant, y **error 229** al leer el esquema de otro.
   - `npm test` → las 14 pruebas en verde.
6. **Código**: `sp_crear_tenant` (alta y permisos), `tenantDb` en `db.js` (EXECUTE AS), `requireTenant` / `requireAdmin` en `auth.js` (tenant desde el token, admin con acceso mínimo), `verification.js` (token con hash).

## Pendiente / evolución

- **Cambios de tablas**: `core.sp_aplicar_plantilla_tenant` es idempotente; una migración nueva agrega la tabla a la plantilla y la ejecuta para cada tenant de `core.Tenant`.
- **Escaparate público** (búsqueda y perfiles): leerá lo publicable de todos los tenants desde una vista o tabla en `core`, de solo lectura, sin dar a nadie permisos sobre los esquemas de tenant.
- **Admin de plataforma**: los reportes vivirán en `core` y se agregarán a su panel, con permisos solo para el admin.
- **Mínimo privilegio de la app**: hoy la API se conecta como `sa` (local) / admin del servidor (Azure). Lo ideal es un usuario propio con permisos sobre `core`, `IMPERSONATE` sobre los `usr_*` y permiso para crear esquemas.
