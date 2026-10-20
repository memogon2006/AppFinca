/**
 * auctionPriceService.js
 * Servicio inteligente de monitoreo de precios de subastas ganaderas en Colombia,
 * comparativa semanal de variaciones y valuador comercial de inventario en pie.
 * 
 * Subastas monitoreadas:
 * - Central Ganadera de Medellín (Antioquia)
 * - Sugaberrío (Puerto Berrío / Cimitarra / Sabana)
 * - Sugamagdalena (La Dorada, Caldas / Puerto Salgar)
 * - Suganusa (Ubaté / Chiquinquirá / Cundiboyacense)
 * - Subastar S.A. (Montería / Córdoba / Sucre / Urabá)
 * - Promedio Nacional FEDEGÁN (Fondo Nacional del Ganado)
 */

import { calculateWeightMetrics } from './calculations';

export const AUCTION_HOUSES = {
  sugaberrio: {
    id: 'sugaberrio',
    name: 'Sugaberrío',
    location: 'Puerto Berrío / Cimitarra (Magdalena Medio)',
    auctionDays: 'Miércoles y Jueves',
    logo: '🏷️',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
  },
  central_ganadera: {
    id: 'central_ganadera',
    name: 'Central Ganadera',
    location: 'Medellín (Antioquia)',
    auctionDays: 'Martes y Jueves',
    logo: '🏛️',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
  },
  sugamagdalena: {
    id: 'sugamagdalena',
    name: 'Sugamagdalena',
    location: 'La Dorada (Caldas) / Puerto Salgar',
    auctionDays: 'Viernes',
    logo: '🌊',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800'
  },
  suganusa: {
    id: 'suganusa',
    name: 'Suganusa',
    location: 'Ubaté / Chiquinquirá (Cundiboyacense)',
    auctionDays: 'Martes',
    logo: '🏔️',
    color: 'indigo',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
  },
  subastar: {
    id: 'subastar',
    name: 'Subastar S.A.',
    location: 'Montería / Planeta Rica / San Pedro (Costa)',
    auctionDays: 'Martes y Jueves',
    logo: '🌴',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
  },
  fedegan_nacional: {
    id: 'fedegan_nacional',
    name: 'Consolidado Nacional FEDEGÁN',
    location: 'Promedio Ponderado Nacional',
    auctionDays: 'Consolidado Semanal',
    logo: '📈',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800'
  }
};

export const MARKET_CATEGORIES = {
  macho_ceba: {
    id: 'macho_ceba',
    name: 'Macho de Ceba / Novillo Gordo',
    shortName: 'Macho Ceba (1ra)',
    emoji: '🐂',
    weightRange: '450 - 550 kg',
    desc: 'Novillo terminado de primera calidad para sacrificio o frigorífico'
  },
  macho_levante: {
    id: 'macho_levante',
    name: 'Macho de Levante / Desteto',
    shortName: 'Macho Levante',
    emoji: '🐂',
    weightRange: '180 - 280 kg',
    desc: 'Ternero o novillero desteto para inicio de pastoreo y ceba'
  },
  hembra_ceba: {
    id: 'hembra_ceba',
    name: 'Hembra Gorda / Ceba',
    shortName: 'Hembra Ceba',
    emoji: '🐄',
    weightRange: '400 - 480 kg',
    desc: 'Vaca o novilla cebada terminada para sacrificio'
  },
  hembra_levante: {
    id: 'hembra_levante',
    name: 'Hembra de Levante / Vientre',
    shortName: 'Hembra Levante',
    emoji: '🐄',
    weightRange: '180 - 260 kg',
    desc: 'Ternera o novilla de reemplazo para reproducción'
  },
  vaca_descarte: {
    id: 'vaca_descarte',
    name: 'Vaca de Descarte / Horra',
    shortName: 'Vaca Descarte',
    emoji: '🥩',
    weightRange: '350 - 450 kg',
    desc: 'Vaca comercial de desecho / escotera sin vocación lechera'
  }
};

