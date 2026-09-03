import { db } from './db';
import { cloudSaveUser, cloudFindUser, cloudPushData, cloudPullData, cloudDeleteUserData } from './cloudSync';
import { sendWelcomeEmail } from './emailService';

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

  const passwordHash = await hashPassword(cleanPassword);

  // 1. Verificar si ya existe localmente
  const allUsers = await db.users.toArray();
  let existing = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.passwordHash === passwordHash) {
      return loginUser({ email: cleanEmail, password: cleanPassword });
    } else {
      throw new Error('Ya existe una cuenta registrada con este correo en este equipo. Si es tuya, pulsa "Iniciar Sesión" o verifica tu contraseña.');
    }
  }

  // 2. Si no existe localmente pero existe en la nube
  const cloudUser = await cloudFindUser(cleanEmail);
  if (cloudUser) {
    if (cloudUser.passwordHash === passwordHash) {
      await db.users.put(cloudUser);
      await cloudPullData(cloudUser.id);
      const sessionUser = {
        id: cloudUser.id,
        name: cloudUser.name || cleanName,
        farmName: cloudUser.farmName || cleanFarm,
        email: cloudUser.email,
        createdAt: cloudUser.createdAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
  }

  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const newUser = {
    id: userId,
    name: cleanName,
    farmName: cleanFarm,
    email: cleanEmail,
    passwordHash,
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

  const allUsers = await db.users.toArray();
  let user = allUsers.find(u => (u.email || '').toLowerCase() === cleanEmail);

  if (!user) {
    user = await cloudFindUser(cleanEmail);
    if (user) {
      await db.users.put(user);
    }
  }

  if (!user) {
    throw new Error('No se encontró cuenta en este dispositivo. Pulsa la pestaña "Crear Cuenta" arriba e ingresa con los mismos datos de tu cuenta original para ingresar.');
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

  if (cleanEmail !== (user.email || '').toLowerCase()) {
    const allUsers = await db.users.toArray();
    const existing = allUsers.find(u => u.id !== userId && (u.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Este correo o usuario ya está en uso por otra cuenta.');
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
  const updated = { ...user, passwordHash: newHash };
  await db.users.put(updated);
  await cloudSaveUser(updated);

  return { success: true, message: '¡Contraseña actualizada con éxito!' };
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

  const userEmail = user.email;

  // 1. Eliminar todos los pesajes del usuario
  await db.weighings.where('userId').equals(userId).delete();
  const orphanWeights = await db.weighings.filter(w => !w.userId).toArray();
  for (const w of orphanWeights) {
    await db.weighings.delete(w.id);
  }

  // 2. Eliminar todo el inventario de ganado del usuario
  await db.cattle.where('userId').equals(userId).delete();
  const orphanCattle = await db.cattle.filter(c => !c.userId).toArray();
  for (const c of orphanCattle) {
    await db.cattle.delete(c.id);
  }

  // 3. Eliminar usuario de base de datos local
  await db.users.delete(userId);

  // 4. Eliminar datos en la nube
  await cloudDeleteUserData(userId, userEmail);

  // 5. Limpiar sesión
  logoutUser();

  return { success: true };
}
