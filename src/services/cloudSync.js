import { db } from './db';

const FIREBASE_URL = 'https://ganadera-plataforma-default-rtdb.firebaseio.com';

/**
 * Normaliza y codifica el correo electrónico para ser una clave válida en Firebase Realtime Database
 */
export function toSafeEmailKey(email) {
  if (!email) return '';
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, '_dot_');
}

/**
 * Guarda o actualiza el perfil del usuario en Firebase Realtime Database
 */
export async function cloudSaveUser(user) {
  if (!user || !user.email) return false;
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);

  const userPayload = {
    id: user.id,
    name: user.name,
    farmName: user.farmName,
    email: cleanEmail,
    passwordHash: user.passwordHash,
    mustChangePassword: !!user.mustChangePassword,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload),
    });
    return res.ok;
  } catch (err) {
    console.warn('⚠️ Error en cloudSaveUser Firebase:', err);
    return false;
  }
}

/**
 * Busca un usuario en Firebase Realtime Database por correo
 */
export async function cloudFindUser(email) {
  if (!email) return null;
  const cleanEmail = (email || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);

  try {
    const res = await fetch(`${FIREBASE_URL}/users/${safeEmail}.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.email || '').toLowerCase() === cleanEmail) {
        return data;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudFindUser Firebase:', e);
  }

  return null;
}

/**
 * Sube a Firebase el inventario completo de ganado, pesajes, vacunaciones, palpaciones y finanzas
 */
export async function cloudPushData(userId) {
  if (!userId) return false;

  try {
    const cattle = await db.cattle.filter(c => c.userId === userId || !c.userId).toArray();
    const weighings = await db.weighings.filter(w => w.userId === userId || !w.userId).toArray();
    const expenses = db.expenses ? await db.expenses.filter(e => e.userId === userId || !e.userId).toArray() : [];
    const vaccinations = db.vaccinations ? await db.vaccinations.filter(v => v.userId === userId || !v.userId).toArray() : [];
    const audits = db.audits ? await db.audits.filter(a => a.userId === userId || !a.userId).toArray() : [];
    const palpations = db.palpations ? await db.palpations.filter(p => p.userId === userId || !p.userId).toArray() : [];
    const paddocks = db.paddocks ? await db.paddocks.filter(p => p.userId === userId || !p.userId).toArray() : [];
    const milkRecords = db.milkRecords ? await db.milkRecords.filter(m => m.userId === userId || !m.userId).toArray() : [];
    const milkDeliveries = db.milkDeliveries ? await db.milkDeliveries.filter(m => m.userId === userId || !m.userId).toArray() : [];
    const transactions = db.transactions ? await db.transactions.filter(t => t.userId === userId || !t.userId).toArray() : [];
    const activityLogs = db.activityLogs ? await db.activityLogs.filter(a => a.userId === userId || !a.userId).toArray() : [];

    const payload = {
      userId,
      cattle,
      weighings,
      expenses,
      vaccinations,
      audits,
      palpations,
      paddocks,
      milkRecords,
      milkDeliveries,
      transactions,
      activityLogs,
      syncedAt: new Date().toISOString(),
    };

    const res = await fetch(`${FIREBASE_URL}/userData/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (e) {
    console.warn('⚠️ Error en cloudPushData Firebase:', e);
    return false;
  }
}

/**
 * Normaliza cualquier valor recibido de Firebase a un array seguro
 * (Soporta arrays nativos, objetos indexados {0:..., 1:...}, null y undefined)
 */
function normalizeRemoteList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object') return Object.values(val).filter(Boolean);
  return [];
}

/**
 * Reconcilia y sincroniza una tabla local con la versión remota de Firebase
 * (Añade, actualiza y elimina automáticamente para reflejar cambios de otros dispositivos)
 */
async function reconcileCollection(tableName, rawRemoteData, userId) {
  if (!db[tableName]) return;

  const remoteList = normalizeRemoteList(rawRemoteData);
  const remoteIds = new Set(remoteList.map(item => String(item.id)));

  // 1. Guardar o actualizar todos los registros recibidos de la nube
  for (const item of remoteList) {
    if (item && item.id) {
      await db[tableName].put({ ...item, userId });
    }
  }

  // 2. Eliminar registros locales que ya no existen en la nube (fueron borrados en otro celular/computador)
  try {
    const localItems = await db[tableName].filter(item => item.userId === userId || !item.userId).toArray();
    for (const localItem of localItems) {
      if (localItem.id && !remoteIds.has(String(localItem.id))) {
        await db[tableName].delete(localItem.id).catch(() => null);
      }
    }
  } catch (err) {
    console.warn(`Error reconciliando colección ${tableName}:`, err);
  }
}

/**
 * Descarga el inventario, pesajes, vacunaciones y registros desde Firebase Realtime Database
 * Sincroniza bidireccionalmente cualquier cambio hecho en otro dispositivo en tiempo real
 */
export async function cloudPullData(userId) {
  if (!userId) return false;

  try {
    const res = await fetch(`${FIREBASE_URL}/userData/${userId}.json?_t=${Date.now()}`);
    if (res.ok) {
      const remoteData = await res.json();
      if (remoteData && typeof remoteData === 'object') {
        const collections = [
          'cattle',
          'weighings',
          'expenses',
          'vaccinations',
          'audits',
          'palpations',
          'paddocks',
          'milkRecords',
          'milkDeliveries',
          'transactions',
          'activityLogs'
        ];

        for (const col of collections) {
          if (remoteData[col] !== undefined) {
            await reconcileCollection(col, remoteData[col], userId);
          }
        }
        return true;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudPullData Firebase:', e);
  }

  return false;
}

/**
 * Elimina completamente todos los registros del usuario en Firebase de forma permanente
 */
export async function cloudDeleteUserData(userId, email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const safeEmail = toSafeEmailKey(cleanEmail);

    // 1. Eliminar nodo directo de usuario en Firebase (/users/<safeEmail>.json)
    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 2. Eliminar nodo de datos de finca (/userData/<userId>.json)
    if (userId) {
      await fetch(`${FIREBASE_URL}/userData/${userId}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 3. Barrido profundo exhaustivo en /users.json para borrar cualquier nodo que coincida con el correo o userId
    try {
      const res = await fetch(`${FIREBASE_URL}/users.json?_t=${Date.now()}`);
      if (res.ok) {
        const allUsers = await res.json();
        if (allUsers && typeof allUsers === 'object') {
          for (const [key, userObj] of Object.entries(allUsers)) {
            if (
              userObj && 
              ((userObj.email && userObj.email.trim().toLowerCase() === cleanEmail) || 
               (userId && userObj.id === userId))
            ) {
              await fetch(`${FIREBASE_URL}/users/${key}.json`, { method: 'DELETE' }).catch(() => null);
            }
          }
        }
      }
    } catch (scanErr) {
      console.warn('⚠️ Error en barrido profundo de eliminación en Firebase:', scanErr);
    }

    return true;
  } catch (err) {
    console.warn('⚠️ Error en cloudDeleteUserData Firebase:', err);
    return false;
  }
}


/**
 * Sincronización automática de descarga desde la nube
 */
export async function syncCloudAndLocal(userId) {
  if (!userId) return;
  try {
    // Solo descargar y reconciliar (las subidas solo ocurren cuando el usuario crea/edita/borra en este dispositivo)
    await cloudPullData(userId);
  } catch (e) {
    console.warn('⚠️ Error en syncCloudAndLocal Firebase:', e);
  }
}

/**
 * Guarda o registra una cuenta de trabajador en Firebase tanto en /users como en /userData/<ownerId>/workers
 */
export async function cloudSaveWorker(ownerId, workerUser) {
  if (!ownerId || !workerUser || !workerUser.email) return false;
  const safeEmail = toSafeEmailKey(workerUser.email);
  try {
    // 1. Guardar en /users/<safeEmail>.json para autenticación directa
    await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerUser),
    });

    // 2. Guardar en /userData/<ownerId>/workers/<workerId>.json para listado del administrador
    if (workerUser.id) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerUser.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerUser),
      });
    }
    return true;
  } catch (e) {
    console.warn('⚠️ Error en cloudSaveWorker:', e);
    return false;
  }
}

/**
 * Obtiene todos los trabajadores asignados a la finca del propietario desde Firebase
 */
export async function cloudGetFarmWorkers(ownerId) {
  if (!ownerId) return [];
  try {
    const res = await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (!data) return [];
      if (Array.isArray(data)) return data.filter(Boolean);
      if (typeof data === 'object') return Object.values(data).filter(Boolean);
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudGetFarmWorkers:', e);
  }
  return [];
}

/**
 * Actualiza el estado (activo/inactivo) o contraseña del trabajador en Firebase
 */
export async function cloudUpdateWorker(ownerId, workerId, workerEmail, updates) {
  if (!workerEmail) return false;
  const safeEmail = toSafeEmailKey(workerEmail);
  try {
    // Actualizar en /users/<safeEmail>
    await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
    });

    // Actualizar en /userData/<ownerId>/workers/<workerId>
    if (ownerId && workerId) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
      });
    }
    return true;
  } catch (e) {
    console.warn('⚠️ Error en cloudUpdateWorker:', e);
    return false;
  }
}

/**
 * Elimina permanentemente la cuenta de un trabajador de Firebase
 */
export async function cloudDeleteWorker(ownerId, workerId, workerEmail) {
  if (!workerEmail) return false;
  const safeEmail = toSafeEmailKey(workerEmail);
  try {
    // 1. Eliminar acceso de usuario
    await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, { method: 'DELETE' });

    // 2. Eliminar del listado del propietario
    if (ownerId && workerId) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerId}.json`, { method: 'DELETE' });
    }
    return true;
  } catch (e) {
    console.warn('⚠️ Error en cloudDeleteWorker:', e);
    return false;
  }
}