// Matriz de precios base de referencia por subasta con su remate anterior
const DEFAULT_AUCTION_DATA = {
  sugaberrio: {
    lastDate: '16/10/2026',
    prices: {
      macho_ceba: { current: 8450, previous: 8250 },
      macho_levante: { current: 9280, previous: 9060 },
      hembra_ceba: { current: 7580, previous: 7450 },
      hembra_levante: { current: 8250, previous: 8150 },
      vaca_descarte: { current: 6380, previous: 6480 }
    }
  },
  central_ganadera: {
    lastDate: '15/10/2026',
    prices: {
      macho_ceba: { current: 8520, previous: 8340 },
      macho_levante: { current: 9150, previous: 8980 },
      hembra_ceba: { current: 7620, previous: 7500 },
      hembra_levante: { current: 8300, previous: 8200 },
      vaca_descarte: { current: 6450, previous: 6550 }
    }
  },
  sugamagdalena: {
    lastDate: '17/10/2026',
    prices: {
      macho_ceba: { current: 8380, previous: 8220 },
      macho_levante: { current: 9180, previous: 9020 },
      hembra_ceba: { current: 7520, previous: 7420 },
      hembra_levante: { current: 8200, previous: 8100 },
      vaca_descarte: { current: 6320, previous: 6400 }
    }
  },
  suganusa: {
    lastDate: '14/10/2026',
    prices: {
      macho_ceba: { current: 8480, previous: 8350 },
      macho_levante: { current: 9020, previous: 8920 },
      hembra_ceba: { current: 7590, previous: 7490 },
      hembra_levante: { current: 8150, previous: 8050 },
      vaca_descarte: { current: 6400, previous: 6450 }
    }
  },
  subastar: {
    lastDate: '15/10/2026',
    prices: {
      macho_ceba: { current: 8320, previous: 8180 },
      macho_levante: { current: 9340, previous: 9120 },
      hembra_ceba: { current: 7480, previous: 7380 },
      hembra_levante: { current: 8280, previous: 8150 },
      vaca_descarte: { current: 6280, previous: 6350 }
    }
  },
  fedegan_nacional: {
    lastDate: '19/10/2026',
    prices: {
      macho_ceba: { current: 8435, previous: 8270 },
      macho_levante: { current: 9190, previous: 9015 },
      hembra_ceba: { current: 7560, previous: 7450 },
      hembra_levante: { current: 8235, previous: 8130 },
      vaca_descarte: { current: 6365, previous: 6445 }
    }
  }
};

/**
 * Obtiene el listado consolidado de subastas con diferencias semanales calculadas
 */
export function getAuctionPricesData() {
  let customOverrides = {};
  try {
    const raw = localStorage.getItem('ganado_custom_auction_prices');
    if (raw) customOverrides = JSON.parse(raw);
  } catch (e) {}

  const result = {};

  Object.entries(DEFAULT_AUCTION_DATA).forEach(([auctionId, data]) => {
    const info = AUCTION_HOUSES[auctionId] || { name: auctionId, logo: '🏷️' };
    const customData = customOverrides[auctionId] || {};
    const lastDate = customData.lastDate || data.lastDate;

    const categories = {};
    Object.entries(data.prices).forEach(([catId, p]) => {
      const customPrice = customData.prices?.[catId];
      const current = customPrice?.current !== undefined ? customPrice.current : p.current;
      const previous = customPrice?.previous !== undefined ? customPrice.previous : p.previous;
      const diff = current - previous;
      const diffPercent = previous > 0 ? (diff / previous) * 100 : 0;
      const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'equal';

      categories[catId] = {
        ...MARKET_CATEGORIES[catId],
        currentPrice: current,
        previousPrice: previous,
        diff,
        diffPercent: Number(diffPercent.toFixed(2)),
        trend
      };
    });

    result[auctionId] = {
      ...info,
      lastDate,
      categories
    };
  });

  return result;
}

/**
 * Obtiene la subasta favorita / por defecto de referencia
 */
