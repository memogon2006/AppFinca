import { db } from './db';

const FIREBASE_URL = 'https://ganadera-plataforma-default-rtdb.firebaseio.com';

/**
 * Petición fetch segura con abort timeout de 2.5s y bypass automático si no hay conexión
 */
async function safeFetch(url, options = {}, timeoutMs = 2500) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

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
    const res = await safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload),
    });
    return !!(res && res.ok);
  } catch (err) {
    console.warn('⚠️ Error en cloudSaveUser Firebase:', err);
    return false;
  }
}

/**
 * Busca un usuario en Firebase Realtime Database por correo o usuario
 */
export async function cloudFindUser(email) {
  if (!email) return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  const cleanEmail = (email || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);

  // 1. Búsqueda directa por clave segura
  try {
    const res = await safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json?_t=${Date.now()}`);
    if (res && res.ok) {
      const data = await res.json();
      if (data && (data.id || data.email)) {
        const isDel = await cloudIsWorkerDeleted(data.email || cleanEmail);
        if (isDel) {
          return { ...data, isDeleted: true };
        }
        return data;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudFindUser Firebase (directo):', e);
  }

  // 2. Si no contiene '@', buscar con '@finca.local'
  if (!cleanEmail.includes('@')) {
    try {
      const safeWithDomain = toSafeEmailKey(`${cleanEmail}@finca.local`);
      const res = await safeFetch(`${FIREBASE_URL}/users/${safeWithDomain}.json?_t=${Date.now()}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data && (data.id || data.email)) {
          const isDel = await cloudIsWorkerDeleted(data.email || cleanEmail);
          if (isDel) {
            return { ...data, isDeleted: true };
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('⚠️ Error en cloudFindUser Firebase (con dominio):', e);
    }
  }

  // 3. Si termina en '@finca.local', buscar sin el dominio (alias plano)
  if (cleanEmail.endsWith('@finca.local')) {
    try {
      const alias = cleanEmail.replace('@finca.local', '');
      const safeAlias = toSafeEmailKey(alias);
      if (safeAlias && safeAlias !== safeEmail) {
        const res = await safeFetch(`${FIREBASE_URL}/users/${safeAlias}.json?_t=${Date.now()}`);
        if (res && res.ok) {
          const data = await res.json();
          if (data && (data.id || data.email)) {
            const isDel = await cloudIsWorkerDeleted(data.email || cleanEmail);
            if (isDel) {
              return { ...data, isDeleted: true };
            }
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Error en cloudFindUser Firebase (alias plano):', e);
    }
  }

  // 4. Si no se encontró en /users/, verificar si está en la lista de eliminados
  const isDel = await cloudIsWorkerDeleted(cleanEmail);
  if (isDel) {
    return { isDeleted: true, email: cleanEmail, role: 'worker' };
  }

  return null;
}

const PENDING_SYNC_KEY = 'ganadera_pending_sync_';
const PENDING_DEL_KEY = 'ganadera_pending_del_';

/**
 * Registra IDs de elementos creados o editados localmente pendientes de sincronizar con Firebase
 */
export function markPendingSync(userId, ...itemIds) {
  if (!userId || !itemIds || itemIds.length === 0) return;
  try {
    const key = `${PENDING_SYNC_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const set = new Set(raw ? JSON.parse(raw) : []);
    itemIds.flat().filter(Boolean).forEach(id => set.add(String(id)));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error saving markPendingSync:', e);
  }
}

/**
 * Obtiene el conjunto de IDs locales pendientes de subida
 */
export function getPendingSyncIds(userId) {
  if (!userId) return new Set();
  try {
    const key = `${PENDING_SYNC_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/**
 * Limpia los IDs locales sincronizados exitosamente
 */
export function clearPendingSync(userId, itemIds = null) {
  if (!userId) return;
  try {
    const key = `${PENDING_SYNC_KEY}${userId}`;
    if (!itemIds) {
      localStorage.removeItem(key);
    } else {
      const raw = localStorage.getItem(key);
      const set = new Set(raw ? JSON.parse(raw) : []);
      const toRemove = new Set((Array.isArray(itemIds) ? itemIds : [itemIds]).map(String));
      const remaining = Array.from(set).filter(id => !toRemove.has(id));
      if (remaining.length > 0) {
        localStorage.setItem(key, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Error in clearPendingSync:', e);
  }
}

/**
 * Registra elementos eliminados localmente de forma offline para no recrearlos al descargar de Firebase
 */
export function markPendingDelete(userId, tableName, ...itemIds) {
  if (!userId || !tableName || !itemIds || itemIds.length === 0) return;
  try {
    const key = `${PENDING_DEL_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const validIds = itemIds.flat().filter(Boolean).map(String);
    for (const id of validIds) {
      if (!list.some(item => item.tableName === tableName && String(item.id) === id)) {
        list.push({ tableName, id });
      }
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('Error in markPendingDelete:', e);
  }
}

/**
 * Obtiene la lista de elementos eliminados localmente offline pendientes de propagar a Firebase
 */
export function getPendingDeletes(userId) {
  if (!userId) return [];
  try {
    const key = `${PENDING_DEL_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Limpia la lista de eliminaciones pendientes
 */
export function clearPendingDeletes(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(`${PENDING_DEL_KEY}${userId}`);
  } catch (e) {
    console.warn('Error in clearPendingDeletes:', e);
  }
}

/**
 * Indica si este dispositivo tiene creaciones, ediciones o eliminaciones locales pendientes de subir a la nube
 */
export function hasPendingSync(userId) {
  if (!userId) return false;
  return getPendingSyncIds(userId).size > 0 || getPendingDeletes(userId).length > 0;
}

/**
 * Sube a Firebase el inventario completo de ganado, pesajes, vacunaciones, palpaciones y finanzas
 */
export async function cloudPushData(userId) {
  if (!userId) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    const isTarget = item => !item.userId || item.userId === userId || String(item.userId).startsWith('usr_wrk_') || item.ownerId === userId;
    const cattle = await db.cattle.filter(isTarget).toArray();
    const weighings = await db.weighings.filter(isTarget).toArray();
    const expenses = db.expenses ? await db.expenses.filter(isTarget).toArray() : [];
    const vaccinations = db.vaccinations ? await db.vaccinations.filter(isTarget).toArray() : [];
    const audits = db.audits ? await db.audits.filter(isTarget).toArray() : [];
    const palpations = db.palpations ? await db.palpations.filter(isTarget).toArray() : [];
    const paddocks = db.paddocks ? await db.paddocks.filter(isTarget).toArray() : [];
    const milkRecords = db.milkRecords ? await db.milkRecords.filter(isTarget).toArray() : [];
    const milkDeliveries = db.milkDeliveries ? await db.milkDeliveries.filter(isTarget).toArray() : [];
    const transactions = db.transactions ? await db.transactions.filter(isTarget).toArray() : [];
    const farmExpenses = db.farmExpenses ? await db.farmExpenses.filter(isTarget).toArray() : [];
    const farmIncomes = db.farmIncomes ? await db.farmIncomes.filter(isTarget).toArray() : [];
    const activityLogs = db.activityLogs ? await db.activityLogs.filter(isTarget).toArray() : [];
    const calendarNotes = db.calendarNotes ? await db.calendarNotes.filter(isTarget).toArray() : [];

    const payload = {
      userId,
      cattle,
      weighings,
      expenses,
      farmExpenses,
      farmIncomes,
      vaccinations,
      audits,
      palpations,
      paddocks,
      milkRecords,
      milkDeliveries,
      transactions,
      activityLogs,
      calendarNotes,
      syncedAt: new Date().toISOString(),
    };

    const res = await safeFetch(`${FIREBASE_URL}/userData/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      // Limpiar cola de pendientes al confirmar que Firebase recibió los datos
      clearPendingSync(userId);
      clearPendingDeletes(userId);
      return true;
    }
    return false;
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
 * Protege estrictamente cualquier registro pendiente creado offline localmente
 */
async function reconcileCollection(tableName, rawRemoteData, userId) {
  if (!db[tableName] || rawRemoteData === undefined || rawRemoteData === null) return;

  const remoteList = normalizeRemoteList(rawRemoteData);
  const pendingIds = getPendingSyncIds(userId);
  const pendingDeletes = getPendingDeletes(userId)
    .filter(d => d.tableName === tableName)
    .map(d => String(d.id));
  const pendingDeleteSet = new Set(pendingDeletes);

  // 1. Guardar o actualizar todos los registros recibidos en una sola operación batch ultrarrápida
  // Excluir registros que hayan sido eliminados offline localmente
  const validItems = remoteList
    .filter(item => item && item.id && !pendingDeleteSet.has(String(item.id)))
    .map(item => ({ ...item, userId }));

  if (validItems.length > 0) {
    try {
      await db[tableName].bulkPut(validItems);
    } catch (bulkErr) {
      // Fallback individual si algún registro tiene formato irregular
      for (const item of validItems) {
        await db[tableName].put(item).catch(() => null);
      }
    }
  }

  // 2. Eliminar registros locales obsoletos en una sola operación batch
  // NUNCA eliminar registros que fueron creados o modificados localmente y están pendientes de subida
  try {
    const remoteIds = new Set(remoteList.map(item => String(item.id)));
    const isTarget = item => !item.userId || item.userId === userId || String(item.userId).startsWith('usr_wrk_') || item.ownerId === userId;
    const localItems = await db[tableName].filter(isTarget).toArray();
    const idsToDelete = localItems
      .filter(localItem => 
        localItem.id && 
        !remoteIds.has(String(localItem.id)) && 
        !pendingIds.has(String(localItem.id))
      )
      .map(localItem => localItem.id);

    if (idsToDelete.length > 0) {
      await db[tableName].bulkDelete(idsToDelete).catch(() => null);
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
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    const res = await safeFetch(`${FIREBASE_URL}/userData/${userId}.json?_t=${Date.now()}`);
    if (res && res.ok) {
      const remoteData = await res.json();
      if (remoteData && typeof remoteData === 'object') {
        const collections = [
          'cattle',
          'weighings',
          'expenses',
          'farmExpenses',
          'farmIncomes',
          'vaccinations',
          'audits',
          'palpations',
          'paddocks',
          'milkRecords',
          'milkDeliveries',
          'transactions',
          'activityLogs',
          'calendarNotes'
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
 * Sincronización bidireccional inteligente y segura para múltiples computadores simultáneos
 * Si hay cambios locales offline pendientes: PULL de la nube (protegiendo lo offline) y luego PUSH de la unión.
 * Si NO hay cambios pendientes en este equipo: SOLAMENTE PULL para recibir de inmediato lo hecho en otros equipos sin sobreescribir.
 */
export async function syncCloudAndLocal(userId) {
  if (!userId) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const hasPending = hasPendingSync(userId);
    if (hasPending) {
      // 1. Descargar cambios remotos (reconcilia y preserva pendientes locales)
      await cloudPullData(userId);
      // 2. Subir base de datos completa unificada a Firebase
      await cloudPushData(userId);
    } else {
      // 3. Solo descargar cambios nuevos de otros equipos en tiempo real
      await cloudPullData(userId);
    }
  } catch (e) {
    console.warn('⚠️ Error en syncCloudAndLocal Firebase:', e);
  }
}

/**
 * Obtiene el registro de trabajadores eliminados desde Firebase
 */
export async function cloudGetDeletedWorkers() {
  try {
    const res = await fetch(`${FIREBASE_URL}/deletedWorkers.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data && typeof data === 'object' ? data : {};
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudGetDeletedWorkers:', e);
  }
  return {};
}

/**
 * Verifica si un trabajador o usuario está registrado como eliminado en Firebase
 */
export async function cloudIsWorkerDeleted(emailOrUsername) {
  if (!emailOrUsername) return false;
  const clean = String(emailOrUsername).trim().toLowerCase();
  const rawAlias = clean.replace('@finca.local', '').replace(/[^a-z0-9_.-]/g, '');
  const withDomain = clean.includes('@') ? clean : `${rawAlias}@finca.local`;

  try {
    const safeDirect = toSafeEmailKey(clean);
    const safeDomain = toSafeEmailKey(withDomain);
    const safeAlias = toSafeEmailKey(rawAlias);

    const [resDirect, resDomain, resAlias] = await Promise.all([
      safeDirect ? fetch(`${FIREBASE_URL}/deletedWorkers/${safeDirect}.json?_t=${Date.now()}`).catch(() => null) : null,
      safeDomain && safeDomain !== safeDirect ? fetch(`${FIREBASE_URL}/deletedWorkers/${safeDomain}.json?_t=${Date.now()}`).catch(() => null) : null,
      safeAlias && safeAlias !== safeDirect ? fetch(`${FIREBASE_URL}/deletedWorkers/${safeAlias}.json?_t=${Date.now()}`).catch(() => null) : null,
    ]);

    if (resDirect && resDirect.ok) {
      const d = await resDirect.json();
      if (d) return true;
    }
    if (resDomain && resDomain.ok) {
      const d = await resDomain.json();
      if (d) return true;
    }
    if (resAlias && resAlias.ok) {
      const d = await resAlias.json();
      if (d) return true;
    }
  } catch (e) {
    console.warn('⚠️ Error comprobando deletedWorkers:', e);
  }

  return false;
}

/**
 * Guarda o registra una cuenta de trabajador en Firebase tanto en /users como en /userData/<ownerId>/workers
 */
export async function cloudSaveWorker(ownerId, workerUser) {
  if (!ownerId || !workerUser || !workerUser.email) return false;
  const cleanEmail = (workerUser.email || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);
  const rawAlias = (workerUser.username || cleanEmail.replace('@finca.local', '')).trim().toLowerCase();
  const safeAlias = toSafeEmailKey(rawAlias);

  try {
    // 0. Quitar de la lista de eliminados en Firebase si se vuelve a crear
    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/deletedWorkers/${safeEmail}.json`, { method: 'DELETE' }).catch(() => null);
    }
    if (safeAlias && safeAlias !== safeEmail) {
      await fetch(`${FIREBASE_URL}/deletedWorkers/${safeAlias}.json`, { method: 'DELETE' }).catch(() => null);
    }
    if (!cleanEmail.includes('@') && cleanEmail) {
      const safeWithDomain = toSafeEmailKey(`${cleanEmail}@finca.local`);
      await fetch(`${FIREBASE_URL}/deletedWorkers/${safeWithDomain}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 1. Guardar en /users/<safeEmail>.json para autenticación directa con correo
    await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerUser),
    }).catch(() => null);

    // 2. Guardar también en /users/<safeAlias>.json para autenticación directa con usuario simple
    if (safeAlias && safeAlias !== safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeAlias}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerUser),
      }).catch(() => null);
    }

    // 3. Guardar en /userData/<ownerId>/workers/<workerId>.json para listado del administrador
    if (workerUser.id) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerUser.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerUser),
      }).catch(() => null);
    }

    // 4. Si el propietario tiene ownerEmail, guardar también bajo la clave del email del propietario
    if (workerUser.ownerEmail) {
      const safeOwnerEmail = toSafeEmailKey(workerUser.ownerEmail);
      if (safeOwnerEmail && safeOwnerEmail !== ownerId && workerUser.id) {
        await fetch(`${FIREBASE_URL}/userData/${safeOwnerEmail}/workers/${workerUser.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workerUser),
        }).catch(() => null);
      }
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
export async function cloudGetFarmWorkers(ownerId, ownerEmail = null) {
  if (!ownerId && !ownerEmail) return [];
  const safeOwnerEmail = ownerEmail ? toSafeEmailKey(ownerEmail) : null;
  const workersMap = new Map();

  try {
    // 1. Consultar por ownerId
    if (ownerId) {
      const res = await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers.json?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const list = normalizeRemoteList(data);
        for (const w of list) {
          if (w && w.id) workersMap.set(String(w.id), w);
        }
      }
    }

    // 2. Consultar por safeOwnerEmail si es diferente
    if (safeOwnerEmail && safeOwnerEmail !== ownerId) {
      const res = await fetch(`${FIREBASE_URL}/userData/${safeOwnerEmail}/workers.json?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const list = normalizeRemoteList(data);
        for (const w of list) {
          if (w && w.id) workersMap.set(String(w.id), w);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudGetFarmWorkers:', e);
  }

  // Filtrar contra la lista de eliminados
  const deletedMap = await cloudGetDeletedWorkers().catch(() => ({}));
  const deletedKeys = new Set(
    Object.entries(deletedMap).flatMap(([k, v]) => [
      k.toLowerCase(),
      (v?.email || '').toLowerCase(),
      (v?.username || '').toLowerCase(),
      (v?.id || '')
    ]).filter(Boolean)
  );

  return Array.from(workersMap.values()).filter(w => {
    if (!w || !w.id) return false;
    const wId = String(w.id).toLowerCase();
    const wEmail = (w.email || '').toLowerCase();
    const wUser = (w.username || '').toLowerCase();
    if (deletedKeys.has(wId) || deletedKeys.has(wEmail) || deletedKeys.has(wUser)) {
      return false;
    }
    return true;
  });
}

/**
 * Actualiza el estado (activo/inactivo) o contraseña del trabajador en Firebase
 */
export async function cloudUpdateWorker(ownerId, workerId, workerEmail, updates) {
  if (!workerEmail && !workerId) return false;
  const cleanEmail = (workerEmail || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);
  const rawAlias = cleanEmail.replace('@finca.local', '');
  const safeAlias = toSafeEmailKey(rawAlias);

  try {
    const payload = JSON.stringify({ ...updates, updatedAt: new Date().toISOString() });

    // Actualizar en /users/<safeEmail>
    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => null);
    }

    // Actualizar en /users/<safeAlias>
    if (safeAlias && safeAlias !== safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeAlias}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => null);
    }

    // Actualizar en /userData/<ownerId>/workers/<workerId>
    if (ownerId && workerId) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => null);
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
export async function cloudDeleteWorker(ownerId, workerId, workerEmail, ownerEmail = null) {
  if (!workerEmail && !workerId) return false;
  const cleanEmail = (workerEmail || '').trim().toLowerCase();
  const safeEmail = toSafeEmailKey(cleanEmail);
  const rawAlias = cleanEmail.replace('@finca.local', '').replace(/[^a-z0-9_.-]/g, '');
  const safeAlias = toSafeEmailKey(rawAlias);
  const safeOwnerEmail = ownerEmail ? toSafeEmailKey(ownerEmail) : null;

  try {
    const deletedInfo = {
      id: workerId || '',
      email: cleanEmail,
      username: rawAlias,
      deletedAt: new Date().toISOString(),
    };

    // 1. Marcar como eliminado en /deletedWorkers
    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/deletedWorkers/${safeEmail}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletedInfo),
      }).catch(() => null);
    }
    if (safeAlias && safeAlias !== safeEmail) {
      await fetch(`${FIREBASE_URL}/deletedWorkers/${safeAlias}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletedInfo),
      }).catch(() => null);
    }

    // 2. Eliminar acceso de usuario en todas las variantes de clave en /users/
    if (safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeEmail}.json`, { method: 'DELETE' }).catch(() => null);
    }
    if (safeAlias && safeAlias !== safeEmail) {
      await fetch(`${FIREBASE_URL}/users/${safeAlias}.json`, { method: 'DELETE' }).catch(() => null);
    }
    if (!cleanEmail.includes('@') && cleanEmail) {
      const safeWithDomain = toSafeEmailKey(`${cleanEmail}@finca.local`);
      await fetch(`${FIREBASE_URL}/users/${safeWithDomain}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 3. Eliminar del listado del propietario bajo ownerId
    if (ownerId && workerId) {
      await fetch(`${FIREBASE_URL}/userData/${ownerId}/workers/${workerId}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 4. Eliminar del listado del propietario bajo safeOwnerEmail
    if (safeOwnerEmail && workerId) {
      await fetch(`${FIREBASE_URL}/userData/${safeOwnerEmail}/workers/${workerId}.json`, { method: 'DELETE' }).catch(() => null);
    }

    // 5. Barrido profundo en segundo plano por si existe en cualquier nodo de userData
    try {
      const res = await fetch(`${FIREBASE_URL}/userData.json?_t=${Date.now()}`);
      if (res.ok) {
        const userData = await res.json();
        if (userData && typeof userData === 'object') {
          for (const [userKey, data] of Object.entries(userData)) {
            if (data && data.workers && typeof data.workers === 'object') {
              for (const [wKey, wObj] of Object.entries(data.workers)) {
                const wEm = (wObj?.email || '').toLowerCase();
                const wUsr = (wObj?.username || '').toLowerCase();
                if (
                  (workerId && wKey === workerId) ||
                  (workerId && wObj?.id === workerId) ||
                  (cleanEmail && wEm === cleanEmail) ||
                  (rawAlias && (wUsr === rawAlias || wEm === rawAlias))
                ) {
                  await fetch(`${FIREBASE_URL}/userData/${userKey}/workers/${wKey}.json`, { method: 'DELETE' }).catch(() => null);
                }
              }
            }
          }
        }
      }
    } catch (e) {}

    return true;
  } catch (e) {
    console.warn('⚠️ Error en cloudDeleteWorker:', e);
    return false;
  }
}

