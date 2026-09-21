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
 * Descarga el inventario, pesajes, vacunaciones y registros desde Firebase Realtime Database
 */
export async function cloudPullData(userId) {
  if (!userId) return false;

  try {
    const res = await fetch(`${FIREBASE_URL}/userData/${userId}.json?_t=${Date.now()}`);
    if (res.ok) {
      const remoteData = await res.json();
      if (remoteData && typeof remoteData === 'object') {
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
        if (Array.isArray(remoteData.expenses) && db.expenses) {
          for (const item of remoteData.expenses) {
            await db.expenses.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.vaccinations) && db.vaccinations) {
          for (const item of remoteData.vaccinations) {
            await db.vaccinations.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.audits) && db.audits) {
          for (const item of remoteData.audits) {
            await db.audits.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.palpations) && db.palpations) {
          for (const item of remoteData.palpations) {
            await db.palpations.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.paddocks) && db.paddocks) {
          for (const item of remoteData.paddocks) {
            await db.paddocks.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.milkRecords) && db.milkRecords) {
          for (const item of remoteData.milkRecords) {
            await db.milkRecords.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.milkDeliveries) && db.milkDeliveries) {
          for (const item of remoteData.milkDeliveries) {
            await db.milkDeliveries.put({ ...item, userId });
          }
        }
        if (Array.isArray(remoteData.transactions) && db.transactions) {
          for (const item of remoteData.transactions) {
            await db.transactions.put({ ...item, userId });
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
 * Elimina completamente todos los registros del usuario en Firebase
 */
export async function cloudDeleteUserData(userId, email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const safeEmail = toSafeEmailKey(cleanEmail);

    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, { method: 'DELETE' }).catch(() => null);
    }
    if (userId) {
      await fetch(`${FIREBASE_URL}/userData/${userId}.json`, { method: 'DELETE' }).catch(() => null);
    }
    return true;
  } catch (err) {
    console.warn('⚠️ Error en cloudDeleteUserData Firebase:', err);
    return false;
  }
}

/**
 * Sincronización automática de todas las cuentas locales existentes hacia Firebase
 */
export async function syncAllLocalAccountsToCloud() {
  try {
    const allUsers = await db.users.toArray();
    for (const u of allUsers) {
      await cloudSaveUser(u);
      await cloudPushData(u.id);
    }
  } catch (e) {
    console.warn('⚠️ Error en auto-sync de cuentas locales Firebase:', e);
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
    console.warn('⚠️ Error en syncCloudAndLocal Firebase:', e);
  }
}