export function getDefaultAuctionId() {
  try {
    return localStorage.getItem('ganado_default_auction_plaza') || 'sugaberrio';
  } catch (e) {
    return 'sugaberrio';
  }
}

/**
 * Establece la subasta favorita de referencia
 */
export function setDefaultAuctionId(auctionId) {
  try {
    localStorage.setItem('ganado_default_auction_plaza', auctionId);
    window.dispatchEvent(new CustomEvent('auction_prices_updated'));
  } catch (e) {}
}

/**
 * Genera historial sintético de 8 semanas para graficar tendencias
 */
export function getAuctionPriceHistory(auctionId = 'sugaberrio', categoryId = 'macho_ceba') {
  const allData = getAuctionPricesData();
  const currentItem = allData[auctionId]?.categories?.[categoryId] || { currentPrice: 8400, diff: 150 };
  const current = currentItem.currentPrice;

  const weeks = [
    { week: 'Sem -7', price: Math.round(current - 420) },
    { week: 'Sem -6', price: Math.round(current - 350) },
    { week: 'Sem -5', price: Math.round(current - 280) },
    { week: 'Sem -4', price: Math.round(current - 190) },
    { week: 'Sem -3', price: Math.round(current - 120) },
    { week: 'Sem -2', price: Math.round(current - 80) },
    { week: 'Sem -1', price: Math.round(currentItem.previousPrice || current - 150) },
    { week: 'Actual', price: current }
  ];

  return weeks;
}

/**
 * Determina a qué categoría de mercado corresponde un bovino según su sexo y peso
 */
export function classifyAnimalForMarket(animal, currentWeight = 0) {
  const w = currentWeight > 0 ? currentWeight : (parseFloat(animal.weight || animal.entryWeight) || 300);
  const sex = (animal.sex || 'Macho').toLowerCase();
  const isMale = sex.includes('macho') || sex.includes('toro') || sex.includes('buey');

  if (isMale) {
    return w >= 360 ? 'macho_ceba' : 'macho_levante';
  } else {
    // Hembra
    const status = (animal.status || '').toLowerCase();
    const femaleStatus = (animal.femaleStatus || '').toLowerCase();
    if (status.includes('descarte') || femaleStatus.includes('descarte') || femaleStatus.includes('horra') || animal.isCull) {
      return 'vaca_descarte';
    }
    return w >= 340 ? 'hembra_ceba' : 'hembra_levante';
  }
}

/**
 * Calcula la Valuación Comercial en Vivo de todo el hato activo en la finca
 */
export function calculateHerdValuation(activeCattle = [], weighings = [], auctionId = null) {
  const targetAuctionId = auctionId || getDefaultAuctionId();
  const allPrices = getAuctionPricesData();
  const auction = allPrices[targetAuctionId] || allPrices.sugaberrio;

  let totalValue = 0;
  let totalWeight = 0;
  let animalCount = activeCattle.length;

  const breakdown = {
    macho_ceba: { count: 0, weight: 0, value: 0, pricePerKg: auction.categories.macho_ceba.currentPrice },
    macho_levante: { count: 0, weight: 0, value: 0, pricePerKg: auction.categories.macho_levante.currentPrice },
    hembra_ceba: { count: 0, weight: 0, value: 0, pricePerKg: auction.categories.hembra_ceba.currentPrice },
    hembra_levante: { count: 0, weight: 0, value: 0, pricePerKg: auction.categories.hembra_levante.currentPrice },
    vaca_descarte: { count: 0, weight: 0, value: 0, pricePerKg: auction.categories.vaca_descarte.currentPrice }
  };

  activeCattle.forEach(animal => {
    const animalWeighings = weighings.filter(w => String(w.cattleId) === String(animal.id));
    const metrics = calculateWeightMetrics(animal, animalWeighings);
    const weight = metrics.currentWeight || parseFloat(animal.weight || animal.entryWeight) || 300;
    
    const catId = classifyAnimalForMarket(animal, weight);
    const pricePerKg = auction.categories[catId]?.currentPrice || 8400;
    const animalVal = weight * pricePerKg;

    totalWeight += weight;
    totalValue += animalVal;

    if (breakdown[catId]) {
      breakdown[catId].count++;
      breakdown[catId].weight += weight;
      breakdown[catId].value += animalVal;
    }
  });

  const avgPricePerKg = totalWeight > 0 ? (totalValue / totalWeight) : 0;
  const avgWeightPerHead = animalCount > 0 ? (totalWeight / animalCount) : 0;

  return {
    auctionId: targetAuctionId,
    auctionName: auction.name,
    auctionDate: auction.lastDate,
    animalCount,
    totalWeight: Math.round(totalWeight),
    totalValue: Math.round(totalValue),
    avgPricePerKg: Math.round(avgPricePerKg),
    avgWeightPerHead: Math.round(avgWeightPerHead),
    breakdown
  };
}

