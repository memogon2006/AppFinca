/**
 * Servicio Agroclimático y Monitoreo de Estrés Calórico Bovino (ITH)
 * Integrado con la API abierta Open-Meteo (Sin API Keys, Gratuita $0)
 */

const CACHE_KEY = 'ganado_weather_cache_v1';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Calcula el Índice de Temperatura y Humedad (ITH / THI) para Ganado Bovino
 * Fórmula internacional (NOAA / Fedegán / USDA):
 * ITH = (1.8 * T + 32) - (0.55 - 0.0055 * HR) * (1.8 * T - 26)
 * @param {number} tempC - Temperatura en grados Celsius
 * @param {number} relativeHumidity - Humedad relativa en porcentaje (0 a 100)
 * @returns {number} ITH redondeado a 1 decimal
 */
export function calculateITH(tempC, relativeHumidity) {
  const t = parseFloat(tempC) || 28;
  const hr = parseFloat(relativeHumidity) || 75;
  const ith = (1.8 * t + 32) - (0.55 - 0.0055 * hr) * (1.8 * t - 26);
  return Math.round(ith * 10) / 10;
}

/**
 * Categoriza el valor de ITH según las tablas zootécnicas de bienestar animal
 * @param {number} ithValue 
 */
export function getITHLevel(ithValue) {
  const val = parseFloat(ithValue) || 70;

  if (val < 72) {
    return {
      level: 'comfort',
      label: 'Confort Térmico',
      shortLabel: 'Confort',
      color: 'emerald',
      score: 1,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      description: 'El ganado rumia y pastorea con normalidad. Óptima ganancia de peso y máxima producción láctea.',
      actionAdvice: 'Manejo de pastoreo habitual sin restricciones.'
    };
  }

  if (val <= 78) {
    return {
      level: 'mild',
      label: 'Alerta Leve',
      shortLabel: 'Alerta Leve',
      color: 'amber',
      score: 2,
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
      textClass: 'text-amber-600 dark:text-amber-400',
      description: 'Leve aumento de la frecuencia respiratoria y consumo de agua. Ligera disminución de ingesta (~5%).',
      actionAdvice: 'Garantizar agua limpia y fresca en bebederos y saladeros cubiertos.'
    };
  }

  if (val <= 88) {
    return {
      level: 'moderate',
      label: 'Peligro Moderado',
      shortLabel: 'Peligro',
      color: 'orange',
      score: 3,
      badgeClass: 'bg-orange-100 text-orange-950 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700',
      textClass: 'text-orange-600 dark:text-orange-400',
      description: 'Jadeo evidente y salivación. Reducción severa de pastoreo diurno (20-30%) y caída en producción.',
      actionAdvice: 'Priorizar potreros con sombra natural/árboles. Fomentar pastoreo nocturno o madrugada.'
    };
  }

  return {
    level: 'critical',
    label: 'Emergencia Crítica',
    shortLabel: 'Emergencia',
    color: 'rose',
    score: 4,
    badgeClass: 'bg-rose-100 text-rose-950 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 animate-pulse',
    textClass: 'text-rose-600 dark:text-rose-400',
    description: 'Riesgo inminente de golpe de calor, hipertermia, abortos en vacas preñadas y mortalidad.',
    actionAdvice: 'Acción urgente: trasladar a sombra densa o manga cubierta; hidratar y no mover el ganado a pie.'
  };
}

/**
 * Categoriza el piso térmico altitudinal y su impacto zootécnico en pastos y razas
 * @param {number} elevationMeters - Metros sobre el nivel del mar (m.s.n.m.)
 */
export function getThermalFloor(elevationMeters) {
  const elev = parseFloat(elevationMeters) || 125;
  if (elev < 1000) {
    return {
      floor: 'Cálido',
      name: 'Piso Térmico Cálido (Trópico Bajo)',
      elevationRange: '0 - 1.000 m.s.n.m.',
      tempRange: '> 24°C',
      emoji: '🌴',
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
      description: 'Clima cálido tropical. Óptimo para pasturas Brachiaria, Mombaza, Tanzania y ganado Cebú Brahman, Nelore, Girolando y Guzerá.'
    };
  }
  if (elev <= 2000) {
    return {
      floor: 'Templado',
      name: 'Piso Térmico Templado (Trópico Medio)',
      elevationRange: '1.000 - 2.000 m.s.n.m.',
      tempRange: '17°C - 24°C',
      emoji: '⛰️',
      badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
      description: 'Clima medio de ladera y valles. Ideal para pasto Estrella, Mulato II, Caimán y cruces F1, Simmental, Pardo Suizo y Bonsmara.'
    };
  }
  return {
    floor: 'Frío',
    name: 'Piso Térmico Frío (Trópico Alto)',
    elevationRange: '> 2.000 m.s.n.m.',
    tempRange: '12°C - 17°C',
    emoji: '🏔️',
    badgeClass: 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700',
    description: 'Trópico alto especializado. Clima frío para pasto Kikuyo, Raigrás, Avena forrajera y ganado lechero Holstein, Normando, Jersey y Ayrshire.'
  };
}

/**
 * Traduce los códigos climáticos WMO de Open-Meteo a descripciones en español
 */
