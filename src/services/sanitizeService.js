/**
 * Servicio de sanitización y blindaje de entradas de usuario
 * Previene inyecciones de código malicioso (XSS), caracteres corruptos y ataques por inyección
 */

/**
 * Sanitiza una cadena de texto individual eliminando etiquetas HTML peligrosas y normalizando espacios
 */
export function sanitizeString(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'string') return String(val);

  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Elimina scripts completos
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Elimina iframes
    .replace(/javascript:/gi, '') // Neutraliza enlaces javascript:
    .replace(/on\w+\s*=/gi, '') // Neutraliza eventos inline (onerror=, onclick=)
    .replace(/[<>]/g, '') // Elimina tags HTML angulares residuales
    .trim();
}

/**
 * Sanitiza recursivamente todas las propiedades de tipo string en un objeto o array
 */
export function sanitizeData(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}
