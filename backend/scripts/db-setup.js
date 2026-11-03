// Crea la base de datos (si no existe) y aplica las migraciones pendientes.
// Uso: npm run db:setup
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const { sql, config } = require('../src/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

async function createDatabase(name) {
  // En Azure SQL la base ya existe (se crea con az sql db create) y no se
  // puede crear desde master con el mismo usuario; solo se crea en local.
  const pool = await new sql.ConnectionPool(config('master')).connect();
  try {
    // sys.databases (no DB_ID): en Azure SQL, DB_ID desde master no ve las demás bases.
    const exists = await pool.request().input('name', sql.NVarChar, name).query('SELECT 1 AS x FROM sys.databases WHERE name = @name');
    if (exists.recordset.length === 0) {
      if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Nombre de base de datos inválido: ${name}`);
      await pool.request().batch(`CREATE DATABASE [${name}]`);
      console.log(`Base de datos ${name} creada.`);
    }
  } finally {
    await pool.close();
  }
}

// Separa un archivo .sql en batches por las líneas "GO".
function splitBatches(text) {
  return text
    .split(/^\s*GO\s*$/im)
    .map((b) => b.trim())
    .filter(Boolean);
}

async function migrate() {
  const pool = await new sql.ConnectionPool(config()).connect();
  try {
    await pool.request().batch(`
      IF SCHEMA_ID('core') IS NULL EXEC('CREATE SCHEMA core AUTHORIZATION dbo');
      IF OBJECT_ID('core.Migracion') IS NULL
        CREATE TABLE core.Migracion (
          nombre VARCHAR(100) PRIMARY KEY,
          fecha  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
        );`);

    const applied = new Set((await pool.request().query('SELECT nombre FROM core.Migracion')).recordset.map((r) => r.nombre));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      // Los procedimientos (CREATE OR ALTER) se vuelven a aplicar siempre para
      // que un cambio en ellos llegue sin crear otra migración.
      const alwaysRun = /CREATE OR ALTER PROCEDURE/i.test(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
      if (applied.has(file) && !alwaysRun) continue;

      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        for (const batch of splitBatches(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))) {
          await new sql.Request(tx).batch(batch);
        }
        if (!applied.has(file)) {
          await new sql.Request(tx).input('nombre', sql.VarChar, file).query('INSERT core.Migracion (nombre) VALUES (@nombre)');
        }
        await tx.commit();
        console.log(`${applied.has(file) ? 'Actualizada' : 'Aplicada'}: ${file}`);
      } catch (err) {
        await tx.rollback().catch(() => {});
        throw new Error(`${file}: ${err.message}`);
      }
    }
  } finally {
    await pool.close();
  }
}

async function main() {
  await createDatabase(process.env.DB_NAME);
  await migrate();
  console.log('Base de datos lista.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
