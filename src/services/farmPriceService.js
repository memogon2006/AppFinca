import { useState, useEffect } from 'react';
import { getCurrentUser } from './auth';

/**
 * Servicio de Gestión de Precios Comerciales por Finca / Predio Ganadero
 * Garantiza aislamiento e independencia 100% estricta por cuenta de usuario y predio.
 * 1. Precio de la Leche ($/Litro de Leche)
 * 2. Precio de la Carne / Ganado en Pie ($/Kg de Carne)
 */

export const DEFAULT_MILK_PRICE = 2100; // COP / Litro por defecto
export const DEFAULT_MEAT_PRICE_PER_KG = 9200; // COP / Kg en pie por defecto

/**
 * Obtiene la clave única estricta para la cuenta/usuario y predio activo
 */
export function getFarmKey(userOrFarm = null) {
  // 1. Si se pasó un objeto de usuario o finca
  if (userOrFarm && typeof userOrFarm === 'object') {
    const effectiveUserId = userOrFarm.role === 'worker' ? (userOrFarm.ownerId || userOrFarm.id) : userOrFarm.id;
    if (effectiveUserId) {
      return `user_${effectiveUserId}`;
    }
    const farmName = (userOrFarm.farmName || userOrFarm.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (farmName) {
      return `farm_${farmName}`;
    }
  }

  // 2. Si se pasó un string
  if (typeof userOrFarm === 'string' && userOrFarm.trim()) {
    const clean = userOrFarm.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (clean.startsWith('user_') || clean.startsWith('farm_')) {
      return clean;
    }
    return `farm_${clean}`;
  }

  // 3. Obtener de la sesión de usuario activa actualmente logueado
  try {
    const session = getCurrentUser();
    if (session) {
      const effectiveUserId = session.role === 'worker' ? (session.ownerId || session.id) : session.id;
      if (effectiveUserId) {
        return `user_${effectiveUserId}`;
      }
      const farmName = (session.farmName || session.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (farmName) {
        return `farm_${farmName}`;
      }
    }
  } catch (e) {}

  return 'user_default';
}

/**
 * Elimina claves legacy globales sin ámbito que contaminaban precios entre cuentas
 */
function cleanupLegacyGlobalKeys() {
  try {
    localStorage.removeItem('finca_milk_price_per_liter');
    localStorage.removeItem('finca_meat_price_per_kg');
  } catch (e) {}
}

/**
 * Obtiene el precio por litro de leche para la cuenta/finca especificada
 */
export function getFarmMilkPrice(userOrFarm = null) {
  try {
    cleanupLegacyGlobalKeys();

    // 1. Si el objeto usuario ya contiene su precio configurado en su perfil
    if (userOrFarm && typeof userOrFarm === 'object') {
      if (userOrFarm.milkPrice !== undefined && userOrFarm.milkPrice !== null && !isNaN(Number(userOrFarm.milkPrice)) && Number(userOrFarm.milkPrice) > 0) {
        return Number(userOrFarm.milkPrice);
      }
    }

    // 2. Si no se pasó un objeto de usuario específico, consultar sesión activa
    try {
      const session = getCurrentUser();
      if (session) {
        if (!userOrFarm || (typeof userOrFarm === 'string' && (userOrFarm === session.farmName || userOrFarm === session.name || userOrFarm === session.id))) {
          if (session.milkPrice !== undefined && session.milkPrice !== null && !isNaN(Number(session.milkPrice)) && Number(session.milkPrice) > 0) {
            return Number(session.milkPrice);
          }
        }
      }
    } catch (e) {}

    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr ? farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : '';

    // 3. Clave por ID de Cuenta/Usuario
    const valKey = localStorage.getItem(`ganado_price_milk_${key}`) || localStorage.getItem(`finca_milk_price_${key}`);
    if (valKey !== null && valKey !== '' && !isNaN(Number(valKey)) && Number(valKey) > 0) {
      return Number(valKey);
    }

    // 4. Clave secundaria por Nombre de Finca de la cuenta
    if (cleanFarm) {
      const valName = localStorage.getItem(`ganado_price_milk_farm_${cleanFarm}`) || localStorage.getItem(`finca_milk_price_farm_${cleanFarm}`);
      if (valName !== null && valName !== '' && !isNaN(Number(valName)) && Number(valName) > 0) {
        return Number(valName);
      }
    }

    // 5. Si la cuenta no tiene precio personalizado, devolver el valor base estándar de fábrica
    return DEFAULT_MILK_PRICE;
  } catch (e) {
    return DEFAULT_MILK_PRICE;
  }
}

/**
 * Guarda el precio por litro de leche para la cuenta/finca especificada
 */
export function setFarmMilkPrice(userOrFarm = null, price) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return DEFAULT_MILK_PRICE;

  try {
    cleanupLegacyGlobalKeys();
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr ? farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : '';

    // Guardar únicamente en claves aisladas para esta cuenta
    localStorage.setItem(`ganado_price_milk_${key}`, String(num));
    localStorage.setItem(`finca_milk_price_${key}`, String(num));
    if (cleanFarm) {
      localStorage.setItem(`ganado_price_milk_farm_${cleanFarm}`, String(num));
      localStorage.setItem(`finca_milk_price_farm_${cleanFarm}`, String(num));
    }

    // Actualizar sesión activa si corresponde
    try {
      const rawSession = localStorage.getItem('ganado_current_user_session');
      if (rawSession) {
        const sessionUser = JSON.parse(rawSession);
        if (sessionUser && sessionUser.id) {
          sessionUser.milkPrice = num;
          localStorage.setItem('ganado_current_user_session', JSON.stringify(sessionUser));
        }
      }
    } catch (e) {}

    // Notificar a observadores en tiempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_prices_updated', {
        detail: { farmKey: key, milkPrice: num }
      }));
    }
    return num;
  } catch (e) {
    console.warn('Error guardando precio de leche de la finca:', e);
    return num;
  }
}

