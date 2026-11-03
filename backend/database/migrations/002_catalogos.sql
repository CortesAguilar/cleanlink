-- 002_catalogos.sql
-- Catálogos globales (los comparten todos los tenants). Solo los CONFIRMADOS;
-- los propuestos esperan decisión del equipo (ver ANOTACIONES-BACKEND.txt).

MERGE core.Servicio AS t
USING (VALUES
  ('profunda', N'Limpieza profunda',     N'Limpieza profunda', 'residencial'),
  ('casas',    N'Casas y departamentos', N'Casas',             'residencial'),
  ('oficinas', N'Oficinas y locales',    N'Oficinas',          'comercial'),
  ('ventanas', N'Ventanas y fachadas',   N'Ventanas',          'ambas'),
  ('mudanzas', N'Mudanzas',              N'Mudanzas',          'residencial')
) AS s (id, nombre, nombre_corto, categoria)
ON t.id = s.id
WHEN MATCHED THEN UPDATE SET nombre = s.nombre, nombre_corto = s.nombre_corto, categoria = s.categoria
WHEN NOT MATCHED THEN INSERT (id, nombre, nombre_corto, categoria) VALUES (s.id, s.nombre, s.nombre_corto, s.categoria);
GO

MERGE core.TipoEspacio AS t
USING (VALUES
  ('casa',         N'Casa'),
  ('departamento', N'Departamento'),
  ('oficina',      N'Oficina'),
  ('local',        N'Local comercial'),
  ('escuela',      N'Escuela o universidad'),
  ('consultorio',  N'Consultorio o clínica'),
  ('bodega',       N'Bodega o nave industrial'),
  ('vacacional',   N'Renta vacacional')
) AS s (id, nombre)
ON t.id = s.id
WHEN MATCHED THEN UPDATE SET nombre = s.nombre
WHEN NOT MATCHED THEN INSERT (id, nombre) VALUES (s.id, s.nombre);
GO
