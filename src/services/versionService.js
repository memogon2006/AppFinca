export const CURRENT_APP_VERSION = "2.8.57";
export const CURRENT_BUILD_TIME = 1789197000000;

/**
 * Historial de las últimas actualizaciones generadas en el sistema
 */
export const APP_CHANGELOG = [
  {
    version: "2.8.57",
    date: "07/09/2026",
    title: "Tipografía Numérica Tabular y Alineación Financiera de Alta Precisión",
    highlights: [
      "Activación de números tabulares (tabular-nums / OpenType tnum) en toda la plataforma: todos los dígitos numéricos comparten el mismo ancho exacto.",
      "Alineación visual perfecta en cifras monetarias, balances de compras, pesos en kg, ganancias diarias (GDP) y tablas de lotes.",
      "Visualización nítida y profesional en tarjetas de inventario, resúmenes patrimoniales y módulos de pesajes."
    ]
  },
  {
    version: "2.8.56",
    date: "07/09/2026",
    title: "Restauración de Diseño Limpio y Estética Original",
    highlights: [
      "Restauración del diseño visual limpio y minimalista en las tarjetas de ganado.",
      "Restauración del esquema de color y fondos estándar."
    ]
  },
  {
    version: "2.8.55",
    date: "07/09/2026",
    title: "Mini Barra de Progreso a Meta de Ceba y Modo Oscuro OLED de Alto Contraste",
    highlights: [
      "Mini barra de progreso visual horizontal en cada tarjeta de animal activo hacia la meta de ceba (480 kg), indicando porcentaje, kilos faltantes o excedente y días estimados restantes.",
      "Modo oscuro optimizado para pantallas OLED y trabajo en campo con fondos profundos y bordes de alto contraste."
    ]
  },
  {
    version: "2.8.54",
    date: "07/09/2026",
    title: "Selector de Ámbito en Lotes: Activos por Defecto, Historial Total y Vendidos",
    highlights: [
      "Opción para alternar entre '🟢 Activos en Finca' (seleccionado por defecto), '🌐 Historial Total' (todos los animales registrados) y '🏷️ Vendidos'.",
      "Las tarjetas de Valor de Compra, Kilos y Rendimiento se recalculan dinámicamente según el ámbito seleccionado.",
      "Cálculo patrimonial enfocado prioritariamente en los animales presentes en la finca."
    ]
  },
  {
    version: "2.8.53",
    date: "07/09/2026",
    title: "Valor Total de Ganado Basado en Precio de Compra Inicial",
    highlights: [
      "El valor total de ganado, el valor de machos y el valor de hembras se calculan estrictamente sobre el precio de compra o costo inicial de los animales.",
      "Consistencia contable patrimonial en todas las vistas y filtros del inventario."
    ]
  },
  {
    version: "2.8.52",
    date: "07/09/2026",
    title: "Valoración Financiera de Inventario (Total, Machos y Hembras)",
    highlights: [
      "Reemplazo de la métrica 'Utilidad' en el resumen superior del inventario general.",
      "Nuevos indicadores financieros en tiempo real: Valor Total de Ganado (💰), Valor Total Machos (🐂) y Valor Total Hembras (🐄).",
      "Conteo discriminado por sexo y valorización patrimonial adaptada tanto para dispositivos móviles como escritorio."
    ]
  },
  {
    version: "2.8.51",
    date: "07/09/2026",
    title: "Retorno al Inicio Superior de Página al Clicar Logo y Navegar",
    highlights: [
      "Al hacer clic en el logo del toro (🐂), el sistema no solo lleva al Tablero Principal sino que desplaza automáticamente la pantalla al inicio superior exacto (scroll top: 0).",
      "Restablecimiento automático del desplazamiento vertical al cambiar entre cualquiera de los módulos y vistas."
    ]
  },
  {
    version: "2.8.50",
    date: "07/09/2026",
    title: "Acceso Directo al Tablero desde el Logo y Perfil en Botón Ajustes",
    highlights: [
      "Al hacer clic en el logo del toro (emoji 🐂) o el nombre de la finca se navega directamente al Tablero / Panel Principal.",
      "La información de la cuenta, finca y configuración se mantiene accesible exclusivamente en el botón '[LG] LUIS ⚙️ Ajustes'."
    ]
  },
  {
    version: "2.8.49",
    date: "07/09/2026",
    title: "Cierre Automático y Notificaciones Claras en Todas las Acciones",
    highlights: [
      "Cierre automático y fluido de las pestañas/modales tras crear animales individuales o lotes completos.",
      "Confirmación visual instantánea con banner superior de alta visibilidad para cada acción (Creación, Lotes, Pesajes, Ventas, Bajas y Eliminaciones).",
      "Actualización reactiva del inventario en tiempo real sin recargar la pantalla."
    ]
  },
  {
    version: "2.8.48",
    date: "07/09/2026",
    title: "Prioridad Visual y Actualización Inmediata en Edición de Bovinos",
    highlights: [
      "El formulario de edición ahora se superpone en primer plano por encima de la ficha técnica con fondo oscurecido prioritario.",
      "Cierre automático inmediato del modal de edición al guardar los cambios.",
      "Actualización instantánea y en tiempo real de todos los datos en la ficha técnica sin necesidad de recargar."
    ]
  },
  {
    version: "2.8.47",
    date: "07/09/2026",
    title: "Módulo y Estado Productivo de Ceba, Levante y Engorde de Hembras",
    highlights: [
      "Nuevo estado productivo '🥩 Ceba, Levante o Engorde' en el formulario de registro y edición de hembras.",
      "Espacio y sub-pestaña dedicada en el módulo Control de Hembras con métricas de ganancia diaria de peso (GDP), peso promedio y meta de ceba (≥480kg).",
      "Insignias especializadas e integración automática en tarjetas de inventario y detalle del animal."
    ]
  },
  {
    version: "2.8.46",
    date: "07/09/2026",
    title: "Gestión y Eliminación Exclusiva de Datos de Demostración",
    highlights: [
      "Opción inteligente para eliminar únicamente los animales y pesajes de prueba/demostración dejando 100% intactos los datos reales.",
      "Deshabilitación automática de la acción cuando no hay datos de demostración cargados en el sistema.",
      "Banner informativo directo y accesos en el panel de Exportar/Importar y Perfil Ganadero para limpieza rápida."
    ]
  },
  {
    version: "2.8.45",
    date: "07/09/2026",
    title: "Optimización de Celular para Módulo de Lotes e Ingresos",
    highlights: [
      "Diseño adaptable en botones de acción (Comparativa Excel, Ingresar Lote, Exportar Todo) sin cajas sueltas ni saltos distorsionados en celular.",
      "Pestañas selectoras 'Detalle por Lote' y 'Comparar Lotes' optimizadas para caber perfectamente en pantallas móviles sin desbordar insignias.",
      "Cabeceras de lote y filtros de estado con desplazamiento táctil suave y etiquetas compactas para máxima legibilidad."
    ]
  },
  {
    version: "2.8.44",
    date: "07/09/2026",
    title: "Cabecera Móvil Completa con Acceso a Todas las Funciones",
    highlights: [
      "Disponibilidad 100% visible en celulares de: [+ Bovino], [Excel], [Nube], [Tema], [Perfil LG] y [Salir].",
      "Organización en 2 micro-filas limpias y ergonómicas en móviles que evita la saturación y deformación de la pantalla.",
      "Excelente experiencia táctil con botones anchos y legibles en cualquier tamaño de celular."
    ]
  },
  {
    version: "2.8.43",
    date: "07/09/2026",
    title: "Optimización Total para Celulares y Pantallas Móviles",
    highlights: [
      "Cabecera superior optimizada en móviles con distribución equilibrada sin saturación ni superposición de iconos.",
      "Barra de navegación inferior móvil reajustada a 6 columnas amplias con etiquetas nítidas y sin deformaciones.",
      "Barra de herramientas de inventario con desplazamiento horizontal fluido en móviles, evitando desbordamientos de pantalla."
    ]
  },
  {
    version: "2.8.42",
    date: "07/09/2026",
    title: "Alineación Perfecta y Proporciones de la Barra de Navegación",
    highlights: [
      "Protección de identidad de finca (logo 🐂, nombre y conteo de animales) con ancho protegido para evitar que se colapse o quede oculta.",
      "Pestañas de navegación central con espaciado optimizado y etiquetas inteligentes para resoluciones de escritorio.",
      "Botones de acción, utilidades y perfil alineados en una sola fila continua con alturas simétricas y sin superposición."
    ]
  },
  {
    version: "2.8.41",
    date: "07/09/2026",
    title: "Rediseño Armónico y Alineación de Barra de Inventario",
    highlights: [
      "Indicadores de resumen (Total, En Finca, Vendidas, Bajas, Biomasa, Utilidad) estilizados en tarjetas píldora uniformes.",
      "Botones de acción (Liquidar Compañía, Guía, Modo Vista, Ingresar Lote) alineados en una sola fila sin saltos ni superposiciones.",
      "Diseño adaptable que garantiza legibilidad y orden visual impecable en cualquier pantalla."
    ]
  },
  {
    version: "2.8.40",
    date: "07/09/2026",
    title: "Limpieza y Restauración de Barras de Herramientas",
    highlights: [
      "Retiro del botón '+1 Solo Animal' de las barras de herramientas de Inventario y Lotes, manteniendo la interfaz limpia y despejada.",
      "Registro de bovinos individuales disponible a través del botón principal '+ Nuevo Bovino' en la barra superior y accesos del Dashboard.",
      "Se conserva intacta la corrección del registro de bajas y muertes de animales sin errores de base de datos."
    ]
  },
  {
    version: "2.8.39",
    date: "07/09/2026",
    title: "Corrección en Registro de Bajas por Muerte",
    highlights: [
      "Solución al error 'Invalid argument to Table.get()' al registrar la muerte o baja de un animal desde el inventario.",
      "Registro de fecha, motivo y notas de fallecimiento 100% sincronizado con la base de datos local y la nube."
    ]
  },
  {
    version: "2.8.38",
    date: "07/09/2026",
    title: "Sincronización Total de Reportes Excel con Nuevos Estándares",
    highlights: [
      "Todas las fechas en todas las pestañas de Excel se generan en formato latinoamericano DD/MM/YYYY.",
      "Etiquetas y gráficas de inversión monetaria alineadas a 'Valor Compra Total de los Animales'.",
      "Exportación general configurada de forma predeterminada en '🟢 Solo Activos en Finca'."
    ]
  },
  {
    version: "2.8.37",
    date: "07/09/2026",
    title: "Vista Predeterminada de Animales Activos en Lotes",
    highlights: [
      "El módulo de Lotes e Ingresos ahora se abre de forma predeterminada filtrado en animales '🟢 En Finca' (Activos).",
      "Listado y subtotales enfocados de inmediato en el ganado presente en finca para rápida consulta operativa.",
      "Acceso directo con un clic para cambiar a 'Todos', 'Vendidos' o 'Listos ≥480kg'."
    ]
  },
  {
    version: "2.8.36",
    date: "07/09/2026",
    title: "Ajuste de Etiqueta: Valor Compra Total de los Animales",
    highlights: [
      "Actualización de la tarjeta principal en el módulo de Lotes e Ingresos para indicar con claridad 'Valor Compra Total de los Animales'.",
      "Consistencia en textos de encabezado y descripciones zootécnicas de consolidado general."
    ]
  },
  {
    version: "2.8.35",
    date: "07/09/2026",
    title: "Reorganización de Limpieza de Inventario Exclusiva en Perfil",
    highlights: [
      "Retiro definitivo de la opción de limpiar inventario del modal de Excel/Exportación para mantenerlo enfocado en reportes.",
      "Ubicación exclusiva y centralizada en el Perfil de Usuario con doble confirmación de seguridad y código 'BORRAR'.",
      "Interfaz más limpia y ordenada en el módulo de reportes."
    ]
  },
  {
    version: "2.8.34",
    date: "07/09/2026",
    title: "Limpieza de Inventario Integrada en Perfil de Usuario",
    highlights: [
      "Opción 'Limpiar Inventario de Mi Finca (Comenzar en Ceros)' integrada directamente en la pestaña de Datos de Finca del Perfil.",
      "Acceso alternativo en la Zona de Peligro del Perfil para vaciar inventario sin necesidad de borrar la cuenta de usuario.",
      "Protección con doble confirmación y código de seguridad 'BORRAR' en todos los puntos de acceso."
    ]
  },
  {
    version: "2.8.33",
    date: "07/09/2026",
    title: "Doble Confirmación de Seguridad al Limpiar Inventario",
    highlights: [
      "Incorporación de un flujo de seguridad en dos pasos para reiniciar el inventario a ceros.",
      "Requisito de confirmación explícita escribiendo la palabra clave 'BORRAR' antes de ejecutar cualquier limpieza irreversible.",
      "Mensajes claros de cancelación y preservación de datos para evitar pérdidas accidentales."
    ]
  },
  {
    version: "2.8.32",
    date: "07/09/2026",
    title: "Estandarización Total de Fechas (Día/Mes/Año - DD/MM/YYYY)",
    highlights: [
      "Unificación de todas las visualizaciones de fechas al formato latinoamericano estándar Día/Mes/Año (DD/MM/YYYY).",
      "Actualización en tarjetas de ganado, listados, modales de pesajes, proyección de ceba, reproducción y comprobantes.",
      "Formato DD/MM/YYYY en reportes de Excel exportables y confirmaciones del sistema."
    ]
  },
  {
    version: "2.8.31",
    date: "06/09/2026",
    title: "Comparativa de Lotes en Excel con Gráficas Visuales",
    highlights: [
      "Nueva pestaña dedicada en Excel: '⚖️ Comparativa de Lotes' con cuadro de honor, matriz comparativa y bordes negros definidos.",
      "Gráficas visuales de barras integradas en Excel para ritmo de engorde (GDP kg/día), ganancia total de carne (+kg) e inversión de compra ($).",
      "Botón de descarga directa con un solo clic desde el módulo de Lotes y en la exportación general de inventario."
    ]
  },
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
