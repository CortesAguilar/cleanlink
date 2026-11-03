const sql = require('mssql');
const { declare } = require('mssql/lib/datatypes');
const { Request: TdsRequest } = require('tedious');

function config(database = process.env.DB_NAME) {
  return {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    options: {
      encrypt: true,
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    },
  };
}

/**
 * Pool que, antes de prestar una conexión, comprueba que NO esté con la
 * identidad de un tenant (usr_*). Es la red de seguridad para los casos en
 * que SQL Server aborta una consulta sin llegar al REVERT (p. ej. un timeout
 * del cliente): esa conexión se descarta en vez de reutilizarse.
 */
class SafePool extends sql.ConnectionPool {
  _poolValidate(connection) {
    if (!connection || connection.closed || connection.hasError) return false;
    return new Promise((resolve) => {
      let user;
      const req = new TdsRequest('SELECT USER_NAME()', (err) => resolve(!err && Boolean(user) && !user.startsWith('usr_')));
      req.on('row', (columns) => {
        user = columns[0].value;
      });
      connection.execSql(req);
    });
  }
}

// Pool único para toda la API. Se conecta como el usuario de la aplicación
// (dbo), que solo se usa para el esquema core y para impersonar tenants.
let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = new SafePool(config()).connect().catch((err) => {
      poolPromise = undefined;
      throw err;
    });
  }
  return poolPromise;
}

// Los nombres los genera core.sp_crear_tenant; aquí se vuelven a validar
// antes de usarlos en SQL, porque EXECUTE AS no acepta parámetros en un batch.
const DB_USER_PATTERN = /^usr_[a-z0-9_]{1,60}$/;

/**
 * Acceso a la BD con la identidad del tenant, dentro de la transacción `tx`.
 *
 * Cada consulta se envía envuelta así:
 *     EXECUTE AS USER = 'usr_<tenant>';
 *     BEGIN TRY   EXEC sp_executesql <consulta>, <parámetros>   END TRY
 *     BEGIN CATCH REVERT; THROW; END CATCH;
 *     REVERT;
 * - Con EXECUTE AS, SQL Server aplica los permisos de ese usuario, que solo
 *   puede tocar su propio esquema. Las tablas se escriben sin esquema y se
 *   resuelven en el esquema por defecto del usuario (tnt_<tenant>).
 * - La consulta va en un sp_executesql anidado para que CUALQUIER error
 *   (incluso uno de compilación, como una tabla inexistente) caiga en el
 *   CATCH y se haga REVERT. Sin esto la conexión volvería al pool todavía
 *   con la identidad del tenant (lo detectó test/aislamiento.test.js).
 */
function tenantDb(tx, dbUser) {
  if (!DB_USER_PATTERN.test(dbUser)) throw new Error('Usuario de BD de tenant inválido');
  return {
    request() {
      const req = new sql.Request(tx);
      const query = req.query.bind(req);
      req.query = (text) => {
        // Cambiar de identidad dentro de la consulta abortaría la transacción
        // sin pasar por el CATCH; no se permite.
        if (/\b(EXECUTE\s+AS|EXEC\s+AS|REVERT|SETUSER)\b/i.test(text)) {
          return Promise.reject(new Error('Una consulta de tenant no puede cambiar de identidad'));
        }
        const params = Object.values(req.parameters);
        const declarations = params.map((p) => `@${p.name} ${declare(p.type, p)}`).join(', ');
        const forward = params.map((p) => `, @${p.name} = @${p.name}`).join('');
        req.input('__consulta', sql.NVarChar(sql.MAX), text);
        req.input('__parametros', sql.NVarChar(sql.MAX), declarations);
        return query(`EXECUTE AS USER = '${dbUser}';
BEGIN TRY
  EXEC sp_executesql @__consulta, @__parametros${forward};
END TRY
BEGIN CATCH
  REVERT;
  THROW;
END CATCH;
REVERT;`);
      };
      req.batch = () => Promise.reject(new Error('batch() no está permitido con identidad de tenant'));
      return req;
    },
  };
}

/**
 * Abre una transacción (una sola conexión del pool) y ejecuta `fn(db)` con
 * la identidad de BD del tenant. Confirma si todo sale bien; si no, revierte.
 */
async function withTenant(tenant, fn) {
  return inTransaction((tx) => fn(tenantDb(tx, tenant.dbUser)));
}

async function inTransaction(fn) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

module.exports = { sql, config, getPool, tenantDb, withTenant, inTransaction };
