import { db } from './db';
import { getActiveModules, setActiveModules, getModulesUpdatedAt } from './moduleService';

const FIREBASE_URL = 'https://ganadera-plataforma-default-rtdb.firebaseio.com';

// Listener para auto-subida inmediata PUSH-First cuando los módulos cambian en cualquier parte
if (typeof window !== 'undefined') {
  window.addEventListener('ganado_modules_changed', (e) => {
    const detail = e.detail;
    if (detail && detail.syncToCloud !== false) {
      const farmId = detail.farmId || (() => {
        try {
          const raw = localStorage.getItem('ganado_current_user_session');
          if (!raw) return null;
          const u = JSON.parse(raw);
          return u?.role === 'worker' ? (u.ownerId || u.id) : u?.id;
        } catch(err) { return null; }
      })();

      if (farmId && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const raw = localStorage.getItem('ganado_current_user_session');
          if (raw) {
            const u = JSON.parse(raw);
            if (u && u.role !== 'worker' && u.email) {
              const safeEmail = toSafeEmailKey(u.email);
              const modulesPayload = {
                activeModules: detail.modules || detail,
                activeModulesUpdatedAt: Date.now(),
                updatedAt: new Date().toISOString()
              };
              safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modulesPayload),
              }).catch(() => null);
            }
          }
        } catch (uErr) {}
        cloudPushData(farmId).catch(() => null);
      }
    }
  });

  // Listener para auto-subida inmediata cuando el perfil de sonido cambia
  window.addEventListener('ganado_sound_changed', (e) => {
    const detail = e.detail;
    if (detail && detail.syncToCloud !== false) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const raw = localStorage.getItem('ganado_current_user_session');
          if (raw) {
            const u = JSON.parse(raw);
            if (u && u.role !== 'worker' && u.email) {
              const safeEmail = toSafeEmailKey(u.email);
              const soundPayload = {
                soundProfile: detail.profile || 'chime',
                soundEnabled: detail.enabled !== undefined ? !!detail.enabled : true,
                updatedAt: new Date().toISOString()
              };
              safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(soundPayload),
              }).catch(() => null);
            }
          }
        } catch (uErr) {}
      }
    }
  });
}

/**
 * Petición fetch segura con abort timeout de 15s y bypass automático si no hay conexión
 */