export function getWeatherCodeInfo(code) {
  const c = parseInt(code, 10);
  switch (c) {
    case 0:
      return { label: 'Cielo Despejado', icon: 'Sun', emoji: '☀️' };
    case 1:
      return { label: 'Principalmente Despejado', icon: 'Sun', emoji: '🌤️' };
    case 2:
      return { label: 'Parcialmente Nublado', icon: 'CloudSun', emoji: '⛅' };
    case 3:
      return { label: 'Nublado', icon: 'Cloud', emoji: '☁️' };
    case 45:
    case 48:
      return { label: 'Neblina en la Zona', icon: 'CloudFog', emoji: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { label: 'Llovizna Ligera', icon: 'CloudDrizzle', emoji: '🌦️' };
    case 61:
    case 63:
      return { label: 'Lluvia Moderada', icon: 'CloudRain', emoji: '🌧️' };
    case 65:
      return { label: 'Lluvia Fuerte', icon: 'CloudRain', emoji: '🌧️' };
    case 80:
    case 81:
    case 82:
      return { label: 'Chubascos Aislados', icon: 'CloudRain', emoji: '⛈️' };
    case 95:
    case 96:
    case 99:
      return { label: 'Tormenta Eléctrica', icon: 'CloudLightning', emoji: '⚡' };
    default:
      return { label: 'Tiempo Variable', icon: 'Cloud', emoji: '⛅' };
  }
}

/**
 * Consulta la API de Open-Meteo y calcula las variables agroclimáticas
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {boolean} forceRefresh 
 */
export async function fetchAgroWeatherData(latitude, longitude, forceRefresh = false) {
  const lat = parseFloat(latitude) || 6.4913; // Por defecto Magdalena Medio (Puerto Berrío)
  const lng = parseFloat(longitude) || -74.4042;
  const cacheKey = `${CACHE_KEY}_${lat.toFixed(3)}_${lng.toFixed(3)}`;

  // 1. Revisar caché local válida
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
          return cached.data;
        }
      }
    } catch (e) {}
  }

  // 2. Consulta a Open-Meteo
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('Respuesta no válida del servicio meteorológico');
    const json = await res.json();

    const current = json.current || {};
    const daily = json.daily || {};

    const temp = Math.round((current.temperature_2m || 28) * 10) / 10;
    const humidity = Math.round(current.relative_humidity_2m || 75);
    const rain = Math.round((current.precipitation || 0) * 10) / 10;
    const wind = Math.round(current.wind_speed_10m || 8);
    const weatherCode = current.weather_code || 1;
    const ith = calculateITH(temp, humidity);
    const ithLevel = getITHLevel(ith);
    const weatherInfo = getWeatherCodeInfo(weatherCode);

    // Días de la semana para el pronóstico
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const forecastDays = (daily.time || []).map((dateStr, idx) => {
      const d = new Date(dateStr + 'T12:00:00');
      const maxT = Math.round(daily.temperature_2m_max?.[idx] || temp);
      const minT = Math.round(daily.temperature_2m_min?.[idx] || temp - 6);
      const rainMm = Math.round((daily.precipitation_sum?.[idx] || 0) * 10) / 10;
      const rainProb = Math.round(daily.precipitation_probability_max?.[idx] || 0);
      const code = daily.weather_code?.[idx] || 1;
      const dayITH = calculateITH(maxT, humidity);

      return {
        date: dateStr,
        dayName: dayNames[d.getDay()],
        maxTemp: maxT,
        minTemp: minT,
        rainMm,
        rainProb,
        weatherInfo: getWeatherCodeInfo(code),
        ith: dayITH,
        ithLevel: getITHLevel(dayITH)
      };
    });

    const elevation = Math.round(json.elevation || 125);

    const parsedData = {
      location: { lat, lng },
      elevation,
      thermalFloor: getThermalFloor(elevation),
      current: {
        temp,
        humidity,
        rain,
        wind,
        ith,
        ithLevel,
        weatherInfo
      },
      forecastDays: forecastDays.slice(0, 7),
      updatedAt: new Date().toISOString()
    };

    // Guardar en caché
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: parsedData }));
    } catch (e) {}

    return parsedData;

  } catch (err) {
    console.warn('⚠️ Error consultando clima en vivo:', err);

    // Fallback con estimación zootécnica típica del trópico
    const fallbackITH = 76.5;
    return {
      isFallback: true,
      location: { lat, lng },
      elevation: 125,
      thermalFloor: getThermalFloor(125),
      current: {
        temp: 29.5,
        humidity: 78,
        rain: 0,
        wind: 7,
        ith: fallbackITH,
        ithLevel: getITHLevel(fallbackITH),
        weatherInfo: { label: 'Clima Tropical Estimado', icon: 'Sun', emoji: '⛅' }
      },
      forecastDays: [
        { date: 'Hoy', dayName: 'Hoy', maxTemp: 32, minTemp: 23, rainMm: 4, rainProb: 35, weatherInfo: { label: 'Parcialmente Nublado', emoji: '⛅' }, ith: 78, ithLevel: getITHLevel(78) },
        { date: 'Mañana', dayName: 'Mañ', maxTemp: 31, minTemp: 22, rainMm: 12, rainProb: 65, weatherInfo: { label: 'Chubascos', emoji: '🌦️' }, ith: 76, ithLevel: getITHLevel(76) },
        { date: 'Día 3', dayName: 'Pas', maxTemp: 30, minTemp: 22, rainMm: 18, rainProb: 75, weatherInfo: { label: 'Lluvia', emoji: '🌧️' }, ith: 75, ithLevel: getITHLevel(75) },
      ],
      updatedAt: new Date().toISOString()
    };
  }
}
