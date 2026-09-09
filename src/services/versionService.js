export const CURRENT_APP_VERSION = "2.8.84";
export const CURRENT_BUILD_TIME = 1789275500000;

/**
 * Historial de las últimas actualizaciones generadas en el sistema
 */
export const APP_CHANGELOG = [
  {
    version: "2.8.84",
    date: "09/09/2026",
    title: "Limpieza Total de la Barra Superior y Distribución Óptima",
    highlights: [
      "Retiro de Calendario en Navbar: Se eliminó el botón de fecha/calendario de la barra superior para mantener la cabecera 100% limpia, despejada y sin desbordes.",
      "Espacio de Calendario Centralizado: El Calendario Ganadero y la Agenda en Tiempo Real se consultan cómodamente desde su tarjeta en el Tablero Principal.",
      "Alineación Perfecta de Acciones: Todos los botones de acción rápida caben holgadamente en una sola fila sin cortarse."
    ]
  },
  {
    version: "2.8.83",
    date: "09/09/2026",
    title: "Reorganización del Tablero: KPIs de Biomasa e Inventario en la Cima",
    highlights: [
      "Prioridad a Métricas Clave: Las tarjetas de Total Bovinos, Biomasa en kg, GDP promedio e Inversión Activa ahora se ubican en la parte superior del Tablero para consulta inmediata.",
      "Ubicación del Calendario: La tarjeta de Calendario Ganadero y Fecha Actual se posicionó justo después de los KPIs de inventario y manejo.",
      "Flujo Visual Optimizado: Vista limpia y jerarquía de información enfocada en la producción ganadera."
    ]
  },
  {
    version: "2.8.82",
    date: "09/09/2026",
    title: "Ajuste de Tamaño y Adaptabilidad Perfecta de la Barra Superior",
    highlights: [
      "Diseño Compacto en Barra Superior: Ajuste de dimensiones y espaciados en la cabecera para que todos los botones (Calendario, Bovino, Excel, WhatsApp, Nube, Tema, Perfil y Salir) encajen al 100% sin desbordarse ni cortarse.",
      "Indicador de Fecha y Calendario Adaptativo: Formato ultracompacto en laptops y expandido en pantallas gigantes.",
      "Alineación Impecable: Botones equilibrados con tipografía limpia y sin saltos de línea."
    ]
  },
  {
    version: "2.8.81",
    date: "09/09/2026",
    title: "Actualización Instantánea en 1 Clic & Calendario Ganadero en Tiempo Real",
    highlights: [
      "Espacio de Calendario & Fecha en Tiempo Real: Tarjeta interactiva en el Tablero principal y botón directo en la barra superior.",
      "Actualización Instantánea en 1 Clic: Limpieza profunda de cachés obsoletos y desregistro automático de Service Worker para aplicar cambios de inmediato sin trabarse.",
      "Trazabilidad Automática de Finca: Mapeo de pesajes, ingresos, ventas, partos estimados y notas de campo 100% offline."
    ]
  },
  {
    version: "2.8.80",
    date: "09/09/2026",
    title: "Módulo de Calendario Ganadero, Agenda de Finca y Fecha Actual en Vivo",
    highlights: [
      "Fecha Actual en Tiempo Real: Visualizador interactivo de fecha completa (día de la semana, día, mes y año) con reloj digital en vivo tanto en el Tablero principal como en la Barra de Navegación.",
      "Calendario Ganadero Interactivo: Cuadrícula mensual con navegación entre meses, selector rápido para volver a 'Hoy' y leyenda de actividades.",
      "Trazabilidad Automática de Eventos: Mapeo inteligente de pesajes de báscula, ingresos de lotes, ventas/salidas y fechas estimadas de parto en vacas preñadas.",
      "Agenda de Finca y Tareas Offline: Sistema de notas y recordatorios de campo organizados por categorías (Vacunación, Potreros, Pesajes, Insumos, Reproducción) 100% offline."
    ]
  },
  {
    version: "2.8.79",
    date: "09/09/2026",
    title: "Diseño Limpio en Control de Consecutivos (Sin Aviso de Faltantes)",
    highlights: [
      "Eliminación de Aviso de Faltantes: Se retiró el mensaje de números faltantes en la secuencia histórica para mantener la interfaz 100% limpia y despejada.",
      "Enfoque en Último y Siguiente Sugerido: La visualización se concentra exclusivamente en el último consecutivo registrado y el siguiente sugerido.",
      "Optimización Visual: Tarjetas y paneles ordenados con máxima claridad."
    ]
  },
  {
    version: "2.8.78",
    date: "09/09/2026",
    title: "Panel Destacado y Visualización Ampliada del Consecutivo de Finca",
    highlights: [
      "Banner de Consecutivo Prominente en Lotes: Se amplió y rediseñó el panel de numeración en el ingreso por lotes con tipografía grande, alto contraste y botón directo para generar series.",
      "Cifras Grandes y Legibles: Tanto en el registro individual como en lotes, el 'Último Registrado' y el 'Siguiente Sugerido' ahora destacan con máxima visibilidad.",
      "Acceso Rápido al Generador: Botón directo para iniciar la serie automática con el número sugerido de la finca."
    ]
  },
  {
    version: "2.8.77",
    date: "09/09/2026",
    title: "Control de Numeración Consecutiva por Finca y Detección de Saltos",
    highlights: [
      "Regla Fundamental de Consecutivos: El consecutivo principal se extrae exclusivamente antes del primer guion o slash (ej. '1-6' = 1, '25-6' = 25, '25/5' = 25). Los números posteriores no alteran la numeración.",
      "Control y Sugerencia Automática: Muestra el último consecutivo registrado en la finca y sugiere automáticamente el siguiente número consecutivo.",
      "Detección Inteligente de Saltos y Faltantes: Alerta en tiempo real si se ingresa un número no consecutivo o si faltan números en la secuencia histórica.",
      "Generador de Series con Sufijo en Lotes: Permite generar aretes con formato de año o lote (ej. 25-6, 26-6...) en un solo clic con trazabilidad completa."
    ]
  },
  {
    version: "2.8.76",
    date: "09/09/2026",
    title: "Detección Inteligente de Identificaciones Duplicadas y Trazabilidad",
    highlights: [
      "Detección Inteligente de Duplicados: Alerta preventiva si el número de arete ya existe en un animal ACTIVO con la misma marca de hierro o mismo dueño/propietario.",
      "Normalización Avanzada de Formatos: Reconoce equivalencias de separadores (/ , - , _ , \\) y espacios (ej. '1/6' = '1 - 6' = '1-6') sin alterar el texto original guardado.",
      "Modal Interactivo de Advertencia: Opciones claras para '🔍 Revisar Registro' o '➡️ Continuar de Todas Formas' registrando auditoría en el libro de trazabilidad.",
      "Integrado en Registro Individual y por Lotes: Validación en vivo en el formulario individual y en el módulo de ingreso masivo por lote con alertas en el Dashboard."
    ]
  },
  {
    version: "2.8.75",
    date: "08/09/2026",
    title: "Cinta de Texto en Movimiento Continuo (Marquee) en Selector de Tonos",
    highlights: [
      "Texto en Movimiento Continuo: La descripción completa de cada tono se desplaza suavemente de derecha a izquierda en una marquesina continua para leer toda su información sin recortes.",
      "Pausa al Interactuar: Al tocar o pasar el cursor por encima del tono, la animación se detiene para facilitar la lectura detallada.",
      "Diseño de Tarjetas de Sonido Optimizado: Nombres y etiquetas organizados con máxima claridad tanto en celular como en computador."
    ]
  },
  {
    version: "2.8.74",
    date: "08/09/2026",
    title: "Detección Instantánea y Sonido de Actualización Optimizado para Móviles",
    highlights: [
      "Detección Ultrarrápida en Celulares: Sondeo cada 10 segundos y comprobación instantánea al volver a la app o interactuar en la pantalla.",
      "Desbloqueo de Audio en Móviles: Desbloqueo nativo del sistema de audio para que la campana de actualización suene siempre con claridad en Safari y Chrome móvil.",
      "Cero Caché: Cabeceras de servidor directas para garantizar que la nueva versión se anuncie inmediatamente."
    ]
  },
  {
    version: "2.8.73",
    date: "08/09/2026",
    title: "Selector de Tonos de Confirmación y Síntesis de Sonidos Personalizables",
    highlights: [
      "6 Tonos Exclusivos a Escoger: Campana Cristalina 🔔 (por defecto), Báscula Digital Ganadera ⚖️, Burbuja / Pop Acústico 🫧, Marimba Cálida 🪵, Clic Tecnológico 🎯 y Acorde Triunfal 🎺.",
      "Selector Interactivo con Vista Previa en Perfil: Prueba cada tono en tiempo real con el botón 'Probar' y activa tu favorito con un solo toque en Configuración de Perfil.",
      "Síntesis 100% Offline: Generación de sonido nativa mediante Web Audio API ultraligera y sin descargas de archivos."
    ]
  },
  {
    version: "2.8.72",
    date: "08/09/2026",
    title: "Ajuste y Adaptabilidad Total del Aviso de Actualización en Celulares",
    highlights: [
      "Diseño 100% Responsivo en Celulares: El aviso de actualización ahora se adapta perfectamente al ancho de cualquier pantalla móvil sin cortar textos ni botones.",
      "Lectura Completa de Novedades: Eliminado el recorte de texto para que puedas leer todas las mejoras de la nueva versión con claridad.",
      "Botones Ergonómicos de Acción: Botones amplios y cómodos para actualizar de inmediato o posponer con un solo toque."
    ]
  },
  {
    version: "2.8.71",
    date: "08/09/2026",
    title: "Sonido Armónico de Bienvenida al Ingresar a la Finca",
    highlights: [
      "Acorde Armónico de Entrada: Sonido melódico cálido y distinguido al iniciar sesión o ingresar a la plataforma.",
      "Integrado con el Control de Perfil: Respeta la configuración de sonido del usuario (activado o silenciado).",
      "Experiencia de Acceso Dinámica: Confirmación sonora al conectar con la finca y sincronizar datos."
    ]
  },
  {
    version: "2.8.70",
    date: "08/09/2026",
    title: "Control de Sonido Exclusivo en Configuración de Perfil (Sin Vibración)",
    highlights: [
      "Control de Sonido Centralizado: El botón para activar o silenciar los efectos de sonido ahora se encuentra ubicado única y exclusivamente dentro del modal de Configuración de Perfil.",
      "Eliminación Total de Vibración: Se retiró cualquier comportamiento o referencia de vibración en toda la app.",
      "Interfaz de Báscula Rápida Limpia: Se eliminaron los botones de sonido de la pantalla de pesaje para un diseño 100% despejado."
    ]
  },
  {
    version: "2.8.69",
    date: "08/09/2026",
    title: "Sonido y Vibración en Registro, Edición de Animales y Detección de Actualizaciones",
    highlights: [
      "Confirmación Auditiva en Registro & Edición: Cada vez que creas o modificas un animal, lote, pesaje o venta, el sistema emite el 'Beep' confirmatorio con vibración.",
      "Tono Melódico de Actualización: Al detectarse una nueva versión o generarse una actualización en el sistema, la app emite una campana / acorde de anuncio.",
      "Operación 100% Offline: Síntesis de sonido Web Audio nativa ultrarrápida sin consumo de datos ni dependencias externas."
    ]
  },
  {
    version: "2.8.68",
    date: "08/09/2026",
    title: "Feedback Sonoro (Beep de Báscula) y Háptico (Vibración) en Báscula Rápida",
    highlights: [
      "Confirmación Auditiva Real: Sonido característico tipo indicador de báscula ganadera ('Beep') sintetizado 100% offline al guardar cada pesaje.",
      "Vibración Háptica en Móviles: Emisión de vibración táctil confirmatoria al registrar pesos en manga o corral.",
      "Melodía de Guardado Masivo: Tono arpegiado especial de éxito al guardar el lote completo con 'Guardar Todo'.",
      "Controles Rápidos en Pantalla: Botones para activar/silenciar sonido, activar/desactivar vibración y botón para 'Probar Beep'."
    ]
  },
  {
    version: "2.8.66",
    date: "07/09/2026",
    title: "Báscula Rápida con Arete, Marca/Dueño y Color + Auditoría Completa",
    highlights: [
      "Báscula Rápida Mejorada: Ahora cada tarjeta de pesaje destaca con máxima prioridad el Número/Arete, la Marca/Hierro, el Dueño/Propietario y el Color visual del animal.",
      "Buscador de Báscula Ampliado: Permite buscar y filtrar animales por color, marca, dueño, nombre, arete o lote de ingreso.",
      "Auditoría y Sincronización de Datos: Homogeneización estricta de IDs en todos los módulos de pesaje, hembras, gráficos y compañía."
    ]
  },
  {
    version: "2.8.65",
    date: "07/09/2026",
    title: "Sincronización Total de Días en Finca en Inventario y Lotes",
    highlights: [
      "Eliminación de cualquier desfase de zona horaria en el cálculo de métricas de peso y días de permanencia individual.",
      "Coincidencia matemática exacta entre los días del animal activo, los días del lote y la diferencia en el calendario."
    ]
  },
  {
    version: "2.8.64",
    date: "07/09/2026",
    title: "Corrección y Sincronización Exacta de Días en Finca por Lote",
    highlights: [
      "Ajuste en la métrica de Tiempo en Finca: ahora los días en finca del lote coinciden exactamente con los días individuales de los animales activos en el inventario y con el calendario.",
      "Parsing de fechas sin desfase horario: cálculo exacto de días entre la fecha de ingreso y la fecha actual en todas las vistas de la aplicación."
    ]
  },
  {
    version: "2.8.62",
    date: "07/09/2026",
    title: "Reportes WhatsApp Detallados por Cada Dueño o Marca",
    highlights: [
      "Ajuste completo en el reporte por Dueño/Marca: entrega el desglose zootécnico y financiero completo (cabezas, machos, hembras, biomasa en kg, GDP promedio, inversión activa, listos para venta y listado de chapetas) para el dueño seleccionado o para cada dueño registrado.",
      "Cálculo zootécnico de pesajes continuos y GDP integrado con el registro de pesajes de cada animal."
    ]
  },
  {
    version: "2.8.61",
    date: "07/09/2026",
    title: "Gestión y Eliminación de Contactos en Módulo de WhatsApp",
    highlights: [
      "Opción directa para eliminar contactos individuales de la agenda rápida de WhatsApp con confirmación de seguridad.",
      "Botón rápido para limpiar el campo de teléfono y desvincular números predeterminados con un solo clic."
    ]
  },
  {
    version: "2.8.60",
    date: "07/09/2026",
    title: "Envío Automático de Reportes a WhatsApp con Filtro por Dueño o Marca",
    highlights: [
      "Generador de reportes ejecutivos para WhatsApp: Inventario & Patrimonio, Ganado Listo para Venta, Jornada de Pesajes y Balance por Dueño.",
      "Selector dinámico de Dueño / Marca: filtra y recalcula automáticamente todas las cifras (cabezas, biomasa, inversión y ganancias) para ese socio o hierro específico.",
      "Agenda rápida de WhatsApp: guarda números predeterminados y contactos de mayordomos o socios.",
      "Vista previa en vivo estilo chat de WhatsApp y botón de 1 clic para abrir WhatsApp o copiar al portapapeles."
    ]
  },
  {
    version: "2.8.59",
    date: "07/09/2026",
    title: "Limpieza Visual del Tablero Principal",
    highlights: [
      "Eliminación del banner de sugerencia de seguridad en el inicio para una interfaz más despejada, directa y enfocada en los indicadores."
    ]
  },
  {
    version: "2.8.58",
    date: "07/09/2026",
    title: "Perfeccionamiento Visual y Alto Contraste en Modo Oscuro",
    highlights: [
      "Corrección del contraste en tarjetas principales de KPI (Dashboard, Lotes y Finanzas): eliminación de fondos claros descoloridos en modo oscuro.",
      "Integración de fondos oscuros profundos (slate-900), bordes temáticos sutiles, íconos vibrantes y textos en alta definición.",
      "Excelente legibilidad y contraste tanto en modo claro como en modo oscuro."
    ]
  },
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const cacheBuster = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const response = await fetch(`/version.json?_nocache=${cacheBuster}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    clearTimeout(timeoutId);

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
 * Aplica la actualización limpiando cachés del navegador, desregistrando service workers obsoletos y recargando limpiamente
 */
export async function applyAppUpdate() {
  try {
    // 1. Desregistrar todos los service workers antiguos para forzar el nuevo código
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        try {
          await registration.unregister();
        } catch (swErr) {
          console.warn('Error desregistrando service worker:', swErr);
        }
      }
    }

    // 2. Limpiar todos los cachés del navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // 3. Redireccionar con parámetro anti-caché
    const cleanUrl = window.location.origin + window.location.pathname + `?_v=${Date.now()}`;
    window.location.replace(cleanUrl);
  } catch (e) {
    console.warn('Error limpiando caché:', e);
    window.location.reload();
  }
}
