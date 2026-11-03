-- 003_tenants.sql
-- Multi-tenencia por esquema: cada tenant tiene
--   * un esquema propio  tnt_<slug>   con las tablas de la plantilla, y
--   * un usuario de BD   usr_<slug>   (WITHOUT LOGIN) con permisos SOLO sobre
--     ese esquema y lectura de catálogos (rol_tenant).
-- La API ejecuta las consultas del tenant con EXECUTE AS USER = usr_<slug>,
-- así que SQL Server rechaza (error 229) cualquier acceso a otro esquema.

-- Plantilla del esquema de un tenant. Es idempotente: cuando se agregue una
-- tabla nueva, una migración la vuelve a ejecutar para cada tenant existente.
CREATE OR ALTER PROCEDURE core.sp_aplicar_plantilla_tenant
  @schema_name SYSNAME
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @schema_name NOT LIKE 'tnt[_]%' OR @schema_name COLLATE Latin1_General_BIN LIKE '%[^a-z0-9_]%'
    THROW 50001, 'Nombre de esquema inválido.', 1;

  DECLARE @s NVARCHAR(260) = QUOTENAME(@schema_name);
  DECLARE @sql NVARCHAR(MAX);

  IF SCHEMA_ID(@schema_name) IS NULL
  BEGIN
    -- El dueño es dbo, no el tenant: su usuario no puede alterar permisos ni objetos.
    SET @sql = N'CREATE SCHEMA ' + @s + N' AUTHORIZATION dbo';
    EXEC sp_executesql @sql;
  END

  -- Datos de operación del tenant: personas, horario y m² máximos (1 sola fila).
  IF OBJECT_ID(@schema_name + N'.Perfil') IS NULL
  BEGIN
    SET @sql = N'CREATE TABLE ' + @s + N'.Perfil (
      id            TINYINT      NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      personas_num  INT          NULL CHECK (personas_num > 0),
      personas_min  INT          NULL CHECK (personas_min > 0),
      personas_max  INT          NULL,
      horario_modo  VARCHAR(12)  NOT NULL DEFAULT ''sin-definir''
                    CHECK (horario_modo IN (''siempre'', ''definido'', ''sin-definir'')),
      horario_dias  VARCHAR(27)  NULL,
      hora_inicio   CHAR(5)      NULL,
      hora_fin      CHAR(5)      NULL,
      m2_max        INT          NOT NULL CHECK (m2_max > 0),
      fecha_actualizacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
      CHECK (personas_max >= personas_min)
    )';
    EXEC sp_executesql @sql;
  END

  -- Servicios que ofrece, precio FINAL por m² (IVA incluido) y destacados (máx. 2, lo valida la API).
  IF OBJECT_ID(@schema_name + N'.ProveedorServicio') IS NULL
  BEGIN
    SET @sql = N'CREATE TABLE ' + @s + N'.ProveedorServicio (
      servicio_id VARCHAR(20)   NOT NULL PRIMARY KEY REFERENCES core.Servicio(id),
      precio_m2   DECIMAL(10,2) NOT NULL CHECK (precio_m2 > 0),
      destacado   BIT           NOT NULL DEFAULT 0
    )';
    EXEC sp_executesql @sql;
  END

  -- Ajuste por tipo de espacio (1.0 por defecto: sin fila = 1.0).
  IF OBJECT_ID(@schema_name + N'.AjusteEspacio') IS NULL
  BEGIN
    SET @sql = N'CREATE TABLE ' + @s + N'.AjusteEspacio (
      tipo_espacio_id VARCHAR(20)  NOT NULL PRIMARY KEY REFERENCES core.TipoEspacio(id),
      factor          DECIMAL(4,2) NOT NULL DEFAULT 1.0 CHECK (factor > 0 AND factor <= 10)
    )';
    EXEC sp_executesql @sql;
  END
END
GO

