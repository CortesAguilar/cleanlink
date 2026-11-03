// Alta, lectura y edición de los datos de un tenant.
// Lo usan las rutas de la API y el seed.
const { sql, getPool, tenantDb, withTenant, inTransaction } = require('./db');

const KINDS = ['persona', 'equipo', 'empresa'];
const WEEKDAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const HOUR = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FEATURED = 2;

class ValidationError extends Error {
  constructor(errors) {
    super('Revisa los datos enviados');
    this.status = 400;
    this.errors = errors;
  }
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

function text(value, max) {
  return typeof value === 'string' && value.trim() && value.trim().length <= max ? value.trim() : null;
}

function int(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function number(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function validateTeam(body, kind, errors) {
  if (kind === 'persona') return { teamSize: 1, teamMin: null, teamMax: null };
  if (kind === 'equipo') {
    const teamSize = int(body.teamSize, 2, 500);
    if (teamSize === null) errors.teamSize = 'Indica cuántas personas forman el equipo (2 o más)';
    return { teamSize, teamMin: null, teamMax: null };
  }
  const teamMin = int(body.teamMin, 1, 10000);
  const teamMax = int(body.teamMax, 1, 10000);
  if (teamMin === null || teamMax === null || teamMax < teamMin) {
    errors.teamMin = 'Indica un rango de personas válido (mínimo y máximo)';
  }
  return { teamSize: null, teamMin, teamMax };
}

function validateSchedule(schedule, errors) {
  const mode = schedule?.mode;
  if (mode === 'siempre' || mode === 'sin-definir') return { mode };
  if (mode === 'definido') {
    const days = Array.isArray(schedule.days) ? WEEKDAYS.filter((d) => schedule.days.includes(d)) : [];
    const { from, to } = schedule;
    if (!days.length) errors.schedule = 'Elige al menos un día';
    else if (!HOUR.test(from ?? '') || !HOUR.test(to ?? '') || from >= to) {
      errors.schedule = 'Indica un horario válido (la hora de inicio antes que la de cierre)';
    }
    return { mode, days, from, to };
  }
  errors.schedule = 'Elige un horario de atención';
  return { mode: 'sin-definir' };
}

function validateServices(list, catalog, errors) {
  if (!Array.isArray(list) || list.length === 0) {
    errors.services = 'Elige al menos un servicio';
    return [];
  }
  const seen = new Set();
  const services = [];
  for (const item of list) {
    const pricePerM2 = number(item?.pricePerM2, 0.01, 100000);
    if (!catalog.has(item?.id) || seen.has(item.id)) {
      errors.services = 'Hay un servicio que no está en el catálogo o está repetido';
    } else if (pricePerM2 === null) {
      errors.services = 'Cada servicio necesita un precio por m² mayor a 0';
    }
    seen.add(item?.id);
    services.push({ id: item?.id, pricePerM2, featured: item?.featured === true });
  }
  if (services.filter((s) => s.featured).length > MAX_FEATURED) {
    errors.services = `Solo puedes destacar ${MAX_FEATURED} servicios`;
  }
  return services;
}

function validateAdjustments(list, catalog, errors) {
  if (list === undefined) return [];
  if (!Array.isArray(list)) {
    errors.spaceAdjustments = 'Formato de ajustes inválido';
    return [];
  }
  const adjustments = [];
  for (const item of list) {
    const factor = number(item?.factor, 0.1, 10);
    if (!catalog.has(item?.id) || factor === null) {
      errors.spaceAdjustments = 'Cada ajuste necesita un tipo de espacio válido y un factor entre 0.1 y 10';
    }
    adjustments.push({ id: item?.id, factor });
  }
  return adjustments;
}

async function loadCatalogIds() {
  const pool = await getPool();
  const [services, spaces] = await Promise.all([
    pool.request().query('SELECT id FROM core.Servicio'),
    pool.request().query('SELECT id FROM core.TipoEspacio'),
  ]);
  return {
    services: new Set(services.recordset.map((r) => r.id)),
    spaces: new Set(spaces.recordset.map((r) => r.id)),
  };
}

/** Datos de operación (tabla Perfil del esquema del tenant). */
function validateOperation(body, kind, errors) {
  return {
    ...validateTeam(body, kind, errors),
    maxM2: (() => {
      const maxM2 = int(body.maxM2, 1, 1000000);
      if (maxM2 === null) errors.maxM2 = 'Indica los m² máximos que atiendes';
      return maxM2;
    })(),
    schedule: validateSchedule(body.schedule, errors),
  };
}

/** Datos públicos del perfil (core.Tenant). */
function validatePublic(body, errors) {
  const city = text(body.city, 80);
  const state = text(body.state, 80);
  if (!city) errors.city = 'Indica tu ciudad';
  if (!state) errors.state = 'Indica tu estado';
  const about = typeof body.about === 'string' && body.about.trim() ? body.about.trim().slice(0, 1000) : null;
  return { city, state, about };
}

async function validateNewTenant(body) {
  const errors = {};
  const catalog = await loadCatalogIds();

  const name = text(body.name, 120);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const kind = KINDS.includes(body.kind) ? body.kind : null;
  if (!name) errors.name = 'Indica el nombre de la persona, equipo o empresa';
  if (!EMAIL.test(email) || email.length > 254) errors.email = 'Indica un correo válido';
  if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
  if (!kind) errors.kind = 'Elige si eres persona, equipo o empresa';

  const data = {
    name,
    email,
    password,
    kind,
    ...validatePublic(body, errors),
    ...validateOperation(body, kind ?? 'persona', errors),
    services: validateServices(body.services, catalog.services, errors),
    spaceAdjustments: validateAdjustments(body.spaceAdjustments, catalog.spaces, errors),
  };
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return data;
}

// ---------------------------------------------------------------------------
// Escritura en el esquema del tenant (siempre con tenantDb/withTenant:
// las tablas van sin esquema y SQL Server las resuelve en el del tenant).
// ---------------------------------------------------------------------------

async function writeOperation(db, op) {
  const s = op.schedule;
  await db
    .request()
    .input('personas_num', sql.Int, op.teamSize)
    .input('personas_min', sql.Int, op.teamMin)
    .input('personas_max', sql.Int, op.teamMax)
    .input('horario_modo', sql.VarChar, s.mode)
    .input('horario_dias', sql.VarChar, s.mode === 'definido' ? s.days.join(',') : null)
    .input('hora_inicio', sql.Char(5), s.mode === 'definido' ? s.from : null)
    .input('hora_fin', sql.Char(5), s.mode === 'definido' ? s.to : null)
    .input('m2_max', sql.Int, op.maxM2).query(`
      MERGE Perfil AS t
      USING (SELECT 1 AS id) AS s ON t.id = s.id
      WHEN MATCHED THEN UPDATE SET
        personas_num = @personas_num, personas_min = @personas_min, personas_max = @personas_max,
        horario_modo = @horario_modo, horario_dias = @horario_dias, hora_inicio = @hora_inicio,
        hora_fin = @hora_fin, m2_max = @m2_max, fecha_actualizacion = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT
        (id, personas_num, personas_min, personas_max, horario_modo, horario_dias, hora_inicio, hora_fin, m2_max)
        VALUES (1, @personas_num, @personas_min, @personas_max, @horario_modo, @horario_dias, @hora_inicio, @hora_fin, @m2_max);`);
}

async function writeServices(db, services) {
  await db.request().query('DELETE ProveedorServicio');
  for (const s of services) {
    await db
      .request()
      .input('id', sql.VarChar, s.id)
      .input('precio', sql.Decimal(10, 2), s.pricePerM2)
      .input('destacado', sql.Bit, s.featured)
      .query('INSERT ProveedorServicio (servicio_id, precio_m2, destacado) VALUES (@id, @precio, @destacado)');
  }
}

async function writeAdjustments(db, adjustments) {
  await db.request().query('DELETE AjusteEspacio');
  // Sin fila = factor 1.0; solo se guardan los que el proveedor cambió.
  for (const a of adjustments.filter((a) => a.factor !== 1)) {
    await db
      .request()
      .input('id', sql.VarChar, a.id)
      .input('factor', sql.Decimal(4, 2), a.factor)
      .query('INSERT AjusteEspacio (tipo_espacio_id, factor) VALUES (@id, @factor)');
  }
}

/** Nombre base del esquema: "Brillo Total, S.A." -> "brillo_total_s_a". */
function slugify(name) {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
    .replace(/_+$/, '');
  return slug || 'tenant';
}

/**
 * Alta de tenant. En una sola transacción:
 * 1. core.sp_crear_tenant crea la cuenta, el registro, el esquema, el usuario de BD y sus permisos.
 * 2. Con la identidad del NUEVO tenant se guardan sus datos de operación, servicios y ajustes.
 * Si cualquier paso falla no queda nada creado.
 */
async function createTenant(data, passwordHash) {
  return inTransaction(async (tx) => {
    const created = await new sql.Request(tx)
      .input('nombre', sql.NVarChar(120), data.name)
      .input('correo', sql.NVarChar(254), data.email)
      .input('password_hash', sql.VarChar(100), passwordHash)
      .input('tipo', sql.VarChar(10), data.kind)
      .input('ciudad', sql.NVarChar(80), data.city)
      .input('estado', sql.NVarChar(80), data.state)
      .input('presentacion', sql.NVarChar(1000), data.about)
      .input('slug', sql.VarChar(30), slugify(data.name))
      .output('tenant_id', sql.Int)
      .output('usuario_id', sql.Int)
      .output('schema_name', sql.NVarChar(128))
      .output('db_user', sql.NVarChar(128))
      .execute('core.sp_crear_tenant');
    const out = created.output;

    const db = tenantDb(tx, out.db_user);
    await writeOperation(db, data);
    await writeServices(db, data.services);
    await writeAdjustments(db, data.spaceAdjustments);

    return { userId: out.usuario_id, tenantId: out.tenant_id, schema: out.schema_name, dbUser: out.db_user };
  });
}

// ---------------------------------------------------------------------------
// Lectura y edición del propio tenant
// ---------------------------------------------------------------------------

/** Todo lo que ve el tenant en su vista de gestión. */
async function getTenant(tenant) {
  const pool = await getPool();
  // Datos públicos y de registro (core): se leen con la cuenta de la app,
  // filtrando por el id que viene del token.
  const core = (
    await pool.request().input('id', sql.Int, tenant.id).query(`
      SELECT t.id, t.nombre, t.tipo, t.ciudad, t.estado, t.presentacion, t.schema_name, t.db_user,
             t.verificado, t.fecha_creacion, u.correo
      FROM core.Tenant t JOIN core.Usuario u ON u.id = t.usuario_id
      WHERE t.id = @id`)
  ).recordset[0];

  // Datos privados: se leen con la identidad del tenant, en su esquema.
  // Una transacción usa una sola conexión: las consultas van una tras otra.
  const priv = await withTenant(tenant, async (db) => {
    const perfil = await db.request().query('SELECT * FROM Perfil');
    const servicios = await db.request().query(`
      SELECT ps.servicio_id, ps.precio_m2, ps.destacado, s.nombre
      FROM ProveedorServicio ps JOIN core.Servicio s ON s.id = ps.servicio_id
      ORDER BY ps.destacado DESC, s.nombre`);
    const ajustes = await db.request().query(`
      SELECT te.id, te.nombre, COALESCE(a.factor, 1.0) AS factor
      FROM core.TipoEspacio te LEFT JOIN AjusteEspacio a ON a.tipo_espacio_id = te.id
      ORDER BY te.nombre`);
    // Para la demo: con qué usuario y esquema por defecto está trabajando SQL Server.
    const identidad = await db.request().query('SELECT USER_NAME() AS usuario, SCHEMA_NAME() AS esquema');
    return { perfil: perfil.recordset[0], servicios: servicios.recordset, ajustes: ajustes.recordset, identidad: identidad.recordset[0] };
  });

  const p = priv.perfil;
  return {
    id: core.id,
    name: core.nombre,
    email: core.correo,
    kind: core.tipo,
    city: core.ciudad,
    state: core.estado,
    about: core.presentacion,
    verified: core.verificado,
    createdAt: core.fecha_creacion,
    teamSize: p.personas_num,
    teamMin: p.personas_min,
    teamMax: p.personas_max,
    maxM2: p.m2_max,
    schedule:
      p.horario_modo === 'definido'
        ? { mode: 'definido', days: p.horario_dias.split(','), from: p.hora_inicio, to: p.hora_fin }
        : { mode: p.horario_modo },
    services: priv.servicios.map((s) => ({ id: s.servicio_id, label: s.nombre, pricePerM2: Number(s.precio_m2), featured: s.destacado })),
    spaceAdjustments: priv.ajustes.map((a) => ({ id: a.id, label: a.nombre, factor: Number(a.factor) })),
    isolation: {
      schema: core.schema_name,
      dbUser: core.db_user,
      sqlUser: priv.identidad.usuario,
      sqlDefaultSchema: priv.identidad.esquema,
    },
  };
}

async function updateProfile(tenant, body) {
  const errors = {};
  const pub = validatePublic(body, errors);
  const kind = (
    await (await getPool()).request().input('id', sql.Int, tenant.id).query('SELECT tipo FROM core.Tenant WHERE id = @id')
  ).recordset[0].tipo;
  const op = validateOperation(body, kind, errors);
  if (Object.keys(errors).length) throw new ValidationError(errors);

  await inTransaction(async (tx) => {
    await new sql.Request(tx)
      .input('id', sql.Int, tenant.id)
      .input('ciudad', sql.NVarChar(80), pub.city)
      .input('estado', sql.NVarChar(80), pub.state)
      .input('presentacion', sql.NVarChar(1000), pub.about)
      .query('UPDATE core.Tenant SET ciudad = @ciudad, estado = @estado, presentacion = @presentacion WHERE id = @id');
    await writeOperation(tenantDb(tx, tenant.dbUser), op);
  });
}

async function updateServices(tenant, body) {
  const errors = {};
  const services = validateServices(body.services, (await loadCatalogIds()).services, errors);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  await withTenant(tenant, (db) => writeServices(db, services));
}

async function updateAdjustments(tenant, body) {
  const errors = {};
  const adjustments = validateAdjustments(body.spaceAdjustments ?? [], (await loadCatalogIds()).spaces, errors);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  await withTenant(tenant, (db) => writeAdjustments(db, adjustments));
}

module.exports = {
  ValidationError,
  validateNewTenant,
  createTenant,
  getTenant,
  updateProfile,
  updateServices,
  updateAdjustments,
  slugify,
};
