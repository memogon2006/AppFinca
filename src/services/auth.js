import { db, logActivity } from './db';
import { 
  cloudSaveUser, 
  cloudFindUser, 
  cloudPushData, 
  cloudPullData,
  syncCloudAndLocal,
  cloudDeleteUserData,
  cloudSaveWorker,
  cloudGetFarmWorkers,
  cloudUpdateWorker,
  cloudDeleteWorker,
  cloudGetDeletedWorkers,
  cloudIsWorkerDeleted
} from './cloudSync';
import { sendWelcomeEmail, sendPasswordResetEmail } from './emailService';

const STORAGE_KEY = 'ganado_current_user_session';
const LOCKOUT_PREFIX = 'ganado_login_lockout_';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueo

/**
 * Normaliza la clave de identificación del usuario para el bloqueo
 */
function getLockoutKey(emailOrUser) {
  const clean = (emailOrUser || '').trim().toLowerCase();
  return `${LOCKOUT_PREFIX}${clean.replace(/[^a-z0-9_.-]/g, '_')}`;
}

/**
 * Consulta el estado actual de bloqueo por intentos fallidos
 */
export function getLoginLockoutStatus(emailOrUser) {
  if (!emailOrUser) return { isLocked: false, remainingMs: 0, attempts: 0, formattedRemaining: '05:00' };
  const key = getLockoutKey(emailOrUser);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { isLocked: false, remainingMs: 0, attempts: 0, formattedRemaining: '05:00' };
    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingMs = data.lockedUntil - now;
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return {
        isLocked: true,
        remainingMs,
        attempts: data.attempts || MAX_FAILED_ATTEMPTS,
        remainingMinutes: minutes,
        remainingSeconds: seconds,
        formattedRemaining: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      };
    }

    // Si ya expiró el tiempo de bloqueo, limpiar el registro
    if (data.lockedUntil && now >= data.lockedUntil) {
      localStorage.removeItem(key);
      return { isLocked: false, remainingMs: 0, attempts: 0, formattedRemaining: '05:00' };
    }

    return {
      isLocked: false,
      remainingMs: 0,
      attempts: data.attempts || 0,
      formattedRemaining: '05:00'
    };
  } catch (e) {
    return { isLocked: false, remainingMs: 0, attempts: 0, formattedRemaining: '05:00' };
  }
}

/**
 * Registra un intento fallido de contraseña. Si llega a 5, activa el bloqueo de 5 minutos.
 */
export function recordFailedLoginAttempt(emailOrUser) {
  if (!emailOrUser) return;
  const key = getLockoutKey(emailOrUser);
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { attempts: 0 };
    const now = Date.now();

    data.attempts = (data.attempts || 0) + 1;
    data.lastAttemptAt = now;

    if (data.attempts >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(key, JSON.stringify(data));
      const totalSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      throw new Error(`⛔ Has superado el límite de 5 intentos fallidos. Por seguridad, el acceso ha sido bloqueado temporalmente durante 5 minutos (${formatted}).`);
    }

    localStorage.setItem(key, JSON.stringify(data));
    const remainingAttempts = MAX_FAILED_ATTEMPTS - data.attempts;
    throw new Error(`Usuario o contraseña incorrectos. Te ${remainingAttempts === 1 ? 'queda 1 intento' : `quedan ${remainingAttempts} intentos`} antes de que el acceso se bloquee por 5 minutos.`);
  } catch (e) {
    throw e;
  }
}

/**
 * Limpia el contador de intentos fallidos y el bloqueo tras un inicio de sesión exitoso
 */
