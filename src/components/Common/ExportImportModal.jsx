import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  Filter,
  Layers,
  Target,
  Sparkles
} from 'lucide-react';
import { exportBackupData, importBackupData, loadSampleData, clearAllData, db } from '../../services/db';
import { calculateWeightMetrics, calculateFinancials, formatNumber, formatDate } from '../../services/calculations';
import { buildBatchComparisonWorksheet } from '../../services/batchExcelService';
import { useAuth } from '../../context/AuthContext';
import XLSX from 'xlsx-js-style';

export function ExportImportModal({ isOpen, onClose, onDataChanged }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Filtros interactivos para Excel
  const [availableBatches, setAvailableBatches] = useState([]);
  const [exportBatch, setExportBatch] = useState('all');
  const [exportStatus, setExportStatus] = useState('all'); // 'all' | 'Activo' | 'Vendido' | 'ready480'
  const [splitByBatch, setSplitByBatch] = useState(true);

  const userId = currentUser?.id;

  useEffect(() => {
    if (!isOpen) return;
    async function loadBatches() {
      try {
        const cattle = userId ? await db.cattle.where('userId').equals(userId).toArray() : await db.cattle.toArray();
        const batchesSet = new Set();
        cattle.forEach(c => {
          const b = c.entryBatch || c.paddock;
          if (b && String(b).trim()) batchesSet.add(String(b).trim());
        });
        setAvailableBatches(Array.from(batchesSet));
      } catch (e) {
        console.warn('Error cargando lotes:', e);
      }
    }
    loadBatches();
  }, [isOpen, userId]);

  const handleClearAll = async () => {
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas ELIMINAR TODOS los animales de ${currentUser?.farmName || 'tu finca'} para comenzar en CEROS?\n\nEsta acción no se puede deshacer (te recomendamos descargar un respaldo antes).`)) {
      try {
        setLoading(true);
        await clearAllData(userId);
        setMessage({ type: 'success', text: '¡Inventario de tu finca limpiado por completo! Ahora estás en ceros para ingresar tu ganado.' });
        if (onDataChanged) onDataChanged();
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al limpiar datos: ' + err.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportJSON = async () => {
    try {
      setLoading(true);
      await exportBackupData(userId, currentUser);
      setMessage({ type: 'success', text: 'Copia de seguridad JSON descargada correctamente.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al exportar: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-ajuste de ancho de columnas para que las celdas no se corten
  const calculateColumnWidths = (dataRows) => {
    if (!dataRows || dataRows.length === 0) return [];
    const headers = Object.keys(dataRows[0]);
    return headers.map(header => {
      let maxLen = header.length;
      dataRows.forEach(row => {
        const val = row[header];
        if (val !== null && val !== undefined) {
          const str = String(val);
          if (str.length > maxLen) maxLen = str.length;
        }
      });
      // Margen generoso para que nada quede apretado ni cortado en Excel
      return { wch: Math.min(50, Math.max(maxLen + 4, 12)) };
    });
  };

  // Aplicar bordes negros bien definidos, estilos de encabezado, filas destacadas de vendidos y totales
  const applyTableStyles = (ws, isPesajesSheet = false, sheetData = null) => {
    if (!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    const blackBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const headerBorder = {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const totalBorder = {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'double', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const isHeader = R === 0;
      const isTotalRow = !isPesajesSheet && R === range.e.r && range.e.r > 1;
      const isEvenRow = R % 2 === 0;

      const rowItem = (!isHeader && !isTotalRow && sheetData) ? sheetData[R - 1] : null;
      const isSoldRow = rowItem && (rowItem['Estado'] === 'Vendido');
      const isDeadRow = rowItem && (rowItem['Estado'] === 'Muerto');

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }
        const cell = ws[cellAddress];

        if (isHeader) {
          cell.s = {
            fill: { fgColor: { rgb: '065F46' } }, // Verde esmeralda oscuro
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: headerBorder,
          };
        } else if (isTotalRow) {
          cell.s = {
            fill: { fgColor: { rgb: 'D1FAE5' } }, // Verde claro de totales
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '064E3B' } },
            alignment: {
              horizontal: C === 0 ? 'left' : (typeof cell.v === 'number' ? 'right' : 'center'),
              vertical: 'center'
            },
            border: totalBorder,
          };
        } else if (isSoldRow) {
          // FILA COMPLETA DE ANIMAL VENDIDO EN COLOR ÁMBAR / DORADO DISTINTIVO
          cell.s = {
            fill: { fgColor: { rgb: 'FEF3C7' } }, // Ámbar suave (Yellow/Amber 100)
            font: { name: 'Calibri', sz: 10, color: { rgb: '78350F' }, bold: C === 0 || C === 9 },
            alignment: {
              horizontal: typeof cell.v === 'number' ? 'right' : (String(cell.v).includes('-') || String(cell.v).length <= 10 ? 'center' : 'left'),
              vertical: 'center'
            },
            border: blackBorder,
          };
        } else if (isDeadRow) {
          // FILA COMPLETA DE ANIMAL MUERTO EN COLOR ROSA SUAVE
          cell.s = {
            fill: { fgColor: { rgb: 'FEE2E2' } }, // Rosa suave (Red 100)
            font: { name: 'Calibri', sz: 10, color: { rgb: '991B1B' } },
            alignment: {
              horizontal: typeof cell.v === 'number' ? 'right' : (String(cell.v).includes('-') || String(cell.v).length <= 10 ? 'center' : 'left'),
              vertical: 'center'
            },
            border: blackBorder,
          };
        } else {
          // FILAS NORMALES (ACTIVOS / EN FINCA)
          cell.s = {
            fill: isEvenRow ? { fgColor: { rgb: 'F8FAFC' } } : { fgColor: { rgb: 'FFFFFF' } },
            font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' }, bold: C === 0 },
            alignment: {
              horizontal: typeof cell.v === 'number' ? 'right' : (String(cell.v).includes('-') || String(cell.v).length <= 10 ? 'center' : 'left'),
              vertical: 'center'
            },
            border: blackBorder,
          };
        }
      }
    }
  };

  // Función constructora de fila de datos Excel
  const buildExcelRow = (c, weighings) => {
    const animalWeighs = weighings.filter(w => w.cattleId === String(c.id) || w.cattleId === c.id);
    const wm = calculateWeightMetrics(c, animalWeighs);
    const fin = calculateFinancials(c);

    return {
      'Número Chapa / Arete': c.tagNumber,
      'Nombre': c.name || '',
      'Lote / Ingreso #': c.entryBatch || c.paddock || 'Ingreso #1',
      'Hierro / Marca': c.ironBrand || '',
      'Propietario / Dueño': c.owner || '',
      'Sexo': c.sex,
      'Raza': c.breed || '',
      'Categoría': c.category || '',
      'Tipo de Producción': c.productionType || '',
      'Estado': c.status || 'Activo',
      'Fecha Entrada': c.entryDate ? formatDate(c.entryDate) : '',
      'Días en Finca': Number(wm.totalDays),
      'Peso Entrada (kg)': c.entryWeight ? Number(parseFloat(c.entryWeight).toFixed(1)) : 0,
      'Peso Actual (kg)': Number(parseFloat(wm.currentWeight).toFixed(1)),
      'Ganancia Total (+kg)': Number(parseFloat(wm.totalGain).toFixed(1)),
      'GDP Promedio (kg/día)': Number(parseFloat(wm.overallGdp).toFixed(3)),
      'Semáforo GDP': wm.performance?.label || '',
      'Meta 480 kg (Estado)': wm.cebaProjection?.isReady ? '🎯 Listo Venta (≥ 480 kg)' : 'En Ceba',
      'Avance a Meta (%)': wm.cebaProjection ? Number(wm.cebaProjection.progressPercentage.toFixed(1)) : 0,
      'Faltan para Meta (kg)': wm.cebaProjection ? Number(wm.cebaProjection.remainingKg.toFixed(1)) : 0,
      'Días Est. a Meta': wm.cebaProjection?.daysToTarget ? Number(wm.cebaProjection.daysToTarget) : '',
      'Fecha Est. Salida': wm.cebaProjection?.estimatedDate ? formatDate(wm.cebaProjection.estimatedDate) : '',
      'Estado Reproductivo': c.reproductiveStatus || 'N/A',
      'Fecha de Servicio': c.serviceDate ? formatDate(c.serviceDate) : '',
      'Producción Leche': c.milkingStatus || 'N/A',
      'Litros / Día': c.dailyMilkLiters ? Number(parseFloat(c.dailyMilkLiters).toFixed(1)) : 0,
      'Es Solo Cría': c.isBreedingOnly ? 'Sí' : 'No',
      'Valor Compra ($ COP)': c.entryPrice ? Number(parseFloat(c.entryPrice).toFixed(0)) : 0,
      'Costos Adicionales ($ COP)': c.additionalCosts ? Number(parseFloat(c.additionalCosts).toFixed(0)) : 0,
      'Inversión Total ($ COP)': Number(parseFloat(fin.totalInvested).toFixed(0)),
      'Valor Estimado / Venta ($ COP)': fin.isSold ? Number(parseFloat(c.exitPrice || 0).toFixed(0)) : Number(parseFloat(fin.totalInvested + fin.netProfit).toFixed(0)),
      'Utilidad Neta ($ COP)': Number(parseFloat(fin.netProfit).toFixed(0)),
      'Rentabilidad ROI (%)': Number(parseFloat(fin.roi).toFixed(1)),
      'Fecha de Salida': c.exitDate ? formatDate(c.exitDate) : '',
      'Peso Salida (kg)': c.exitWeight ? Number(parseFloat(c.exitWeight).toFixed(1)) : '',
      'Comprador / Destino': c.buyer || '',
      'Observaciones / Notas': c.notes || '',
      _rawAnimal: c,
      _rawWm: wm
    };
  };

  // Función constructora de fila de Totales y Promedios con desglose de Activos y Vendidos
  const buildTotalsRow = (rows, label = 'TOTALES / PROMEDIOS') => {
    if (!rows || rows.length === 0) return null;
    const count = rows.length;
    const activeCount = rows.filter(r => r['Estado'] === 'Activo').length;
    const soldCount = rows.filter(r => r['Estado'] === 'Vendido').length;
    const deadCount = rows.filter(r => r['Estado'] === 'Muerto').length;

    const totalWeight = rows.reduce((acc, r) => acc + (parseFloat(r['Peso Actual (kg)']) || 0), 0);
    const totalGain = rows.reduce((acc, r) => acc + (parseFloat(r['Ganancia Total (+kg)']) || 0), 0);
    const gdpValues = rows.map(r => parseFloat(r['GDP Promedio (kg/día)'])).filter(v => v > 0);
    const avgGdp = gdpValues.length > 0 ? (gdpValues.reduce((a, b) => a + b, 0) / gdpValues.length) : 0;
    const totalInvested = rows.reduce((acc, r) => acc + (parseFloat(r['Inversión Total ($ COP)']) || 0), 0);
    const totalValue = rows.reduce((acc, r) => acc + (parseFloat(r['Valor Estimado / Venta ($ COP)']) || 0), 0);
    const totalProfit = rows.reduce((acc, r) => acc + (parseFloat(r['Utilidad Neta ($ COP)']) || 0), 0);
    const avgRoi = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

    return {
      'Número Chapa / Arete': `📊 ${label} (${count} cabezas: ${activeCount} en finca | ${soldCount} vendidas)`,
      'Nombre': `🟢 ${activeCount} activas en finca`,
      'Lote / Ingreso #': `🏷️ ${soldCount} vendidas`,
      'Hierro / Marca': deadCount > 0 ? `💀 ${deadCount} bajas` : '',
      'Propietario / Dueño': '',
      'Sexo': '',
      'Raza': '',
      'Categoría': '',
      'Tipo de Producción': '',
      'Estado': `🟢 ${activeCount} en finca • 🏷️ ${soldCount} vendidas`,
      'Fecha Entrada': '',
      'Días en Finca': '',
      'Peso Entrada (kg)': '',
      'Peso Actual (kg)': Number(totalWeight.toFixed(1)),
      'Ganancia Total (+kg)': Number(totalGain.toFixed(1)),
      'GDP Promedio (kg/día)': Number(avgGdp.toFixed(3)),
      'Semáforo GDP': avgGdp >= 0.75 ? '🚀 Excelente' : avgGdp >= 0.37 ? '⚡ Aceptable' : '⚠️ Bajo',
      'Meta 480 kg (Estado)': '',
      'Avance a Meta (%)': '',
      'Faltan para Meta (kg)': '',
      'Días Est. a Meta': '',
      'Fecha Est. Salida': '',
      'Estado Reproductivo': '',
      'Fecha de Servicio': '',
      'Producción Leche': '',
      'Litros / Día': '',
      'Es Solo Cría': '',
      'Valor Compra ($ COP)': '',
      'Costos Adicionales ($ COP)': '',
      'Inversión Total ($ COP)': Number(totalInvested.toFixed(0)),
      'Valor Estimado / Venta ($ COP)': Number(totalValue.toFixed(0)),
      'Utilidad Neta ($ COP)': Number(totalProfit.toFixed(0)),
      'Rentabilidad ROI (%)': Number(avgRoi.toFixed(1)),
      'Fecha de Salida': '',
      'Peso Salida (kg)': '',
      'Comprador / Destino': '',
      'Observaciones / Notas': ''
    };
  };

  const sanitizeSheetName = (name) => {
    return String(name || 'Lote')
      .replace(/[\\\/\?\*\:\[\]]/g, '')
      .trim()
      .slice(0, 31);
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const allCattle = userId ? await db.cattle.where('userId').equals(userId).toArray() : await db.cattle.toArray();
      const weighings = userId ? await db.weighings.where('userId').equals(userId).toArray() : await db.weighings.toArray();

      if (allCattle.length === 0) {
        setMessage({ type: 'error', text: 'No hay animales en el inventario para exportar a Excel.' });
        return;
      }

      // Procesar todos los animales
      const allProcessedRows = allCattle.map(c => buildExcelRow(c, weighings));

      // Filtrar según selección de usuario
      let filteredRows = allProcessedRows.filter(row => {
        // Filtro Lote
        if (exportBatch !== 'all') {
          const rowBatch = row['Lote / Ingreso #'];
          if (rowBatch !== exportBatch) return false;
        }

        // Filtro Estado
        if (exportStatus === 'Activo' && row['Estado'] !== 'Activo') return false;
        if (exportStatus === 'Vendido' && row['Estado'] !== 'Vendido') return false;
        if (exportStatus === 'ready480') {
          const currentWeight = parseFloat(row['Peso Actual (kg)']) || 0;
          if (row['Estado'] !== 'Activo' || currentWeight < 480) return false;
        }

        return true;
      });

      if (filteredRows.length === 0) {
        setMessage({ type: 'error', text: 'No se encontraron animales con los filtros seleccionados para exportar.' });
        return;
      }

      // Ordenar para mostrar prioritariamente los ganados Activos (en finca), luego Vendidos y Muertos
      filteredRows.sort((a, b) => {
        const statusOrder = { 'Activo': 1, 'Vendido': 2, 'Muerto': 3 };
        const orderA = statusOrder[a['Estado']] || 99;
        const orderB = statusOrder[b['Estado']] || 99;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a['Número Chapa / Arete'] || '').localeCompare(b['Número Chapa / Arete'] || '', undefined, { numeric: true });
      });

      const wb = XLSX.utils.book_new();

      // Limpiar propiedades internas antes de agregar a la hoja
      const cleanRows = (rows) => rows.map(({ _rawAnimal, _rawWm, ...rest }) => rest);

      // 1. Hoja Principal / Filtrada
      const mainSheetData = cleanRows(filteredRows);
      const mainTotals = buildTotalsRow(mainSheetData, 'RESUMEN GENERAL');
      if (mainTotals) mainSheetData.push(mainTotals);

      const mainSheetName = exportBatch !== 'all' 
        ? sanitizeSheetName(exportBatch) 
        : (exportStatus === 'ready480' ? 'Listos Venta ≥ 480kg' : 'Inventario General');
      
      const wsMain = XLSX.utils.json_to_sheet(mainSheetData);
      wsMain['!cols'] = calculateColumnWidths(mainSheetData);
      if (wsMain['!ref']) wsMain['!autofilter'] = { ref: wsMain['!ref'] };
      applyTableStyles(wsMain, false, mainSheetData);
      XLSX.utils.book_append_sheet(wb, wsMain, mainSheetName);

      // 2. NUEVA PESTAÑA: Comparativa Ejecutiva de Lotes & Gráficas de Rendimiento
      if (exportBatch === 'all') {
        const wsComparison = buildBatchComparisonWorksheet(
          filteredRows.map(r => r._rawAnimal),
          weighings,
          currentUser?.farmName || 'Finca Ganadera'
        );
        if (wsComparison) {
          XLSX.utils.book_append_sheet(wb, wsComparison, '⚖️ Comparativa de Lotes');
        }
      }

      // 3. Si se activó "Separar en pestañas por Lote" (y no se filtró un solo lote)
      if (splitByBatch && exportBatch === 'all') {
        // Obtener lotes únicos presentes en los datos
        const batchesInFiltered = Array.from(new Set(filteredRows.map(r => r['Lote / Ingreso #'])));
        
        batchesInFiltered.forEach(batchName => {
          const batchRows = filteredRows.filter(r => r['Lote / Ingreso #'] === batchName);
          if (batchRows.length > 0) {
            const batchSheetData = cleanRows(batchRows);
            const batchTotals = buildTotalsRow(batchSheetData, `TOTAL ${batchName}`);
            if (batchTotals) batchSheetData.push(batchTotals);

            let sheetTitle = sanitizeSheetName(batchName);
            // Evitar colisión de nombres
            if (wb.SheetNames.includes(sheetTitle)) {
              sheetTitle = sanitizeSheetName(`${sheetTitle}_1`);
            }
            const wsBatch = XLSX.utils.json_to_sheet(batchSheetData);
            wsBatch['!cols'] = calculateColumnWidths(batchSheetData);
            if (wsBatch['!ref']) wsBatch['!autofilter'] = { ref: wsBatch['!ref'] };
            applyTableStyles(wsBatch, false, batchSheetData);
            XLSX.utils.book_append_sheet(wb, wsBatch, sheetTitle);
          }
        });

        // 3. Pestaña dedicada a 🎯 Listos para Venta (≥ 480 kg) si hay alguno
        const readyRows = filteredRows.filter(r => r['Estado'] === 'Activo' && (parseFloat(r['Peso Actual (kg)']) || 0) >= 480);
        if (readyRows.length > 0 && exportStatus !== 'ready480') {
          const readySheetData = cleanRows(readyRows);
          const readyTotals = buildTotalsRow(readySheetData, 'TOTAL LISTOS VENTA');
          if (readyTotals) readySheetData.push(readyTotals);

          const wsReady = XLSX.utils.json_to_sheet(readySheetData);
          wsReady['!cols'] = calculateColumnWidths(readySheetData);
          if (wsReady['!ref']) wsReady['!autofilter'] = { ref: wsReady['!ref'] };
          applyTableStyles(wsReady, false, readySheetData);
          XLSX.utils.book_append_sheet(wb, wsReady, '🎯 Listos Venta (≥480kg)');
        }
      }

      // 4. Pestaña Historial de Pesajes Formateada
      const relevantCattleIds = new Set(filteredRows.map(r => String(r._rawAnimal.id)));
      const filteredWeighings = weighings.filter(w => relevantCattleIds.has(String(w.cattleId)));
      if (filteredWeighings.length > 0) {
        const formattedWeighings = filteredWeighings.map(w => {
          const animal = allCattle.find(c => String(c.id) === String(w.cattleId)) || {};
          return {
            'Número Chapa / Arete': animal.tagNumber || 'N/A',
            'Nombre Bovino': animal.name || '',
            'Lote / Ingreso #': animal.entryBatch || animal.paddock || 'Ingreso #1',
            'Hierro / Marca': animal.ironBrand || '',
            'Sexo': animal.sex || '',
            'Raza': animal.breed || '',
            'Fecha del Pesaje': w.date ? formatDate(w.date) : '',
            'Peso Registrado (kg)': Number((parseFloat(w.weight) || 0).toFixed(1)),
            'Condición Corporal (1-5)': w.conditionScore ? Number(w.conditionScore) : '',
            'Observaciones / Notas': w.notes || ''
          };
        });

        const wsPesajes = XLSX.utils.json_to_sheet(formattedWeighings);
        wsPesajes['!cols'] = calculateColumnWidths(formattedWeighings);
        if (wsPesajes['!ref']) wsPesajes['!autofilter'] = { ref: wsPesajes['!ref'] };
        applyTableStyles(wsPesajes, true, formattedWeighings);
        XLSX.utils.book_append_sheet(wb, wsPesajes, "Historial Pesajes");
      }

      const cleanFarm = (currentUser?.farmName || "Finca").replace(/[^a-zA-Z0-9]/g, '_');
      const filterSuffix = exportBatch !== 'all' ? `_${sanitizeSheetName(exportBatch)}` : '';
      XLSX.writeFile(wb, `Inventario_${cleanFarm}${filterSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      setMessage({ type: 'success', text: `¡Excel profesional generado exitosamente con ${filteredRows.length} animales, bordes definidos y subtotales!` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Error generando Excel: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const result = await importBackupData(evt.target.result, userId);
        if (result.success) {
          setMessage({ type: 'success', text: result.message });
          if (onDataChanged) onDataChanged();
        } else {
          setMessage({ type: 'error', text: result.message });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al leer el archivo: ' + err.message });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = async () => {
    if (window.confirm('¿Cargar datos de ejemplo/demostración para ver cómo funciona el sistema?')) {
      setLoading(true);
      await loadSampleData(userId);
      setMessage({ type: 'success', text: 'Datos de ejemplo cargados correctamente en tu cuenta.' });
      if (onDataChanged) onDataChanged();
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestión & Exportación • ${currentUser?.farmName || 'Mi Finca'}`} subtitle="Descarga reportes Excel segmentados por lote, respaldos JSON o administra datos" maxWidth="max-w-3xl">
      {message && (
        <div className={`p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-xs sm:text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* SECCIÓN DESTACADA: EXPORTACIÓN INTELIGENTE A EXCEL CON FILTROS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md space-y-4">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                Exportar Reporte a Microsoft Excel (.xlsx)
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase border border-emerald-400/40">
                  Por Lotes & Ceba
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Genera un libro Excel profesional con <b>Pestaña de Comparativa Ejecutiva de Lotes & Gráficas de Rendimiento</b>, hojas individuales por lote, GDP, semáforo y subtotales contables.
              </p>
            </div>
          </div>
        </div>

        {/* Panel de Filtros Interactivos */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Opciones y Segmentación de Descarga:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Selector de Lote / Ingreso */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lote / Ingreso # a Exportar:
              </label>
              <select
                value={exportBatch}
                onChange={(e) => setExportBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">📁 Todos los Lotes ({availableBatches.length} lotes)</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>🏷️ {b}</option>
                ))}
              </select>
            </div>

            {/* Selector de Estado / Ceba */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estado / Grupo de Animales:
              </label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">Todos los Animales (Activos y Vendidos)</option>
                <option value="Activo">🟢 Solo Activos en Finca</option>
                <option value="ready480">🎯 Solo Listos para Venta (≥ 480 kg)</option>
                <option value="Vendido">🏷️ Solo Vendidos / Historial</option>
              </select>
            </div>
          </div>

          {/* Opción Multi-Pestaña */}
          {exportBatch === 'all' && (
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={splitByBatch}
                onChange={(e) => setSplitByBatch(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Crear pestañas (hojas) independientes por cada Lote con subtotales y promedios
              </span>
            </label>
          )}
        </div>

        {/* Botón de Descarga Excel */}
        <button
          onClick={handleExportExcel}
          disabled={loading}
          className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 text-sm cursor-pointer"
        >
          <Download className="w-5 h-5" /> Descargar Archivo Excel Personalizado (.xlsx)
        </button>
      </div>

      {/* Otras Opciones: Respaldos JSON y Limpieza */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Respaldo JSON */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Respaldo Completo (JSON)</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Guarda una copia exacta de tu finca para guardar en tu celular o PC.</p>
          </div>
          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Descargar JSON
          </button>
        </div>

        {/* Importar JSON */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Restaurar Respaldo</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Carga un archivo JSON previamente descargado para restaurar tu hato.</p>
          </div>
          <label className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer text-center text-xs">
            <Upload className="w-3.5 h-3.5" /> Subir Archivo JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        {/* Datos Demo */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Datos de Demostración</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Carga animales de ejemplo para probar cálculos y reportes.</p>
          </div>
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Cargar Demo
          </button>
        </div>
      </div>

      {/* Botón Peligro: Limpiar Todo a Ceros */}
      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            Limpiar Inventario de Mi Finca (Comenzar en Ceros)
          </h4>
          <p className="text-[11px] text-rose-600 dark:text-rose-400/80">
            Borra los datos de prueba o inventario actual para empezar desde ceros.
          </p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap shadow transition"
        >
          Limpiar a Ceros
        </button>
      </div>

    </Modal>
  );
}

