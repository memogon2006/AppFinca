/**
 * Servicio de Automatización de Correos de Bienvenida y Credenciales
 */

export async function sendWelcomeEmail({ name, farmName, email, password }) {
  if (!email || !email.includes('@')) {
    console.log('No es un correo electrónico válido para enviar email, omitiendo envío.');
    return { success: false, reason: 'invalid_email' };
  }

  const payload = {
    to: email.trim(),
    name: name.trim(),
    farmName: farmName.trim(),
    password: password.trim(),
    loginUrl: 'https://finca-ganadera-gamma.vercel.app',
    subject: `🐂 ¡Bienvenido a INVENTARIO BOVINO APP! - Credenciales de ${farmName.trim()}`,
  };

  try {
    // 1. Intentar enviar mediante el endpoint serverless de la app
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      return { success: true, method: 'serverless' };
    }
  } catch (e) {
    console.warn('Error enviando correo por serverless:', e);
  }

  // 2. Fallback mediante Relay de Notificación Webhook
  try {
    await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email.trim()), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: payload.subject,
        '🐂 Finca': farmName,
        '👤 Ganadero': name,
        '📧 Usuario / Correo': email,
        '🔐 Contraseña': password,
        '🌐 Enlace de Acceso': payload.loginUrl,
        _template: 'table',
      }),
    }).catch(() => null);

    return { success: true, method: 'relay' };
  } catch (e) {
    console.warn('Error en relay de correo:', e);
    return { success: false, error: e.message };
  }
}