export function clearLoginLockout(emailOrUser) {
  if (!emailOrUser) return;
  const key = getLockoutKey(emailOrUser);
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

/**
 * Función pura JavaScript SHA-256 para máxima compatibilidad con teléfonos móviles (Safari iOS, Android, WebViews)
 */
function sha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  hash = hash.slice(0, 8);

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const b = (hash[i] >> (i2 * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Genera un hash SHA-256 seguro para la contraseña
 */
export async function hashPassword(password) {
  if (!password) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Usando fallback nativo de hashing:', e);
  }
  return sha256Fallback(password);
}

/**
 * Obtiene el usuario con sesión activa desde el almacenamiento local
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo sesión:', e);
    return null;
  }
}

/**
 * Registra un nuevo usuario/ganadería o enlaza la cuenta si ya existe con los mismos datos
 */
export async function registerUser({ name, farmName, email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanFarm = (farmName || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanName) throw new Error('Por favor ingresa tu nombre de ganadero o administrador.');
  if (!cleanFarm) throw new Error('Por favor ingresa el nombre de tu finca o hacienda.');
  if (!cleanEmail) throw new Error('Por favor ingresa un correo o nombre de usuario.');
  if (!cleanPassword || cleanPassword.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres.');

  // 1. Validar si ya existe en la Nube Firebase (1 sola cuenta por correo)
  const cloudUser = await cloudFindUser(cleanEmail);
  if (cloudUser) {
    throw new Error(`El correo "${cleanEmail}" ya se encuentra registrado. Solo se permite una sola cuenta por correo. Por favor dirígete a la pestaña "Iniciar Sesión" para ingresar.`);
  }

  // 2. Si no existe en la nube, purgar cualquier residuo huérfano local de cuentas eliminadas
  const allUsers = await db.users.toArray();
  for (const u of allUsers) {
    if ((u.email || '').trim().toLowerCase() === cleanEmail) {
      await db.users.delete(u.id).catch(() => null);
    }
  }

  const passwordHash = await hashPassword(cleanPassword);

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const newUser = {
    id: userId,
    name: cleanName,
    farmName: cleanFarm,
    email: cleanEmail,
    passwordHash,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  };

  // Guardar en base de datos local
  await db.users.put(newUser);

  // Si existen animales sin userId, asociarlos
  const legacyCattle = await db.cattle.filter(c => !c.userId).toArray();
  if (legacyCattle.length > 0) {
    for (const c of legacyCattle) {
      await db.cattle.update(c.id, { userId });
    }
  }

  const legacyWeights = await db.weighings.filter(w => !w.userId).toArray();
  if (legacyWeights.length > 0) {
    for (const w of legacyWeights) {
      await db.weighings.update(w.id, { userId });
    }
  }

  // Guardar en la nube pública
  await cloudSaveUser(newUser);
  await cloudPushData(userId);

  // Automatización: Enviar correo de bienvenida con credenciales
  sendWelcomeEmail({
    name: cleanName,
    farmName: cleanFarm,
    email: cleanEmail,
    password: cleanPassword,
  }).catch((e) => console.warn('Error en automatización de correo:', e));

  // Guardar sesión activa
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    farmName: newUser.farmName,
    email: newUser.email,
    createdAt: newUser.createdAt,
    mustChangePassword: false,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Inicia sesión verificando credenciales en Local y en la Nube de forma ultrarrápida
 */
export async function loginUser({ email, password }) {
  const cleanInput = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanInput || !cleanPassword) {
    throw new Error('Por favor ingresa tu correo/usuario y contraseña.');
  }

  // 0. VERIFICAR BLOQUEO POR 5 INTENTOS FALLIDOS CONSECUTIVOS
  const lockout = getLoginLockoutStatus(cleanInput);
  if (lockout.isLocked) {
    throw new Error(`⛔ Acceso bloqueado temporalmente por seguridad tras 5 intentos fallidos. Podrás volver a intentar en ${lockout.formattedRemaining}.`);
  }

  const inputHash = await hashPassword(cleanPassword);
  const rawAlias = cleanInput.replace('@finca.local', '').replace(/[^a-z0-9_.-]/g, '');

  // 1. RUTA RÁPIDA LOCAL: Buscar en la base de datos local Dexie (toma < 10ms)
  let localUser = null;
  try {
    const allUsers = await db.users.toArray().catch(() => []);
    localUser = allUsers.find(u => {
      if (u.isDeleted) return false;
      const uEmail = (u.email || '').toLowerCase().trim();
      const uUser = (u.username || '').toLowerCase().trim();
      return uEmail === cleanInput || 
             uEmail === `${rawAlias}@finca.local` || 
             uEmail === rawAlias ||
             uUser === rawAlias ||
             uUser === cleanInput;
    });
  } catch (e) {
    console.warn('Nota: consulta local de usuario:', e);
  }

  // Si el usuario existe localmente y la contraseña coincide
  if (localUser && localUser.passwordHash === inputHash) {
    if (localUser.role === 'worker' && localUser.isActive === false) {
      throw new Error('⚠️ Tu cuenta de trabajador ha sido deshabilitada por el administrador del predio.');
    }

    // Limpiar bloqueo tras éxito
    clearLoginLockout(cleanInput);
    if (localUser.email) clearLoginLockout(localUser.email);

    const sessionUser = {
      id: localUser.id,
      name: localUser.name,
      farmName: localUser.farmName,
      email: localUser.email,
      username: localUser.username || localUser.email?.replace('@finca.local', '') || '',
      role: localUser.role || 'admin',
      ownerId: localUser.ownerId || null,
      ownerEmail: localUser.ownerEmail || null,
      isActive: localUser.isActive !== false,
      createdAt: localUser.createdAt,
      mustChangePassword: !!localUser.mustChangePassword,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));

    // Sincronización en segundo plano sin retrasar el ingreso
    const dataOwnerId = sessionUser.role === 'worker' ? (sessionUser.ownerId || sessionUser.id) : sessionUser.id;
    if (dataOwnerId && navigator.onLine) {
      syncCloudAndLocal(dataOwnerId).catch(() => null);
    }

    return sessionUser;
  }

  // 2. RUTA EN LA NUBE (Primer inicio de sesión en un dispositivo nuevo o credenciales actualizadas)
  const [remoteUser, isDeletedRemote] = await Promise.all([
    cloudFindUser(cleanInput).catch(() => null),
    cloudIsWorkerDeleted(cleanInput).catch(() => false)
  ]);

  if (isDeletedRemote) {
    try {
      const allUsers = await db.users.toArray();
      for (const u of allUsers) {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uUser = (u.username || '').toLowerCase().trim();
        if (u.role === 'worker' && (uEmail === cleanInput || uEmail === `${rawAlias}@finca.local` || uUser === rawAlias)) {
          await db.users.delete(u.id).catch(() => null);
        }
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    throw new Error(`⚠️ La cuenta "${cleanInput}" ha sido eliminada por el administrador.`);
  }

  let user = remoteUser;

  if (user && user.isDeleted) {
    try {
      const allUsers = await db.users.toArray();
      for (const u of allUsers) {
        if ((u.email || '').toLowerCase() === cleanInput || (u.username || '').toLowerCase() === rawAlias) {
          await db.users.delete(u.id).catch(() => null);
        }
      }
    } catch (e) {}
    throw new Error(`⚠️ La cuenta "${cleanInput}" ha sido eliminada por el administrador.`);
  }

  if (user) {
    await db.users.put(user).catch(() => null);
  } else if (localUser) {
    user = localUser;
  }

  if (!user) {
    recordFailedLoginAttempt(cleanInput);
  }

  // Validar si la cuenta de trabajador está deshabilitada
  if (user.role === 'worker' && user.isActive === false) {
    throw new Error('⚠️ Tu cuenta de trabajador ha sido deshabilitada por el administrador del predio.');
  }

  if (user.passwordHash !== inputHash) {
    recordFailedLoginAttempt(cleanInput);
  }

  // Limpiar bloqueo tras éxito
  clearLoginLockout(cleanInput);
  if (user.email) clearLoginLockout(user.email);

  const sessionUser = {
    id: user.id,
    name: user.name,
    farmName: user.farmName,
    email: user.email,
    username: user.username || user.email?.replace('@finca.local', '') || '',
    role: user.role || 'admin',
    ownerId: user.ownerId || null,
    ownerEmail: user.ownerEmail || null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    mustChangePassword: !!user.mustChangePassword,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));

  // Sincronizar datos en segundo plano
  const dataOwnerId = user.role === 'worker' ? (user.ownerId || user.id) : user.id;
  if (dataOwnerId && navigator.onLine) {
    syncCloudAndLocal(dataOwnerId).catch(() => null);
  }

  return sessionUser;
}

/**
 * Cierra la sesión activa
 */
export function logoutUser() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Actualiza el perfil del usuario (nombre de propietario, nombre de finca, correo)
 */
export async function updateUserProfile(userId, { name, farmName, email }) {
  const cleanName = (name || '').trim();
  const cleanFarm = (farmName || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName) throw new Error('El nombre de propietario no puede estar vacío.');
  if (!cleanFarm) throw new Error('El nombre de la finca no puede estar vacío.');
  if (!cleanEmail) throw new Error('El correo/usuario no puede estar vacío.');

  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  const oldEmail = (user.email || '').toLowerCase();
  if (cleanEmail !== oldEmail) {
    // 1. Verificar si el nuevo correo ya existe en la nube registrado por otra cuenta
    const cloudUser = await cloudFindUser(cleanEmail);
    if (cloudUser && cloudUser.id && cloudUser.id !== userId) {
      throw new Error('Este correo electrónico ya está registrado en otra cuenta en la nube.');
    }

    // 2. Purgar cualquier residuo huérfano local en el navegador con el correo nuevo O el viejo
    const allUsers = await db.users.toArray();
    for (const u of allUsers) {
      const uEmail = (u.email || '').trim().toLowerCase();
      if (u.id !== userId && (uEmail === cleanEmail || uEmail === oldEmail)) {
        await db.users.delete(u.id).catch(() => null);
      }
    }

    // 3. Limpiar registro anterior en Firebase si cambió de correo
    if (oldEmail) {
      await cloudDeleteUserData(null, oldEmail).catch(() => null);
    }
  }

  const updates = {
    ...user,
    name: cleanName,
    farmName: cleanFarm,
    email: cleanEmail,
    updatedAt: new Date().toISOString(),
  };

  await db.users.put(updates);
  await cloudSaveUser(updates);
  await cloudPushData(userId).catch(() => null);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    const updatedSession = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  }
  return updates;
}

/**
 * Cambia la contraseña del usuario verificando la clave anterior
 */
export async function changeUserPassword(userId, currentPassword, newPassword) {
  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();

  if (!cleanCurrent) throw new Error('Debes ingresar tu contraseña actual.');
  if (!cleanNew || cleanNew.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  const currentHash = await hashPassword(cleanCurrent);
  if (user.passwordHash !== currentHash) {
    throw new Error('La contraseña actual es incorrecta.');
  }

  const newHash = await hashPassword(cleanNew);
  const updated = { ...user, passwordHash: newHash, mustChangePassword: false, updatedAt: new Date().toISOString() };
  await db.users.put(updated);
  await cloudSaveUser(updated);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    const updatedSession = { ...current, mustChangePassword: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
  }

  return { success: true, message: '¡Contraseña actualizada con éxito!' };
}

/**
 * Fuerza el establecimiento de una nueva contraseña obligatoria (cuando ingresa con clave temporal)
 */
export async function forceSetNewPassword(userId, newPassword) {
  const cleanNew = (newPassword || '').trim();

  if (!cleanNew || cleanNew.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  const newHash = await hashPassword(cleanNew);
  const updated = {
    ...user,
    passwordHash: newHash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  await db.users.put(updated);
  await cloudSaveUser(updated);

  // Actualizar sesión activa
  const current = getCurrentUser();
  if (current && current.id === userId) {
    const updatedSession = { ...current, mustChangePassword: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  }

  return updated;
}

/**
 * Eliminación completa y definitiva de la cuenta, inventario y registros en local y nube
 */
export async function deleteUserAccount(userId, password) {
  const cleanPassword = (password || '').trim();

  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  // Verificar contraseña
  const inputHash = await hashPassword(cleanPassword);
  if (user.passwordHash !== inputHash) {
    throw new Error('Contraseña incorrecta. Confirma tu contraseña para proceder con la eliminación.');
  }

  const userEmail = (user.email || '').trim().toLowerCase();

  // 1. Eliminar todos los pesajes del usuario y huérfanos
  if (db.weighings) {
    await db.weighings.where('userId').equals(userId).delete().catch(() => null);
    const orphanWeights = await db.weighings.filter(w => !w.userId || w.userId === userId).toArray().catch(() => []);
    for (const w of orphanWeights) {
      if (w.id) await db.weighings.delete(w.id).catch(() => null);
    }
  }

  // 2. Eliminar todo el inventario de ganado del usuario y huérfanos
  if (db.cattle) {
    await db.cattle.where('userId').equals(userId).delete().catch(() => null);
    const orphanCattle = await db.cattle.filter(c => !c.userId || c.userId === userId).toArray().catch(() => []);
    for (const c of orphanCattle) {
      if (c.id) await db.cattle.delete(c.id).catch(() => null);
    }
  }

  // 3. Eliminar registros en todas las tablas adicionales
  const extraTables = ['expenses', 'vaccinations', 'audits', 'palpations', 'paddocks', 'milkRecords', 'milkDeliveries', 'transactions', 'settings'];
  for (const table of extraTables) {
    if (db[table]) {
      try {
        await db[table].where('userId').equals(userId).delete().catch(() => null);
        const orphans = await db[table].filter(item => !item.userId || item.userId === userId).toArray().catch(() => []);
        for (const item of orphans) {
          if (item.id) await db[table].delete(item.id).catch(() => null);
        }
      } catch (e) {}
    }
  }

  // 4. Eliminar usuario de base de datos local y liberar el correo de inmediato
  await db.users.delete(userId).catch(() => null);
  const remainingUsers = await db.users.toArray().catch(() => []);
  for (const u of remainingUsers) {
    if ((u.email || '').trim().toLowerCase() === userEmail || u.id === userId) {
      await db.users.delete(u.id).catch(() => null);
    }
  }

  // 5. Eliminar datos en la nube (libera /users/<safeEmail>.json y /userData/<userId>.json)
  await cloudDeleteUserData(userId, userEmail);

  // 6. Limpiar sesión activa y almacenamiento local
  logoutUser();
  try {
    sessionStorage.clear();
    localStorage.removeItem('ganado_current_user_session');
    localStorage.removeItem('ganado_session_token');
  } catch (e) {}

  return { success: true };
}

/**
 * Purga y limpia de forma exhaustiva todos los datos locales de un usuario
 * (usado cuando la cuenta es eliminada desde la nube o desde la app)
 */
export async function purgeLocalUserData(userId, email) {
  const cleanEmail = (email || '').trim().toLowerCase();

  const allTables = ['cattle', 'weighings', 'expenses', 'vaccinations', 'audits', 'palpations', 'paddocks', 'milkRecords', 'milkDeliveries', 'transactions', 'settings'];
  for (const table of allTables) {
    if (db[table]) {
      try {
        if (userId) {
          await db[table].where('userId').equals(userId).delete().catch(() => null);
        }
        const orphans = await db[table].filter(item => !item.userId || (userId && item.userId === userId)).toArray().catch(() => []);
        for (const item of orphans) {
          if (item.id) await db[table].delete(item.id).catch(() => null);
        }
      } catch (e) {}
    }
  }

  if (db.users) {
    if (userId) await db.users.delete(userId).catch(() => null);
    const remainingUsers = await db.users.toArray().catch(() => []);
    for (const u of remainingUsers) {
      if ((u.email || '').trim().toLowerCase() === cleanEmail || (userId && u.id === userId)) {
        await db.users.delete(u.id).catch(() => null);
      }
    }
  }

  logoutUser();
  try {
    sessionStorage.clear();
    localStorage.removeItem('ganado_current_user_session');
    localStorage.removeItem('ganado_session_token');
  } catch (e) {}
}


/**
 * Genera una clave temporal segura y fácil de recordar para ganaderos (ej. Ganado-4829, Finca-7310)
 */
export function generateTemporaryPassword() {
  const prefixes = ['Ganado', 'Finca', 'Bovino', 'Pasto', 'Toro', 'Vaca'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomDigits}`;
}

/**
 * Solicita el restablecimiento / blanqueo de contraseña para un correo electrónico.
 * Busca el usuario en Dexie local o en Firebase Cloud, genera una clave temporal segura,
 * actualiza el hash en ambas bases de datos y despacha el correo de restablecimiento.
 */
export async function requestPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Por favor ingresa tu correo electrónico registrado.');
  }

  // 1. Buscar en BD local
  const allUsers = await db.users.toArray();
  let user = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);

  // 2. Si no está en local, buscar en la Nube Firebase
  if (!user) {
    user = await cloudFindUser(cleanEmail);
    if (user) {
      await db.users.put(user);
    }
  }

  if (!user) {
    throw new Error(`No se encontró ninguna cuenta ganadera registrada con el correo "${cleanEmail}". Por favor verifica el correo o crea una cuenta nueva.`);
  }

  // 3. Generar clave temporal
  const tempPassword = generateTemporaryPassword();
  const newHash = await hashPassword(tempPassword);

  // 4. Actualizar usuario en local y nube con requerimiento de cambio obligatorio
  const updatedUser = {
    ...user,
    passwordHash: newHash,
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  };

  await db.users.put(updatedUser);
  await cloudSaveUser(updatedUser);

  // 5. Despachar correo de restablecimiento
  let emailSent = false;
  try {
    const emailRes = await sendPasswordResetEmail({
      name: updatedUser.name || 'Ganadero',
      farmName: updatedUser.farmName || 'Mi Finca',
      email: updatedUser.email,
      tempPassword,
    });
    emailSent = emailRes?.success || false;
  } catch (e) {
    console.warn('Error enviando correo de restablecimiento:', e);
  }

  return {
    success: true,
    email: updatedUser.email,
    name: updatedUser.name || 'Ganadero',
    farmName: updatedUser.farmName || 'Mi Finca',
    tempPassword,
    emailSent,
    message: `¡Clave temporal generada con éxito! Se ha enviado al correo ${updatedUser.email}.`
  };
}

/**
 * Reenvía las credenciales o genera una clave temporal desde el panel de administración
 */
export async function adminResendCredentials(userId) {
  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuario no encontrado.');

  const tempPassword = generateTemporaryPassword();
  const newHash = await hashPassword(tempPassword);

  const updated = {
    ...user,
    passwordHash: newHash,
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  };

  await db.users.put(updated);
  await cloudSaveUser(updated);

  const emailRes = await sendPasswordResetEmail({
    name: updated.name || 'Ganadero',
    farmName: updated.farmName || 'Mi Finca',
    email: updated.email,
    tempPassword,
  });

  return {
    success: true,
    tempPassword,
    emailSent: emailRes?.success || false,
    message: `Se ha generado una nueva clave temporal (${tempPassword}) y se ha despachado al correo ${updated.email}.`
  };
}

/**
 * Crea una nueva cuenta de trabajador/vaquero asociada a la finca del administrador
 */
export async function createWorkerAccount({ name, username, password, ownerUser }) {
  const cleanName = (name || '').trim();
  const rawInput = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!ownerUser || !ownerUser.id) throw new Error('No se encontró la sesión del administrador.');
  if (!cleanName) throw new Error('Por favor ingresa el nombre del trabajador o mayordomo.');
  if (!rawInput) throw new Error('Por favor ingresa un usuario o correo para el trabajador.');
  if (!cleanPassword || cleanPassword.length < 4) throw new Error('La clave o PIN debe tener al menos 4 caracteres.');

  // Formato estandarizado de correo y alias
  const alias = rawInput.replace('@finca.local', '').replace(/[^a-z0-9_.-]/g, '');
  const cleanEmail = rawInput.includes('@') ? rawInput : `${alias}@finca.local`;

  // Verificar si ya existe una cuenta principal o trabajador ACTIVO
  const existingCloud = await cloudFindUser(cleanEmail);
  const existingCloudAlias = await cloudFindUser(alias);
  
  // Si la cuenta remota está marcada como eliminada, liberarla
  const isCloudConflict = (existingCloud && !existingCloud.isDeleted && existingCloud.role !== 'worker') ||
                          (existingCloudAlias && !existingCloudAlias.isDeleted && existingCloudAlias.role !== 'worker');

  if (isCloudConflict) {
    throw new Error(`El usuario o correo "${rawInput}" ya está en uso como cuenta principal de administrador. Por favor utiliza otro diferente.`);
  }

  // Purgar cualquier residuo huérfano local previo de este trabajador para liberarlo
  const allLocal = await db.users.toArray();
  for (const u of allLocal) {
    if (u.role === 'worker') {
      const uEmail = (u.email || '').toLowerCase();
      const uUser = (u.username || '').toLowerCase();
      if (uEmail === cleanEmail || uEmail === alias || uUser === alias) {
        await db.users.delete(u.id).catch(() => null);
      }
    }
  }

  // Limpiar memoria de último trabajador eliminado si coincide
  try {
    const lastDeletedRaw = localStorage.getItem('ganado_last_deleted_worker');
    if (lastDeletedRaw) {
      const del = JSON.parse(lastDeletedRaw);
      if (del.email === cleanEmail || del.alias === alias) {
        localStorage.removeItem('ganado_last_deleted_worker');
      }
    }
  } catch (e) {}

  const passwordHash = await hashPassword(cleanPassword);
  const workerId = 'usr_wrk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const newWorker = {
    id: workerId,
    name: cleanName,
    username: alias,
    farmName: ownerUser.farmName || 'Mi Finca',
    email: cleanEmail,
    passwordHash,
    role: 'worker',
    ownerId: ownerUser.id,
    ownerEmail: (ownerUser.email || '').trim().toLowerCase(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Guardar en Dexie y en Firebase (cloudSaveWorker además limpiará deletedWorkers)
  await db.users.put(newWorker);
  await cloudSaveWorker(ownerUser.id, newWorker);

  await logActivity({
    action: 'worker_created',
    description: `Creó la cuenta de trabajador para ${cleanName} (${cleanEmail})`,
    operatorName: ownerUser.name,
    operatorRole: 'admin',
    userId: ownerUser.id,
  });

  return newWorker;
}

/**
 * Obtiene la lista de trabajadores de la finca
 */
export async function getFarmWorkers(ownerId, ownerEmail = null) {
  if (!ownerId && !ownerEmail) return [];
  const cleanOwnerId = (ownerId || '').trim();
  const cleanOwnerEmail = (ownerEmail || '').trim().toLowerCase();

  let remoteWorkers = [];
  let fetchedRemote = false;
  try {
    const res = await cloudGetFarmWorkers(cleanOwnerId, cleanOwnerEmail);
    if (Array.isArray(res)) {
      remoteWorkers = res;
      fetchedRemote = true;
    }
  } catch (e) {
    console.warn('Error leyendo trabajadores de la nube:', e);
  }

  // 1. Obtener todos los trabajadores locales que pertenecen estrictamente a este propietario
  const allUsers = await db.users.toArray();
  const localWorkers = allUsers.filter(u => {
    if (u.role !== 'worker' || u.isDeleted) return false;
    const uOwnerId = String(u.ownerId || '').trim();
    const uOwnerEmail = (u.ownerEmail || '').trim().toLowerCase();
    return (cleanOwnerId && uOwnerId === cleanOwnerId) ||
           (cleanOwnerEmail && uOwnerEmail === cleanOwnerEmail) ||
           (cleanOwnerEmail && uOwnerId === cleanOwnerEmail) ||
           (cleanOwnerId && uOwnerEmail === cleanOwnerId);
  });

  // 2. Si obtuvimos la lista remota de la nube con éxito (incluso si la lista está vacía)
  if (fetchedRemote) {
    // Guardar trabajadores remotos en Dexie
    for (const rw of remoteWorkers) {
      if (rw && rw.id) await db.users.put(rw).catch(() => null);
    }
    // Purgar trabajadores locales que ya no existen en la nube (fueron eliminados)
    const remoteKeys = new Set(
      remoteWorkers.flatMap(w => [
        String(w.id || '').toLowerCase(),
        String(w.email || '').toLowerCase(),
        String(w.username || '').toLowerCase()
      ]).filter(Boolean)
    );
    for (const lw of localWorkers) {
      const lId = String(lw.id || '').toLowerCase();
      const lEmail = (lw.email || '').toLowerCase();
      const lUser = (lw.username || '').toLowerCase();
      if (!remoteKeys.has(lId) && !remoteKeys.has(lEmail) && !remoteKeys.has(lUser)) {
        await db.users.delete(lw.id).catch(() => null);
      }
    }
    return remoteWorkers;
  }

  // Deduplicar localWorkers por clave única y limpiar duplicados en Dexie
  const seen = new Set();
  const uniqueLocal = [];
  for (const w of localWorkers) {
    const key = String(w.email || w.username || w.id).toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueLocal.push(w);
    } else if (w.id) {
      await db.users.delete(w.id).catch(() => null);
    }
  }

  return uniqueLocal;
}

/**
 * Habilita o deshabilita la cuenta del trabajador en tiempo real
 */
export async function toggleWorkerStatus(workerId, workerEmail, ownerId, isActive, adminName = 'Administrador') {
  if (!workerEmail && !workerId) throw new Error('Correo/usuario de trabajador no especificado.');
  const updates = { isActive: !!isActive };
  await cloudUpdateWorker(ownerId, workerId, workerEmail, updates);
  const local = await db.users.get(workerId);
  if (local) {
    await db.users.put({ ...local, ...updates });
  }
  await logActivity({
    action: isActive ? 'worker_enabled' : 'worker_disabled',
    description: `${isActive ? 'Habilitó' : 'Deshabilitó'} el acceso a la cuenta de ${local?.name || workerEmail}`,
    operatorName: adminName,
    operatorRole: 'admin',
    userId: ownerId,
  });
  return true;
}

/**
 * Cambia o resetea el PIN/contraseña de un trabajador
 */
export async function updateWorkerPassword(workerId, workerEmail, ownerId, newPassword, adminName = 'Administrador') {
  const cleanPassword = (newPassword || '').trim();
  if (!cleanPassword || cleanPassword.length < 4) throw new Error('La clave o PIN debe tener al menos 4 caracteres.');
  const passwordHash = await hashPassword(cleanPassword);
  const updates = { passwordHash, mustChangePassword: false };
  await cloudUpdateWorker(ownerId, workerId, workerEmail, updates);
  const local = await db.users.get(workerId);
  if (local) {
    await db.users.put({ ...local, ...updates });
  }
  await logActivity({
    action: 'worker_password_updated',
    description: `Actualizó la contraseña/PIN de ${local?.name || workerEmail}`,
    operatorName: adminName,
    operatorRole: 'admin',
    userId: ownerId,
  });
  return true;
}

/**
 * Elimina definitivamente una cuenta de trabajador
 */
export async function deleteWorkerAccount(workerId, workerEmail, ownerId, adminName = 'Administrador', workerName = null, ownerEmail = null) {
  if (!workerEmail && !workerId) throw new Error('Correo/usuario no especificado.');

  // 1. Eliminar de Firebase y registrar en deletedWorkers
  await cloudDeleteWorker(ownerId, workerId, workerEmail, ownerEmail);

  // 2. Eliminar de Dexie por ID primario
  if (workerId) {
    await db.users.delete(workerId).catch(() => null);
  }

  // 3. Barrido profundo en Dexie db.users para borrar todas las filas y variantes de este trabajador
  const cleanEmail = (workerEmail || '').trim().toLowerCase();
  const cleanAlias = cleanEmail.replace('@finca.local', '').replace(/[^a-z0-9_.-]/g, '');
  const cleanName = (workerName || '').trim().toLowerCase();

  try {
    const allUsers = await db.users.toArray();
    for (const u of allUsers) {
      if (u.role !== 'worker') continue;
      const uEmail = (u.email || '').trim().toLowerCase();
      const uUser = (u.username || '').trim().toLowerCase();
      const uId = String(u.id || '').trim();
      const uName = (u.name || '').trim().toLowerCase();

      const matches = 
        (workerId && uId === workerId) ||
        (cleanEmail && uEmail === cleanEmail) ||
        (cleanAlias && (
          uEmail === cleanAlias || 
          uEmail === `${cleanAlias}@finca.local` || 
          uUser === cleanAlias || 
          uId === cleanAlias ||
          uEmail.startsWith(`${cleanAlias}@`)
        )) ||
        (cleanName && uName === cleanName);

      if (matches) {
        await db.users.delete(u.id).catch(() => null);
      }
    }
  } catch (err) {
    console.warn('Error en barrido local de eliminación de trabajador:', err);
  }

  // 4. Si la sesión activa en este dispositivo coincide con el trabajador eliminado, cerrarla y registrar la eliminación
  try {
    localStorage.setItem('ganado_last_deleted_worker', JSON.stringify({
      id: workerId,
      email: cleanEmail,
      alias: cleanAlias,
      name: cleanName,
      timestamp: Date.now()
    }));

    const currentRaw = localStorage.getItem(STORAGE_KEY);
    if (currentRaw) {
      const current = JSON.parse(currentRaw);
      const curEmail = (current.email || '').toLowerCase();
      const curUser = (current.username || '').toLowerCase();
      const curId = String(current.id || '');
      const curName = (current.name || '').toLowerCase();

      if (
        (workerId && curId === workerId) || 
        (cleanEmail && curEmail === cleanEmail) || 
        (cleanAlias && (curEmail === cleanAlias || curEmail === `${cleanAlias}@finca.local` || curUser === cleanAlias)) ||
        (cleanName && curName === cleanName)
      ) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (e) {}

  await logActivity({
    action: 'worker_deleted',
    description: `Eliminó permanentemente la cuenta de trabajador (${workerEmail || workerId})`,
    operatorName: adminName,
    operatorRole: 'admin',
    userId: ownerId,
  });

  return true;
}

