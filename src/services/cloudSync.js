import { db } from './db';

const CLOUD_API_URL = 'https://api.restful-api.dev/objects';
const REGISTRY_STORAGE_KEY = 'ganado_cloud_user_id_';
const DATA_STORAGE_KEY = 'ganado_cloud_data_id_';

/**
 * Guarda o actualiza el usuario en la Nube Global
 */
export async function cloudSaveUser(user) {
  if (!user || !user.email) return false;
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const targetName = `bovino_usr_${cleanEmail}`;

  const userPayload = {
    id: user.id,
    name: user.name,
    farmName: user.farmName,
    email: cleanEmail,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    let cloudId = localStorage.getItem(REGISTRY_STORAGE_KEY + cleanEmail);

    if (!cloudId) {
      const listRes = await fetch(CLOUD_API_URL).catch(() => null);
      if (listRes && listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list)) {
          const found = list.find(item => item.name === targetName);
          if (found && found.id) {
            cloudId = found.id;
            localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, cloudId);
          }
        }
      }
    }

    if (cloudId) {
      const updateRes = await fetch(`${CLOUD_API_URL}/${cloudId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          data: userPayload,
        }),
      }).catch(() => null);

      if (updateRes && updateRes.ok) return true;
    }

    const createRes = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: targetName,
        data: userPayload,
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      if (created && created.id) {
        localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, created.id);
        return true;
      }
    }
  } catch (err) {
    console.warn('Error en cloudSaveUser:', err);
  }

  return false;
}

/**
 * Busca un usuario en la Nube Global
 */
export async function cloudFindUser(email) {
  if (!email) return null;
  const cleanEmail = (email || '').trim().toLowerCase();
  const targetName = `bovino_usr_${cleanEmail}`;

  try {
    const res = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const found = list.find(item => item.name === targetName);
        if (found && found.data && (found.data.email || '').toLowerCase() === cleanEmail) {
          localStorage.setItem(REGISTRY_STORAGE_KEY + cleanEmail, found.id);
          return found.data;
        }
      }
    }
  } catch (e) {
    console.warn('Error en cloudFindUser:', e);
  }

  return null;
}

/**
 * Sube a la nube el inventario completo de ganado y pesajes del usuario
 */
export async function cloudPushData(userId) {
  if (!userId) return false;
  const targetName = `bovino_dat_${userId}`;

  try {
    const cattle = await db.cattle.filter(c => c.userId === userId || !c.userId).toArray();
    const weighings = await db.weighings.filter(w => w.userId === userId || !w.userId).toArray();
    const expenses = await db.expenses.filter(e => e.userId === userId || !e.userId).toArray();

    const payload = {
      userId,
      cattle,
      weighings,
      expenses,
      syncedAt: new Date().toISOString(),
    };

    let cloudDataId = localStorage.getItem(DATA_STORAGE_KEY + userId);

    if (!cloudDataId) {
      const listRes = await fetch(CLOUD_API_URL).catch(() => null);
      if (listRes && listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list)) {
          const found = list.find(item => item.name === targetName);
          if (found && found.id) {
            cloudDataId = found.id;
            localStorage.setItem(DATA_STORAGE_KEY + userId, cloudDataId);
          }
        }
      }
    }

    if (cloudDataId) {
      const updateRes = await fetch(`${CLOUD_API_URL}/${cloudDataId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          data: payload,
        }),
      }).catch(() => null);

      if (updateRes && updateRes.ok) return true;
    }

    const createRes = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: targetName,
        data: payload,
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      if (created && created.id) {
        localStorage.setItem(DATA_STORAGE_KEY + userId, created.id);
        return true;
      }
    }
  } catch (e) {
    console.warn('Error en cloudPushData:', e);
  }

  return false;
}

/**
 * Descarga el inventario y pesajes del usuario desde la nube a este dispositivo
 */
export async function cloudPullData(userId) {
  if (!userId) return false;
  const targetName = `bovino_dat_${userId}`;

  try {
    const res = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const found = list.find(item => item.name === targetName);
        if (found && found.data) {
          const remoteData = found.data;
          if (Array.isArray(remoteData.cattle)) {
            for (const item of remoteData.cattle) {
              await db.cattle.put({ ...item, userId });
            }
          }
          if (Array.isArray(remoteData.weighings)) {
            for (const item of remoteData.weighings) {
              await db.weighings.put({ ...item, userId });
            }
          }
          if (Array.isArray(remoteData.expenses)) {
            for (const item of remoteData.expenses) {
              await db.expenses.put({ ...item, userId });
            }
          }
          localStorage.setItem(DATA_STORAGE_KEY + userId, found.id);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Error en cloudPullData:', e);
  }

  return false;
}

/**
 * Elimina completamente todos los registros del usuario en la nube
 */
export async function cloudDeleteUserData(userId, email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const userTarget = `bovino_usr_${cleanEmail}`;
    const dataTarget = `bovino_dat_${userId}`;

    const listRes = await fetch(`${CLOUD_API_URL}?_t=${Date.now()}`).catch(() => null);
    if (listRes && listRes.ok) {
      const list = await listRes.json();
      if (Array.isArray(list)) {
        const userObj = list.find(item => item.name === userTarget);
        if (userObj && userObj.id) {
          await fetch(`${CLOUD_API_URL}/${userObj.id}`, { method: 'DELETE' }).catch(() => null);
        }

        const dataObj = list.find(item => item.name === dataTarget);
        if (dataObj && dataObj.id) {
          await fetch(`${CLOUD_API_URL}/${dataObj.id}`, { method: 'DELETE' }).catch(() => null);
        }
      }
    }

    if (cleanEmail) localStorage.removeItem(REGISTRY_STORAGE_KEY + cleanEmail);
    if (userId) localStorage.removeItem(DATA_STORAGE_KEY + userId);

    return true;
  } catch (err) {
    console.warn('Error en cloudDeleteUserData:', err);
    return false;
  }
}

/**
 * Sincronización automática de todas las cuentas locales existentes hacia la nube
 */
export async function syncAllLocalAccountsToCloud() {
  try {
    const allUsers = await db.users.toArray();
    for (const u of allUsers) {
      await cloudSaveUser(u);
      await cloudPushData(u.id);
    }
  } catch (e) {
    console.warn('Error en auto-sync de cuentas locales:', e);
  }
}

/**
 * Sincronización bidireccional automática (Pull + Push)
 */
export async function syncCloudAndLocal(userId) {
  if (!userId) return;
  try {
    await cloudPullData(userId);
    await cloudPushData(userId);
  } catch (e) {
    console.warn('Error en syncCloudAndLocal:', e);
  }
}
