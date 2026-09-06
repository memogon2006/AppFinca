export const CURRENT_APP_VERSION = "2.8.30";
export const CURRENT_BUILD_TIME = 1789125000000;

/**
 * Historial de las últimas actualizaciones generadas en el sistema
 */
export const APP_CHANGELOG = [
  {
    version: "2.8.30",
    date: "06/09/2026",
    title: "Comparador Ejecutivo Sintético de Lotes",
    highlights: [
      "Comparativa compacta y concisa enfocada en: Precios ($/animal y $/kg), Rendimientos (GDP y +kg), Tiempo en Finca (Días) y Valor de Compra Total.",
      "Tabla matriz ejecutiva con fondo de alto contraste, bordes negros definidos y columnas financieras/zootécnicas clave.",
      "Tarjetas resumen compactas por lote para rápida lectura en móvil y computador."
    ]
  },
  {
    version: "2.8.29",
    date: "06/09/2026",
    title: "Comparador Interactivo de Lotes & Ingresos",
    highlights: [
      "Comparador cara a cara entre múltiples lotes con selección interactiva por chips o todos a la vez.",
      "Insignias y medallas de eficiencia al mejor lote: menor costo de compra ($/kg), mayor ritmo de engorde (GDP) y mayor ganancia total de carne.",
      "Matriz comparativa completa y tarjetas lado a lado de biomasa, inversión, días en finca y cabezas listas para venta."
    ]
  },
  {
    version: "2.8.28",
    date: "06/09/2026",
    title: "Módulo de Análisis por Lote / Ingreso",
    highlights: [
      "Espacio dedicado para ver compra total, precio por animal, valor del kilo ($/kg) y kilos promedio por lote.",
      "Tabla comparativa entre lotes con biomasa de entrada, peso actual, ganancia de carne y GDP.",
      "Listado detallado animal por animal con bordes negros definidos y pie de subtotales/promedios exactos."
    ]
  },
  {
    version: "2.8.23",
    date: "06/09/2026",
    title: "Historial de Actualizaciones en Perfil",
    highlights: [
      "Visualizador de las últimas 5 actualizaciones generadas con sus mejoras y cambios.",
      "Identificación automática de la versión instalada y estado de conexión en la nube."
    ]
  },
  {
    version: "2.8.22",
    date: "06/09/2026",
    title: "Desglose de Cabezas Activas y Vendidas en Totales",
    highlights: [
      "Fila final de totales en Excel desglosa cuántas cabezas siguen en finca y cuántas fueron vendidas.",
      "Pie de tabla (tfoot) en el inventario con resumen numérico de biomasa, activos y vendidos.",
      "Insignias superiores destacadas con contadores en tiempo real."
    ]
  },
  {
    version: "2.8.21",
    date: "06/09/2026",
    title: "Fila Diferenciada de Vendidos y Prioridad de Activos",
    highlights: [
      "Toda la fila del animal vendido aparece coloreada en tono ámbar distintivo.",
      "Los animales activos que siguen en finca se muestran siempre de primero en la tabla y en Excel.",
      "En Excel, cada celda de animal vendido tiene fondo ámbar pastel y texto en marrón oscuro."
    ]
  },
  {
    version: "2.8.20",
    date: "06/09/2026",
    title: "Bordes Negros Definidos y Estilos Pro en Excel",
    highlights: [
      "Cuadrícula con bordes negros nítidos en todas las celdas de las hojas Excel.",
      "Encabezados verde esmeralda con texto en blanco y filas alternadas con contraste óptimo.",
      "Línea de totales destacada con doble borde inferior contable."
    ]
  }
];

/**
 * Consulta en la nube si hay una nueva versión publicada
 */
export async function checkAppUpdate() {
  try {
    const response = await fetch(`/version.json?_nocache=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    if (!response.ok) return { hasUpdate: false };

    const remote = await response.json();
    const hasNewVersion = remote.version !== CURRENT_APP_VERSION || (remote.buildTime && remote.buildTime > CURRENT_BUILD_TIME);

    return {
      hasUpdate: hasNewVersion,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: remote.version || CURRENT_APP_VERSION,
      description: remote.description || 'Mejoras de rendimiento y nuevas funciones ganaderas.',
    };
  } catch (err) {
    console.warn('Error verificando actualizaciones:', err);
    return { hasUpdate: false };
  }
}

/**
 * Aplica la actualización limpiando cachés del navegador y recargando la aplicación
 */
export async function applyAppUpdate() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
    }
  } catch (e) {
    console.warn('Error limpiando caché:', e);
  } finally {
    window.location.reload(true);
  }
}