-- Alta de tenant: cuenta + registro + esquema + usuario de BD + permisos.
-- Todo en una transacción: si algo falla no quedan esquemas ni usuarios huérfanos.
CREATE OR ALTER PROCEDURE core.sp_crear_tenant
  @nombre        NVARCHAR(120),
  @correo        NVARCHAR(254),
  @password_hash VARCHAR(100),
  @tipo          VARCHAR(10),
  @ciudad        NVARCHAR(80),
  @estado        NVARCHAR(80),
  @presentacion  NVARCHAR(1000) = NULL,
  @slug          VARCHAR(30),
  @tenant_id     INT     OUTPUT,
  @usuario_id    INT     OUTPUT,
  @schema_name   SYSNAME OUTPUT,
  @db_user       SYSNAME OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @slug IS NULL OR @slug = '' OR @slug COLLATE Latin1_General_BIN LIKE '%[^a-z0-9_]%'
    THROW 50001, 'Identificador de tenant inválido.', 1;

  -- El nombre lo genera el servidor; si ya existe se le agrega un número.
  DECLARE @n INT = 1;
  SET @schema_name = 'tnt_' + @slug;
  WHILE SCHEMA_ID(@schema_name) IS NOT NULL
     OR DATABASE_PRINCIPAL_ID('usr_' + SUBSTRING(@schema_name, 5, 128)) IS NOT NULL
     OR EXISTS (SELECT 1 FROM core.Tenant WHERE schema_name = @schema_name)
  BEGIN
    SET @n += 1;
    SET @schema_name = 'tnt_' + @slug + '_' + CAST(@n AS VARCHAR(10));
  END
  SET @db_user = 'usr_' + SUBSTRING(@schema_name, 5, 128);

  BEGIN TRANSACTION;

  INSERT core.Usuario (nombre, correo, password_hash, tipo_cuenta)
  VALUES (@nombre, @correo, @password_hash, 'proveedor');
  SET @usuario_id = SCOPE_IDENTITY();

  INSERT core.Tenant (usuario_id, nombre, tipo, ciudad, estado, presentacion, schema_name, db_user)
  VALUES (@usuario_id, @nombre, @tipo, @ciudad, @estado, @presentacion, @schema_name, @db_user);
  SET @tenant_id = SCOPE_IDENTITY();

  EXEC core.sp_aplicar_plantilla_tenant @schema_name;

  DECLARE @s NVARCHAR(260) = QUOTENAME(@schema_name);
  DECLARE @u NVARCHAR(260) = QUOTENAME(@db_user);
  DECLARE @sql NVARCHAR(MAX) =
    N'CREATE USER ' + @u + N' WITHOUT LOGIN WITH DEFAULT_SCHEMA = ' + @s + N';' +
    N'GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::' + @s + N' TO ' + @u + N';' +
    N'ALTER ROLE rol_tenant ADD MEMBER ' + @u + N';';
  EXEC sp_executesql @sql;

  COMMIT TRANSACTION;
END
GO

-- Baja de tenant (para pruebas y para reiniciar la demo): borra tablas,
-- esquema, usuario de BD y sus registros en core.
CREATE OR ALTER PROCEDURE core.sp_eliminar_tenant
  @tenant_id INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @schema_name SYSNAME, @db_user SYSNAME, @usuario_id INT;
  SELECT @schema_name = schema_name, @db_user = db_user, @usuario_id = usuario_id
  FROM core.Tenant WHERE id = @tenant_id;
  IF @schema_name IS NULL RETURN;

  BEGIN TRANSACTION;

  DECLARE @sql NVARCHAR(MAX) = N'';
  SELECT @sql += N'DROP TABLE ' + QUOTENAME(@schema_name) + N'.' + QUOTENAME(name) + N';'
  FROM sys.tables WHERE schema_id = SCHEMA_ID(@schema_name);
  IF SCHEMA_ID(@schema_name) IS NOT NULL SET @sql += N'DROP SCHEMA ' + QUOTENAME(@schema_name) + N';';
  IF DATABASE_PRINCIPAL_ID(@db_user) IS NOT NULL SET @sql += N'DROP USER ' + QUOTENAME(@db_user) + N';';
  EXEC sp_executesql @sql;

  DELETE core.Tenant WHERE id = @tenant_id;
  DELETE core.Usuario WHERE id = @usuario_id;

  COMMIT TRANSACTION;
END
GO