/**
 * Obtiene el precio por kilo de carne / ganado en pie para la cuenta/finca especificada
 */
export function getFarmMeatPrice(userOrFarm = null) {
  try {
    cleanupLegacyGlobalKeys();

    if (userOrFarm && typeof userOrFarm === 'object') {
      if (userOrFarm.meatPricePerKg !== undefined && userOrFarm.meatPricePerKg !== null && !isNaN(Number(userOrFarm.meatPricePerKg)) && Number(userOrFarm.meatPricePerKg) > 0) {
        return Number(userOrFarm.meatPricePerKg);
      }
    }

    // Si no se pasó un objeto de usuario específico, consultar sesión activa
    try {
      const session = getCurrentUser();
      if (session) {
        if (!userOrFarm || (typeof userOrFarm === 'string' && (userOrFarm === session.farmName || userOrFarm === session.name || userOrFarm === session.id))) {
          if (session.meatPricePerKg !== undefined && session.meatPricePerKg !== null && !isNaN(Number(session.meatPricePerKg)) && Number(session.meatPricePerKg) > 0) {
            return Number(session.meatPricePerKg);
          }
        }
      }
    } catch (e) {}

    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr ? farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : '';

    // 1. Clave por ID de Cuenta/Usuario
    const valKey = localStorage.getItem(`ganado_price_meat_${key}`) || localStorage.getItem(`finca_meat_price_${key}`);
    if (valKey !== null && valKey !== '' && !isNaN(Number(valKey)) && Number(valKey) > 0) {
      return Number(valKey);
    }

    // 2. Clave secundaria por Nombre de Finca de la cuenta
    if (cleanFarm) {
      const valName = localStorage.getItem(`ganado_price_meat_farm_${cleanFarm}`) || localStorage.getItem(`finca_meat_price_farm_${cleanFarm}`);
      if (valName !== null && valName !== '' && !isNaN(Number(valName)) && Number(valName) > 0) {
        return Number(valName);
      }
    }

    return DEFAULT_MEAT_PRICE_PER_KG;
  } catch (e) {
    return DEFAULT_MEAT_PRICE_PER_KG;
  }
}

