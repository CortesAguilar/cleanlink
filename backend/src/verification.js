// Verificación de correo: token de un solo uso que vence en 24 horas.
const crypto = require('node:crypto');
const { sql, getPool, inTransaction } = require('./db');
const { sendVerificationEmail } = require('./email');

const TOKEN_TTL_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Crea un token para la cuenta y devuelve el token en claro (solo viaja en el enlace). */
async function issueToken(usuarioId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const pool = await getPool();
  await pool
    .request()
    .input('usuario', sql.Int, usuarioId)
    .input('hash', sql.Char(64), hashToken(token))
    .input('horas', sql.Int, TOKEN_TTL_HOURS)
    .query(`INSERT core.VerificacionCorreo (usuario_id, token_hash, expira)
            VALUES (@usuario, @hash, DATEADD(HOUR, @horas, SYSUTCDATETIME()))`);
  return token;
}

function verificationLink(token) {
  const base = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return `${base}/verificar?token=${encodeURIComponent(token)}`;
}

/**
 * Genera un token nuevo y envía el correo. Nunca lanza: si el envío falla
 * devuelve false y la cuenta puede pedir que se reenvíe.
 */
async function sendVerification(user) {
  try {
    const token = await issueToken(user.id);
    return await sendVerificationEmail(user.email, user.name, verificationLink(token));
  } catch (err) {
    console.error('No se pudo enviar el correo de verificación:', err.message);
    return false;
  }
}

/** Segundos que faltan para poder reenviar (0 si ya se puede). */
async function resendWait(usuarioId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('usuario', sql.Int, usuarioId)
    .query('SELECT DATEDIFF(SECOND, MAX(fecha_creacion), SYSUTCDATETIME()) AS transcurrido FROM core.VerificacionCorreo WHERE usuario_id = @usuario');
  const elapsed = result.recordset[0].transcurrido;
  return elapsed === null ? 0 : Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
}

/**
 * Marca el token como usado y la cuenta (y su tenant, si es proveedor) como verificada.
 * Devuelve el id de la cuenta, o null si el token no existe, ya se usó o venció.
 */
async function verifyToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  return inTransaction(async (tx) => {
    const used = await new sql.Request(tx).input('hash', sql.Char(64), hashToken(token)).query(`
      UPDATE core.VerificacionCorreo
      SET usado_en = SYSUTCDATETIME()
      OUTPUT inserted.usuario_id
      WHERE token_hash = @hash AND usado_en IS NULL AND expira > SYSUTCDATETIME()`);
    const usuarioId = used.recordset[0]?.usuario_id;
    if (!usuarioId) return null;
    await new sql.Request(tx).input('usuario', sql.Int, usuarioId).query(`
      UPDATE core.Usuario SET verificado = 1 WHERE id = @usuario;
      UPDATE core.Tenant SET verificado = 1 WHERE usuario_id = @usuario;`);
    return usuarioId;
  });
}

module.exports = { sendVerification, resendWait, verifyToken, issueToken };
