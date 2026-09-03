// Vercel Serverless Function para sincronización multi-dispositivo (Celular <-> PC)

// Memoria global temporal compartida para instancias en caliente
const memoryStore = {
  users: {},
  data: {},
};

export default async function handler(req, res) {
  // Configurar encabezados CORS para permitir cualquier dispositivo, celular o red WiFi/4G
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

  const { action } = req.query || req.body || {};

  try {
    // 1. Guardar o registrar usuario en la nube
    if (action === 'save_user' || (req.method === 'POST' && req.body?.type === 'user')) {
      const user = req.body?.user || req.body;
      const cleanEmail = (user.email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return res.status(400).json({ error: 'Email requerido' });
      }

      memoryStore.users[cleanEmail] = {
        id: user.id,
        name: user.name,
        farmName: user.farmName,
        email: cleanEmail,
        passwordHash: user.passwordHash,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({ success: true, user: memoryStore.users[cleanEmail] });
    }

    // 2. Buscar usuario por correo/usuario en la nube
    if (action === 'get_user') {
      const email = (req.query?.email || req.body?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
      }

      const user = memoryStore.users[email] || null;
      return res.status(200).json({ success: true, user });
    }

    // 3. Subir datos de ganado y pesajes del usuario
    if (action === 'push_data' || (req.method === 'POST' && req.body?.type === 'data')) {
      const { userId, cattle, weighings } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      memoryStore.data[userId] = {
        userId,
        cattle: Array.isArray(cattle) ? cattle : [],
        weighings: Array.isArray(weighings) ? weighings : [],
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({ success: true, count: memoryStore.data[userId].cattle.length });
    }

    // 4. Descargar datos de ganado y pesajes del usuario
    if (action === 'pull_data') {
      const userId = req.query?.userId || req.body?.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      const data = memoryStore.data[userId] || { userId, cattle: [], weighings: [] };
      return res.status(200).json({ success: true, data });
    }

    // 5. Ping de estado
    return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  } catch (err) {
    console.error('Error en /api/cloud:', err);
    return res.status(500).json({ error: err.message });
  }
}
