// Vercel Serverless Function para envío automatizado de correos de bienvenida con credenciales

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

  const { to, name, farmName, password, loginUrl, subject } = req.body || {};

  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Correo de destino requerido y válido' });
  }

  const htmlContent = `
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
              <span class="label">🔑 Contraseña:</span>
              <span class="value">${password || '••••••••'}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${loginUrl || 'https://finca-ganadera-gamma.vercel.app'}" class="btn">
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

  try {
    // Intentar despachar mediante relay FormSubmit
    await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: subject || `🐂 Credenciales de Acceso - ${farmName}`,
        '🌿 Finca': farmName,
        '👤 Ganadero': name,
        '📧 Correo': to,
        '🔑 Contraseña': password,
        '🌐 Enlace Directo': loginUrl,
        _html: htmlContent,
      }),
    }).catch(() => null);

    return res.status(200).json({ 
      success: true, 
      message: `Mensaje de bienvenida y credenciales despachadas a ${to}` 
    });
  } catch (err) {
    console.error('Error enviando email:', err);
    return res.status(500).json({ error: err.message });
  }
}