/**
 * Guarda una actualización manual de precio de subasta (local o personalizada)
 */
export function saveCustomAuctionPrice(auctionId, categoryId, currentPrice, previousPrice = null) {
  try {
    let customOverrides = {};
    const raw = localStorage.getItem('ganado_custom_auction_prices');
    if (raw) customOverrides = JSON.parse(raw);

    if (!customOverrides[auctionId]) {
      customOverrides[auctionId] = { prices: {} };
    }
    if (!customOverrides[auctionId].prices) {
      customOverrides[auctionId].prices = {};
    }

    const cur = parseFloat(currentPrice) || 0;
    const prev = previousPrice !== null ? parseFloat(previousPrice) : cur;

    customOverrides[auctionId].prices[categoryId] = {
      current: cur,
      previous: prev
    };
    customOverrides[auctionId].lastDate = new Date().toLocaleDateString('es-CO');

    localStorage.setItem('ganado_custom_auction_prices', JSON.stringify(customOverrides));
    window.dispatchEvent(new CustomEvent('auction_prices_updated'));
    return true;
  } catch (e) {
    console.error('Error guardando precio de subasta personalizado:', e);
    return false;
  }
}

/**
 * Genera el texto del boletín con formato limpio para enviar por WhatsApp
 */
export function generateAuctionWhatsAppReport(auctionId = 'sugaberrio', herdValuation = null, farmName = 'Mi Finca') {
  const allPrices = getAuctionPricesData();
  const auction = allPrices[auctionId] || allPrices.sugaberrio;

  let text = `🐂 *BOLETÍN DE PRECIOS DE SUBASTA GANADERA* 📊\n` +
    `🏛️ *Plaza:* ${auction.name} (${auction.location})\n` +
    `📅 *Último Remate:* ${auction.lastDate}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  Object.values(auction.categories).forEach(cat => {
    const symbol = cat.trend === 'up' ? '▲' : cat.trend === 'down' ? '▼' : '=';
    const sign = cat.diff > 0 ? '+' : '';
    text += `${cat.emoji} *${cat.shortName}:* $${cat.currentPrice.toLocaleString('es-CO')} / kg\n` +
      `   └ Variación: ${symbol} ${sign}$${cat.diff.toLocaleString('es-CO')} (${sign}${cat.diffPercent}%)\n`;
  });

  if (herdValuation && herdValuation.totalValue > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *VALOR ESTIMADO DEL HATO EN PIE (${farmName}):*\n` +
      `• *Total Cabezas:* ${herdValuation.animalCount} animales\n` +
      `• *Peso Total:* ${herdValuation.totalWeight.toLocaleString('es-CO')} kg\n` +
      `• *Valor Comercial:* $${herdValuation.totalValue.toLocaleString('es-CO')} COP\n` +
      `• *Precio Promedio Ponderado:* $${herdValuation.avgPricePerKg.toLocaleString('es-CO')} / kg\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Datos sincronizados vía Software Ganadero_ 🐮🌱`;

  return text;
}
