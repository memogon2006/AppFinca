// Vercel Serverless Function para envío automatizado de correos (Bienvenida & Restablecimiento de Clave)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  const { type = 'welcome', to, name, farmName, password, tempPassword, loginUrl = 'https://finca-ganadera-gamma.vercel.app', subject } = req.body || {};

  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Correo de destino requerido y válido' });
  }

  let finalSubject = subject;
  let htmlContent = '';
  let relayData = {};

  if (type === 'reset_password') {
    finalSubject = subject || `🔐 Restablecimiento de Contraseña - INVENTARIO BOVINO APP (${farmName || 'Mi Finca'})`;
    htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
          .content { padding: 30px 25px; }
          .card { background-color: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #bae6fd; text-align: center; }
          .temp-key-title { font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .temp-key { font-size: 26px; font-weight: 900; color: #0c4a6e; letter-spacing: 2px; font-family: 'Courier New', Courier, monospace; background: #ffffff; padding: 12px 20px; border-radius: 8px; border: 2px dashed #0284c7; display: inline-block; margin: 6px 0; }
          .credential-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: left; }
          .credential-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #475569; }
          .value { font-weight: 700; color: #0f172a; }
          .btn-container { text-align: center; margin-top: 25px; margin-bottom: 15px; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(2,132,199,0.3); }
          .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 40px; margin-bottom: 8px;">🔐</div>
            <h1>Restablecimiento de Contraseña</h1>
            <p>Acceso seguro para <strong>${farmName || 'tu ganadería'}</strong></p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${name || 'Ganadero'}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta ganadera. Se ha generado una nueva <strong>clave temporal de acceso</strong>:</p>
            
            <div class="card">
              <div class="temp-key-title">🔑 Tu Nueva Clave Temporal de Acceso</div>
              <div class="temp-key">${tempPassword}</div>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px; margin-bottom: 0;">
                Usa esta clave para iniciar sesión y podrás cambiarla por una propia en tu Perfil.
              </p>
            </div>

            <div style="background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <div class="credential-row">
                <span class="label">📧 Correo Registrado:</span>
                <span class="value">${to}</span>
              </div>
              <div class="credential-row">
                <span class="label">🌿 Finca / Predio:</span>
                <span class="value">${farmName || 'Mi Finca'}</span>
              </div>
            </div>

            <div class="btn-container">
              <a href="${loginUrl}" class="btn">
                Iniciar Sesión Ahora →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              🛡️ <em>Seguridad:</em> Si tú no solicitaste este restablecimiento, puedes ingresar inmediatamente con esta clave temporal y cambiarla desde tu panel de usuario.
            </p>
          </div>

          <div class="footer">
            INVENTARIO BOVINO APP • Sistema de Gestión Ganadera, Pesajes & Reproducción
          </div>
        </div>
      </body>
      </html>
    `;

    relayData = {
      _subject: finalSubject,
      '🔐 Asunto': 'Restablecimiento de Contraseña',
      '👤 Ganadero': name,
      '🌿 Finca': farmName,
      '📧 Correo': to,
      '🔑 Clave Temporal': tempPassword,
      '🌐 Ingresar a la App': loginUrl,
      _html: htmlContent,
    };
  } else {
    // Bienvenida por defecto
    finalSubject = subject || `🐂 ¡Bienvenido a INVENTARIO BOVINO APP! - Credenciales de ${farmName || 'tu Finca'}`;
    htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 25px; }
          .card { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #cbd5e1; }
          .credential-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .credential-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #475569; }
          .value { font-weight: 700; color: #0f172a; }
          .btn-container { text-align: center; margin-top: 25px; margin-bottom: 15px; }
          .btn { display: inline-block; background-color: #059669; color: #ffffff !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(5,150,105,0.3); }
          .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 40px; margin-bottom: 8px;">🐂</div>
            <h1>¡Bienvenido a INVENTARIO BOVINO APP!</h1>
            <p>Tu plataforma ganadera para <strong>${farmName || 'tu finca'}</strong></p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${name || 'Ganadero'}</strong>,</p>
            <p>Tu cuenta ha sido creada exitosamente. A continuación tienes tus credenciales de acceso para que puedas ingresar desde tu celular, tablet o computador:</p>
            
            <div class="card">
              <div class="credential-row">
                <span class="label">🌿 Finca / Hacienda:</span>
                <span class="value">${farmName || 'Mi Finca'}</span>
              </div>
              <div class="credential-row">
                <span class="label">👤 Propietario / Admin:</span>
                <span class="value">${name || 'Ganadero'}</span>
              </div>
              <div class="credential-row">
                <span class="label">📧 Correo / Usuario:</span>
                <span class="value">${to}</span>
              </div>
              <div class="credential-row">
                <span class="label">🔑 Contraseña Inicial:</span>
                <span class="value">${password || '••••••••'}</span>
              </div>
            </div>

            <div class="btn-container">
              <a href="${loginUrl}" class="btn">
                Ingresar a Mi Finca Ahora →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              💡 <em>Consejo:</em> Puedes ingresar desde cualquier celular o computador utilizando este mismo usuario y contraseña. Tus datos se sincronizan automáticamente en la nube.
            </p>
          </div>

          <div class="footer">
            INVENTARIO BOVINO APP • Sistema de Gestión Ganadera, Pesajes & Reproducción
          </div>
        </div>
      </body>
      </html>
    `;

    relayData = {
      _subject: finalSubject,
      '🌿 Finca': farmName,
      '👤 Ganadero': name,
      '📧 Correo': to,
      '🔑 Contraseña': password,
      '🌐 Enlace Directo': loginUrl,
      _html: htmlContent,
    };
  }

  // 1. Intentar enviar con Resend API si existe clave configurada
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'INVENTARIO BOVINO APP <onboarding@resend.dev>',
          to: [to],
          subject: finalSubject,
          html: htmlContent,
        }),
      });

      if (resendResponse.ok) {
        const data = await resendResponse.json();
        return res.status(200).json({
          success: true,
          provider: 'resend',
          id: data.id,
          message: `Correo enviado exitosamente a ${to}`
        });
      }
    } catch (e) {
      console.warn('Error enviando con Resend:', e);
    }
  }

  // 2. Fallback mediante Relay FormSubmit
  try {
    const fsResponse = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://finca-ganadera-gamma.vercel.app',
        'Referer': 'https://finca-ganadera-gamma.vercel.app/',
        'User-Agent': 'Mozilla/5.0 (compatible; InventarioBovino/1.0)',
      },
      body: JSON.stringify(relayData),
    });

    const fsData = await fsResponse.json().catch(() => ({}));
    const needsActivation = fsData.message && fsData.message.includes('needs Activation');

    return res.status(200).json({ 
      success: true, 
      provider: 'formsubmit',
      needsActivation: !!needsActivation,
      message: needsActivation
        ? `Revisa tu correo ${to} (y la carpeta de Spam) y pulsa "Activate Form" para confirmar la recepción.`
        : `Mensaje despachado exitosamente a ${to}` 
    });
  } catch (err) {
    console.error('Error enviando email:', err);
    return res.status(500).json({ error: err.message });
  }
}