async function safeFetch(url, options = {}, timeoutMs = 15000) {
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
 * Guarda o actualiza el perfil del usuario en Firebase Realtime Database sin sobreescribir campos existentes indebidamente
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
    role: user.role || 'admin',
    ownerId: user.ownerId || null,
    ownerEmail: user.ownerEmail || null,
    activeModules: user.activeModules || getActiveModules(),
    farmPreset: user.farmPreset || null,
    mustChangePassword: !!user.mustChangePassword,
    updatedAt: new Date().toISOString(),
  };

  if (user.soundProfile) {
    userPayload.soundProfile = user.soundProfile;
  }
  if (user.soundEnabled !== undefined) {
    userPayload.soundEnabled = !!user.soundEnabled;
  }
  if (user.passwordHash) {
    userPayload.passwordHash = user.passwordHash;
  }
  if (user.createdAt) {
    userPayload.createdAt = user.createdAt;
  }
  if (user.activeModulesUpdatedAt) {
    userPayload.activeModulesUpdatedAt = user.activeModulesUpdatedAt;
  }

  try {
    const res = await safeFetch(`${FIREBASE_URL}/users/${safeEmail}.json`, {
      method: 'PATCH',
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

  // 4. Búsqueda profunda en la colección de usuarios de Firebase
  // Permite encontrar la cuenta ingresando:
  // - Prefijo del correo (ej: 'juliayema' para 'juliayema@gmail.com')
  // - Nombre de la finca o hacienda (ej: 'LA JULIA', 'GANADERIA LA G', 'San Lorenzo')
  // - Nombre del administrador o ganadero (ej: 'LUIS GUILLERMO GONZALEZ ARIAS')
  try {
    const res = await safeFetch(`${FIREBASE_URL}/users.json?_t=${Date.now()}`);
    if (res && res.ok) {
      const allUsersMap = await res.json();
      if (allUsersMap && typeof allUsersMap === 'object') {
        const normalizeStr = (str) => (str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        const normClean = normalizeStr(cleanEmail);
        const entries = Object.values(allUsersMap).filter(u => u && typeof u === 'object' && !u.isDeleted);

        // Helper para elegir siempre el registro más reciente si existen nodos duplicados de la misma finca/usuario
        const pickMostRecentUser = (matches) => {
          if (!matches || matches.length === 0) return null;
          if (matches.length === 1) return matches[0];
          return matches.sort((a, b) => {
            const tsA = new Date(a.updatedAt || a.createdAt || 0).getTime() || (a.activeModulesUpdatedAt || 0);
            const tsB = new Date(b.updatedAt || b.createdAt || 0).getTime() || (b.activeModulesUpdatedAt || 0);
            return tsB - tsA;
          })[0];
        };

        // A. Coincidencia exacta por correo
        let found = pickMostRecentUser(entries.filter(u => u.email && u.email.trim().toLowerCase() === cleanEmail));

        // B. Coincidencia por prefijo del correo (ej: 'juliayema' => 'juliayema@gmail.com')
        if (!found) {
          found = pickMostRecentUser(entries.filter(u => {
            if (!u.email) return false;
            const prefix = u.email.split('@')[0].trim().toLowerCase();
            return prefix === cleanEmail || (normClean && normalizeStr(prefix) === normClean);
          }));
        }

        // C. Coincidencia por nombre de la Finca / Hacienda (ej: 'LA JULIA', 'GANADERIA LA G')
        if (!found) {
          found = pickMostRecentUser(entries.filter(u => {
            if (!u.farmName) return false;
            const farm = u.farmName.trim().toLowerCase();
            return farm === cleanEmail || (normClean && normalizeStr(u.farmName) === normClean);
          }));
        }

        // D. Coincidencia por nombre de usuario o nombre completo
        if (!found) {
          found = pickMostRecentUser(entries.filter(u => {
            const uName = (u.name || '').trim().toLowerCase();
            const uUser = (u.username || '').trim().toLowerCase();
            return uUser === cleanEmail || uName === cleanEmail ||
                   (normClean && (normalizeStr(u.username) === normClean || normalizeStr(u.name) === normClean));
          }));
        }

        if (found && (found.id || found.email)) {
          const isDel = await cloudIsWorkerDeleted(found.email || cleanEmail);
          if (isDel) {
            return { ...found, isDeleted: true };
          }
          return found;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Error en cloudFindUser Firebase (búsqueda profunda):', e);
  }

  // 5. Si no se encontró en /users/, verificar si está en la lista de eliminados
  const isDel = await cloudIsWorkerDeleted(cleanEmail);
  if (isDel) {
    return { isDeleted: true, email: cleanEmail, role: 'worker' };
  }

  return null;
}

const PENDING_SYNC_KEY = 'ganadera_pending_sync_';
const PENDING_DEL_KEY = 'ganadera_pending_del_';
const TOMBSTONES_KEY = 'ganadera_tombstones_';
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días de memoria para evitar resurrección de elementos eliminados en celulares

/**
 * Obtiene el mapa de lápidas (tombstones) de elementos eliminados recientemente
 */
export function getTombstones(userId) {
  if (!userId) return new Map();
  try {
    const key = `${TOMBSTONES_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const list = JSON.parse(raw);
    const now = Date.now();
    const map = new Map();
    const validList = [];
    for (const item of list) {
      if (item && item.id && item.tableName && (now - (item.timestamp || 0) < TOMBSTONE_TTL_MS)) {
        map.set(`${item.tableName}_${String(item.id)}`, item);
        validList.push(item);
      }
    }
    if (validList.length !== list.length) {
      localStorage.setItem(key, JSON.stringify(validList));
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Agrega lápidas de elementos eliminados para blindar contra resurrección al reconciliar
 */
export function addTombstones(userId, tableName, ...itemIds) {
  if (!userId || !tableName || !itemIds) return;
  try {
    const key = `${TOMBSTONES_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const validIds = itemIds.flat().filter(Boolean).map(String);
    for (const id of validIds) {
      const idx = list.findIndex(item => item.tableName === tableName && String(item.id) === id);
      if (idx >= 0) {
        list[idx].timestamp = now;
      } else {
        list.push({ tableName, id, timestamp: now });
      }
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving tombstone:', e);
  }
}

const LAST_SYNCED_KEY = 'ganadera_last_synced_at_';

/**
 * Obtiene el conteo total de elementos pendientes de sincronizar (creados/modificados + eliminados)
 */
export function getPendingSyncCount(userId) {
  if (!userId) return 0;
  return getPendingSyncIds(userId).size + getPendingDeletes(userId).length;
}

/**
 * Dispara un evento en window para que la interfaz actualice el indicador de sincronización en tiempo real
 */
export function notifySyncStateChange(userId) {
  if (typeof window !== 'undefined' && userId) {
    try {
      const count = getPendingSyncCount(userId);
      window.dispatchEvent(new CustomEvent('ganado_pending_sync_changed', {
        detail: { userId, count }
      }));
    } catch (e) {}
  }
}

/**
 * Guarda y emite la marca de tiempo de la última sincronización exitosa con Firebase
 */
export function recordLastSyncedAt(userId, customIso = null) {
  if (!userId) return;
  try {
    const iso = customIso || new Date().toISOString();
    localStorage.setItem(`${LAST_SYNCED_KEY}${userId}`, iso);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganado_last_synced_changed', {
        detail: { userId, timestamp: iso }
      }));
    }
  } catch (e) {}
}

/**
 * Obtiene la marca de tiempo de la última sincronización exitosa guardada localmente
 */
export function getLastSyncedAt(userId) {
  if (!userId) return null;
  try {
    return localStorage.getItem(`${LAST_SYNCED_KEY}${userId}`);
  } catch {
    return null;
  }
}

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
    notifySyncStateChange(userId);
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
    notifySyncStateChange(userId);
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
    const validIds = itemIds.flat().filter(Boolean).map(String);
    addTombstones(userId, tableName, ...validIds);

    const key = `${PENDING_DEL_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    for (const id of validIds) {
      if (!list.some(item => item.tableName === tableName && String(item.id) === id)) {
        list.push({ tableName, id });
      }
    }
    localStorage.setItem(key, JSON.stringify(list));
    notifySyncStateChange(userId);
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
    notifySyncStateChange(userId);
  } catch (e) {
    console.warn('Error in clearPendingDeletes:', e);
  }
}

let isInitialPullDone = false;
let isSyncInProgress = false;

/**
 * Indica si este cliente ya completó su descarga inicial desde la nube en la sesión actual
 */
export function isInitialPullCompleted() {
  return isInitialPullDone;
}

/**
 * Marca la descarga inicial como completada
 */
export function markInitialPullCompleted() {
  isInitialPullDone = true;
}

/**
 * Reinicia el estado de descarga inicial al cambiar de sesión/finca
 */
export function resetInitialPullState() {
  isInitialPullDone = false;
}

/**
 * Helper para extraer una marca de tiempo numérica confiable de cualquier registro
 */
function parseRecordTimestamp(item) {
  if (!item) return 0;
  if (item.updatedAt) {
    const t = new Date(item.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.createdAt) {
    const t = new Date(item.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.date) {
    const t = new Date(item.date).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return 0;
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
export async function cloudPushData(userId, options = {}) {
  if (!userId) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  const { skipPrePull = false } = options;

  // SALVAGUARDA VITAL: Ningún dispositivo puede subir datos (PUSH) sin haber completado
  // primero su descarga (PULL) inicial en esta sesión, salvo que sea una restauración explícita de respaldo.
  if (!isInitialPullDone && !skipPrePull) {
    try {
      await cloudPullData(userId);
      isInitialPullDone = true;
    } catch (pullErr) {
      console.warn('⚠️ No se pudo completar pull previo a push:', pullErr);
    }
  } else if (skipPrePull) {
    isInitialPullDone = true;
  }

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
    const dailyMilkLogs = db.dailyMilkLogs ? await db.dailyMilkLogs.filter(isTarget).toArray() : [];
    const milkSettlements = db.milkSettlements ? await db.milkSettlements.filter(isTarget).toArray() : [];
    const transactions = db.transactions ? await db.transactions.filter(isTarget).toArray() : [];
    const farmExpenses = db.farmExpenses ? await db.farmExpenses.filter(isTarget).toArray() : [];
    const farmIncomes = db.farmIncomes ? await db.farmIncomes.filter(isTarget).toArray() : [];
    const activityLogs = db.activityLogs ? await db.activityLogs.filter(isTarget).toArray() : [];
    const calendarNotes = db.calendarNotes ? await db.calendarNotes.filter(isTarget).toArray() : [];
    const rainfall = db.rainfall ? await db.rainfall.filter(isTarget).toArray() : [];

    // Preservar trabajadores registrados en el nodo remoto para no perderlos al hacer PUT
    let existingWorkers = undefined;
    try {
      const wRes = await safeFetch(`${FIREBASE_URL}/userData/${userId}/workers.json?_t=${Date.now()}`, {}, 5000);
      if (wRes && wRes.ok) {
        const wData = await wRes.json();
        if (wData && typeof wData === 'object') {
          existingWorkers = wData;
        }
      }
    } catch (e) {}

    let sessionMeta = {};
    try {
      const rawSession = localStorage.getItem('ganado_current_user_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        sessionMeta = {
          farmName: parsed?.farmName || undefined,
          ownerEmail: parsed?.ownerEmail || parsed?.email || undefined,
        };
      }
    } catch (e) {}

    const activeModules = getActiveModules(userId);
    const activeModulesUpdatedAt = getModulesUpdatedAt(userId) || Date.now();
    const tombstonesList = Array.from(getTombstones(userId).values());
    const nowIso = new Date().toISOString();
    const payload = {
      userId,
      ...(sessionMeta.farmName ? { farmName: sessionMeta.farmName } : {}),
      ...(sessionMeta.ownerEmail ? { ownerEmail: sessionMeta.ownerEmail } : {}),
      ...(existingWorkers ? { workers: existingWorkers } : {}),
      activeModules,
      activeModulesUpdatedAt,
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
      dailyMilkLogs,
      milkSettlements,
      transactions,
      activityLogs,
      calendarNotes,
      rainfall,
      tombstones: tombstonesList,
      syncedAt: nowIso,
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
      recordLastSyncedAt(userId, nowIso);
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
 * Calcula la marca de tiempo más reciente de un nodo de respaldo en la nube
 * (Evalúa syncedAt y también la fecha más reciente de sus registros de ganado/pesajes)
 */
function getSnapshotLatestTimestamp(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  let maxTs = 0;
  if (snapshot.syncedAt) {
    const t = new Date(snapshot.syncedAt).getTime();
    if (!isNaN(t) && t > maxTs) maxTs = t;
  }
  const cattleList = normalizeRemoteList(snapshot.cattle);
  for (const c of cattleList) {
    const t = parseRecordTimestamp(c);
    if (t > maxTs) maxTs = t;
  }
  const weighList = normalizeRemoteList(snapshot.weighings);
  for (const w of weighList) {
    const t = parseRecordTimestamp(w);
    if (t > maxTs) maxTs = t;
  }
  return maxTs;
}

/**
 * Busca y resuelve siempre el ÚLTIMO respaldo general generado en la nube para la finca activa.
 * Si la finca tuvo nodos alternativos por correo, alias o dispositivos previos, compara sus
 * marcas de tiempo (syncedAt) y selecciona el respaldo más reciente para que todos los
 * dispositivos (celulares y computadores) queden 100% conectados con la información al día.
 */
async function fetchLatestCloudFarmSnapshot(userId, checkAliases = false) {
  const candidates = [];

  // 1. Nodo principal por userId
  try {
    const res = await safeFetch(`${FIREBASE_URL}/userData/${userId}.json?_t=${Date.now()}`);
    if (res && res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        candidates.push({ key: userId, data, ts: getSnapshotLatestTimestamp(data) });
      }
    }
  } catch (e) {}

  // 2. Al iniciar sesión o arrancar la app, verificar si existe un respaldo más reciente de la misma finca
  // bajo claves alternativas (ej. usr_<safeEmail>, <safeEmail>, o coincidencia exacta de farmName/email)
  if (checkAliases) {
    try {
      let sessionUser = null;
      try {
        const raw = localStorage.getItem('ganado_current_user_session');
        if (raw) sessionUser = JSON.parse(raw);
      } catch (e) {}

      const email = (sessionUser?.ownerEmail || sessionUser?.email || '').trim().toLowerCase();
      const farmName = (sessionUser?.farmName || '').trim().toLowerCase();
      const safeEmail = email ? toSafeEmailKey(email) : '';
      const aliasKeys = new Set();

      if (safeEmail) {
        if (safeEmail !== userId) aliasKeys.add(safeEmail);
        if (`usr_${safeEmail}` !== userId) aliasKeys.add(`usr_${safeEmail}`);
      }
      if (sessionUser?.ownerId && sessionUser.ownerId !== userId) {
        aliasKeys.add(sessionUser.ownerId);
      }

      for (const aliasKey of aliasKeys) {
        try {
          const aRes = await safeFetch(`${FIREBASE_URL}/userData/${aliasKey}.json?_t=${Date.now()}`, {}, 6000);
          if (aRes && aRes.ok) {
            const aData = await aRes.json();
            if (aData && typeof aData === 'object' && normalizeRemoteList(aData.cattle).length > 0) {
              candidates.push({ key: aliasKey, data: aData, ts: getSnapshotLatestTimestamp(aData) });
            }
          }
        } catch (e) {}
      }

      // Si el usuario tiene nombre de finca o correo, consultar /users.json para detectar si existe otro
      // userId asociado a la misma finca cuyo respaldo en /userData sea más reciente
      if (email || farmName) {
        const uRes = await safeFetch(`${FIREBASE_URL}/users.json?_t=${Date.now()}`, {}, 6000);
        if (uRes && uRes.ok) {
          const allUsers = await uRes.json();
          if (allUsers && typeof allUsers === 'object') {
            const normalizeStr = (str) => (str || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            const normFarm = normalizeStr(farmName);

            const matchingUserIds = new Set();
            for (const uObj of Object.values(allUsers)) {
              if (!uObj || typeof uObj !== 'object' || uObj.isDeleted) continue;
              const uEmail = (uObj.email || '').trim().toLowerCase();
              const uOwnerEmail = (uObj.ownerEmail || '').trim().toLowerCase();
              const uFarm = normalizeStr(uObj.farmName);

              const sameEmail = email && (uEmail === email || uOwnerEmail === email);
              const sameFarm = normFarm && normFarm.length >= 4 && uFarm === normFarm;

              if (sameEmail || sameFarm) {
                if (uObj.id && uObj.id !== userId && !String(uObj.id).startsWith('usr_wrk_')) {
                  matchingUserIds.add(uObj.id);
                }
                if (uObj.ownerId && uObj.ownerId !== userId) {
                  matchingUserIds.add(uObj.ownerId);
                }
              }
            }

            for (const otherId of matchingUserIds) {
              if (candidates.some(c => c.key === otherId)) continue;
              try {
                const oRes = await safeFetch(`${FIREBASE_URL}/userData/${otherId}.json?_t=${Date.now()}`, {}, 6000);
                if (oRes && oRes.ok) {
                  const oData = await oRes.json();
                  if (oData && typeof oData === 'object' && normalizeRemoteList(oData.cattle).length > 0) {
                    candidates.push({ key: otherId, data: oData, ts: getSnapshotLatestTimestamp(oData) });
                  }
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (aliasErr) {
      console.warn('Nota verificando nodos de respaldo de la finca:', aliasErr);
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].data;

  // Ordenar candidatos priorizando el respaldo más reciente (mayor timestamp syncedAt)
  // y que contenga inventario activo válido
  candidates.sort((a, b) => {
    const aHasCattle = normalizeRemoteList(a.data?.cattle).length > 0 ? 1 : 0;
    const bHasCattle = normalizeRemoteList(b.data?.cattle).length > 0 ? 1 : 0;
    if (aHasCattle !== bHasCattle) return bHasCattle - aHasCattle;
    return b.ts - a.ts;
  });

  const winner = candidates[0];

  // Si el respaldo más reciente estaba en un nodo hermano, consolidarlo también en userId
  if (winner.key !== userId && winner.data) {
    safeFetch(`${FIREBASE_URL}/userData/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...winner.data, userId }),
    }).catch(() => null);
  }

  return winner.data;
}

