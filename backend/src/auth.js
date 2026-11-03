const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('./db');

const TOKEN_TTL = '7d';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta JWT_SECRET en las variables de entorno');
  return secret;
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Token de sesión: identifica la cuenta y, si es proveedor, su tenant. */
function signToken(user) {
  return jwt.sign(
    { tipoCuenta: user.tipoCuenta, tenantId: user.tenantId ?? null },
    jwtSecret(),
    { subject: String(user.id), expiresIn: TOKEN_TTL },
  );
}

/** Exige un token válido y deja la sesión en req.session. */
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Inicia sesión para continuar' });
  try {
    const payload = jwt.verify(token, jwtSecret());
    req.session = { userId: Number(payload.sub), tipoCuenta: payload.tipoCuenta, tenantId: payload.tenantId };
    next();
  } catch {
    res.status(401).json({ error: 'La sesión expiró o no es válida' });
  }
}

/**
 * Exige sesión de proveedor y resuelve su tenant en req.tenant.
 * El tenant sale SOLO del token firmado: se ignora cualquier tenant, esquema
 * o id que venga en la URL, el query string o el body.
 */
async function requireTenant(req, res, next) {
  if (req.session?.tipoCuenta !== 'proveedor' || !req.session.tenantId) {
    return res.status(403).json({ error: 'Solo las cuentas de proveedor tienen vista de gestión' });
  }
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.session.tenantId)
      .input('usuario', sql.Int, req.session.userId)
      .query('SELECT id, schema_name, db_user FROM core.Tenant WHERE id = @id AND usuario_id = @usuario');
    const row = result.recordset[0];
    if (!row) return res.status(403).json({ error: 'El tenant de la sesión no existe' });
    req.tenant = { id: row.id, schema: row.schema_name, dbUser: row.db_user };
    next();
  } catch (err) {
    next(err);
  }
}

/** Exige sesión de admin de plataforma, confirmada en la base (no solo en el token). */
async function requireAdmin(req, res, next) {
  if (req.session?.tipoCuenta !== 'admin') return res.status(403).json({ error: 'Solo el admin de plataforma puede ver esto' });
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, req.session.userId)
      .query("SELECT 1 AS ok FROM core.Usuario WHERE id = @id AND tipo_cuenta = 'admin'");
    if (!result.recordset[0]) return res.status(403).json({ error: 'Solo el admin de plataforma puede ver esto' });
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { hashPassword, checkPassword, signToken, requireAuth, requireTenant, requireAdmin };
