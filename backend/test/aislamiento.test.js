// Prueba de aislamiento multi-tenant.
// Requiere SQL Server con las migraciones aplicadas (npm run db:setup).
// Uso: npm test
require('dotenv').config({ quiet: true });
// En las pruebas no se envían correos reales: el enlace se imprime en la consola.
process.env.ACS_CONNECTION_STRING = ''; // dotenv no sobrescribe variables ya definidas
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { sql, getPool, withTenant } = require('../src/db');

const RUN = Date.now().toString(36);
const PASSWORD = 'prueba-aislamiento-123';

let server;
let base;
const t = {}; // tenants creados para la prueba: a y c

async function api(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

function newTenant(name, services) {
  return {
    name,
    email: `${name.toLowerCase().replace(/\W+/g, '.')}.${RUN}@prueba.cleanlink.mx`,
    password: PASSWORD,
    kind: 'equipo',
    teamSize: 4,
    city: 'Tijuana',
    state: 'Baja California',
    maxM2: 300,
    schedule: { mode: 'siempre' },
    services,
  };
}

before(async () => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}/api`;

  for (const [key, name, services] of [
    ['a', `Prueba A ${RUN}`, [{ id: 'oficinas', pricePerM2: 11, featured: true }]],
    ['c', `Prueba C ${RUN}`, [{ id: 'casas', pricePerM2: 33, featured: true }]],
  ]) {
    const res = await api('POST', '/tenants', { body: newTenant(name, services) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    t[key] = { token: res.body.token, id: res.body.tenant.id, schema: res.body.tenant.schema };
    const pool = await getPool();
    const row = (await pool.request().input('id', sql.Int, t[key].id).query('SELECT db_user FROM core.Tenant WHERE id = @id')).recordset[0];
    t[key].dbUser = row.db_user;
  }
});

after(async () => {
  const pool = await getPool();
  for (const tenant of Object.values(t)) {
    await pool.request().input('tenant_id', sql.Int, tenant.id).execute('core.sp_eliminar_tenant');
  }
  await pool.close();
  server.close();
});

test('el alta crea un esquema y un usuario de BD distintos para cada tenant', () => {
  assert.match(t.a.schema, /^tnt_prueba_a_/);
  assert.match(t.c.schema, /^tnt_prueba_c_/);
  assert.notEqual(t.a.dbUser, t.c.dbUser);
});

test('cada tenant ve solo sus datos y SQL Server trabaja con su identidad', async () => {
  const a = await api('GET', '/tenant', { token: t.a.token });
  const c = await api('GET', '/tenant', { token: t.c.token });
  assert.deepEqual(a.body.services.map((s) => s.id), ['oficinas']);
  assert.deepEqual(c.body.services.map((s) => s.id), ['casas']);
  assert.equal(c.body.isolation.sqlUser, t.c.dbUser);
  assert.equal(c.body.isolation.sqlDefaultSchema, t.c.schema);
});

test('el tenant sale del token: un tenantId en la URL o en el body se ignora', async () => {
  const read = await api('GET', `/tenant?tenantId=${t.a.id}&schema=${t.a.schema}`, { token: t.c.token });
  assert.equal(read.body.id, t.c.id);

  await api('PUT', '/tenant/servicios', {
    token: t.c.token,
    body: { tenantId: t.a.id, services: [{ id: 'ventanas', pricePerM2: 99, featured: true }] },
  });
  const a = await api('GET', '/tenant', { token: t.a.token });
  const c = await api('GET', '/tenant', { token: t.c.token });
  assert.deepEqual(a.body.services.map((s) => s.id), ['oficinas'], 'A no cambió');
  assert.deepEqual(c.body.services.map((s) => s.id), ['ventanas'], 'el cambio cayó en C');
});

test('la base de datos niega a C leer o escribir el esquema de A (error 229)', async () => {
  const attempts = [
    `SELECT * FROM ${t.a.schema}.ProveedorServicio`,
    `UPDATE ${t.a.schema}.ProveedorServicio SET precio_m2 = 1`,
    'SELECT * FROM core.Usuario',
    'SELECT * FROM core.Tenant',
  ];
  for (const query of attempts) {
    await assert.rejects(
      withTenant({ dbUser: t.c.dbUser }, (db) => db.request().query(query)),
      (err) => err.number === 229,
      query,
    );
  }
});

test('C no puede hacerse pasar por el usuario de BD de A', async () => {
  // La API no deja que una consulta de tenant cambie de identidad...
  await assert.rejects(
    withTenant({ dbUser: t.c.dbUser }, (db) => db.request().query(`EXECUTE AS USER = '${t.a.dbUser}'`)),
    /no puede cambiar de identidad/,
  );
  // ...y aunque se saltara esa regla, SQL Server lo niega (C no tiene permiso IMPERSONATE).
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  await assert.rejects(
    new sql.Request(tx).batch(`EXECUTE AS USER = '${t.c.dbUser}'; EXECUTE AS USER = '${t.a.dbUser}';`),
    (err) => err.number === 15517,
  );
  await tx.rollback().catch(() => {});
});

test('después de un error las conexiones del pool vuelven a la identidad de la app', async () => {
  await assert.rejects(withTenant({ dbUser: t.c.dbUser }, (db) => db.request().query('SELECT * FROM TablaQueNoExiste')));
  await assert.rejects(withTenant({ dbUser: t.c.dbUser }, (db) => db.request().query(`SELECT * FROM ${t.a.schema}.Perfil`)));
  // La prueba anterior dejó a propósito una conexión con la identidad de C:
  // el pool debe descartarla en lugar de reutilizarla.
  const pool = await getPool();
  const users = await Promise.all(
    Array.from({ length: 10 }, () => pool.request().query('SELECT USER_NAME() AS u').then((r) => r.recordset[0].u)),
  );
  assert.ok(users.every((u) => u === 'dbo'), users.join(', '));
});

test('sin token, con token alterado o con cuenta de cliente no hay acceso', async () => {
  assert.equal((await api('GET', '/tenant')).status, 401);

  const forged = jwt.sign({ tipoCuenta: 'proveedor', tenantId: t.a.id }, 'otro-secreto', { subject: '1' });
  assert.equal((await api('GET', '/tenant', { token: forged })).status, 401);

  // Token válido de C pero con el tenantId de A: el tenant no corresponde a la cuenta.
  const c = jwt.decode(t.c.token);
  const mixed = jwt.sign({ tipoCuenta: 'proveedor', tenantId: t.a.id }, process.env.JWT_SECRET, { subject: c.sub });
  assert.equal((await api('GET', '/tenant', { token: mixed })).status, 403);

  const client = await api('POST', '/auth/register', {
    body: { name: 'Cliente prueba', email: `cliente.${RUN}@prueba.cleanlink.mx`, password: PASSWORD },
  });
  assert.equal((await api('GET', '/tenant', { token: client.body.token })).status, 403);
  const pool = await getPool();
  await pool.request().input('id', sql.Int, client.body.user.id).query('DELETE core.Usuario WHERE id = @id');
});
