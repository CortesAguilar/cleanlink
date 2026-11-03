// Admin de plataforma y verificación de correo.
// Requiere SQL Server con las migraciones aplicadas (npm run db:setup).
require('dotenv').config({ quiet: true });
// En las pruebas no se envían correos reales: el enlace se imprime en la consola.
process.env.ACS_CONNECTION_STRING = ''; // dotenv no sobrescribe variables ya definidas

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const { sql, getPool } = require('../src/db');
const { hashPassword } = require('../src/auth');
const { issueToken } = require('../src/verification');

const RUN = Date.now().toString(36);
const PASSWORD = 'prueba-admin-123';

let server;
let base;
let tenant; // { id, userId, token }
let adminId;
let adminToken;

async function api(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}/api`;

  const created = await api('POST', '/tenants', {
    body: {
      name: `Prueba Verificacion ${RUN}`,
      email: `verificacion.${RUN}@prueba.cleanlink.mx`,
      password: PASSWORD,
      kind: 'persona',
      city: 'Tijuana',
      state: 'Baja California',
      maxM2: 120,
      schedule: { mode: 'siempre' },
      services: [{ id: 'casas', pricePerM2: 15, featured: true }],
    },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  tenant = { id: created.body.tenant.id, userId: created.body.user.id, token: created.body.token, emailSent: created.body.emailSent };

  const pool = await getPool();
  const email = `admin.${RUN}@prueba.cleanlink.mx`;
  const admin = await pool
    .request()
    .input('correo', sql.NVarChar(254), email)
    .input('hash', sql.VarChar(100), await hashPassword(PASSWORD))
    .query(`INSERT core.Usuario (nombre, correo, password_hash, tipo_cuenta, verificado)
            OUTPUT inserted.id VALUES (N'Admin prueba', @correo, @hash, 'admin', 1)`);
  adminId = admin.recordset[0].id;
  adminToken = (await api('POST', '/auth/login', { body: { email, password: PASSWORD } })).body.token;
});

after(async () => {
  const pool = await getPool();
  await pool.request().input('tenant_id', sql.Int, tenant.id).execute('core.sp_eliminar_tenant');
  await pool.request().input('id', sql.Int, adminId).query('DELETE core.Usuario WHERE id = @id');
  await pool.close();
  server.close();
});

test('el admin ve el registro de tenants con su esquema', async () => {
  const res = await api('GET', '/admin/tenants', { token: adminToken });
  assert.equal(res.status, 200);
  const row = res.body.find((t) => t.id === tenant.id);
  assert.ok(row, 'el tenant nuevo aparece en la lista');
  assert.match(row.schema, /^tnt_prueba_verificacion_/);
  assert.equal(row.tables, 3);
  assert.equal(row.verified, false);
});

test('solo el admin puede ver la lista de tenants', async () => {
  assert.equal((await api('GET', '/admin/tenants')).status, 401);
  assert.equal((await api('GET', '/admin/tenants', { token: tenant.token })).status, 403);
});

test('el admin no tiene acceso a los datos privados de un tenant', async () => {
  assert.equal((await api('GET', '/tenant', { token: adminToken })).status, 403);
});

test('el alta funciona aunque el correo no esté configurado', () => {
  assert.equal(tenant.emailSent, false);
});

test('un enlace inventado no verifica la cuenta', async () => {
  const res = await api('POST', '/auth/verify-email', { body: { token: 'x'.repeat(43) } });
  assert.equal(res.status, 400);
  assert.equal((await api('GET', '/tenant', { token: tenant.token })).body.verified, false);
});

test('el reenvío respeta el tiempo de espera', async () => {
  const res = await api('POST', '/auth/resend-verification', { token: tenant.token });
  assert.equal(res.status, 429);
});

test('un enlace válido verifica la cuenta y el tenant, y solo sirve una vez', async () => {
  const token = await issueToken(tenant.userId);
  assert.equal((await api('POST', '/auth/verify-email', { body: { token } })).status, 200);
  assert.equal((await api('GET', '/tenant', { token: tenant.token })).body.verified, true);
  const admin = await api('GET', '/admin/tenants', { token: adminToken });
  assert.equal(admin.body.find((t) => t.id === tenant.id).verified, true);
  assert.equal((await api('POST', '/auth/verify-email', { body: { token } })).status, 400);
});