/**
 * Guarda el precio por kilo de carne para la cuenta/finca especificada
 */
export function setFarmMeatPrice(userOrFarm = null, price) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return DEFAULT_MEAT_PRICE_PER_KG;

  try {
    cleanupLegacyGlobalKeys();
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr ? farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : '';

    localStorage.setItem(`ganado_price_meat_${key}`, String(num));
    localStorage.setItem(`finca_meat_price_${key}`, String(num));
    if (cleanFarm) {
      localStorage.setItem(`ganado_price_meat_farm_${cleanFarm}`, String(num));
      localStorage.setItem(`finca_meat_price_farm_${cleanFarm}`, String(num));
    }

    // Actualizar sesión activa si corresponde
    try {
      const rawSession = localStorage.getItem('ganado_current_user_session');
      if (rawSession) {
        const sessionUser = JSON.parse(rawSession);
        if (sessionUser && sessionUser.id) {
          sessionUser.meatPricePerKg = num;
          localStorage.setItem('ganado_current_user_session', JSON.stringify(sessionUser));
        }
      }
    } catch (e) {}

    // Notificar a observadores en tiempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farm_prices_updated', {
        detail: { farmKey: key, meatPricePerKg: num }
      }));
    }
    return num;
  } catch (e) {
    console.warn('Error guardando precio de carne de la finca:', e);
    return num;
  }
}

/**
 * Obtiene ambos precios configurados para la cuenta/finca
 */
export function getFarmPrices(userOrFarm = null) {
  return {
    milkPrice: getFarmMilkPrice(userOrFarm),
    meatPricePerKg: getFarmMeatPrice(userOrFarm)
  };
}

/**
 * Guarda ambos precios configurados para la cuenta/finca
 */
export function setFarmPrices(userOrFarm = null, { milkPrice, meatPricePerKg }) {
  let resMilk = null;
  let resMeat = null;
  if (milkPrice !== undefined && milkPrice !== null && !isNaN(Number(milkPrice))) {
    resMilk = setFarmMilkPrice(userOrFarm, milkPrice);
  }
  if (meatPricePerKg !== undefined && meatPricePerKg !== null && !isNaN(Number(meatPricePerKg))) {
    resMeat = setFarmMeatPrice(userOrFarm, meatPricePerKg);
  }
  return {
    milkPrice: resMilk !== null ? resMilk : getFarmMilkPrice(userOrFarm),
    meatPricePerKg: resMeat !== null ? resMeat : getFarmMeatPrice(userOrFarm)
  };
}

/**
 * Hook de React para sincronizar los precios comerciales de la finca en tiempo real
 */
export function useFarmPrices(userOrFarm = null) {
  const [prices, setPrices] = useState(() => getFarmPrices(userOrFarm));

  useEffect(() => {
    setPrices(getFarmPrices(userOrFarm));

    const handleUpdate = () => {
      setPrices(getFarmPrices(userOrFarm));
    };

    window.addEventListener('farm_prices_updated', handleUpdate);
    return () => window.removeEventListener('farm_prices_updated', handleUpdate);
  }, [userOrFarm?.id, userOrFarm?.farmName, userOrFarm?.ownerId, typeof userOrFarm === 'string' ? userOrFarm : null]);

  const updateMilkPrice = (newPrice) => {
    const updated = setFarmMilkPrice(userOrFarm, newPrice);
    setPrices(prev => ({ ...prev, milkPrice: updated }));
    return updated;
  };

  const updateMeatPrice = (newPrice) => {
    const updated = setFarmMeatPrice(userOrFarm, newPrice);
    setPrices(prev => ({ ...prev, meatPricePerKg: updated }));
    return updated;
  };

  const updateAllPrices = (newPrices) => {
    const updated = setFarmPrices(userOrFarm, newPrices);
    setPrices(updated);
    return updated;
  };

  return {
    milkPrice: prices.milkPrice,
    meatPricePerKg: prices.meatPricePerKg,
    setMilkPrice: updateMilkPrice,
    setMeatPrice: updateMeatPrice,
    setPrices: updateAllPrices,
  };
}
