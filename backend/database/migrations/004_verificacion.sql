-- 004_verificacion.sql
-- Tokens de verificación de correo. Solo se guarda el hash (SHA-256) del
-- token: quien lea la tabla no puede armar un enlace válido.

IF OBJECT_ID('core.VerificacionCorreo') IS NULL
CREATE TABLE core.VerificacionCorreo (
  id             INT IDENTITY PRIMARY KEY,
  usuario_id     INT          NOT NULL CONSTRAINT FK_Verificacion_Usuario REFERENCES core.Usuario(id) ON DELETE CASCADE,
  token_hash     CHAR(64)     NOT NULL CONSTRAINT UQ_Verificacion_token UNIQUE,
  expira         DATETIME2(0) NOT NULL,
  usado_en       DATETIME2(0) NULL,
  fecha_creacion DATETIME2(0) NOT NULL CONSTRAINT DF_Verificacion_fecha DEFAULT SYSUTCDATETIME()
);
GO
