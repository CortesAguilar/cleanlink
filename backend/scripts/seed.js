// Datos de demo: 2 tenants (una empresa y un equipo) y una cuenta de admin de plataforma.
// Es idempotente: si una cuenta ya existe, no la vuelve a crear.
//
// Uso:
//   npm run db:seed              crea lo que falte
//   npm run db:seed -- --reset   además elimina los tenants que NO son de la semilla
//                                (p. ej. el que se da de alta en vivo), para repetir la demo
//
// Contraseña de las cuentas de demo: SEED_PASSWORD o, si no está definida, la de abajo.
require('dotenv').config({ quiet: true });
const { sql, getPool } = require('../src/db');
const { hashPassword } = require('../src/auth');
const { validateNewTenant, createTenant } = require('../src/tenants');

const PASSWORD = process.env.SEED_PASSWORD;

const TENANTS = [
  {
    name: 'Brillo Total',
    email: 'brillo.total@demo.cleanlink.mx',
    kind: 'empresa',
    teamMin: 8,
    teamMax: 25,
    city: 'Tijuana',
    state: 'Baja California',
    about: 'Empresa de limpieza comercial con más de 10 años atendiendo oficinas, locales y bodegas.',
    maxM2: 5000,
    schedule: { mode: 'definido', days: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'], from: '08:00', to: '18:00' },
    services: [
      { id: 'oficinas', pricePerM2: 12, featured: true },
      { id: 'ventanas', pricePerM2: 10, featured: true },
      { id: 'profunda', pricePerM2: 18, featured: false },
    ],
    spaceAdjustments: [
      { id: 'oficina', factor: 1.1 },
      { id: 'escuela', factor: 1.2 },
      { id: 'bodega', factor: 1.3 },
    ],
  },
  {
    name: 'Cuadrilla Hernández',
    email: 'cuadrilla.hernandez@demo.cleanlink.mx',
    kind: 'equipo',
    teamSize: 6,
    city: 'Tijuana',
    state: 'Baja California',
    about: 'Equipo familiar especializado en casas, departamentos y mudanzas.',
    maxM2: 400,
    schedule: { mode: 'definido', days: ['lun', 'mar', 'mie', 'jue', 'vie'], from: '07:00', to: '15:00' },
    services: [
      { id: 'casas', pricePerM2: 14, featured: true },
      { id: 'mudanzas', pricePerM2: 16, featured: true },
      { id: 'profunda', pricePerM2: 20, featured: false },
    ],
    spaceAdjustments: [
      { id: 'departamento', factor: 0.9 },
      { id: 'vacacional', factor: 1.15 },
    ],
  },
];

const ADMIN = { name: 'Equipo CleanLink', email: 'admin@demo.cleanlink.mx' };

async function exists(pool, email) {
  const r = await pool.request().input('correo', sql.NVarChar(254), email).query('SELECT 1 AS x FROM core.Usuario WHERE correo = @correo');
  return r.recordset.length > 0;
}

async function main() {
  const pool = await getPool();

  if (process.argv.includes('--reset')) {
    const seeded = TENANTS.map((t) => t.email);
    const others = await pool.request().query(`
      SELECT t.id, t.nombre, t.schema_name, u.correo
      FROM core.Tenant t JOIN core.Usuario u ON u.id = t.usuario_id`);
    for (const t of others.recordset.filter((t) => !seeded.includes(t.correo))) {
      await pool.request().input('tenant_id', sql.Int, t.id).execute('core.sp_eliminar_tenant');
      console.log(`Eliminado: ${t.nombre} (${t.schema_name})`);
    }
  }

  for (const tenant of TENANTS) {
    if (await exists(pool, tenant.email)) {
      console.log(`Ya existe: ${tenant.name}`);
      continue;
    }
    const data = await validateNewTenant({ ...tenant, password: PASSWORD });
    const created = await createTenant(data, await hashPassword(PASSWORD));
    console.log(`Creado: ${tenant.name} -> esquema ${created.schema}, usuario de BD ${created.dbUser}`);
  }

  if (!(await exists(pool, ADMIN.email))) {
    await pool
      .request()
      .input('nombre', sql.NVarChar(120), ADMIN.name)
      .input('correo', sql.NVarChar(254), ADMIN.email)
      .input('hash', sql.VarChar(100), await hashPassword(PASSWORD))
      .query(`INSERT core.Usuario (nombre, correo, password_hash, tipo_cuenta, verificado)
              VALUES (@nombre, @correo, @hash, 'admin', 1)`);
    console.log(`Creado: admin de plataforma (${ADMIN.email})`);
  }

  await pool.close();
}

main().catch((err) => {
  console.error(err.errors ?? err.message);
  process.exit(1);
});
