const express = require('express');
const { sql, getPool } = require('./db');
const { hashPassword, checkPassword, signToken, requireAuth, requireTenant } = require('./auth');
const tenants = require('./tenants');

const router = express.Router();

// Express 5 pasa a next() los errores de handlers async.

// ---------------------------------------------------------------------------
// Catálogos globales (públicos)
// ---------------------------------------------------------------------------

router.get('/services', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT id, nombre, nombre_corto, categoria FROM core.Servicio ORDER BY nombre');
  res.json(result.recordset.map((s) => ({ id: s.id, label: s.nombre, short: s.nombre_corto, category: s.categoria })));
});

router.get('/space-types', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT id, nombre FROM core.TipoEspacio ORDER BY nombre');
  res.json(result.recordset.map((t) => ({ id: t.id, label: t.nombre })));
});

// ---------------------------------------------------------------------------
// Alta de tenant (registro de proveedor)
// ---------------------------------------------------------------------------

router.post('/tenants', async (req, res) => {
  const data = await tenants.validateNewTenant(req.body ?? {});
  try {
    const created = await tenants.createTenant(data, await hashPassword(data.password));
    const user = { id: created.userId, tipoCuenta: 'proveedor', tenantId: created.tenantId };
    res.status(201).json({
      token: signToken(user),
      user: { id: user.id, name: data.name, email: data.email, accountType: 'proveedor', tenantId: created.tenantId },
      tenant: { id: created.tenantId, schema: created.schema },
    });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo', errors: { email: 'Ya existe una cuenta con ese correo' } });
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  const pool = await getPool();
  const result = await pool.request().input('correo', sql.NVarChar(254), email).query(`
    SELECT u.id, u.nombre, u.correo, u.password_hash, u.tipo_cuenta, t.id AS tenant_id
    FROM core.Usuario u LEFT JOIN core.Tenant t ON t.usuario_id = u.id
    WHERE u.correo = @correo`);
  return result.recordset[0];
}

function publicUser(row) {
  return { id: row.id, name: row.nombre, email: row.correo, accountType: row.tipo_cuenta, tenantId: row.tenant_id ?? null };
}

router.post('/auth/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const row = email && (await findUserByEmail(email));
  if (!row || !(await checkPassword(password, row.password_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  res.json({ token: signToken({ id: row.id, tipoCuenta: row.tipo_cuenta, tenantId: row.tenant_id }), user: publicUser(row) });
});

// Registro de clientes (los proveedores se registran con POST /api/tenants).
router.post('/auth/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const errors = {};
  if (!name || name.length > 120) errors.name = 'Indica tu nombre';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Indica un correo válido';
  if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Revisa los datos enviados', errors });

  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .input('nombre', sql.NVarChar(120), name)
      .input('correo', sql.NVarChar(254), email)
      .input('hash', sql.VarChar(100), await hashPassword(password))
      .query(`INSERT core.Usuario (nombre, correo, password_hash, tipo_cuenta)
              OUTPUT inserted.id, inserted.nombre, inserted.correo, inserted.tipo_cuenta
              VALUES (@nombre, @correo, @hash, 'cliente')`);
    const row = result.recordset[0];
    res.status(201).json({ token: signToken({ id: row.id, tipoCuenta: 'cliente' }), user: publicUser(row) });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo', errors: { email: 'Ya existe una cuenta con ese correo' } });
    }
    throw err;
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, req.session.userId).query(`
    SELECT u.id, u.nombre, u.correo, u.tipo_cuenta, t.id AS tenant_id
    FROM core.Usuario u LEFT JOIN core.Tenant t ON t.usuario_id = u.id
    WHERE u.id = @id`);
  if (!result.recordset[0]) return res.status(401).json({ error: 'La cuenta ya no existe' });
  res.json(publicUser(result.recordset[0]));
});

// ---------------------------------------------------------------------------
// Datos del propio tenant. El tenant SIEMPRE sale del token (requireTenant);
// no hay ningún parámetro para elegir otro.
// ---------------------------------------------------------------------------

router.use('/tenant', requireAuth, requireTenant);

router.get('/tenant', async (req, res) => {
  res.json(await tenants.getTenant(req.tenant));
});

router.put('/tenant/perfil', async (req, res) => {
  await tenants.updateProfile(req.tenant, req.body ?? {});
  res.json(await tenants.getTenant(req.tenant));
});

router.put('/tenant/servicios', async (req, res) => {
  await tenants.updateServices(req.tenant, req.body ?? {});
  res.json(await tenants.getTenant(req.tenant));
});

router.put('/tenant/ajustes', async (req, res) => {
  await tenants.updateAdjustments(req.tenant, req.body ?? {});
  res.json(await tenants.getTenant(req.tenant));
});

// Manejador de errores de la API (se monta en index.js después de express.json
// para que también atrape el JSON mal formado).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof tenants.ValidationError) return res.status(400).json({ error: err.message, errors: err.errors });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { router, errorHandler };
