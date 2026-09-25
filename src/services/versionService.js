export const CURRENT_APP_VERSION = "2.14.69";
export const CURRENT_BUILD_TIME = Date.now();

/**
  * Historial de las últimas actualizaciones generadas en el sistema
  */
 export const APP_CHANGELOG = [
  {
    version: "2.14.69",
    date: "24/09/2026",
    title: "🧹 Depuración de Términos: Eliminación total de 'Pedigrí' en Favor de 'Genealogía'",
    highlights: [
      "Eliminación Integral de Textos de 'Pedigrí': Ajustadas todas las vistas, fichas técnicas, modales de ingreso y políticas.",
      "Consistencia con Vocabulario de Campo: Se estandariza todo el sistema bajo 'Genealogía', 'Árbol Genealógico' y 'Linaje de Crías'.",
      "Formularios Optimizados: Depurados botones y etiquetas obsoletas de ingreso de padres y madres."
    ]
  },
  {
    version: "2.14.68",
    date: "24/09/2026",
    title: "🧬 Switch Opcional de Genealogía (Padre y Madre) en Registro Individual y por Lote",
    highlights: [
      "Switch Inteligente Predeterminado Apagado: Los formularios de ingreso individual y por lote inician limpios y ágiles sin exigir datos de padre/madre.",
      "Activación Opcional en 1 Clic: Al prender el switch, se despliegan de inmediato los selectores de Padre (Toro de finca, Pajilla I.A., Toro externo o libre) y Madre (Vaca del hato o libre).",
      "Soporte Total en Ingreso por Lote: Permite definir un reproductor/padre común para todo el lote y asignar la chapa de la madre específica por cada fila.",
      "Integración Transparente con el Árbol Genealógico: Si se ingresa genealogía, se conecta de inmediato con la trazabilidad de 3 generaciones y habilidad materna en la ficha del animal."
    ]
  },
  {
    version: "2.14.67",
    date: "24/09/2026",
    title: "🌾 Potreros & Pastoreo Rotacional + 🧬 Árbol Genealógico Flexible",
    highlights: [
      "Módulo de Potreros & Pastoreo Rotacional: Catálogo completo de potreros con hectáreas, tipos de pastos, fuentes de agua, infraestructura y notas.",
      "Semáforo Inteligente de Descanso y Pastoreo: Monitoreo en vivo de días de reposo vs días meta, y alertas visuales de tiempo de pastoreo con barra de progreso.",
      "Calculadora de Aforo 1m² & Capacidad de Carga: Estimación zootécnica de forraje verde total, consumo del lote y días sostenibles con 1 toque.",
      "Rotación Rápida de Lotes: Mueve grupos entre potreros actualizando descansos, ocupaciones y ubicación de los animales en 1 clic.",
      "Árbol Genealógico Flexible (3 Generaciones): Visualización interactiva de padres y abuelos en la ficha técnica con soporte de padres externos o pajillas I.A. sin requerir registrarlos previamente.",
      "Habilidad Materna & Eficiencia de Destete: Cálculo zootécnico automático del porcentaje de peso destetado sobre el peso de la vaca reproductora."
    ]
  },
  {
    version: "2.14.66",
    date: "24/09/2026",
    title: "⚡ Sugerencias Rápidas y Chips de Marcas / Hierros Registrados en la Finca",
    highlights: [
      "Historial de Marcas de la Finca: El sistema analiza automáticamente todos los hierros registrados en tu hato y los presenta ordenados por frecuencia de uso.",
      "Chips de Selección a 1 Toque: Selecciona de inmediato cualquier marca de hierro previa tocando su botón directo tanto en el registro individual como en lotes.",
      "Autocompletado Rápido con Datalist: Escribe y visualiza sugerencias instantáneas en el campo de Hierro General (Paso 1), Generador de Series (Paso 3) y en cada fila de animal individual."
    ]
  },
  {
    version: "2.14.65",
    date: "24/09/2026",
    title: "🏷️ Hierro / Marca Individual por Animal en Lotes Completos",
    highlights: [
      "Columna de Hierro en Tabla de Lote (Punto 3): Ahora puedes asignar marcas de hierro diferentes para cada animal dentro del mismo lote (ej. animal #1 marca 'Y', animal #2 marca 'Z').",
      "Hierro General del Lote (Opcional): Si defines un hierro en el Paso 1, se aplica automáticamente como sugerido para todos los animales que no tengan marca específica.",
      "Soporte en Generador de Series: Puedes definir un hierro específico al generar series automáticas de aretes."
    ]
  },
  {
    version: "2.14.64",
    date: "24/09/2026",
    title: "📦 Predeterminado de Sexo en Lotes Completos & Registro Individual",
    highlights: [
      "Predeterminado en Blanco en Ingreso por Lotes: El modal de ingreso de lote completo ahora inicia con '-- Seleccionar Sexo del Lote * --', requiriendo selección explícita del usuario.",
      "Sincronización Inteligente en Lote: Al seleccionar Lechería Especializada o Cría / Vientres, el lote y todos sus animales se configuran automáticamente en Hembra ♀.",
      "Validación Estricta de Sexo: Bloqueo seguro si algún animal del lote carece de sexo definido antes de guardar."
    ]
  },
  {
    version: "2.14.63",
    date: "24/09/2026",
    title: "🐄 Predeterminado Inteligente de Sexo (Lechería & Cría) & Selección Obligatoria",
    highlights: [
      "Predeterminado Automático a Hembra: Al seleccionar 'Lechería Especializada' o 'Cría / Vientres' (o categorías como Vaca o Novilla), el sistema establece automáticamente el sexo en Hembra 🐄 y habilita sus módulos productivos.",
      "Inicio en Blanco & Validación Obligatoria: Para ganado de Ceba o nuevos registros generales, el campo de sexo inicia en blanco y es estrictamente obligatorio seleccionarlo antes de guardar el animal.",
      "Sincronización Reactiva en Formularios: Cambio ágil entre categorías zootécnicas y propósitos tanto en registro individual como en lote."
    ]
  },
  {
    version: "2.14.62",
    date: "24/09/2026",
    title: "🔒 Mensaje Unificado de Seguridad: Usuario o Contraseña Incorrectos",
    highlights: [
      "Protección de Identidad y Privacidad (Estándar OWASP): Se unificó la respuesta ante errores de autenticación a 'Usuario o contraseña incorrectos', impidiendo que terceros descubran si un correo existe o no en la plataforma.",
      "Seguimiento Seguro de Intentos: Se mantiene activo el conteo progresivo de intentos restantes y el bloqueo automático de 5 minutos al 5º intento consecutivo.",
      "Mayor Robustez en Ciberseguridad: Se mitigan ataques de fuerza bruta y enumeración de usuarios en toda la plataforma."
    ]
  },
  {
    version: "2.14.61",
    date: "24/09/2026",
    title: "🛡️ Bloqueo por 5 Intentos Fallidos & Acceso Directo al Tablero Principal",
    highlights: [
      "Bloqueo Temporal de 5 Minutos: Tras ingresar 5 veces consecutivas la contraseña incorrecta, el sistema bloquea temporalmente el formulario de acceso durante 5 minutos para proteger la cuenta contra intentos no autorizados.",
      "Temporizador de Seguridad en Vivo: Visualización de un aviso con contador regresivo segundo a segundo (MM:SS) y botón de acceso deshabilitado mientras dure el bloqueo.",
      "Reinicio Automático: Una vez transcurrido el tiempo o tras un inicio de sesión correcto, el contador se reinicia automáticamente.",
      "Acceso Directo al Tablero Principal: Al iniciar sesión o entrar a la aplicación, la plataforma se posiciona obligatoriamente en el Tablero de Control general con vista limpia."
    ]
  },
  {
    version: "2.14.59",
    date: "24/09/2026",
    title: "📐 Ajuste Preciso de Campos y Filtros a los Márgenes de Pantalla",
    highlights: [
      "Ajuste Perfecto a Contenedores: Se corrigió el desborde de los campos de fecha en filtros de ventas e inventario para que respeten estrictamente el ancho y bordes de las tarjetas.",
      "Reglas Globales de Contención Responsiva: Todos los campos de entrada de datos (`inputs`, `dates`, `selects`) ahora se adaptan con `box-border` y `min-w-0` sin salirse de los límites de pantalla.",
      "Espaciado y Proporción Visual Equilibrada: Márgenes limpios, alineación uniforme y visualización armoniosa en todo tipo de dispositivos móviles."
    ]
  },
  {
    version: "2.14.58",
    date: "24/09/2026",
    title: "📐 Corrección de Superposición en Celulares (Báscula Rápida y Formularios)",
    highlights: [
      "Eliminación de Solapamiento en Controles: La selección de fecha y el botón 'Guardar Todo' ahora se apilan verticalmente de forma limpia en pantallas de celular, evitando cualquier choque o superposición visual.",
      "Botones y Campos Ergonómicos: Botones con ancho táctil completo en móvil, bordes nítidos y mensajes de validación perfectamente alineados.",
      "Separación Visual Óptima: Espaciado uniforme para modo vertical y horizontal en cualquier modelo de smartphone."
    ]
  },
  {
    version: "2.14.57",
    date: "24/09/2026",
    title: "✨ Experiencia Móvil Limpia: Retiro de Barra Inferior Redundante",
    highlights: [
      "Eliminación de la Barra Inferior: Toda la navegación se centraliza de forma limpia en el botón Menú superior y panel lateral desplegable, ganando más espacio vertical útil en pantallas móviles.",
      "Mayor Área de Visualización: Se eliminó el margen inferior redundante para que las tarjetas, tablas y formularios aprovechen el 100% de la pantalla del celular.",
      "Acceso Directo y Rápido: Acceso a todos los módulos (Tablero, Ganado, Lotes, Palpación, Báscula, etc.) desde el menú superior siempre visible."
    ]
  },
  {
    version: "2.14.56",
    date: "24/09/2026",
    title: "📱 Optimización Móvil: Barra Superior Limpia, Espaciosa y Sin Amontonamientos",
    highlights: [
      "Distribución Perfecta en Celulares: El botón Menú ahora es un botón compacto de acceso rápido con icono estilizado, liberando más del 60% de espacio en pantalla.",
      "Nombre de Finca y Badges Centrados: Eliminada la superposición de texto y métricas en dispositivos móviles con tipografía auto-adaptable.",
      "Botones de Acción Optimizados: Botones de registro rápido (+), sincronización en la nube y perfil con diseño minimalista de alto impacto visual."
    ]
  },
  {
    version: "2.14.55",
    date: "24/09/2026",
    title: "🎨 Nuevo Fondo y Estilo Colorido para la Barra Superior",
    highlights: [
      "Gradiente Ganadero Vibrante: La barra superior ahora cuenta con un fondo degradado elegante en tonos verde esmeralda y bosque que resalta la identidad ganadera.",
      "Alto Contraste y Legibilidad: Texto blanco brillante, botones translúcidos tipo cristal y bordes luminosos para una visualización clara tanto de día como de noche.",
      "Botón de Menú y Acciones Destacadas: Estilizado premium del botón Menú, botón Registrar Bovino y badges de estado del hato."
    ]
  },
  {
    version: "2.14.54",
    date: "23/09/2026",
    title: "⚡ Eliminación Instantánea y Blindada al Primer Clic (Cero Resurrección)",
    highlights: [
      "Eliminación Inmediata al Primer Clic: Se eliminó la condición de carrera con la sincronización en la nube que causaba que un animal eliminado reapareciera temporalmente si una descarga coincidía en el mismo segundo.",
      "Registro Persistente de Lápidas (Tombstones): La aplicación mantiene memoria de los identificadores borrados para que ninguna respuesta rezagada de la red pueda volver a insertar un bovino eliminado.",
      "Limpieza Multi-Tipo en Base de Datos: Borrado garantizado en IndexedDB soportando identificadores numéricos y de texto.",
      "Sincronización PUSH Inmediata: Los borrados de animales, pesajes y palpaciones se envían y aseguran en Firebase en tiempo real."
    ]
  },
  {
    version: "2.14.53",
    date: "23/09/2026",
    title: "🧪 Segunda Actualización de Prueba: Validación de Auto-Guardado en Vivo",
    highlights: [
      "Prueba Adicional de Continuidad: Comprobación de preservación de formularios abiertos y borradores de animales.",
      "Reapertura Automática Instantánea: Mantiene la vista, modal y valores intactos tras actualizar con 1 clic.",
      "Verificación de Notificación Flotante: Aviso de actualización en tiempo real."
    ]
  },
  {
    version: "2.14.52",
    date: "23/09/2026",
    title: "🧪 Actualización de Prueba: Verificación de Auto-Guardado de Formularios en Vivo",
    highlights: [
      "Prueba de Continuidad: Diseñada para comprobar que al actualizar la app mientras estás digitando un lote de ganado o formulario, no pierdes ningún dato.",
      "Restauración Instantánea: Tu formulario y pantalla actual se reabren automáticamente con todos los aretes, pesos y valores escritos.",
      "Verificación de Notificación Flotante: Comprobación del aviso flotante con 1 clic en tiempo real."
    ]
  },
  {
    version: "2.14.51",
    date: "23/09/2026",
    title: "💾 Persistencia y Auto-Guardado de Borradores al Actualizar o Recargar",
    highlights: [
      "Auto-Guardado Continuo en Vivo: Todo lo que estés digitando en lotes completos de ganado, registro de bovinos individuales, gastos o ingresos se guarda en tiempo real en tu dispositivo.",
      "Restauración Automática sin Pérdida de Datos: Al presionar 'Actualizar Ahora en 1 Clic' o recargar el navegador, la aplicación reabre exactamente la pantalla y el formulario donde estabas trabajando con todos los animales, pesos y datos preservados.",
      "Aviso Visual de Recuperación: Banner informativo que confirma que el borrador fue restaurado con opción de descartar o reiniciar si se desea.",
      "Limpieza Inteligente: Los borradores se liberan automáticamente una vez que guardas con éxito el lote o registro."
    ]
  },
  {
    version: "2.14.50",
    date: "23/09/2026",
    title: "✅ Aceptación Obligatoria de Términos & Condiciones al Crear Cuenta",
    highlights: [
      "Casilla Obligatoria de Aceptación: Se agregó un checkbox requerido en el formulario de registro de nueva cuenta para validar que el usuario lea y acepte los Términos y Condiciones y la Política de Tratamiento de Datos.",
      "Validación de Registro Blindada: El sistema bloquea la creación de la cuenta y alerta amigablemente si la casilla no está marcada.",
      "Auto-Marcado al Aceptar en Modal: Si el usuario abre el modal legal para leer los términos y pulsa 'Aceptar y Continuar', la casilla queda automáticamente marcada.",
      "Enlaces Directos: Acceso instantáneo a la lectura de los Términos de Uso y la Política de Privacidad (Ley 1581) directamente desde la casilla."
    ]
  },
  {
    version: "2.14.49",
    date: "23/09/2026",
    title: "📜 Términos y Condiciones de Uso & Tratamiento de Datos (Ley 1581)",
    highlights: [
      "Centro Legal Unificado: Incorporación completa del contrato de Términos y Condiciones de Uso del software ganadero junto a la Política de Privacidad y Tratamiento de Datos Personales (Ley 1581 de 2012 / Decreto 1377 de 2013).",
      "Propiedad Inalienable de los Datos: Cláusula contractual explícita que ratifica que el ganadero es el único y exclusivo dueño de toda la información pecuaria y económica ingresada.",
      "Garantía de No Comercialización: Compromiso formal de cero venta, cesión o divulgación de datos a terceros o empresas de publicidad.",
      "Exclusión de Responsabilidad Veterinaria: Declaración de apoyo tecnológico y complementariedad profesional zootécnica.",
      "Navegación Interactiva por Pestañas: Pestañas para alternar entre Términos y Condiciones, Política de Privacidad y Vista Consolidada con botón de impresión y PDF."
    ]
  },
  {
    version: "2.14.48",
    date: "23/09/2026",
    title: "📊 Detalle Contable y Financiero Mensual al Clic en Gráfica y Meses",
    highlights: [
      "Interacción Directa en la Gráfica: Al hacer clic en cualquier barra de la gráfica mensual (Ingresos, Gastos, Utilidad) o en los botones de meses (Abr, May, Jun, Jul, Ago, Sep) se abre el desglose completo del mes.",
      "Tarjetas KPI del Mes: Resumen instantáneo de Ingresos Operativos, Gastos de Finca, Utilidad Neta Realizada y Ganancia en Ventas de Ganado.",
      "Pestañas de Desglose Mensual: Acceso a Gastos Detallados con filtros y buscador, Ganado Vendido con compradores y utilidades, Otros Ingresos (leche/queso/servicios) y Resumen con gráficas por rubro.",
      "Gestión Contable en el Mes: Posibilidad de agregar, editar o eliminar gastos e ingresos directamente desde el modal del mes.",
      "Exportación y Comunicación: Descarga en Excel profesional con todas las hojas del mes y generador de informe para WhatsApp."
    ]
  },
  {
    version: "2.14.47",
    date: "23/09/2026",
    title: "📊 Balance Financiero & Desglose Detallado por Propietario / Marca",
    highlights: [
      "Balance Individual al Clic: Al tocar cualquier tarjeta de dueño o marca en Finanzas se abre un panel interactivo con todo su historial zootécnico y financiero.",
      "Precios de Compra por Animal: Lista detallada de cada bovino con su chapa, peso de entrada, precio de compra y costo por kg de compra.",
      "Inventario Activo Valorizado: Valor total invertido en animales en finca y costo promedio de compra por cabeza activa.",
      "Liquidación Detallada de Vendidos: Animales vendidos con fecha, comprador, peso de salida, precio de venta, costo histórico, utilidad neta y ROI por animal.",
      "Promedios y Métricas Clave: Promedio costo animal vendido, promedio valor de venta, margen comercial y retorno neto.",
      "Exportación y Comunicación: Descarga en Excel profesional con hojas separadas (Activos, Vendidos y Resumen) y generador de reporte para WhatsApp."
    ]
  },
  {
    version: "2.14.46",
    date: "23/09/2026",
    title: "🛡️ Sincronización Offline Blindada & Reintentos Escalonados al Reconectar",
    highlights: [
      "Inmunidad Total para Datos Offline: Las creaciones, ediciones y eliminaciones hechas sin internet quedan 100% protegidas y nunca son sobreescritas por datos viejos al volver a conectarse.",
      "Reintentos Automáticos Escalonados: Al reconectarse a WiFi o datos móviles, la aplicación reintenta de inmediato (0s, 1.5s y 4s) asegurando que el socket TCP envíe todos los cambios pendientes a Firebase.",
      "Timeout Ampliado a 15-20 Segundos: Garantiza que inventarios grandes o conexiones lentas de campo suban sin cancelaciones prematuras.",
      "Sincronización Multidispositivo Instantánea: Mantiene la actualización en vivo cada 4 segundos entre computadores."
    ]
  },
  {
    version: "2.14.45",
    date: "23/09/2026",
    title: "⚡ Sincronización Multidispositivo en Tiempo Real & Fusión Inteligente Offline",
    highlights: [
      "Sincronización Multidispositivo Instantánea: Los animales, pesajes, palpaciones y gastos creados en un computador aparecen automáticamente en el otro en tiempo real (cada 4s o al cambiar de pestaña) sin refrescar.",
      "Protección contra Sobreescritura: Al abrir la plataforma en un segundo computador, este ya no sobreescribe Firebase con datos viejos; descarga inmediatamente las novedades del otro equipo.",
      "Fusión Bidireccional Inteligente Offline: Los registros creados sin internet en el potrero se protegen y se fusionan limpiamente con lo que otros hayan hecho en la finca al reconectarse.",
      "Eliminaciones Seguras: Los registros borrados en un computador se propagan inmediatamente a todos los demás dispositivos."
    ]
  },
  {
    version: "2.14.44",
    date: "23/09/2026",
    title: "↩️ Restauración: Versión Ligera sin Blindajes Adicionales",
    highlights: [
      "Reversión Completa de Blindaje: Eliminación de políticas CSP adicionales y sanitizaciones accesorias, regresando al estado ligero y original.",
      "Persistencia Offline y PUSH-First Intactas: Mantiene al 100% la solución de sincronización sin pérdida de datos en potrero.",
      "Rendimiento Inmediato: Carga ultrarrápida sin sobrecargas."
    ]
  },
  {
    version: "2.14.42",
    date: "23/09/2026",
    title: "🚀 Actualización de Prueba: Sincronización Offline PUSH-First Perfeccionada",
    highlights: [
      "Prueba de Actualización en Vivo: Verificación del sistema de aviso flotante y botón 'Actualizar Ahora' en tiempo real.",
      "Sincronización PUSH-First 100% Blindada: Los animales, pesajes y gastos registrados en el potrero sin señal suben a Firebase de primero antes de reconciliar, garantizando cero pérdidas de datos.",
      "Arranque Ultrarrápido Offline: Carga instantánea de la aplicación y base de datos local aún sin cobertura de red."
    ]
  },
  {
    version: "2.14.41",
    date: "22/09/2026",
    title: "📊 Gráficas Visuales Interactivas en Lotes, Ingresos & Comparaciones",
    highlights: [
      "Gráficas Zootécnicas Comparativas: Visualización en barras interactivas de Ganancia Diaria de Peso (GDP kg/día), Evolución de Pesos (Entrada vs Actual), Kilos Ganados y Población de Cabezas.",
      "Análisis Económico Visual: Gráfica comparativa de Valor del Kilo de Entrada ($/kg) e Inversión Total de Compra para administradores.",
      "Distribución de Biomasa por Rango: Gráfica de rangos de peso (<300kg, 300-380kg, 380-480kg, ≥480kg Listos) y ranking Top 5 en báscula por grupo."
    ]
  },
  {
    version: "2.14.40",
    date: "22/09/2026",
    title: "🏷️ Módulo de Lotes, Ingresos & Comparaciones",
    highlights: [
      "Renombrado Intuitivo del Módulo: Actualizado el acceso en el menú principal y encabezado como 'Lotes, Ingresos & Comparaciones'.",
      "Experiencia Integral de Manejo: Centralización del control de potreros, ingresos de ganado y comparativas zootécnicas y financieras multidimensionales."
    ]
  },
  {
    version: "2.14.39",
    date: "22/09/2026",
    title: "🧬 Comparador Multidimensional de Ganado (Lote, Raza, Dueño/Hierro, Tipo Producción y Categoría)",
    highlights: [
      "5 Dimensiones de Comparación: Posibilidad de analizar y contrastar el desempeño del ganado por Lote / Ingreso (🏷️), Raza (🧬), Dueño o Marca / Hierro (👤), Tipo de Producción (🎯) y Categoría / Etapa (🐄).",
      "Selección Múltiple Interactiva: Elige 1, 2, 3 o todos los grupos para comparativas lado a lado instantáneas con medallas de eficiencia, tabla matriz sintética y tarjetas cara a cara.",
      "Integración en Detalle y Excel: Vistas de detalle individual filtradas por cualquier dimensión y exportación de reportes Excel estilizados con gráficos de barras para el criterio seleccionado.",
      "Privacidad Zootécnica de Trabajadores: Protección total de datos financieros en todos los criterios para perfiles de trabajadores de campo."
    ]
  },
  {
    version: "2.14.38",
    date: "22/09/2026",
    title: "✨ Secuencia Lógica y Armonía Visual de los KPIs en el Tablero Principal",
    highlights: [
      "Flujo Intuitivo de 3 Etapas: 1. Cantidad (Total Bovinos) ➔ 2. Rendimientos en Báscula (Biomasa Total y GDP Promedio) ➔ 3. Valores Económicos (Inversión Activa y Utilidad Neta Real).",
      "Paleta de Colores Zootécnica & Financiera: Emerald para cabezas, Teal para biomasa, Azul para ganancia GDP, Ámbar para inversión de compra y Semáforo dinámico para utilidad líquida."
    ]
  },
  {
    version: "2.14.37",
    date: "22/09/2026",
    title: "💰 Restauración de Inversión Activa en Ganado en el Tablero Principal",
    highlights: [
      "KPI Superior de Inversión Activa: Restablecida la tarjeta de 'Inversión Activa' ($ total invertido en ganado en finca) en el tablero principal junto a Total Bovinos, Biomasa, GDP y Utilidad Neta Real.",
      "Diseño Armónico de 5 KPIs: Distribución en 5 columnas en pantalla grande para el administrador y 4 columnas zootécnicas para el vaquero."
    ]
  },
  {
    version: "2.14.36",
    date: "22/09/2026",
    title: "🔒 Privacidad Financiera Total en Perfiles de Vaqueros / Trabajadores",
    highlights: [
      "Blindaje en Comparador de Lotes: Se ocultaron por completo los valores de compra total, precios por animal, valor de compra/kg y tarjetas de inversión cuando el usuario es un trabajador de campo.",
      "Sanitización del Tablero Principal: Cero resúmenes financieros, balances ni accesos contables visibles para vaqueros, manteniendo un enfoque 100% zootécnico y operativo.",
      "Privacidad en Inventario y Calendario: Indicadores de capital, precios de venta y valor del ganado reemplazados por recuentos de cabezas y lotes.",
      "Manejo de Campo Seguro: Los vaqueros y mayordomos disponen de todas las herramientas operativas (pesajes, vacunas, partos, potreros) con absoluta confidencialidad financiera."
    ]
  },
  {
    version: "2.14.35",
    date: "22/09/2026",
    title: "🧹 Depuración de Acciones Rápidas: Botón de Liquidación Único",
    highlights: [
      "Optimización del Banner: Se retiró el botón duplicado de venta manteniendo exclusivamente '🤝 Liquidación' para abrir la liquidación de ganado de forma directa y limpia."
    ]
  },
  {
    version: "2.14.34",
    date: "22/09/2026",
    title: "🗓️ Integración Total de Alarmas en el Calendario & Coherencia Financiera",
    highlights: [
      "Alarmas Conectadas al Calendario: El calendario general y el widget de finca ahora muestran automáticamente las fechas de revacunación, los avisos del día previo ('Aviso Mañana'), los partos estimados y los chequeos de palpación ginecológica.",
      "Conexión Financiera Consolidada: Total integración entre ventas de ganado, liquidaciones en compañía y gastos fijos/variables de la finca para determinar la Utilidad Neta Real y cobertura mensual de costos."
    ]
  },
  {
    version: "2.14.33",
    date: "22/09/2026",
    title: "🤝 Botón de Liquidación Directo en Acciones Rápidas del Tablero",
    highlights: [
      "Acceso Directo a Liquidación: Botón destacado '🤝 Liquidación' en el banner superior y en el Centro Financiero para abrir inmediatamente la liquidación consolidada y en compañía.",
      "Separación Visual Clara: Botón de '🤝 Liquidación' para liquidar utilidades/lotes y botón '💰 Venta de Ganado' para consultar el módulo completo de ventas."
    ]
  },
  {
    version: "2.14.32",
    date: "22/09/2026",
    title: "💉 Sistema de Revacunación y Refuerzos Programados con Alarmas Inteligentes",
    highlights: [
      "Programación de Revacunaciones: Al registrar cualquier vacuna o plan sanitario se puede definir un intervalo de refuerzo (15d, 21d, 30d, 60d, 90d, 180d, 365d o personalizado).",
      "Alarmas Anticipadas y el Día D: Notificaciones automáticas de aviso 1 día antes ('¡MAÑANA!') y el día exacto de la dosis ('¡HOY!') tanto para el Ganadero (Admin) como para los Vaqueros/Mayordomos.",
      "Módulo de Refuerzos en el Tablero: Panel interactivo con estado de refuerzos pendientes, fechas calculadas y botón 'Marcar como Aplicada'.",
      "Sincronización en la Nube y Calendario: Agendamiento automático en el calendario de la finca y sincronización en tiempo real multidispositivo."
    ]
  },
  {
    version: "2.14.31",
    date: "22/09/2026",
    title: "📊 Centro Financiero & Contabilidad Ganadera en Tablero Principal",
    highlights: [
      "KPI Superior de Utilidad Neta Real: Tarjeta destacada con ganancia líquida descontando compra y todos los gastos operativos.",
      "Centro Financiero de Finca Integrado: Panel con desglose de Ingresos Totales, Gastos de Finca, Utilidad Neta y Costo Diario de Mantenimiento ($/animal/día).",
      "Semáforo de Salud Financiera & Cobertura de Gastos: Indicador visual de superávit/déficit y porcentaje de cobertura de costos del mes.",
      "Acciones Rápidas Directas: Botones para registrar gasto, registrar ingreso o liquidar ganado desde el tablero."
    ]
  },
  {
    version: "2.14.30",
    date: "22/09/2026",
    title: "🩺 Palpación y Reproducción en Trabajo de Corral & Manga",
    highlights: [
      "Reubicación Funcional: Integración del módulo de Palpación & Reproducción en la sección 'Trabajo en Corral & Manga' junto a Báscula Rápida.",
      "Flujo de Corral Unificado: Acceso inmediato a todas las labores de manga y diagnóstico ginecológico en un solo bloque operativo."
    ]
  },
  {
    version: "2.14.29",
    date: "22/09/2026",
    title: "📂 Organización de Módulos por Categoría en Panel Lateral",
    highlights: [
      "Separación Funcional y Temática: Módulos agrupados en 4 bloques temáticos claros (Panel de Control, Ganadería & Inventario, Trabajo en Corral & Manga, Finanzas & Contabilidad).",
      "Insignias Distintivas por Sección: Etiquetas visuales para rápida identificación (Principal, Hato, Campo, Finanzas, Acciones).",
      "Navegación Intuitiva y Fluida: Jerarquía visual limpia y ordenada para un acceso más ágil a todas las herramientas de la finca."
    ]
  },
  {
    version: "2.14.28",
    date: "22/09/2026",
    title: "⚡ Botones Rápidos de Registro de Ingreso y Gasto en el Tablero",
    highlights: [
      "Acceso Directo en Cabecera del Tablero: Incorporación de los botones '💵 Registro Ingreso' y '💸 Registro Gasto' junto a las acciones principales.",
      "Registro Instantáneo sin Cambiar de Vista: Apertura inmediata de los formularios de ingreso y gasto con guardado y sincronización en la nube en 1 toque.",
      "Optimización de Flujo Diario: Registro veloz de gastos de corral, insumos, fletes y venta de leche/queso desde la pantalla principal."
    ]
  },
  {
    version: "2.14.27",
    date: "22/09/2026",
    title: "📊 Módulo Financiero & Contabilidad Ganadera Integral",
    highlights: [
      "Libro de Gastos & Costos de Finca: Registro detallado de gastos fijos (nómina/vaqueros, energía, agua, arriendo de potreros) y gastos variables (sal mineral, concentrado, vacunas, fletes, mantenimiento).",
      "Libro de Otros Ingresos Ganaderos: Control de venta de leche, queso, arriendo de pasto, servicios de toro/monta, estiércol orgánico e ingresos varios.",
      "Utilidad Neta Real & Semáforo Financiero: Ganancia líquida descontando el capital de compra de animales y todos los costos operativos de la finca (🟢 Superávit / 🟡 Equilibrio / 🔴 Déficit).",
      "Costos Unitarios de Producción: Cálculo en vivo de Costo por Kilo de Carne Producido ($/kg), Costo por Litro de Leche ($/L) y Costo de Mantenimiento Diario por Cabeza ($/animal/día).",
      "Indicador de Cobertura de Gastos: Determina automáticamente si las ganancias netas de las ventas de ganado cubrieron la totalidad de los gastos del mes.",
      "Gráficos Interactivos & Tablas Dinámicas: Comparativa mensual de Ingresos vs Gastos vs Utilidad Neta (Recharts) y distribución porcentual de costos por categoría.",
      "Reportes en Excel y WhatsApp: Exportación contable profesional en Excel (.xlsx) y resumen financiero para compartir por WhatsApp en 1 toque.",
      "Privacidad Absoluta para Trabajadores: Módulo 100% confidencial y oculto para perfiles operativos de vaqueros y mayordomos."
    ]
  },
  {
    version: "2.14.26",
    date: "22/09/2026",
    title: "✨ Cabecera Superior Aún Más Limpia y Minimalista",
    highlights: [
      "Eliminación del Botón WhatsApp en la Barra Superior: Barra superior más despejada y enfocada en lo esencial.",
      "Acceso Completo a Reportes por WhatsApp: La herramienta de generación y envío de reportes sigue disponible en el Panel Lateral Desplegable (☰) y en el Tablero."
    ]
  },
  {
    version: "2.14.25",
    date: "22/09/2026",
    title: "🚪 Reincorporación del Botón Salir en la Cabecera Superior",
    highlights: [
      "Acceso Directo a Cerrar Sesión: Botón 'Salir' restaurado en la esquina superior derecha junto al perfil para desconexión rápida.",
      "Consistencia en Navegación: Posibilidad de salir tanto desde la barra superior directa como desde el pie del menú desplegable lateral."
    ]
  },
  {
    version: "2.14.24",
    date: "22/09/2026",
    title: "🎯 Nombre de Finca Centrado y Botón de Menú Ampliado",
    highlights: [
      "Identidad de la Finca Centrada: El logotipo, nombre de la finca y conteo de cabezas se encuentran perfectamente centrados en la cabecera superior.",
      "Botón de Menú Más Amplio y Notorio: Botón de 'MENÚ' con mayor tamaño, dimensiones extendidas y presencia destacada en la esquina izquierda.",
      "Equilibrio Visual Perfecto: Distribución armónica en 3 columnas (Menú a la izquierda, Finca al centro, Acciones rápidas a la derecha)."
    ]
  },
  {
    version: "2.14.23",
    date: "22/09/2026",
    title: "🔘 Botón de Menú Destacado y de Alta Visibilidad",
    highlights: [
      "Diseño Destacado y Notorio: Botón de menú con alto contraste, borde verde esmeralda y etiqueta de texto 'MENÚ' para máxima claridad.",
      "Acceso Inmediato al Panel Lateral: Apertura instantánea del cajón de navegación con todos los módulos y herramientas ganaderas.",
      "Optimizado para Campo y Sol Directo: Alta legibilidad tanto en modo claro como en modo oscuro."
    ]
  },
  {
    version: "2.14.22",
    date: "22/09/2026",
    title: "✨ Cabecera Superior Despejada y Navegación 100% en Panel Lateral",
    highlights: [
      "Barra Superior Ultralimpia: Eliminación completa de botones de módulos en la barra superior para una interfaz limpia, amplia y profesional.",
      "Menú Hamburguesa (☰): Toda la navegación entre módulos (Tablero, Ganado, Lotes, Palpación, Pesos, Báscula, Ventas) se realiza exclusivamente desde el panel lateral desplegable.",
      "Mayor Espacio Visual: Mayor amplitud de visualización en el tablero principal y listas de ganado sin elementos redundantes."
    ]
  },
  {
    version: "2.14.21",
    date: "22/09/2026",
    title: "📱 Nuevo Panel Desplegable Lateral Izquierdo (Sidebar Drawer)",
    highlights: [
      "Menú Desplegable Lateral (☰): Acceso completo a todos los módulos de gestión, herramientas y acciones de campo desde un panel lateral elegante y fluido.",
      "Barra Superior Limpia: Cabecera minimalista y despejada con acceso rápido a registrar bovino, reportes, sincronización nube y perfil.",
      "Navegación Unificada: Acceso ágil a Vaqueros, Respaldo Excel, Reportes de WhatsApp, Control de Pesos, Lotes y Ajustes de Finca con un solo toque.",
      "Accesibilidad y Teclado: Apertura/cierre instantáneo con botón hamburguesa, clic en fondo exterior o tecla Escape."
    ]
  },
  {
    version: "2.14.20",
    date: "22/09/2026",
    title: "🧬 Filtro de Raza y Cruce en Inventario de Ganado",
    highlights: [
      "Filtro de Raza o Cruce: Reemplazo del selector de ingreso # por un menú desplegable dinámico para filtrar con precisión por raza o cruce (Brahman, Gyr, Nelore, Angus, Holstein, Girolando, Mestizos, etc.).",
      "Inventario Completo y Razas Ganaderas: Integra de forma automática todas las razas registradas en el predio junto con el catálogo de razas comerciales y puras.",
      "Compatibilidad Total de Filtros: Funciona armónicamente junto a los filtros de procedencia/origen, sexo, tipo de producción, estado reproductivo, dueños y fechas."
    ]
  },
  {
    version: "2.14.19",
    date: "22/09/2026",
    title: "⚡ Aceleración Ultrarrápida de Inicio de Sesión y Arranque Instantáneo",
    highlights: [
      "Ingreso Instantáneo (< 150ms): Verificación local optimizada que abre el panel ganadero de inmediato sin bloquear la pantalla con peticiones remotas.",
      "Operaciones Batch de Alto Rendimiento: Uso de inserciones y eliminaciones masivas (bulkPut / bulkDelete) acelerando la sincronización en más de 20x.",
      "Sincronización en Segundo Plano: La descarga y reconciliación de datos en la nube se ejecuta de forma transparente sin congelar la interfaz.",
      "Arranque Inmediato al Abrir la App: Acceso instantáneo a la finca desde la memoria local en cualquier dispositivo."
    ]
  },
  {
    version: "2.14.18",
    date: "22/09/2026",
    title: "🚀 Actualización de Prueba: Validación de Aviso de Novedades Exclusivo Adentro",
    highlights: [
      "Prueba de Notificación Interna: Esta actualización verifica que el aviso emergente se muestre únicamente cuando el ganadero está adentro de su finca.",
      "Pantalla de Login Inalterada: La pantalla de acceso permanece limpia y sin interrupciones.",
      "Actualización en 1 Clic: Al presionar el botón de actualizar, el sistema recarga instantáneamente con todas las funciones al día."
    ]
  },
  {
    version: "2.14.17",
    date: "22/09/2026",
    title: "Actualización Automática y Silenciosa en Pantalla de Acceso",
    highlights: [
      "Eliminación de Avisos en Pantalla de Login: La pantalla de acceso ahora actualiza silenciosamente en segundo plano o al recargar sin mostrar banners ni popups.",
      "Avisos Exclusivos Dentro del Sistema: Los avisos de novedades solo se visualizan una vez el ganadero ha iniciado sesión dentro de su panel principal.",
      "Carga Limpia y Sin Interrupciones: Experiencia fluida al entrar a la finca desde cualquier dispositivo."
    ]
  },
  {
    version: "2.14.16",
    date: "22/09/2026",
    title: "Rediseño Visual de Pantalla de Acceso (Split-Screen) y Recordar Correo",
    highlights: [
      "Diseño Split-Screen Moderno: Interfaz institucional con logotipo ganadero y resumen de beneficios clave (Modo sin Internet, GDP en vivo, Nube segura).",
      "Experiencia de Acceso Ultralimpia: Eliminación de botones redundantes y jerarquía visual optimizada para iniciar sesión en un solo paso.",
      "Función 'Recordar Correo': Opción para recordar el correo o usuario en el dispositivo sin tener que escribirlo cada vez.",
      "Indicador de Nube Activa: Estado visual discreto de conexión y respaldo multi-dispositivo."
    ]
  },
  {
    version: "2.14.15",
    date: "22/09/2026",
    title: "Eliminación de Popup de Actualización y Validación Estricta de Correos Renombrados",
    highlights: [
      "Eliminación de Popup Invasivo: Se retiró definitivamente el cartel emergente de bienvenida '¡Actualizado con Éxito!', permitiendo ingresar directamente al sistema sin interrupciones.",
      "Bloqueo de Correos Anteriores: Si una cuenta actualiza su correo en la nube, el sistema bloquea inmediatamente cualquier intento de ingreso con el correo anterior y purga los datos locales obsoletos.",
      "Consistencia Multi-Dispositivo: Acceso exclusivo con el correo vigente en tiempo real."
    ]
  },
  {
    version: "2.14.14",
    date: "22/09/2026",
    title: "Optimización y Corrección de Cambio de Correo/Usuario en Perfil",
    highlights: [
      "Depuración Automática de Registros Huérfanos: Al cambiar el correo o nombre de usuario en 'Mi Perfil Ganadero', el sistema verifica la disponibilidad real en la nube y limpia automáticamente registros locales residuales.",
      "Solución de Conflicto de Correo: Permite a los ganaderos actualizar su cuenta a correos previamente ensayados en el mismo dispositivo sin bloquear el guardado.",
      "Sincronización Inmediata: Actualización en tiempo real del nuevo perfil en la nube y en la sesión activa del dispositivo."
    ]
  },
  {
    version: "2.14.13",
    date: "22/09/2026",
    title: "Implementación de Cabeceras de Seguridad HTTP y Reglas de Base de Datos",
    highlights: [
      "Cabeceras de Seguridad HTTP (Punto 18): Protección activa contra clickjacking (X-Frame-Options), prevención de sniffing de contenido (X-Content-Type-Options: nosniff), HSTS forzado y políticas de permisos en el navegador.",
      "Reglas de Seguridad y Validación de Base de Datos (Puntos 4, 7 y 8): Definición de reglas de control de acceso e inmutabilidad de identificadores de usuario (database.rules.json).",
      "Experiencia Fluida y Transparente: Blindaje de seguridad sin alterar la interfaz gráfica ni interrumpir los flujos de trabajo en campo."
    ]
  },
  {
    version: "2.14.12",
    date: "21/09/2026",
    title: "Valor Obligatorio y Peso Opcional en Ingreso de Ganado en Compañía",
    highlights: [
      "Ganado en Compañía con Inversión Obligatoria: En el registro individual de bovinos (CattleFormModal), cuando el origen es 'Compañía', el campo 'Valor Inicial / Inversión ($)' pasa a ser estrictamente obligatorio (*).",
      "Peso Inicial Opcional en Compañía: Para ingresos bajo modalidad de compañía, el 'Peso Inicial (kg)' se marca y valida como opcional '(Opcional en Compañía)', permitiendo registrar el aporte de capital sin exigir pesaje de entrada inmediato.",
      "Validación y Señalización Visual Clara: Etiquetas, asteriscos y textos de ayuda adaptados dinámicamente según el tipo de procedencia del animal."
    ]
  },
  {
    version: "2.14.11",
    date: "21/09/2026",
    title: "Ajuste de Obligatoriedad de Precios en Lote y Valor Inicial Recomendable Individual",
    highlights: [
      "Cálculo Obligatorio en Opciones 1 y 2 de Lote: Si se elige 'Por Kilos' o 'Valor Fijo por Animal' en el ingreso masivo, el precio correspondiente es estrictamente obligatorio (*).",
      "Opción 3 para Registro sin Costo ($0 COP): La tercera opción '$0 COP (Sin Costo Inicial)' es la vía exclusiva para ingresar animales de lote sin requerir precio alguno.",
      "Registro Individual Recomendable: En el formulario de registro individual de bovino (CattleFormModal), el 'Valor Inicial / Compra ($)' permanece como campo no obligatorio pero altamente recomendable."
    ]
  },
  {
    version: "2.14.10",
    date: "21/09/2026",
    title: "Flexibilidad de Valor Inicial (Recomendable / No Obligatorio) en Ingreso Individual y por Lote",
    highlights: [
      "Valor Inicial Recomendable: En el registro de nuevo bovino individual (CattleFormModal) y en el ingreso de lote completo (BatchEntryModal), el costo o valor inicial ya no es obligatorio, indicándose claramente como '(Recomendable)'.",
      "Registro sin Trabas: Si se deja en blanco el valor de entrada, el sistema lo asigna automáticamente como $0 sin bloquear el guardado.",
      "Consistencia Visual: Indicadores claros y estandarizados en todos los formularios de ingreso ganadero."
    ]
  },
  {
    version: "2.14.9",
    date: "21/09/2026",
    title: "Modalidad de Ingreso sin Costo ($0 COP) y Reordenamiento de Opciones de Liquidación",
    highlights: [
      "Opción '$0 COP (Sin Costo Inicial)' Universal: Ahora disponible en cualquier tipo de origen de lote (Compra, Nacimiento, Traslado, Compañía) para registrar animales de inventario base o sin valor de compra.",
      "Reordenamiento de Izquierda a Derecha: Las 3 opciones de liquidación se organizan de forma consistente: 1. Por Kilos (Izquierda), 2. Valor Fijo por Cabeza (Centro), 3. Sin Costo / $0 COP (Derecha / Tercera).",
      "Liquidación Fluida: Selección directa sin validación forzada de precios cuando se elige costo cero."
    ]
  },
  {
    version: "2.14.8",
    date: "21/09/2026",
    title: "Selección Individual de Sexo (Macho / Hembra) en Ingreso de Lote Completo",
    highlights: [
      "Sexo Personalizado por Bovino: En el modal de ingreso de lote, cada fila de la tabla cuenta con su propio selector de sexo (♂ Macho / ♀ Hembra) con colores distintivos de alto contraste.",
      "Soporte para Lotes Mixtos: Nueva opción '⚤ Mixto' en los datos generales del lote para registrar machos y hembras simultáneamente.",
      "Ajuste Automático de Categorías y Estados: Cada animal adapta su categoría y estado reproductivo según su sexo individual al ser guardado en el inventario.",
      "Desglose en Resumen: El resumen del lote visualiza el conteo exacto de machos y hembras ingresados."
    ]
  },
  {
    version: "2.14.7",
    date: "21/09/2026",
    title: "Reutilización Total de Cuentas y Persistencia Fluida de Sesión de Trabajador al Recargar",
    highlights: [
      "Liberación Total de Nombres y Correos: Cualquier usuario o correo previamente eliminado queda 100% disponible para ser registrado en una nueva cuenta sin bloqueos ni falsos conflictos.",
      "Persistencia de Sesión de Trabajador: Los vaqueros y trabajadores activos permanecen autenticados sin ser expulsados al recargar el navegador o actualizar la página.",
      "Validación Dinámica sin Listas Estáticas: Eliminación de bloqueos fijos en el sistema, permitiendo crear y eliminar cuentas de trabajadores de forma completamente flexible."
    ]
  },
  {
    version: "2.14.6",
    date: "21/09/2026",
    title: "Registro Global en la Nube de Cuentas Eliminadas y Bloqueo Definitivo de 'mariogomez'",
    highlights: [
      "Registro Global en Firebase de Cuentas Eliminadas: Todas las cuentas eliminadas por el administrador se inscriben en el registro en la nube de cuentas revocadas, bloqueando el acceso en todos los dispositivos y navegadores.",
      "Bloqueo y Purga Total de 'mariogomez' y 'pedro.vaquero': Eliminación irrevocable en la nube y en base de datos local Dexie con expulsión forzada al recargar la página.",
      "Sincronización Bidireccional de Lista de Trabajadores: Reconciliación en tiempo real del panel de trabajadores contra la nube Firebase, eliminando duplicados y registros fantasmas."
    ]
  },
  {
    version: "2.14.5",
    date: "21/09/2026",
    title: "Bloqueo Total y Purga Permanente de la Cuenta 'pedro.vaquero'",
    highlights: [
      "Bloqueo Absoluto de 'pedro.vaquero': Bloqueo estricto e irrevocable de cualquier intento de inicio de sesión con el usuario o correo de pedro.vaquero.",
      "Expulsión Forzada en Recarga: Detección proactiva de tokens bloqueados en la sesión activa; al recargar la página se purga el almacenamiento local y se cierra la sesión al instante.",
      "Purga Definitiva en Base de Datos: Limpieza automática en IndexedDB y memoria local en cada inicio de la aplicación para eliminar cualquier residuo de cuentas revocadas."
    ]
  },
  {
    version: "2.14.4",
    date: "21/09/2026",
    title: "Invalidación y Expulsión Inmediata de Sesiones de Trabajadores Eliminados",
    highlights: [
      "Expulsión Inmediata al Recargar: Si una cuenta de trabajador fue eliminada, al recargar la página se valida contra IndexedDB y el usuario es expulsado de inmediato sin preservar la sesión en localStorage.",
      "Sincronización Local de Estado de Eliminación: Registro automático de trabajadores eliminados en memoria para cerrar cualquier pestaña o sesión activa restante.",
      "Purga Total Garantizada: Verificación estricta en cada arranque de la app para evitar sesiones zombis o huérfanas."
    ]
  },
  {
    version: "2.14.3",
    date: "21/09/2026",
    title: "Purga Permanente y Definitiva de la Cuenta 'memo'",
    highlights: [
      "Eliminación Forzada y Total de 'memo': Limpieza y purga automática al inicio de la aplicación en IndexedDB, eliminando cualquier cuenta asociada al usuario 'memo'.",
      "Bloqueo Instantáneo en Login: El inicio de sesión con el usuario 'memo' queda 100% bloqueado y rechazado de inmediato.",
      "Cierre Inmediato de Sesión Residual: Cualquier sesión activa residual de 'memo' se invalida y cierra automáticamente."
    ]
  },
  {
    version: "2.14.2",
    date: "21/09/2026",
    title: "Blindaje de Eliminación y Bloqueo de Acceso para Vaqueros Eliminados",
    highlights: [
      "Bloqueo Absoluto de Ingreso: Los trabajadores eliminados son rechazados de inmediato en la pantalla de inicio de sesión, impidiendo cualquier acceso con usuarios eliminados.",
      "Purga Total por Nombre, Usuario y Correo: Eliminación simultánea de todas las variantes del trabajador en la base local Dexie y en la nube.",
      "Eliminación de Coincidencia por Nombre de Pantalla: El inicio de sesión valida estrictamente el correo o nombre de usuario exacto, evitando accesos accidentales por nombres de visualización.",
      "Deduplicación Automática en Base de Datos: Limpieza inmediata de registros duplicados o huérfanos al abrir el panel de trabajadores."
    ]
  },
  {
    version: "2.14.1",
    date: "21/09/2026",
    title: "Eliminación Definitiva de Cuentas y Creación Instantánea de Trabajadores",
    highlights: [
      "Eliminación Total y Permanente: Al borrar un trabajador, se purga exhaustivamente de la base de datos local y de la nube Firebase, cerrando su sesión de inmediato e impidiendo cualquier reingreso.",
      "Cero Resurrección de Cuentas: Filtrado estricto por propietario que elimina definitivamente cualquier registro fantasma o huérfano en el panel del administrador.",
      "Acceso Multi-Formato Instantáneo: Los mayordomos y vaqueros pueden iniciar sesión de forma transparente utilizando su usuario simple (ej. 'juan') o su formato completo ('juan@finca.local').",
      "Actualización Inmediata de Listas: La lista de trabajadores en el panel de administración se refresca en tiempo real al crear, modificar o eliminar cuentas de campo."
    ]
  },
  {
    version: "2.14.0",
    date: "21/09/2026",
    title: "Sincronización en Tiempo Real de Alertas y Agenda/Calendario Ganadero",
    highlights: [
      "Sincronización Total de Alertas: Todas las alertas ganaderas (partos próximos, machos listos para venta ≥480 kg, chequeos reproductivos post-servicio, posibles identificaciones duplicadas y ciclos oficiales ICA) se reflejan idénticamente en las cuentas de trabajadores y administrador.",
      "Agenda & Notas de Calendario en Tiempo Real: Las tareas, recordatorios de corral y notas de manejo creadas en el calendario se almacenan en base de datos y se sincronizan instantáneamente a través de Google Cloud Firebase en todos los dispositivos.",
      "Visualización Reactiva en Tablero: El widget de calendario y la agenda del día muestran en vivo todas las notas y tareas agregadas tanto por el patrón como por los vaqueros.",
      "Auditoría y Respaldo Completo: Inclusión de recordatorios y tareas en la bitácora de auditoría y en las copias de seguridad descargables en JSON."
    ]
  },
  {
    version: "2.13.9",
    date: "21/09/2026",
    title: "Corrección Definitiva de Esquema de Base de Datos y Restauración de Respaldos",
    highlights: [
      "Solución al UpgradeError de Claves Primarias: Corrección de claves primarias en el motor IndexedDB Dexie para permitir la apertura y restauración inmediata de archivos JSON de respaldo sin errores.",
      "Sincronización Inmediata al Importar: Carga y transmisión instantánea a la nube tras restaurar cualquier copia de seguridad.",
      "Integridad de Datos Garantizada: Tablas locales optimizadas y listas para operar a gran escala."
    ]
  },
  {
    version: "2.13.8",
    date: "21/09/2026",
    title: "Reconciliación Universal de Trabajadores y Mayordomos",
    highlights: [
      "Visibilidad Total de Vaqueros: Listado garantizado de trabajadores activos tanto desde almacenamiento local como desde la nube mediante vinculación flexible por ID y correo.",
      "Persistencia Blindada de Cuentas de Campo: Las cuentas de mayordomos y vaqueros se mantienen siempre visibles y operativas para el patrón en su panel de administración.",
      "Sincronización Transversal: Detección automática de personal de campo sin importar variaciones de identificadores locales."
    ]
  },
  {
    version: "2.13.7",
    date: "21/09/2026",
    title: "Protección Total de Datos Locales & Resiliencia de Sincronización",
    highlights: [
      "Blindaje Contra Purga Accidental: Protección permanente para que la base de datos local nunca se elimine automáticamente ante fallos o políticas de red en la nube.",
      "Reconciliación Segura: Prevención de borrado en colecciones locales ante respuestas vacías o no autorizadas del servidor.",
      "Sincronización Transparente de Vaquero: Descarga inmediata de animales y potreros del propietario una vez establecida la conexión."
    ]
  },
  {
    version: "2.13.6",
    date: "21/09/2026",
    title: "Optimización de Esquema de Almacenamiento & Soporte de Alta Escala",
    highlights: [
      "Corrección de Restricción de Índices en Base de Datos: Eliminación de restricciones de unicidad conflictivas en el motor IndexedDB local, permitiendo inicios de sesión y registros instantáneos sin bloqueos.",
      "Capacidad de Crecimiento para Grandes Hatos: Base de datos local y en la nube optimizada para manejar decenas de miles de cabezas de ganado y sincronización multi-usuario.",
      "Resiliencia de Inicio de Sesión: Mecanismo de contingencia offline/online para garantizar acceso inmediato al predio desde cualquier dispositivo."
    ]
  },
  {
    version: "2.13.5",
    date: "21/09/2026",
    title: "Auditoría Total & Detallada de Acciones (Ingresos, Ediciones, Bajas y Pesajes)",
    highlights: [
      "Detalle Exhaustivo en Bitácora: Registro pormenorizado de cada acción realizada por trabajadores y administrador con chapas, pesos, colores, lotes, procedencias y diagnósticos.",
      "Trazabilidad Completa del Ciclo Bovino: Auditoría automática en ingresos individuales y por lotes, pesajes en báscula, eliminaciones, bajas por muerte, reactivaciones, ventas y vacunas.",
      "Auditoría en Arqueos de Manga: Resumen automático de conteos de ganado, animales faltantes y novedades detectadas durante el checklist de inventario.",
      "Sincronización en la Nube con Identificadores Únicos: Historial protegido contra colisiones entre múltiples celulares y dispositivos."
    ]
  },
  {
    version: "2.13.4",
    date: "21/09/2026",
    title: "Sincronización Total Multi-Perfil & Multi-Plataforma en Tiempo Real",
    highlights: [
      "Espejado Total Administrador ⇄ Vaquero: Todas las modificaciones de animales, pesajes, lotes, potreros, vacunas y partos hechas por el administrador o vaqueros se reflejan instantáneamente en todos los perfiles.",
      "Sincronización Dinámica de Identidad del Predio: Cambios en el nombre de la finca o configuración se transmiten en vivo a todas las cuentas y dispositivos.",
      "Reconciliación Universal en 11 Colecciones: Descargas y subidas automáticas cada 10 segundos y al cambiar de ventana para mantener a todo el equipo al día."
    ]
  },
  {
    version: "2.13.3",
    date: "21/09/2026",
    title: "Vaciado & Limpieza Selectiva de Bitácora de Auditoría",
    highlights: [
      "Vaciado Completo de Bitácora en 1 Clic: El administrador puede limpiar todo el historial de movimientos operativos y eventos de trabajadores cuando lo requiera.",
      "Eliminación Selectiva de Movimientos: Opción para suprimir registros individuales de la bitácora con confirmación previa.",
      "Sincronización Inmediata en la Nube: La limpieza de la bitácora se refleja instantáneamente en Google Firebase y en todos los dispositivos conectados."
    ]
  },
  {
    version: "2.13.2",
    date: "21/09/2026",
    title: "Sincronización Directa de Hato en Perfil & Acceso Inmediato a Actualizaciones",
    highlights: [
      "Botón Permanente de Actualización y Limpieza de Caché: Visible en todo momento en Configuración > Versión y en el Perfil del Vaquero para forzar la última versión en un clic.",
      "Sincronización de Ganado en 1 Toque: Botón directo en el perfil del trabajador para descargar y conectar al instante todos los animales, pesajes y registros de la finca asignada.",
      "Descarga Automática de Hato para Mayordomos: Conexión transparente con los datos del administrador sin bloqueos de consultas locales.",
      "Auditoría y Trazabilidad en Tiempo Real: Sincronización instantánea de registros de manga y corral con Google Cloud Firebase."
    ]
  },
  {
    version: "2.13.1",
    date: "21/09/2026",
    title: "Aviso Automático de Actualización & Modo Mayordomo / Vaquero Perfeccionado",
    highlights: [
      "Aviso Automático e Instantáneo: Notificación automática en tiempo real al publicar nuevas versiones con botón de actualización en 1 clic y sonido distintivo.",
      "Confirmación Visual de Bienvenida: Mensaje automático al ingresar a la versión actualizada detallando las nuevas herramientas de campo.",
      "Gestión Directa de Mayordomos y Vaqueros: El propietario crea y administra cuentas operativas con usuario y PIN/clave personalizada.",
      "Privacidad Financiera Total: Interfaz de campo simplificada para vaqueros sin precios de compra, ventas ni utilidades.",
      "Auditoría en Tiempo Real: Registro histórico de pesajes, palpaciones y vacunas realizadas por cada trabajador con fecha exacta."
    ]
  },
  {
    version: "2.13.0",
    date: "21/09/2026",
    title: "Gestión de Mayordomos y Vaqueros (Modo Campo, Roles & Auditoría)",
    highlights: [
      "Creación Directa de Cuentas por el Administrador: El propietario de la finca crea y entrega las credenciales (usuario y PIN/clave) a sus mayordomos y vaqueros.",
      "Control de Acceso en Tiempo Real: El administrador puede habilitar o deshabilitar temporalmente el acceso del vaquero con un solo clic, o eliminar su cuenta de forma definitiva.",
      "Privacidad y Protección Financiera: Cuando el trabajador inicia sesión, la plataforma oculta automáticamente precios de compra, ventas, utilidades, liquidaciones y bloquea eliminaciones.",
      "Bitácora de Auditoría en Vivo: Registro automático y detallado de todas las acciones operativas realizadas por los trabajadores (pesajes, partos, vacunas) con nombre y fecha exacta.",
      "Sincronización en Tiempo Real: Las labores registradas en la manga o potrero suben de inmediato a la cuenta del patrón en Google Firebase."
    ]
  },
  {
    version: "2.12.18",
    date: "20/09/2026",
    title: "Sincronización Multi-Dispositivo Perfeccionada & Cero Conflictos",
    highlights: [
      "Normalización Universal de Firebase: Detección precisa de listas vacías, objetos indexados y arrays nativos para reconciliación exacta.",
      "Eliminaciones Espejadas al 100%: Si eliminas un bovino en tu celular o en una ventana, se borra de inmediato en todas las demás pestañas y dispositivos sin resucitar.",
      "Sincronización PULL Exclusiva: Las descargas en segundo plano no sobrescriben datos de otros dispositivos.",
      "Sondeo Ultra Reactivo: Detección automática en 10s y al enfocar la pantalla."
    ]
  },
  {
    version: "2.12.17",
    date: "20/09/2026",
    title: "Sincronización Multi-Dispositivo en Tiempo Real & Reconciliación Total",
    highlights: [
      "Sincronización Instantánea entre Dispositivos: Cualquier cambio, nuevo bovino, pesaje, vacuna o edición hecho en tu celular se refleja automáticamente en tu computador o tablet en segundos.",
      "Reconciliación Bidireccional Completa: Si eliminas o vendes un animal en un dispositivo, se actualiza y remueve limpiamente en todos los demás dispositivos.",
      "Sondeo Inteligente en Vivo: Detección continua cada 10 segundos y al cambiar o enfocar la pantalla para mantener tu inventario 100% sincronizado.",
      "Cero Pérdida de Datos: Sincronización protegida con Google Cloud Firebase y modo sin conexión (offline) en potrero."
    ]
  },
  {
    version: "2.12.16",
    date: "20/09/2026",
    title: "Blindaje Definitivo de Cuentas & Sincronización Bidireccional Limpia",
    highlights: [
      "Cero Resurrección de Cuentas: Eliminación permanente de sincronizaciones ciegas para evitar que dispositivos abiertos recreen cuentas borradas.",
      "Validación de Sesión con la Nube: Si una cuenta es eliminada en Firebase (o desde otro dispositivo), la app purga automáticamente la memoria local y cierra la sesión.",
      "Sincronización Inteligente: Se bloquean subidas de datos huérfanos si el usuario no existe en la nube.",
      "Liberación Total de Correos: Garantía de reutilización inmediata de cualquier correo en cuentas nuevas."
    ]
  },
  {
    version: "2.12.15",
    date: "20/09/2026",
    title: "Eliminación Total y Permanente de Cuentas & Purga Profunda",
    highlights: [
      "Eliminación Total en Cascada: Al borrar una cuenta, se eliminan todos los animales, pesajes, vacunaciones, palpaciones, finanzas y registros en Dexie (IndexedDB) y en Google Firebase.",
      "Barrido Profundo en la Nube: Purga exhaustiva de todos los nodos de usuarios y datos asociados en Firebase Realtime Database.",
      "Liberación Inmediata de Correo: El correo queda 100% libre para ser reutilizado en cualquier momento sin bloqueos ni errores de duplicidad.",
      "Reinicio Limpio de Sesión: Limpieza completa de memoria local, sesiones activas y recarga transparente."
    ]
  },
  {
    version: "2.12.14",
    date: "20/09/2026",
    title: "Prueba de Actualización en Vivo & Rendimiento Ganadero",
    highlights: [
      "Prueba de Actualización en Vivo: Verificación exitosa del sistema de aviso flotante y botón 'Actualizar Ahora'.",
      "Sincronización Instantánea: Limpieza profunda de archivos en caché y carga fresca de todas las novedades.",
      "Seguridad & Rendimiento: Protección blindada en autenticación y gestión de lotes ganaderos."
    ]
  },
  {
    version: "2.12.13",
    date: "20/09/2026",
    title: "Cambio Obligatorio de Contraseña tras Restablecimiento de Cuenta",
    highlights: [
      "Flujo de Seguridad Blindado: Al ingresar con una clave temporal regenerada o por blanqueo de acceso, el sistema bloquea la navegación con un modal obligatorio para definir la nueva contraseña personal.",
      "Validación en Tiempo Real: Comprobación de longitud mínima y confirmación exacta de la nueva clave antes de permitir el acceso al inventario ganadero.",
      "Sincronización Inmediata en la Nube: La nueva contraseña se cifra (SHA-256) y se actualiza simultáneamente en la base de datos local y en Google Cloud Firebase.",
      "Experiencia Fluida y Segura: Enlace directo para cerrar sesión si el usuario no desea cambiar la clave en ese instante."
    ]
  },
  {
    version: "2.12.12",
    date: "20/09/2026",
    title: "Correo de Bienvenida Automático & Restablecimiento / Blanqueo de Contraseña",
    highlights: [
      "Correo de Bienvenida Automático: Al crear una cuenta, el sistema envía un correo de confirmación con los datos del predio (Finca, Ganadero, Correo, Clave inicial y enlace de acceso directo).",
      "Recuperación de Contraseña Ganadera: Opción interactiva '¿Olvidaste tu contraseña?' en Login para generar una clave temporal segura enviada al correo registrado y visible en pantalla.",
      "Blanqueo Administrativo de Claves: Botón en Configuración de Perfil > Seguridad para generar y despachar nuevas claves temporales sin exponer contraseñas anteriores.",
      "Seguridad y Respaldo Permanente: Contraseñas protegidas mediante hash criptográfico SHA-256 cumpliendo la Ley 1581 de 2012 y sincronización instantánea en Google Firebase."
    ]
  },
  {
    version: "2.12.11",
    date: "20/09/2026",
    title: "Política de Privacidad y Tratamiento de Datos Personales (Ley 1581 de 2012)",
    highlights: [
      "Documento Legal Oficial Integrado: Marco de protección de datos personales y pecuarios conforme a la Ley 1581 de 2012 y Decreto 1377 de 2013 de Colombia.",
      "Acceso Directo Universal: Enlace interactivo en la pantalla de inicio de sesión, registro y en la configuración del perfil del ganadero.",
      "Garantía de Habeas Data y No Comercialización: Declaración de estricta confidencialidad pecuaria, portabilidad de datos (Excel/JSON), derecho de rectificación y supresión total."
    ]
  },
  {
    version: "2.12.10",
    date: "20/09/2026",
    title: "Restricción de Cuenta Única por Correo Electrónico (1 Correo = 1 Cuenta)",
    highlights: [
      "Índice Único en Base de Datos: Configuración de clave única (&email) en Dexie (IndexedDB) para impedir duplicidad de cuentas por correo.",
      "Blindaje en Registro & Edición: Verificación estricta en tiempo real local y en Google Firebase para rechazar intentos de registro con correos ya existentes.",
      "Trazabilidad de Perfil: Validación de disponibilidad al actualizar correo electrónico en la configuración de la cuenta."
    ]
  },
  {
    version: "2.12.9",
    date: "20/09/2026",
    title: "Sincronización Multi-Dispositivo Permanente en Google Cloud (Firebase)",
    highlights: [
      "Autenticación Centralizada en la Nube: Inicia sesión con tu correo y contraseña desde cualquier celular, tablet o computador sin límites.",
      "Sincronización Total Automática: Descarga inmediata de tu inventario de ganado, pesajes, vacunaciones, chequeos y finanzas en cualquier dispositivo nuevo.",
      "Persistencia de Datos en Google Firebase Realtime Database: Cero límites de peticiones y disponibilidad 24/7 en tiempo real."
    ]
  },
  {
    version: "2.12.8",
    date: "19/09/2026",
    title: "Corrección y Blindaje de Base de Datos: Operaciones Idempotentes (bulkPut)",
    highlights: [
      "Solución de ConstraintError: Migración de todas las inserciones masivas e individuales (`bulkAdd`/`add`) a operaciones seguras idempotentes (`bulkPut`/`put`).",
      "Cero Conflictos de Llaves: Previene bloqueos por colisión de identificadores o registros preexistentes al importar respaldos, cargar datos de demostración o registrar lotes."
    ]
  },
  {
    version: "2.12.7",
    date: "19/09/2026",
    title: "Actualización Integral de Guía de Métricas & Glosario Ganadero",
    highlights: [
      "Nuevos Conceptos Reproductivos: Inclusión de fórmulas de palpación rápida, tasa de preñez, días de gestación, intervalos entre chequeos ginecológicos y multiselección de estados en hembras.",
      "Sanidad Oficial & Censo ICA: Explicación de ciclos FEDEGAN-ICA, categorías poblacionales, RUV y biológicos obligatorios/preventivos.",
      "Manejo, Arqueo & Trazabilidad: Guías de auditoría en corral, distinción nacidos vs comprados, costo $0 en crías y control de consecutivos.",
      "Finanzas & Prorrateo de Lotes: Fórmulas de distribución de fletes, guías y gastos de compra por cabeza y valoración patrimonial."
    ]
  },
  {
    version: "2.12.6",
    date: "19/09/2026",
    title: "Retiro Total del Botón de WhatsApp en la Vista de Palpación",
    highlights: [
      "Eliminación de WhatsApp en Palpación: Se removió el botón 'Reporte WhatsApp' del encabezado superior de la jornada de palpación para mantener la cabecera limpia y enfocada en 'Guardar Todo' y 'Reiniciar Jornada'.",
      "Consistencia de Interfaz: Interfaz despejada y directa para el trabajo en manga y corral."
    ]
  },
  {
    version: "2.12.5",
    date: "19/09/2026",
    title: "Estabilización de Actualizaciones, ErrorBoundary & PWA Network-First",
    highlights: [
      "Protección Total contra Pantalla Negra: Integración de ErrorBoundary y cargador visual de arranque que previene cualquier bloqueo de interfaz al actualizar.",
      "PWA Network-First: El Service Worker prioriza la descarga fresca de código al estar en línea y activa el respaldo seguro en caché al estar fuera de cobertura.",
      "Recarga Inteligente y Limpieza de Memoria: El proceso de actualización limpia registros residuales y refresca la aplicación de forma transparente e instantánea."
    ]
  },
  {
    version: "2.12.4",
    date: "19/09/2026",
    title: "Limpieza de Barra Inferior: Reporte WhatsApp Exclusivo en Panel Superior",
    highlights: [
      "Barra Inferior Simplificada: Se removió el botón redundante de WhatsApp de la barra flotante inferior, dejando únicamente las acciones clave de campo ('Reiniciar' y 'Guardar Todo').",
      "Ubicación Única de WhatsApp: El acceso al envío y generación de reportes ginecológicos por WhatsApp queda ubicado de forma exclusiva y destacada en el banner superior."
    ]
  },
  {
    version: "2.12.3",
    date: "19/09/2026",
    title: "Historial de Chequeo Anterior, Días de Preñez & Días Transcurridos en Palpación",
    highlights: [
      "Chequeo Anterior en Cada Hembra: Muestra en tiempo real la fecha del último examen ginecológico, el diagnóstico previo, los días de preñez que tenía, condición corporal, evaluador y hallazgos.",
      "Días Transcurridos Entre Chequeos: Cálculo dinámico de la cantidad de días transcurridos entre la fecha del último chequeo y la fecha de la jornada actual.",
      "Proyección Inteligente en 1 Clic: Botón inteligente 'Proyectar a ~X días' que suma automáticamente los días transcurridos a los días de preñez previos.",
      "Indicador de Primer Chequeo: Mensaje claro y limpio si la hembra está siendo evaluada por primera vez."
    ]
  },
  {
    version: "2.12.2",
    date: "19/09/2026",
    title: "Botón de Reinicio y Limpieza de Jornada de Palpación Ampliado",
    highlights: [
      "Botón Superior Destacado: El botón de 'Reiniciar Jornada' ahora es más grande, claramente visible y cuenta con texto explicativo.",
      "Acceso en Barra Inferior Flotante: Se integró el botón 'Reiniciar' en la barra inferior persistente junto a WhatsApp y Guardar Todo para máxima comodidad en el corral."
    ]
  },
  {
    version: "2.12.1",
    date: "19/09/2026",
    title: "Ajuste Visual de Barra Superior & Botón de Palpación en Tablero",
    highlights: [
      "Barra Superior Equilibrada: Etiquetas de navegación limpias y compactas que evitan el apiñamiento y mantienen la armonía con la identidad de la finca.",
      "Acceso Rápido en Tablero: Incorporación del botón destacado '🩺 Palpación Rápida' en el banner del panel principal junto a Báscula, Vacunación y Arqueo."
    ]
  },
  {
    version: "2.12.0",
    date: "19/09/2026",
    title: "Módulo de Palpación Rápida & Diagnóstico Reproductivo de Hembras",
    highlights: [
      "Jornada Veterinaria de Manga y Corral: Nuevo módulo ultrarrápido (estilo Báscula y Checklist) exclusivo para hembras activas, optimizado para campo y trabajo táctil.",
      "Diagnóstico Ágil de Preñez y Vacías: Registro en 1 toque de estado (Preñada, Vacía, Dudosa), botones rápidos de meses (1m a 8m), entrada libre de días y cálculo en vivo de fecha de parto y alertas.",
      "Hallazgos Ginecológicos Clínicos: Registro de cuerno derecho/izquierdo, cuerpo lúteo (CL), feto viable, ovarios estáticos/anestro, quistes, aptitud para IA/monta y protocolos IATF.",
      "Borrador Seguro & Reportes WhatsApp: Guardado automático en memoria local contra pérdidas de señal, reporte clínico instantáneo por WhatsApp al dueño o veterinario y sincronización total en la nube."
    ]
  },
  {
    version: "2.11.5",
    date: "19/09/2026",
    title: "Multiselección de Estados Productivos en Hembras & Registro Simultáneo",
    highlights: [
      "Selección Múltiple de Estados: Ahora las hembras pueden tener simultáneamente más de un estado productivo (por ejemplo, 'Producción de leche' + 'Gestación', o 'Levante de cría' + 'Gestación').",
      "Formularios Dinámicos Simultáneos: Al seleccionar varios estados, se abren en tiempo real todos los módulos correspondientes para diligenciar la información de cada uno (Control de Gestación, Control Lechero, etc.) en un solo paso.",
      "Reglas Inteligentes de Compatibilidad: Alternancia y exclusión lógica entre preñada y vacía, manteniendo la coherencia de los datos.",
      "Insignias y Filtros Multiestado: En el inventario, fichas y vista de hembras se muestran todas las insignias activas y el animal participa de forma dinámica en cada sección y reporte correspondiente."
    ]
  },
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
 * Compara dos versiones semánticas (ej. "2.12.12" vs "2.12.11")
 * Retorna true únicamente si remoteVer es estrictamente superior a currentVer
 */
export function isVersionGreater(remoteVer, currentVer) {
  if (!remoteVer || !currentVer) return false;
  const clean = v => String(v).replace(/^v/i, '').trim();
  if (clean(remoteVer) === clean(currentVer)) return false;
  
  const rParts = clean(remoteVer).split('.').map(n => parseInt(n, 10) || 0);
  const cParts = clean(currentVer).split('.').map(n => parseInt(n, 10) || 0);
  
  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

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
    const remoteVer = remote.version || CURRENT_APP_VERSION;
    const hasNewVersion = remoteVer !== CURRENT_APP_VERSION || isVersionGreater(remoteVer, CURRENT_APP_VERSION);

    return {
      hasUpdate: hasNewVersion,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: remoteVer,
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

    // 3. Limpiar almacenamiento de sesión temporal
    try {
      sessionStorage.clear();
    } catch (e) {}

    // 4. Recargar limpiamente forzando petición fresca
    const cleanUrl = window.location.origin + window.location.pathname + '?_v=' + Date.now();
    window.location.replace(cleanUrl);
  } catch (e) {
    console.warn('Error limpiando caché:', e);
    window.location.replace(window.location.origin + window.location.pathname + '?_v=' + Date.now());
  }
}
