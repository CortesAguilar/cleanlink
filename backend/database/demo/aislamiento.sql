-- Demo de aislamiento en la base de datos (ejecutar en VS Code con la extensión
-- SQL Server, conectado a la BD cleanlink). Cada bloque se puede correr por separado.

-- 1. Los tenants: cada uno con su esquema y su usuario de BD.
SELECT t.id, t.nombre, t.tipo, t.schema_name, t.db_user
FROM core.Tenant t
ORDER BY t.id;

-- Los esquemas existen de verdad en SQL Server:
SELECT name AS esquema, USER_NAME(principal_id) AS dueno
FROM sys.schemas
WHERE name LIKE 'tnt[_]%';

-- Permisos de cada usuario de tenant: solo sobre SU esquema (+ lectura de catálogos vía rol_tenant).
SELECT USER_NAME(p.grantee_principal_id) AS usuario, p.permission_name, p.class_desc,
       COALESCE(SCHEMA_NAME(p.major_id), OBJECT_SCHEMA_NAME(p.major_id) + '.' + OBJECT_NAME(p.major_id)) AS sobre
FROM sys.database_permissions p
WHERE USER_NAME(p.grantee_principal_id) LIKE 'usr[_]%' OR USER_NAME(p.grantee_principal_id) = 'rol_tenant'
ORDER BY usuario, sobre, p.permission_name;
GO

-- 2. Así consulta la API: con la identidad del tenant. Las tablas van SIN esquema
--    y SQL Server las resuelve en el esquema por defecto del usuario.
EXECUTE AS USER = 'usr_brillo_total';
SELECT USER_NAME() AS usuario, SCHEMA_NAME() AS esquema_por_defecto;
SELECT * FROM ProveedorServicio;
REVERT;
GO

-- 3. El mismo código, con otro tenant, ve OTROS datos.
EXECUTE AS USER = 'usr_cuadrilla_hernandez';
SELECT USER_NAME() AS usuario, SCHEMA_NAME() AS esquema_por_defecto;
SELECT * FROM ProveedorServicio;
REVERT;
GO

-- 4. Intento de leer datos de OTRO tenant: SQL Server lo niega (error 229).
EXECUTE AS USER = 'usr_cuadrilla_hernandez';
BEGIN TRY
  SELECT * FROM tnt_brillo_total.ProveedorServicio;
END TRY
BEGIN CATCH
  SELECT ERROR_NUMBER() AS error, ERROR_MESSAGE() AS mensaje;
END CATCH;
REVERT;
GO

-- 5. Tampoco puede leer las cuentas ni el registro de tenants (esquema core).
EXECUTE AS USER = 'usr_cuadrilla_hernandez';
BEGIN TRY
  SELECT * FROM core.Usuario;
END TRY
BEGIN CATCH
  SELECT ERROR_NUMBER() AS error, ERROR_MESSAGE() AS mensaje;
END CATCH;
REVERT;
GO
