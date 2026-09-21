/**
 * Servicio de Automatización de Correos (Bienvenida, Credenciales y Restablecimiento)
 */

export async function sendWelcomeEmail({ name, farmName, email, password }) {
  if (!email || !email.includes('@')) {
    console.log('No es un correo electrónico válido para enviar email, omitiendo envío.');
    return { success: false, reason: 'invalid_email' };
  }

  const payload = {
    type: 'welcome',
    to: email.trim(),
    name: (name || 'Ganadero').trim(),
    farmName: (farmName || 'Mi Finca').trim(),
    password: (password || '').trim(),
    loginUrl: 'https://finca-ganadera-gamma.vercel.app',
    subject: `🐂 ¡Bienvenido a INVENTARIO BOVINO APP! - Credenciales de ${(farmName || 'tu Finca').trim()}`,
  };

  try {
    // 1. Intentar enviar mediante el endpoint serverless de la app
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, method: 'serverless', ...data };
    }
  } catch (e) {
    console.warn('Error enviando correo por serverless:', e);
  }

  // 2. Fallback mediante Relay de Notificación Webhook
  try {
    const fsRes = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email.trim()), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://finca-ganadera-gamma.vercel.app',
        'Referer': 'https://finca-ganadera-gamma.vercel.app/',
        'User-Agent': 'Mozilla/5.0 (compatible; InventarioBovino/1.0)',
      },
      body: JSON.stringify({
        _subject: payload.subject,
        '🐂 Finca': payload.farmName,
        '👤 Ganadero': payload.name,
        '📧 Usuario / Correo': payload.to,
        '🔐 Contraseña Inicial': payload.password,
        '🌐 Enlace de Acceso': payload.loginUrl,
        _template: 'table',
      }),
    });

    const fsData = await fsRes.json().catch(() => ({}));
    const needsActivation = fsData.message && fsData.message.includes('needs Activation');

    return { 
      success: true, 
      method: 'relay',
      needsActivation: !!needsActivation,
      message: fsData.message 
    };
  } catch (e) {
    console.warn('Error en relay de correo:', e);
    return { success: false, error: e.message };
  }
}

export async function sendPasswordResetEmail({ name, farmName, email, tempPassword }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'invalid_email' };
  }

  const payload = {
    type: 'reset_password',
    to: email.trim(),
    name: (name || 'Ganadero').trim(),
    farmName: (farmName || 'Mi Finca').trim(),
    tempPassword: tempPassword.trim(),
    loginUrl: 'https://finca-ganadera-gamma.vercel.app',
    subject: `🔐 Restablecimiento de Contraseña - INVENTARIO BOVINO APP (${(farmName || 'Mi Finca').trim()})`,
  };

  try {
    // 1. Intentar enviar mediante el endpoint serverless de la app
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, method: 'serverless', ...data };
    }
  } catch (e) {
    console.warn('Error enviando correo por serverless:', e);
  }

  // 2. Fallback mediante Relay de Notificación Webhook
  try {
    const fsRes = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email.trim()), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://finca-ganadera-gamma.vercel.app',
        'Referer': 'https://finca-ganadera-gamma.vercel.app/',
        'User-Agent': 'Mozilla/5.0 (compatible; InventarioBovino/1.0)',
      },
      body: JSON.stringify({
        _subject: payload.subject,
        '🔐 Tipo': 'Restablecimiento de Contraseña Ganadera',
        '🐂 Finca': payload.farmName,
        '👤 Ganadero': payload.name,
        '📧 Correo': payload.to,
        '🔑 Clave Temporal': payload.tempPassword,
        '🌐 Enlace de Acceso': payload.loginUrl,
        _template: 'table',
      }),
    });

    const fsData = await fsRes.json().catch(() => ({}));
    const needsActivation = fsData.message && fsData.message.includes('needs Activation');

    return { 
      success: true, 
      method: 'relay',
      needsActivation: !!needsActivation,
      message: fsData.message 
    };
  } catch (e) {
    console.warn('Error en relay de correo:', e);
    return { success: false, error: e.message };
  }
}