/**
 * Reconcilia y sincroniza una tabla local con la versión remota de Firebase.
 * Garantiza que el último respaldo general de la nube sea la fuente de verdad
 * y evita que datos viejos guardados en un celular sobreescriban o resuciten en la nube.
 */
async function reconcileCollection(tableName, rawRemoteData, userId, options = {}) {
  if (!db[tableName]) return;

  const { forceAuthoritative = false } = options;
  const remoteList = normalizeRemoteList(rawRemoteData);
  const pendingIds = forceAuthoritative ? new Set() : getPendingSyncIds(userId);
  const pendingDeletes = forceAuthoritative
    ? []
    : getPendingDeletes(userId)
        .filter(d => d.tableName === tableName)
        .map(d => String(d.id));
  const pendingDeleteSet = new Set(pendingDeletes);
  const tombstones = getTombstones(userId);
  const isDeleted = (id) => {
    if (!id && id !== 0) return false;
    if (forceAuthoritative) return false; // En carga autoritativa del último respaldo, el respaldo de la nube manda
    const strId = String(id);
    const numId = !isNaN(Number(id)) ? Number(id) : null;
    return pendingDeleteSet.has(strId) || 
           (numId !== null && pendingDeleteSet.has(String(numId))) ||
           tombstones.has(`${tableName}_${strId}`) ||
           (numId !== null && tombstones.has(`${tableName}_${numId}`)) ||
           (tableName === 'farmIncomes' && strId.startsWith('inc_milk_') && (tombstones.has(`milkSettlements_${strId.replace('inc_milk_', '')}`) || pendingDeleteSet.has(strId.replace('inc_milk_', '')))) ||
           (tableName === 'farmIncomes' && strId.startsWith('inc_tank_') && (tombstones.has(`milkDeliveries_${strId.replace('inc_tank_', '')}`) || pendingDeleteSet.has(strId.replace('inc_tank_', '')))) ||
           (tableName === 'milkSettlements' && (tombstones.has(`farmIncomes_inc_milk_${strId}`) || pendingDeleteSet.has(`inc_milk_${strId}`))) ||
           (tableName === 'milkDeliveries' && (tombstones.has(`farmIncomes_inc_tank_${strId}`) || pendingDeleteSet.has(`inc_tank_${strId}`)));
  };

  // Obtener los registros locales existentes para comparar marcas de tiempo
  const isTarget = item => !item.userId || item.userId === userId || String(item.userId).startsWith('usr_wrk_') || item.ownerId === userId;
  const localItems = await db[tableName].filter(isTarget).toArray();
  const localItemMap = new Map();
  for (const loc of localItems) {
    if (loc && (loc.id !== undefined && loc.id !== null)) {
      localItemMap.set(String(loc.id), loc);
    }
  }

  const validItems = [];
  const supersededPendingIds = [];

  for (const remoteItem of remoteList) {
    if (!remoteItem || (remoteItem.id === undefined && remoteItem.id === null) || isDeleted(remoteItem.id)) continue;

    const strId = String(remoteItem.id);
    const localItem = localItemMap.get(strId);

    if (!localItem || forceAuthoritative) {
      // Registro nuevo o carga autoritativa del último respaldo de la nube: se acepta directamente
      validItems.push({ ...remoteItem, userId });
      continue;
    }

    const remoteTs = parseRecordTimestamp(remoteItem);
    const localTs = parseRecordTimestamp(localItem);

    // REGLA FUNDAMENTAL DE CICLO DE VIDA (Liquidaciones / Ventas / Bajas):
    // Si en la nube el animal está marcado como 'Vendido' o 'Muerto' y localmente sigue 'Activo',
    // el estado de salida de la nube GANA SIEMPRE. Esto blinda contra celulares desactualizados.
    const isRemoteLiquidated = (remoteItem.status === 'Vendido' || remoteItem.status === 'Muerto') && localItem.status === 'Activo';

    if (pendingIds.has(strId)) {
      if (isRemoteLiquidated || (remoteTs >= localTs && remoteTs > 0)) {
        // La versión remota es igual o más reciente, o trae una liquidación de salida definitiva:
        // La nube gana y se limpia el pendiente obsoleto de este dispositivo.
        validItems.push({ ...remoteItem, userId });
        supersededPendingIds.push(strId);
      } else {
        // El cliente local tiene una mutación deliberada más reciente (offline real en esta sesión).
        // Se preserva la versión local intacta.
      }
    } else {
      // Sin cambios pendientes locales en este dispositivo:
      // El respaldo de la nube es SIEMPRE la autoridad general para mantener todos los equipos idénticos.
      validItems.push({ ...remoteItem, userId });
    }
  }

  if (supersededPendingIds.length > 0) {
    clearPendingSync(userId, supersededPendingIds);
  }

  // 1. Guardar o actualizar todos los registros reconciliados en IndexedDB
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

  // 2. Si algún registro recibido de Firebase está marcado como eliminado en tombstones,
  // asegurar su eliminación inmediata de IndexedDB local
  if (!forceAuthoritative) {
    for (const item of remoteList) {
      if (item && item.id && isDeleted(item.id)) {
        await db[tableName].delete(item.id).catch(() => null);
        if (!isNaN(Number(item.id))) {
          await db[tableName].delete(Number(item.id)).catch(() => null);
        }
        await db[tableName].delete(String(item.id)).catch(() => null);
      }
    }
  }

  // 3. Depurar registros obsoletos locales que ya no existen en el último respaldo general de la nube.
  // REGLA CLAVE CONTRA CACHÉ VIEJA DE CELULARES:
  // Si un registro local NO existe en el respaldo de la nube (!remoteIds.has(strId)):
  // - Si NO estaba marcado como pendiente de subida antes del pull (!pendingIds.has(strId)) o si es
  //   una carga autoritativa de respaldo (forceAuthoritative), significa que es un dato viejo/eliminado
  //   que quedó guardado en el celular: se ELIMINA localmente y NUNCA se vuelve a subir a la nube.
  try {
    const remoteIds = new Set(remoteList.map(item => String(item.id)));
    const idsToDelete = [];

    for (const localItem of localItems) {
      if (!localItem || (localItem.id === undefined && localItem.id === null)) continue;
      const strId = String(localItem.id);

      if (isDeleted(localItem.id)) {
        idsToDelete.push(localItem.id);
      } else if (!remoteIds.has(strId)) {
        if (forceAuthoritative || !pendingIds.has(strId)) {
          idsToDelete.push(localItem.id);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await db[tableName].bulkDelete(idsToDelete).catch(() => null);
      for (const rawId of idsToDelete) {
        await db[tableName].delete(rawId).catch(() => null);
        if (!isNaN(Number(rawId))) {
          await db[tableName].delete(Number(rawId)).catch(() => null);
        }
        await db[tableName].delete(String(rawId)).catch(() => null);
      }
    }
  } catch (err) {
    console.warn(`Error reconciliando colección ${tableName}:`, err);
  }
}

/**
 * Descarga el último respaldo general de la finca desde Firebase Realtime Database
 * y sincroniza todas las colecciones para que todos los dispositivos vean la misma información al día.
 */
export async function cloudPullData(userId, options = {}) {
  if (!userId) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  const { forceAuthoritative = false } = options;
  const isFirstSessionPull = !isInitialPullDone || forceAuthoritative;

  try {
    const remoteData = await fetchLatestCloudFarmSnapshot(userId, isFirstSessionPull);
    if (remoteData && typeof remoteData === 'object') {
      // Determinar si el respaldo de la nube es más reciente que la última sincronización de este dispositivo
      const lastLocalSyncIso = getLastSyncedAt(userId);
      const lastLocalSyncTs = lastLocalSyncIso ? new Date(lastLocalSyncIso).getTime() : 0;
      const remoteSyncTs = getSnapshotLatestTimestamp(remoteData);
      const isRemoteSnapshotNewer = remoteSyncTs > 0 && (!lastLocalSyncTs || remoteSyncTs > lastLocalSyncTs);

      // Si estamos iniciando sesión o abriendo la app y la nube tiene un respaldo más nuevo que este celular,
      // el respaldo de la nube actúa como fuente de verdad absoluta (limpiando pendientes obsoletos de sesiones viejas)
      const useAuthoritativeSnapshot = forceAuthoritative || (!isInitialPullDone && isRemoteSnapshotNewer);
      if (useAuthoritativeSnapshot) {
        clearPendingSync(userId);
        clearPendingDeletes(userId);
      }

      // Reconciliar módulos activos de la finca respetando la marca de tiempo
      if (remoteData.activeModules && typeof remoteData.activeModules === 'object') {
        try {
          const localTs = getModulesUpdatedAt(userId);
          const remoteTs = parseInt(remoteData.activeModulesUpdatedAt, 10) || 0;
          if (useAuthoritativeSnapshot || !localTs || remoteTs >= localTs) {
            setActiveModules(remoteData.activeModules, userId, false);
          } else {
            cloudPushData(userId).catch(() => null);
          }
        } catch (modErr) {
          console.warn('Error applying pulled active modules:', modErr);
        }
      }

      // Reconciliar lápidas (tombstones) remotas si existen para sincronizar eliminaciones legítimas
      if (remoteData.tombstones && Array.isArray(remoteData.tombstones)) {
        for (const t of remoteData.tombstones) {
          if (t && t.tableName && t.id) {
            addTombstones(userId, t.tableName, t.id);
          }
        }
      }

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
        'dailyMilkLogs',
        'milkSettlements',
        'transactions',
        'activityLogs',
        'calendarNotes',
        'rainfall'
      ];

      // Verificar si el nodo remoto representa un respaldo válido de la finca
      const hasValidSnapshot = Boolean(
        remoteData.syncedAt ||
        remoteData.userId ||
        remoteData.cattle !== undefined ||
        remoteData.weighings !== undefined ||
        remoteData.paddocks !== undefined
      );

      for (const col of collections) {
        if (remoteData[col] !== undefined) {
          await reconcileCollection(col, remoteData[col], userId, { forceAuthoritative: useAuthoritativeSnapshot });
        } else if (hasValidSnapshot) {
          // En Firebase Realtime DB los arrays vacíos [] se omiten (quedan undefined).
          // Reconciliar con [] asegura que si en el último respaldo general se vació una tabla,
          // el celular también limpie esos registros viejos y no los vuelva a subir.
          await reconcileCollection(col, [], userId, { forceAuthoritative: useAuthoritativeSnapshot });
        }
      }
      isInitialPullDone = true;
      recordLastSyncedAt(userId, remoteData.syncedAt || new Date().toISOString());
      return true;
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
 * Sincronización bidireccional inteligente y segura para múltiples computadores y celulares simultáneos
 * Garantiza estrictamente PULL-First: Descarga siempre primero el último respaldo general de la nube.
 * Solo si hay cambios locales legítimos posteriores al PULL, realiza PUSH.
 */
export async function syncCloudAndLocal(userId, options = {}) {
  if (!userId) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (isSyncInProgress) return;
  isSyncInProgress = true;
  try {
    // 1. SIEMPRE PULL-First: Descargar primero el último respaldo general de la nube
    await cloudPullData(userId, options);
    isInitialPullDone = true;

    // 2. Solo si después del PULL aún hay pendientes locales legítimos creados en esta sesión, hacer PUSH
    const hasPending = hasPendingSync(userId);
    if (hasPending) {
      await cloudPushData(userId);
    }
  } catch (e) {
    console.warn('⚠️ Error en syncCloudAndLocal Firebase:', e);
  } finally {
    isSyncInProgress = false;
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

