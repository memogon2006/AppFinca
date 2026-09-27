import { useState, useEffect } from 'react';

/**
 * Servicio de Gestión de Precios Comerciales por Finca / Predio Ganadero
 * Permite que cada finca tenga valores independientes para:
 * 1. Precio de la Leche ($/Litro de Leche)
 * 2. Precio de la Carne / Ganado en Pie ($/Kg de Carne)
 */

export const DEFAULT_MILK_PRICE = 2100; // Valor base referencial en Colombia (COP/Litro)
export const DEFAULT_MEAT_PRICE_PER_KG = 9200; // Valor base referencial en Colombia (COP/Kg en pie)

/**
 * Normaliza la clave única para identificar una finca
 */
export function getFarmKey(userOrFarm) {
  if (!userOrFarm) {
    try {
      const session = JSON.parse(localStorage.getItem('ganado_current_user_session') || '{}');
      if (session && (session.farmName || session.id)) {
        return getFarmKey(session);
      }
    } catch (e) {}
    return 'default_farm';
  }

  if (typeof userOrFarm === 'string') {
    const clean = userOrFarm.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return clean || 'default_farm';
  }

  // Objeto usuario o finca
  const farmId = userOrFarm.role === 'worker' ? (userOrFarm.ownerId || userOrFarm.id) : userOrFarm.id;
  const farmName = (userOrFarm.farmName || userOrFarm.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (farmId) {
    return `farm_${farmId}`;
  }
  if (farmName) {
    return `farm_${farmName}`;
  }
  return 'default_farm';
}

/**
 * Obtiene el precio por litro de leche para la finca especificada
 */
export function getFarmMilkPrice(userOrFarm = null) {
  try {
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // 1. Clave por ID/Key de Finca
    const valKey = localStorage.getItem(`finca_milk_price_${key}`);
    if (valKey !== null && valKey !== '' && !isNaN(Number(valKey)) && Number(valKey) > 0) {
      return Number(valKey);
    }

    // 2. Clave por Nombre de Finca
    if (cleanFarm) {
      const valName = localStorage.getItem(`finca_milk_price_${cleanFarm}`);
      if (valName !== null && valName !== '' && !isNaN(Number(valName)) && Number(valName) > 0) {
        return Number(valName);
      }
    }

    // 3. Fallback genérico previo si existe
    const generic = localStorage.getItem('finca_milk_price_per_liter');
    if (generic !== null && generic !== '' && !isNaN(Number(generic)) && Number(generic) > 0) {
      return Number(generic);
    }

    return DEFAULT_MILK_PRICE;
  } catch (e) {
    return DEFAULT_MILK_PRICE;
  }
}

/**
 * Guarda el precio por litro de leche para la finca especificada
 */
export function setFarmMilkPrice(userOrFarm = null, price) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return DEFAULT_MILK_PRICE;

  try {
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    localStorage.setItem(`finca_milk_price_${key}`, String(num));
    if (cleanFarm) {
      localStorage.setItem(`finca_milk_price_${cleanFarm}`, String(num));
    }
    localStorage.setItem('finca_milk_price_per_liter', String(num));

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
 * Obtiene el precio por kilo de carne / ganado en pie para la finca especificada
 */
export function getFarmMeatPrice(userOrFarm = null) {
  try {
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // 1. Clave por ID/Key de Finca
    const valKey = localStorage.getItem(`finca_meat_price_${key}`);
    if (valKey !== null && valKey !== '' && !isNaN(Number(valKey)) && Number(valKey) > 0) {
      return Number(valKey);
    }

    // 2. Clave por Nombre de Finca
    if (cleanFarm) {
      const valName = localStorage.getItem(`finca_meat_price_${cleanFarm}`);
      if (valName !== null && valName !== '' && !isNaN(Number(valName)) && Number(valName) > 0) {
        return Number(valName);
      }
    }

    // 3. Fallback genérico previo si existe
    const generic = localStorage.getItem('finca_meat_price_per_kg');
    if (generic !== null && generic !== '' && !isNaN(Number(generic)) && Number(generic) > 0) {
      return Number(generic);
    }

    return DEFAULT_MEAT_PRICE_PER_KG;
  } catch (e) {
    return DEFAULT_MEAT_PRICE_PER_KG;
  }
}

/**
 * Guarda el precio por kilo de carne para la finca especificada
 */
export function setFarmMeatPrice(userOrFarm = null, price) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return DEFAULT_MEAT_PRICE_PER_KG;

  try {
    const key = getFarmKey(userOrFarm);
    const farmNameStr = typeof userOrFarm === 'string' ? userOrFarm : (userOrFarm?.farmName || '');
    const cleanFarm = farmNameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    localStorage.setItem(`finca_meat_price_${key}`, String(num));
    if (cleanFarm) {
      localStorage.setItem(`finca_meat_price_${cleanFarm}`, String(num));
    }
    localStorage.setItem('finca_meat_price_per_kg', String(num));

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
 * Obtiene ambos precios configurados para la finca
 */
export function getFarmPrices(userOrFarm = null) {
  return {
    milkPrice: getFarmMilkPrice(userOrFarm),
    meatPricePerKg: getFarmMeatPrice(userOrFarm)
  };
}

/**
 * Guarda ambos precios configurados para la finca
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
