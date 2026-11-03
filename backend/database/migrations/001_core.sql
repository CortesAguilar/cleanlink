-- 001_core.sql
-- Esquema compartido "core": cuentas, registro de tenants y catálogos globales.
-- Los usuarios de BD de los tenants NO tienen permisos aquí, salvo SELECT en
-- los catálogos (ver rol_tenant al final).

IF SCHEMA_ID('core') IS NULL EXEC('CREATE SCHEMA core AUTHORIZATION dbo');
GO

IF OBJECT_ID('core.Usuario') IS NULL
CREATE TABLE core.Usuario (
  id             INT IDENTITY PRIMARY KEY,
  nombre         NVARCHAR(120) NOT NULL,
  correo         NVARCHAR(254) NOT NULL CONSTRAINT UQ_Usuario_correo UNIQUE,
  password_hash  VARCHAR(100)  NOT NULL,
  tipo_cuenta    VARCHAR(10)   NOT NULL
                 CONSTRAINT CK_Usuario_tipo CHECK (tipo_cuenta IN ('cliente', 'proveedor', 'admin')),
  verificado     BIT           NOT NULL CONSTRAINT DF_Usuario_verificado DEFAULT 0,
  fecha_creacion DATETIME2(0)  NOT NULL CONSTRAINT DF_Usuario_fecha DEFAULT SYSUTCDATETIME()
);
GO

-- Registro de tenants. Cada proveedor (persona, equipo o empresa) es un tenant
-- y tiene su propio esquema (schema_name) y su propio usuario de BD (db_user).
IF OBJECT_ID('core.Tenant') IS NULL
CREATE TABLE core.Tenant (
  id             INT IDENTITY PRIMARY KEY,
  usuario_id     INT           NOT NULL CONSTRAINT UQ_Tenant_usuario UNIQUE
                 CONSTRAINT FK_Tenant_Usuario REFERENCES core.Usuario(id),
  nombre         NVARCHAR(120) NOT NULL,
  tipo           VARCHAR(10)   NOT NULL
                 CONSTRAINT CK_Tenant_tipo CHECK (tipo IN ('persona', 'equipo', 'empresa')),
  ciudad         NVARCHAR(80)  NOT NULL,
  estado         NVARCHAR(80)  NOT NULL,
  presentacion   NVARCHAR(1000) NULL,
  schema_name    SYSNAME       NOT NULL CONSTRAINT UQ_Tenant_schema UNIQUE,
  db_user        SYSNAME       NOT NULL CONSTRAINT UQ_Tenant_dbuser UNIQUE,
  verificado     BIT           NOT NULL CONSTRAINT DF_Tenant_verificado DEFAULT 0,
  fecha_creacion DATETIME2(0)  NOT NULL CONSTRAINT DF_Tenant_fecha DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_Tenant_schema CHECK (schema_name LIKE 'tnt[_]%' AND schema_name COLLATE Latin1_General_BIN NOT LIKE '%[^a-z0-9_]%'),
  CONSTRAINT CK_Tenant_dbuser CHECK (db_user LIKE 'usr[_]%' AND db_user COLLATE Latin1_General_BIN NOT LIKE '%[^a-z0-9_]%')
);
GO

IF OBJECT_ID('core.Servicio') IS NULL
CREATE TABLE core.Servicio (
  id           VARCHAR(20)   PRIMARY KEY,
  nombre       NVARCHAR(80)  NOT NULL,
  nombre_corto NVARCHAR(40)  NOT NULL,
  categoria    VARCHAR(12)   NOT NULL
               CONSTRAINT CK_Servicio_categoria CHECK (categoria IN ('residencial', 'comercial', 'ambas'))
);
GO

IF OBJECT_ID('core.TipoEspacio') IS NULL
CREATE TABLE core.TipoEspacio (
  id     VARCHAR(20)  PRIMARY KEY,
  nombre NVARCHAR(60) NOT NULL
);
GO

-- Rol común a todos los usuarios de tenant: solo lectura de catálogos globales.
IF DATABASE_PRINCIPAL_ID('rol_tenant') IS NULL CREATE ROLE rol_tenant AUTHORIZATION dbo;
GO
GRANT SELECT ON core.Servicio TO rol_tenant;
GRANT SELECT ON core.TipoEspacio TO rol_tenant;
GO
