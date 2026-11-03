// Envío de correos con Azure Communication Services (dominio administrado por Azure).
// Sin ACS_CONNECTION_STRING (desarrollo) el correo no se envía: el enlace se
// imprime en la consola para poder probar el flujo completo.
const { EmailClient } = require('@azure/communication-email');

let client;
function getClient() {
  if (!client) client = new EmailClient(process.env.ACS_CONNECTION_STRING);
  return client;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function verificationContent(name, link) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Confirma tu correo en CleanLink',
    plainText:
      `Hola, ${name}:\n\n` +
      'Gracias por registrar tu negocio en CleanLink. Confirma tu correo abriendo este enlace:\n\n' +
      `${link}\n\n` +
      'El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.\n\n— Equipo CleanLink',
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f8fcfd;font-family:Arial,Helvetica,sans-serif;color:#0f2a33">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #dae8ec;border-radius:16px">
      <tr><td style="padding:32px">
        <p style="margin:0 0 24px;font-size:22px;font-weight:700">Clean<span style="color:#0b7f86">Link</span></p>
        <p style="margin:0 0 12px;font-size:16px">Hola, ${safeName}:</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:24px">Gracias por registrar tu negocio en CleanLink. Confirma tu correo para verificar tu cuenta.</p>
        <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0b7f86;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">Confirmar mi correo</a></p>
        <p style="margin:0 0 8px;font-size:13px;color:#4b6470">Si el botón no funciona, copia este enlace en tu navegador:</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${link}" style="color:#0b7f86">${link}</a></p>
        <p style="margin:0;font-size:13px;color:#4b6470">El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}

/**
 * Envía el correo de verificación. Devuelve true cuando Azure acepta el envío
 * (false si el correo no está configurado). La entrega tarda unos segundos
 * más y se revisa en segundo plano para no hacer esperar al registro.
 */
async function sendVerificationEmail(to, name, link) {
  if (!process.env.ACS_CONNECTION_STRING) {
    console.log(`[correo no configurado] Verificación para ${to}: ${link}`);
    return false;
  }
  const poller = await getClient().beginSend({
    senderAddress: process.env.MAIL_FROM,
    content: verificationContent(name, link),
    recipients: { to: [{ address: to, displayName: name }] },
  });
  poller
    .pollUntilDone()
    .then((result) => {
      if (result.status !== 'Succeeded') console.error(`El correo a ${to} no se entregó: ${result.status}`);
    })
    .catch((err) => console.error(`El correo a ${to} no se entregó: ${err.message}`));
  return true;
}

module.exports = { sendVerificationEmail };
