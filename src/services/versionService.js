export const CURRENT_APP_VERSION = "2.11.4";
export const CURRENT_BUILD_TIME = 1789546000000;

/**
 * Historial de las últimas actualizaciones generadas en el sistema
 */
export const APP_CHANGELOG = [
  {
    version: "2.11.4",
    date: "19/09/2026",
    title: "Diagnóstico de Gestación por Días de Preñez & Alertas Reproductivas",
    highlights: [
      "Días de Preñez Aproximados: Permite ingresar directamente los días de preñez diagnosticados (por palpación rectal o ecografía) o seleccionar accesos rápidos por mes (1m a 8m).",
      "Cálculo Automático de Parto: Sincronización en tiempo real entre días de preñez, fecha de monta/servicio y fecha estimada de parto (283 días).",
      "Alertas Reproductivas en Vivo: Alertas inteligentes de parto inminente (≤ 10 días), próximo parto (≤ 30 días) y secado/transición (≤ 60 días).",
      "Integración Total: Sincronización automática con el Calendario de la Finca y el Tablero de Alertas Reproductivas."
    ]
  },
  {
    version: "2.11.3",
    date: "19/09/2026",
    title: "Propósito Automático en Machos & Limpieza Visual de Insignias",
    highlights: [
      "Propósito Automático en Machos: Al seleccionar 'Macho', el tipo de producción siempre se fija por defecto en 'Ceba / Engorde / Levante', evitando que quede seleccionado 'Cría / Vientres'.",
      "Actualización de Etiqueta: El propósito de carne ahora se muestra claramente como 'Ceba / Engorde / Levante' en selectores y distintivos.",
      "Insignia de Origen Simplificada: Eliminación del icono de bebé para dejar una etiqueta nítida y profesional con el sello '🌱 Nacido en Finca'."
    ]
  },
  {
    version: "2.11.2",
    date: "19/09/2026",
    title: "Flexibilidad en Ingreso # / Lote: Opcional para Nacimientos y Ganado no Comercial",
    highlights: [
      "Ingreso # Opcional: El campo 'Ingreso # (Lote / Consecutivo)' deja de ser obligatorio para animales nacidos en la finca y para ganado no destinado a ceba/engorde (cría, vientre, lechería, doble propósito).",
      "Validación Inteligente: Mantiene la obligatoriedad únicamente para animales comprados destinados a ceba/engorde o en compañía para garantizar la trazabilidad de lotes comerciales.",
      "Adaptación en Registro Individual y por Lote: Permite guardar sin lote forzado, eliminando valores por defecto no deseados."
    ]
  },
  {
    version: "2.11.1",
    date: "19/09/2026",
    title: "Identificación Visual de Procedencia: Nacidos vs Comprados",
    highlights: [
      "Insignias Visuales de Origen: Etiquetas distintivas en cada tarjeta y fila del inventario ('🌱 Nacido en Finca', '🛒 Comprado', '🤝 En Compañía', '🔄 Traslado').",
      "Linaje Rápido en Tarjetas y Tablas: Visualización inmediata de la madre ('🐄 M: #105') y el padre ('🐂 P: Toro / Pajilla') en crías nacidas en el predio.",
      "Métricas Adaptadas: Muestra '⚖️ Peso al Nacer' y '🛒 Costo Entrada (Cría): $0' para crías nacidas, diferenciándolas de los animales comprados.",
      "Filtro por Procedencia: Nuevo menú desplegable en los filtros de inventario para segmentar al instante nacidos en finca vs comprados vs compañía vs traslados."
    ]
  },
  {
    version: "2.11.0",
    date: "19/09/2026",
    title: "Trazabilidad de Nacimientos & Genealogía (Madre y Padre / Pajilla)",
    highlights: [
      "Registro de Crías Nacidas en Finca: Opción de procedencia ('Cría Nacida en Finca / Nacimiento') tanto en registro individual como por lote.",
      "Genealogía Completa: Selección de Vaca Madre del hato (o ingreso manual) y Padre / Reproductor (Toro de Finca con selector de machos o Pajilla / I.A. con código/donante).",
      "Costo Inicial $0: Validación adaptada para crías con valor de entrada inicial $0 y cálculo de rentabilidad basado en gastos posteriores.",
      "Historial de Partos en Hembras: Ficha técnica y módulo de hembras con contador y visualización de todas las crías paridas por cada vaca en la finca."
    ]
  },
  {
    version: "2.10.0",
    date: "19/09/2026",
    title: "Optimización Analítica en Módulo de Lotes & Ingresos",
    highlights: [
      "Enfoque 100% Analítico en Lotes: Remoción del botón de ingreso de lote en la vista de Lotes & Ingresos para mantener la barra superior exclusivamente enfocada en análisis de rendimiento ('Comparativa Excel' y 'Exportar Todo')."
    ]
  },
  {
    version: "2.9.9",
    date: "19/09/2026",
    title: "Restauración de Colores del Tablero & Limpieza del Módulo Inventario",
    highlights: [
      "Restauración de Colores del Banner: Regreso a la combinación visual original del tablero principal con sus emojis y contrastes familiares.",
      "Optimización de Botones en Inventario: Eliminación de accesos secundarios redundantes e integración directa de '+ Nuevo Bovino' e 'Ingresar Lote' junto al selector de vista."
    ]
  },
  {
    version: "2.9.8",
    date: "19/09/2026",
    title: "Armonización de Colores & Limpieza Visual en Banner Superior",
    highlights: [
      "Código Semántico de Colores: Distinción de botones por propósito (Verde Esmeralda/Teal para Ingresos, Ámbar Dorado para Venta, Azul Cielo para Báscula, Índigo/Púrpura para Manga y Sanidad, y Vidrio Translúcido para Informes y Censo ICA).",
      "Limpieza de Iconos: Eliminación de duplicidad de emojis en los textos de botones para un acabado nítido y profesional con iconos vectoriales HD."
    ]
  },
  {
    version: "2.9.7",
    date: "19/09/2026",
    title: "Acceso Directo a Venta y Liquidación de Ganado en el Tablero Principal",
    highlights: [
      "Venta y Liquidación en el Banner Principal: Integración del botón '💰 Venta / Liquidar Lote' directamente en el panel superior del Dashboard.",
      "Modalidad Flexible: Soporta liquidación de lotes enteros o selección individual con cálculo de venta directa (100% dueño) o en compañía (reparto 50/50 o personalizado), precios por kilo y pesos de salida.",
      "Acceso Rápido en Módulo Financiero: Botón de liquidación rápida incorporado en la tarjeta de resumen financiero del tablero."
    ]
  },
  {
    version: "2.9.6",
    date: "18/09/2026",
    title: "Ejemplos Ficticios en Guías & Etiqueta de Nombre del Predio",
    highlights: [
      "Privacidad y Ejemplos Ficticios: Sustitución de nombres específicos por ejemplos genéricos ('Ej. Carlos Mendoza', 'Ej. Hacienda La Esperanza', 'ejemplo@miganaderia.com') en todos los formularios.",
      "Ampliación de Identificación de Finca: Actualización del campo de registro a 'Nombre del Predio / Finca / Hacienda' tanto en Login como en Configuración de Perfil."
    ]
  },
  {
    version: "2.9.5",
    date: "18/09/2026",
    title: "Dirección URL 100% Limpia (Sin Parámetros Numéricos)",
    highlights: [
      "URL Limpia y Elegante: Eliminación automática de parámetros temporales de actualización (?_v=...) en la barra de direcciones.",
      "Recarga Transparente: Actualización en segundo plano preservando la URL original https://finca-ganadera-gamma.vercel.app sin números extras."
    ]
  },
  {
    version: "2.9.4",
    date: "18/09/2026",
    title: "Logo Oficial HD Unificado en Todo el Sistema",
    highlights: [
      "Unificación de Identidad Visual: Integración del nuevo emblema de toro en alta definición en la pantalla de inicio de sesión (Login/Registro), pantalla de carga inicial, pestañas del navegador (Favicon .ico/.png) y ventana de Perfil.",
      "Cero Emojis en Logotipos: Sustitución de todos los cuadros de emojis genéricos por el logo oficial de la marca.",
      "Soporte Total de Favicon: Inclusión de favicon.ico de alta definición para barras de título de aplicaciones de escritorio y navegadores."
    ]
  },
  {
    version: "2.9.3",
    date: "18/09/2026",
    title: "Ajuste y Balance Perfecto de la Barra Superior en Laptops",
    highlights: [
      "Cero Desbordes en Laptops: Reajuste de espaciados, paddings y anchos responsivos para que todos los botones (Registrar Bovino, Excel, WhatsApp, Nube, Tema, Perfil y Salir) queden 100% visibles sin cortarse en pantallas de 13\" a 16\".",
      "Integración del Logo Oficial HD: El avatar de la finca ahora muestra el nuevo logo de alta definición en lugar del emoji anterior.",
      "Adaptabilidad Fluida: Optimización de la cuadrícula superior con soporte para resoluciones estándar y ultra-anchas."
    ]
  },
  {
    version: "2.9.2",
    date: "18/09/2026",
    title: "Icono PWA Ultra HD & Alta Definición para Dock y Móviles",
    highlights: [
      "Icono Oficial de Alta Definición: Rediseño del emblema ganadero con renderizado nítido en 512px, 384px, 192px y 64px para pantallas Retina, Dock de macOS, Windows, iPhone y Android.",
      "Cero Pixelado: Eliminación de fuentes emoji de baja resolución para garantizar un acabado limpio, metálico y profesional en cualquier lanzador o pantalla de inicio.",
      "Compatibilidad Total de Manifiesto: Configuración de paquetes de iconos multi-resolución para instalación PWA instantánea."
    ]
  },
  {
    version: "2.9.1",
    date: "18/09/2026",
    title: "Garantía Total de Modo Avión PWA & Caché Offline",
    highlights: [
      "Activación Universal del Service Worker: Corrección del registro en clientes web y móviles para garantizar la instalación del caché en Safari (iOS) y Chrome (Android).",
      "Carga Instantánea en Modo Avión: Toda la interfaz, código, iconos y fuentes quedan guardados en el almacenamiento del dispositivo al primer ingreso, permitiendo abrir la app sin internet ni datos.",
      "Respaldo Dinámico de Pantallas: Respaldo automático de la estructura de la app (App Shell) para navegación fluida en potreros y mangas sin señal."
    ]
  },
  {
    version: "2.9.0",
    date: "18/09/2026",
    title: "PWA 100% Offline-First, Indicador de Señal & Auto-Sync",
    highlights: [
      "Instalación Nativa PWA: Configuración de Web App Manifest y Service Worker inteligente para instalar la app como aplicación nativa en iPhone, Android, Mac y Windows.",
      "Caché Total de Campo: La aplicación abre y funciona al 100% incluso en Modo Avión o en potreros profundos sin cobertura celular ni Wi-Fi.",
      "Indicador de Conexión en Tiempo Real: Monitoreo en vivo en la barra de navegación mostrando estado '🟢 En Línea' o '📡 Modo Campo Offline (Guardado en celular)'.",
      "Auto-Sincronización al Recuperar Señal: Apenas el celular o tablet detecta conexión a internet o Wi-Fi, la plataforma sincroniza automáticamente los pesajes y arqueos con la nube sin necesidad de intervención manual."
    ]
  },
  {
    version: "2.8.100",
    date: "18/09/2026",
    title: "+1 Animal Extra / No Registrado & Alertas de Procedencia",
    highlights: [
      "Botón '+1 Extra' en Checklist: Permite ingresar en el conteo de manga un animal presente que no figura en el inventario oficial, registrando su arete provisional, color, sexo, peso y notas de procedencia.",
      "Insignias y Pestaña de Filtro '⚠️ Extras': Visualización destacada en el conteo con opción de filtrar solo animales extra y botón de eliminación rápida si fue un error.",
      "Resumen y Auditoría de Extras: El balance del arqueo detalla los animales no registrados detectados y los vincula al registro histórico.",
      "Panel de Alertas de Procedencia en el Tablero: Muestra los animales extra detectados con 3 acciones directas: '➕ Crear Bovino Oficial' (formulario prellenado), '✓ Marcar Resuelto / Aclarado' (ej. devuelto a vecino) y '🗑️ Descartar'."
    ]
  },
  {
    version: "2.8.99",
    date: "18/09/2026",
    title: "Corrección y Estabilización: Vista de Báscula Rápida",
    highlights: [
      "Solución al parpadeo/pantalla en blanco al entrar a la vista de Báscula Rápida.",
      "Conexión bidireccional perfecta y fluida entre Checklist / Arqueo y Báscula Rápida."
    ]
  },
  {
    version: "2.8.98",
    date: "18/09/2026",
    title: "Conexión Bidireccional: Checklist de Inventario ⇄ Báscula Rápida",
    highlights: [
      "De Checklist a Báscula Rápida: Opción de activar modo báscula en la configuración del arqueo para digitar pesos en vivo, ver ganancias y registrar pesajes automáticamente al verificar cada animal.",
      "De Báscula Rápida a Checklist: Botón '📋 + Conectar Checklist' en la vista de Báscula Rápida con barra de avance en tiempo real (Esperados, Pesados y Faltantes) y botón 'Finalizar como Arqueo de Campo'.",
      "Sincronización Total con Tablero: Los arqueos generados desde Báscula o Checklist actualizan instantáneamente el espacio de auditoría del tablero principal y permiten compartir por WhatsApp con 1 clic."
    ]
  },
  {
    version: "2.8.97",
    date: "18/09/2026",
    title: "Espacio de Último Arqueo & Faltantes en el Tablero Principal",
    highlights: [
      "Widget en Tablero Principal: Visualización instantánea del último arqueo/checklist realizado con fecha, hora, responsable y ámbito.",
      "Métricas Clave en Vivo: Total de animales esperados, verificados, faltantes e infiltrados/observaciones.",
      "Desglose Detallado de Animales Faltantes: Lista completa de animales por buscar con Número de Arete, Dueño/Sociedad, Marca de Hierro, Color de Pelaje y Potrero.",
      "Acciones Rápidas: Botón '+ Nuevo Arqueo' y botón 'WhatsApp Faltantes' para enviar la alerta de búsqueda directamente a los vaqueros."
    ]
  },
  {
    version: "2.8.96",
    date: "18/09/2026",
    title: "Módulo de Arqueo y Checklist de Inventario en Campo (Censo Físico de Corral)",
    highlights: [
      "Checklist Táctil de Conteo en Manga: Interfaz optimizada para dedos en campo con tarjetas grandes, confirmación de audio y buscador instantáneo por arete o color.",
      "Filtro por Ámbito: Conteo del hato completo, por lote/ingreso, potrero, dueño/marca o categoría/sexo.",
      "Novedades Clínicas Rápidas: Botones para marcar bicheras, cojeras, pérdida de arete, crías al pie, ojo malo o bajas.",
      "Detección de Infiltrados: Identificación e incorporación inmediata de animales pertenecientes a otros lotes que entraron a la manga.",
      "Balance y Reporte WhatsApp: Desglose inmediato de esperados vs. verificados, lista de faltantes/extraviados y envío con 1 clic por WhatsApp.",
      "Planilla Física Imprimible: Generación de formato de campo en PDF / papel con casillas de verificación y espacio para firmas de vaqueros y administradores."
    ]
  },
  {
    version: "2.8.95",
    date: "10/09/2026",
    title: "Estabilización y Carga Fluida de Calendario Ganadero & Ciclos Sanitarios ICA",
    highlights: [
      "Optimización de Renderizado en Vivo: Resolución de referencias de reloj y calendario en tiempo real para evitar pantallas en blanco.",
      "Ribbon de 12 Meses con Ciclos ICA: Navegador rápido interactivo por los meses de vacunación oficial FEDEGAN/ICA (Mayo, Junio, Noviembre, Diciembre) y temporadas preventivas (Carbón y Vitaminas).",
      "Banner Informativo en Tiempo Real: Alerta visual instantánea de ciclos sanitarios en curso o con vacunación ya registrada con RUV.",
      "Carga Inmediata y Fluida: Estabilidad garantizada en dispositivos móviles y de escritorio sin bloqueos de interfaz."
    ]
  },
  {
    version: "2.8.94",
    date: "10/09/2026",
    title: "Meses y Ciclos Sanitarios Oficiales Marcados en el Calendario",
    highlights: [
      "Ribbon de 12 Meses con Ciclos Sanitarios: Navegador rápido de los 12 meses del año con insignias interactivas que destacan los meses oficiales ICA (Mayo, Junio, Noviembre, Diciembre) y temporadas preventivas (Marzo, Abril, Septiembre, Octubre).",
      "Banner Informativo de Ciclo en Pantalla: Muestra en tiempo real qué biológicos corresponden al mes visualizado, si el hato ya fue vacunado (con RUV y fecha) o si el ciclo está en curso.",
      "Marcación en Celdas del Calendario: Cada día del mes dentro de un ciclo sanitario cuenta con un distintivo visual (💉 / 🔥 / 💊) que contextualiza la jornada.",
      "Widget de Calendario en Tablero: Alerta activa del ciclo en el widget principal del tablero con botón directo a la agenda completa."
    ]
  },
  {
    version: "2.8.93",
    date: "10/09/2026",
    title: "Trazabilidad Sanitaria y Vacunas Visible Directamente en Inventario",
    highlights: [
      "Insignia Sanitaria en Tarjetas: Cada bovino en el inventario muestra su total de vacunas registradas (ej. '💉 2 vacunas' o 'RUV') con tooltip de la última fecha y tipo de biológico.",
      "Columna de Sanidad en Tabla: En la vista de tabla se visualiza la trazabilidad sanitaria de cada animal con su última aplicación y fecha correspondiente.",
      "Pestaña Sanidad & Vacunas en Ficha Técnica: Al hacer clic en cualquier animal, la pestaña 'Sanidad & Vacunas' muestra el desglose completo de dosis, ciclos ICA, RUV, lote biológico, vacunador y observaciones."
    ]
  },
  {
    version: "2.8.92",
    date: "10/09/2026",
    title: "Acceso Directo a Censo ICA y Registro de Vacunación en el Banner Principal",
    highlights: [
      "Botones en Banner Principal: Integración de los botones directos '📄 Censo ICA / RUV' y '+ Registrar Vacunación' en la barra superior del Tablero (Control de Inventario, Pesos & Rentabilidad).",
      "Acceso Rápido en Inventario: Disponibles también en la barra de herramientas del inventario de ganado para acceso instantáneo.",
      "Flujo Sanitario Fluido: Abre el reporte oficial para imprimir o registra jornadas de vacunación directamente desde cualquier sección clave sin tener que desplazarte."
    ]
  },
  {
    version: "2.8.91",
    date: "10/09/2026",
    title: "Selección Múltiple de Tipos de Vacunas y Tratamientos Sanitarios",
    highlights: [
      "Aplicación Simultánea de Vacunas: Ahora puedes marcar 2 o más vacunas o biológicos en un solo registro (ej. Fiebre Aftosa + Brucelosis Bovina, o Carbón + Desparasitante + Vitaminas).",
      "Tarjetas de Selección Interactiva: Checkboxes claros para cada biológico oficial, preventivo o personalizado con consolidación visual inmediata del título sanitario.",
      "Registro Sanitario Unificado: Guarda un único evento sanitario con todos los biológicos aplicados, su costo total y trazabilidad completa en el censo oficial y ficha técnica.",
      "Compatibilidad Total: Se vincula automáticamente con las alertas ICA y el censo oficial FEDEGAN."
    ]
  },
  {
    version: "2.8.90",
    date: "10/09/2026",
    title: "Selección Múltiple Personalizada de Bovinos a Vacunar",
    highlights: [
      "Checklist Interactivo de Bovinos: Ahora puedes seleccionar libremente qué animales específicos recibieron la vacuna o tratamiento, sin limitarte a todo el hato o a un solo animal.",
      "Buscador y Filtros Rápidos: Filtra la lista por chapa, nombre, hierro, color, sexo o lote para marcar exactamente los animales correspondientes.",
      "Acciones en 1 Clic: Botones para 'Marcar Visibles' y 'Desmarcar Todos' con contador dinámico de cabezas.",
      "Trazabilidad Individual: Cada bovino seleccionado muestra la vacuna en su ficha técnica individual en la pestaña 'Sanidad & Vacunas'."
    ]
  },
  {
    version: "2.8.89",
    date: "10/09/2026",
    title: "Plan Sanitario Oficial FEDEGAN-ICA & Registro de Vacunación",
    highlights: [
      "Registro Sanitario y Ciclos de Vacunación: Módulo opcional para registrar vacunaciones oficiales (Fiebre Aftosa, Brucelosis Bovina C19/RB51, Carbón Triple/Mancha, Rabia Silvestre, Desparasitantes y Vitaminas).",
      "Censo Sanitario Oficial FEDEGAN/ICA: Generación instantánea del reporte poblacional discriminado por categorías ICA (Vacas, Novillas, Terneras 3-9m Brucelosis, Toros, Novillos, Terneros) listo para imprimir o entregar al brigadista.",
      "Integración en Calendario y Ficha Técnica: Marcación de fechas de vacunación en el Calendario Ganadero y pestaña de historial sanitario individual en la ficha técnica de cada bovino.",
      "Alertas Proactivas de Ciclos Nacionales: Notificaciones automáticas previas y durante los ciclos oficiales de vacunación en Colombia con enlace rápido al RUV."
    ]
  },
  {
    version: "2.8.88",
    date: "09/09/2026",
    title: "Distribución Automática de Gastos Globales en Lotes de Ganado",
    highlights: [
      "Prorrateo Inteligente de Gastos: Nueva sección en el ingreso de lotes para ingresar gastos globales (flete de camión, comisión de compra, vacunas, báscula, guías de movilización, etc.).",
      "Reparto Equitativo por Cabeza: El sistema calcula y distribuye automáticamente el gasto por animal entre todas las cabezas del lote, sumándolo a sus costos adicionales.",
      "Desglose y KPIs Transparentes: Visualización en tiempo real del costo de compra neto, gasto por cabeza e inversión total consolidada con costo real unitario."
    ]
  },
  {
    version: "2.8.87",
    date: "09/09/2026",
    title: "Sugerencias Dinámicas y Aprendizaje de Colores Registrados",
    highlights: [
      "Historial Inteligente de Colores: El panel de selección rápida de colores ahora aprende de los animales registrados en tu finca, priorizando los colores que ya utilizas.",
      "Inclusión Automática de Nuevos Colores: Al registrar cualquier color nuevo, el sistema lo incorpora automáticamente a los botones de acceso rápido y al autocompletado para futuros registros.",
      "Sincronización en Formularios: Disponible tanto en el registro individual como en el generador de lotes masivos."
    ]
  },
  {
    version: "2.8.86",
    date: "09/09/2026",
    title: "Campo de Color de Pelaje Obligatorio al Registrar Animales",
    highlights: [
      "Obligatoriedad de Color: El campo de color de pelaje o señas particulares es ahora de diligenciamiento obligatorio al registrar o editar cualquier bovino.",
      "Botones de Selección Rápida: Se agregaron botones de acceso rápido para los colores más comunes (Blanco, Negro, Hosco, Castaño, Sardo, Colorado, Bayo, etc.) facilitando el registro en 1 clic.",
      "Validación en Lotes: El registro masivo de lotes ahora verifica y exige que cada animal tenga su color asignado."
    ]
  },
  {
    version: "2.8.85",
    date: "09/09/2026",
    title: "Visualización de Color de Bovino en Tarjetas e Inventario",
    highlights: [
      "Color en Tarjetas de Bovinos: Las tarjetas del inventario general ahora destacan visualmente el color / pelaje del animal en la etiqueta principal en lugar de la raza.",
      "Detalle y Módulos Actualizados: En la ventana de detalle del bovino, tablas de inventario, pesaje y módulo de hembras se muestra el color de manera prioritaria.",
      "Búsqueda Integrada: Búsqueda rápida por color o señas en el módulo de lotes y análisis."
    ]
  },
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

    // 3. Recargar limpiamente
    window.location.reload();
  } catch (e) {
    console.warn('Error limpiando caché:', e);
    window.location.reload();
  }
}
