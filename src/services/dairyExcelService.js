import XLSX from 'xlsx-js-style';
import { formatDate, formatCurrency, formatNumber, calculateDaysInMilk, calculateLactationCurve, calculateHerdMilkMetrics } from './calculations';

/**
 * Estilos estándar contables y de encabezado verde esmeralda
 */
const BORDER_BLACK = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const BORDER_DOUBLE_BOTTOM = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'double', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
  fill: { fgColor: { rgb: '065F46' } }, // Esmeralda Oscuro
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_BLACK,
};

const SUBHEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10, name: 'Calibri' },
  fill: { fgColor: { rgb: '047857' } }, // Esmeralda Medio
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_BLACK,
};

const TITLE_STYLE = {
  font: { bold: true, color: { rgb: '065F46' }, sz: 16, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const META_STYLE = {
  font: { italic: true, color: { rgb: '475569' }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const CELL_STYLE = {
  font: { color: { rgb: '0F172A' }, sz: 10, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: BORDER_BLACK,
};

const CELL_CENTER = {
  ...CELL_STYLE,
  alignment: { horizontal: 'center', vertical: 'center' },
};

const CELL_NUM = {
  ...CELL_STYLE,
  alignment: { horizontal: 'right', vertical: 'center' },
};

const TOTAL_STYLE = {
  font: { bold: true, color: { rgb: '065F46' }, sz: 11, name: 'Calibri' },
  fill: { fgColor: { rgb: 'ECFDF5' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: BORDER_DOUBLE_BOTTOM,
};

/**
 * Genera y descarga el libro Excel completo de Control Lechero y Tanque
 */
export function exportDairyReportToExcel({
  cattle = [],
  milkRecords = [],
  milkDeliveries = [],
  farmName = 'Finca Ganadera',
  selectedDate = new Date().toISOString().split('T')[0]
}) {
  const wb = XLSX.utils.book_new();

  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  const metrics = calculateHerdMilkMetrics(cattle, milkRecords, milkDeliveries, selectedDate);

  // ==================== HOJA 1: PLANILLA DE CONTROL LECHERO ====================
  const wsData1 = [
    [{ v: `🥛 PLANILLA DE CONTROL LECHERO • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
    [{ v: `Fecha de Pesaje: ${formatDate(selectedDate)} | Generado: ${formatDate(new Date())}`, s: META_STYLE }],
    [{ v: `Producción Día: ${metrics.todayTotalLiters} L (AM: ${metrics.todayAmLiters} L / PM: ${metrics.todayPmLiters} L) | Promedio: ${metrics.avgPerMilkingCow} L/vaca`, s: META_STYLE }],
    [],
    [
      { v: 'Chapa / ID', s: HEADER_STYLE },
      { v: 'Nombre Bovina', s: HEADER_STYLE },
      { v: 'Lote / Potrero', s: HEADER_STYLE },
      { v: 'Días en Leche (DEL)', s: HEADER_STYLE },
      { v: 'Ordeño AM (L)', s: HEADER_STYLE },
      { v: 'Ordeño PM (L)', s: HEADER_STYLE },
      { v: 'Total Día (L)', s: HEADER_STYLE },
      { v: 'Estado Ordeño', s: HEADER_STYLE },
      { v: 'Estado Reproductivo', s: HEADER_STYLE },
      { v: 'Días para Secado', s: HEADER_STYLE },
      { v: 'Notas / Observaciones', s: HEADER_STYLE },
    ]
  ];

  let sumAm = 0;
  let sumPm = 0;
  let sumTotal = 0;

  females.forEach(cow => {
    const record = milkRecords.find(r => String(r.cattleId) === String(cow.id) && r.date === selectedDate);
    const am = record ? (parseFloat(record.amLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.6 || 0);
    const pm = record ? (parseFloat(record.pmLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.4 || 0);
    const total = record ? (parseFloat(record.totalLiters) || (am + pm)) : (parseFloat(cow.dailyMilkLiters) || 0);
    const del = calculateDaysInMilk(cow, milkRecords);
    const pDays = parseInt(cow.pregnancyDays, 10) || 0;
    const daysToDry = pDays > 0 ? Math.max(0, 220 - pDays) : '-';

    sumAm += am;
    sumPm += pm;
    sumTotal += total;

    wsData1.push([
      { v: `#${cow.tagNumber || 'S/N'}`, s: CELL_CENTER },
      { v: cow.name || '-', s: CELL_STYLE },
      { v: cow.entryBatch || cow.paddock || '-', s: CELL_STYLE },
      { v: del > 0 ? `${del} d` : '-', s: CELL_CENTER },
      { v: am > 0 ? Number(am.toFixed(1)) : 0, s: CELL_NUM },
      { v: pm > 0 ? Number(pm.toFixed(1)) : 0, s: CELL_NUM },
      { v: total > 0 ? Number(total.toFixed(1)) : 0, s: CELL_NUM },
      { v: cow.milkingStatus || 'En ordeño', s: CELL_CENTER },
      { v: cow.reproductiveStatus || (pDays > 0 ? `Preñada (${pDays}d)` : 'Vacía'), s: CELL_CENTER },
      { v: daysToDry === '-' ? '-' : (daysToDry === 0 ? '⚠️ SECAR HOY' : `${daysToDry} días`), s: CELL_CENTER },
      { v: record?.notes || cow.notes || '', s: CELL_STYLE },
    ]);
  });

  // Fila de Totales
  wsData1.push([
    { v: 'TOTALES / PROMEDIO HATO', s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: `${females.length} Hembras`, s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: Number(sumAm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumPm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumTotal.toFixed(1)), s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
  ws1['!cols'] = [
    { wch: 14 }, // Chapa
    { wch: 22 }, // Nombre
    { wch: 18 }, // Lote
    { wch: 18 }, // DEL
    { wch: 15 }, // AM
    { wch: 15 }, // PM
    { wch: 15 }, // Total
    { wch: 16 }, // Estado Ordeño
    { wch: 22 }, // Estado Reproductivo
    { wch: 18 }, // Secado
    { wch: 28 }, // Notas
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilla Control Lechero');

  // ==================== HOJA 2: DESPACHOS & TANQUE FRÍO ====================
  const wsData2 = [
    [{ v: `🧊 REGISTRO DE DESPACHOS A TANQUE & VENTAS • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
    [{ v: `Total Litros Despachados Mes: ${metrics.monthDeliveredLiters} L | Facturación Acumulada: ${formatCurrency(metrics.monthTotalRevenue)}`, s: META_STYLE }],
    [],
    [
      { v: 'Fecha Despacho', s: HEADER_STYLE },
      { v: 'Litros Entregados (L)', s: HEADER_STYLE },
      { v: 'Precio por Litro ($)', s: HEADER_STYLE },
      { v: 'Total Liquidado ($)', s: HEADER_STYLE },
      { v: 'Comprador / Acopio', s: HEADER_STYLE },
      { v: 'Destino de Leche', s: HEADER_STYLE },
      { v: 'Litros Descartados (L)', s: HEADER_STYLE },
      { v: 'Temperatura Tanque (°C)', s: HEADER_STYLE },
      { v: 'Estado de Pago', s: HEADER_STYLE },
      { v: 'Observaciones', s: HEADER_STYLE },
    ]
  ];

  let sumDelivLiters = 0;
  let sumDelivVal = 0;
  let sumRejected = 0;

  milkDeliveries.forEach(deliv => {
    const l = parseFloat(deliv.totalLiters) || 0;
    const p = parseFloat(deliv.pricePerLiter) || 0;
    const val = parseFloat(deliv.totalValue) || (l * p);
    const rej = parseFloat(deliv.rejectedLiters) || 0;

    sumDelivLiters += l;
    sumDelivVal += val;
    sumRejected += rej;

    wsData2.push([
      { v: formatDate(deliv.date), s: CELL_CENTER },
      { v: l, s: CELL_NUM },
      { v: p, s: CELL_NUM },
      { v: val, s: CELL_NUM },
      { v: deliv.buyer || 'Planta / Acopio', s: CELL_STYLE },
      { v: deliv.milkDestination || deliv.destination || 'Planta', s: CELL_CENTER },
      { v: rej > 0 ? rej : 0, s: CELL_NUM },
      { v: deliv.temperature ? `${deliv.temperature}°C` : '-', s: CELL_CENTER },
      { v: deliv.paymentStatus || 'Pagado', s: CELL_CENTER },
      { v: deliv.notes || '', s: CELL_STYLE },
    ]);
  });

  // Fila de Totales Hoja 2
  wsData2.push([
    { v: 'TOTALES DESPACHADOS', s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: Number(sumDelivLiters.toFixed(1)), s: TOTAL_STYLE },
    { v: sumDelivLiters > 0 ? Number((sumDelivVal / sumDelivLiters).toFixed(0)) : 0, s: TOTAL_STYLE },
    { v: Number(sumDelivVal.toFixed(0)), s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: Number(sumRejected.toFixed(1)), s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(wsData2);
  ws2['!cols'] = [
    { wch: 16 }, // Fecha
    { wch: 20 }, // Litros
    { wch: 18 }, // Precio/L
    { wch: 22 }, // Total
    { wch: 25 }, // Comprador
    { wch: 20 }, // Destino
    { wch: 20 }, // Descartados
    { wch: 22 }, // Temp
    { wch: 16 }, // Pago
    { wch: 28 }, // Obs
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Despachos & Tanque');

  // ==================== HOJA 3: RANKING & CURVAS DE LACTANCIA ====================
  const rankingList = females.map(cow => {
    const curve = calculateLactationCurve(cow, milkRecords);
    return {
      cow,
      curve,
      avgDaily: curve.avgDaily || parseFloat(cow.dailyMilkLiters) || 0,
      del: curve.currentDEL,
      peak: curve.peakLiters,
      proj305: curve.projected305,
    };
  }).sort((a, b) => b.avgDaily - a.avgDaily);

  const wsData3 = [
    [{ v: `🏆 RANKING DE PRODUCCIÓN & CURVAS DE LACTANCIA (305 DÍAS) • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
    [{ v: `Evaluación de mérito zootécnico y persistencia lechera`, s: META_STYLE }],
    [],
    [
      { v: 'Puesto', s: HEADER_STYLE },
      { v: 'Chapa / ID', s: HEADER_STYLE },
      { v: 'Nombre Bovina', s: HEADER_STYLE },
      { v: 'Raza', s: HEADER_STYLE },
      { v: 'Promedio Día (L/d)', s: HEADER_STYLE },
      { v: 'Pico Registrado (L)', s: HEADER_STYLE },
      { v: 'Días en Leche (DEL)', s: HEADER_STYLE },
      { v: 'Proyección 305 Días (L)', s: HEADER_STYLE },
      { v: 'Estado Sanitario Ubre', s: HEADER_STYLE },
    ]
  ];

  rankingList.forEach((item, idx) => {
    wsData3.push([
      { v: idx + 1, s: CELL_CENTER },
      { v: `#${item.cow.tagNumber || 'S/N'}`, s: CELL_CENTER },
      { v: item.cow.name || '-', s: CELL_STYLE },
      { v: item.cow.breed || 'Cruze Lechero', s: CELL_STYLE },
      { v: Number(item.avgDaily.toFixed(1)), s: CELL_NUM },
      { v: Number(item.peak.toFixed(1)), s: CELL_NUM },
      { v: item.del > 0 ? `${item.del} d` : '-', s: CELL_CENTER },
      { v: item.proj305 > 0 ? Number(item.proj305.toLocaleString('es-CO')) : 0, s: CELL_NUM },
      { v: item.cow.healthNotes || 'Sano / Ubre Limpia', s: CELL_STYLE },
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(wsData3);
  ws3['!cols'] = [
    { wch: 10 }, // Puesto
    { wch: 14 }, // Chapa
    { wch: 22 }, // Nombre
    { wch: 18 }, // Raza
    { wch: 20 }, // Promedio
    { wch: 20 }, // Pico
    { wch: 18 }, // DEL
    { wch: 24 }, // Proy 305
    { wch: 26 }, // Salud
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Ranking & Proyección 305d');

  // Descarga del archivo Excel
  const cleanName = farmName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `control_lechero_${cleanName}_${selectedDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
