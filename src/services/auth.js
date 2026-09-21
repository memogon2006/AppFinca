import { db } from './db';
import { cloudSaveUser, cloudFindUser, cloudPushData, cloudPullData, cloudDeleteUserData } from './cloudSync';
import { sendWelcomeEmail, sendPasswordResetEmail } from './emailService';

const STORAGE_KEY = 'ganado_current_user_session';

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
 * Inicia sesión verificando credenciales en Local y en la Nube
 */
export async function loginUser({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Por favor ingresa tu correo/usuario y contraseña.');
  }

  // 1. Buscar en la Nube Firebase (fuente de la verdad)
  let user = await cloudFindUser(cleanEmail);

  if (user) {
    await db.users.put(user);
  } else {
    // Si no está en la nube, buscar en local por si está sin internet (offline)
    const allUsers = await db.users.toArray();
    user = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);
  }

  if (!user) {
    throw new Error('No se encontró ninguna cuenta con este correo. Por favor verifica tu correo o pulsa "Crear Cuenta" para registrarte.');
  }

  const inputHash = await hashPassword(cleanPassword);
  if (user.passwordHash !== inputHash) {
    throw new Error('Contraseña incorrecta. Activa "Ver clave" para verificar que no haya errores de digitación.');
  }

  await cloudPullData(user.id);

  const sessionUser = {
    id: user.id,
    name: user.name,
    farmName: user.farmName,
    email: user.email,
    createdAt: user.createdAt,
    mustChangePassword: !!user.mustChangePassword,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
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
    const allUsers = await db.users.toArray();
    const existing = allUsers.find(u => u.id !== userId && (u.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Este correo o usuario ya está en uso por otra cuenta.');
    }

    const cloudUser = await cloudFindUser(cleanEmail);
    if (cloudUser && cloudUser.id !== userId) {
      throw new Error('Este correo electrónico ya está registrado en otra cuenta en la nube.');
    }

    // Limpiar registro anterior en Firebase
    if (oldEmail) {
      await cloudDeleteUserData(null, oldEmail);
    }
  }

  const updates = {
    ...user,
    name: cleanName,
    farmName: cleanFarm,
    email: cleanEmail,
  };

  await db.users.put(updates);
  await cloudSaveUser(updates);

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

