import XLSX from 'xlsx-js-style';
import { formatDate, formatCurrency, formatNumber, calculateDaysInMilk, calculateLactationCurve, calculateHerdMilkMetrics, calculatePeriodMilkSummary } from './calculations';

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
 * Genera y descarga el libro Excel completo de Control Lechero, Períodos y Liquidaciones
 */
export function exportDairyReportToExcel({
  cattle = [],
  milkRecords = [],
  milkDeliveries = [],
  dailyMilkLogs = [],
  milkSettlements = [],
  periodSummary = null,
  periodRange = null,
  farmName = 'Finca Ganadera',
  selectedDate = new Date().toISOString().split('T')[0]
}) {
  const wb = XLSX.utils.book_new();

  const females = cattle.filter(c => c.sex === 'Hembra' && c.status === 'Activo');
  const metrics = calculateHerdMilkMetrics(cattle, milkRecords, milkDeliveries, selectedDate);

  // ==================== HOJA 1: CONTROL DIARIO & PERÍODO (QUINCENAL/MENSUAL) ====================
  const pRange = periodRange || {
    label: `Período Activo`,
    startDate: selectedDate.slice(0, 7) + '-01',
    endDate: selectedDate
  };

  const pSum = periodSummary || calculatePeriodMilkSummary(
    dailyMilkLogs,
    milkRecords,
    pRange.startDate,
    pRange.endDate,
    2100
  );

  const wsDataPeriod = [
    [{ v: `🥛 CONTROL DIARIO & PERIÓDICO DE LECHE • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
    [{ v: `Período: ${pRange.label} | Generado: ${formatDate(new Date())}`, s: META_STYLE }],
    [{ v: `Producción Total: ${formatNumber(pSum.totalLiters, 1)} L | A Venta: ${formatNumber(pSum.totalSalesLiters, 1)} L | Facturación Estimada: ${formatCurrency(pSum.estimatedRevenue)}`, s: META_STYLE }],
    [],
    [
      { v: 'Fecha', s: HEADER_STYLE },
      { v: 'Día', s: HEADER_STYLE },
      { v: 'Ordeño AM (L)', s: HEADER_STYLE },
      { v: 'Ordeño PM (L)', s: HEADER_STYLE },
      { v: 'Total Día (L)', s: HEADER_STYLE },
      { v: 'Vacas Ordeñadas', s: HEADER_STYLE },
      { v: 'Venta / Tanque (L)', s: HEADER_STYLE },
      { v: 'Terneros (L)', s: HEADER_STYLE },
      { v: 'Queso / Finca (L)', s: HEADER_STYLE },
      { v: 'Descarte / Mastitis (L)', s: HEADER_STYLE },
      { v: 'Estado Liquidación', s: HEADER_STYLE },
      { v: 'Observaciones', s: HEADER_STYLE },
    ]
  ];

  let sumAm = 0;
  let sumPm = 0;
  let sumTot = 0;
  let sumSales = 0;
  let sumCalves = 0;
  let sumFarm = 0;
  let sumRej = 0;

  pSum.dailyBreakdown.forEach(d => {
    sumAm += d.amLiters;
    sumPm += d.pmLiters;
    sumTot += d.totalLiters;
    sumSales += d.salesLiters;
    sumCalves += d.calvesLiters;
    sumFarm += d.farmLiters;
    sumRej += d.rejectedLiters;

    const dt = new Date(d.date + 'T00:00:00');
    const dayName = dt.toLocaleDateString('es-CO', { weekday: 'short' });

    wsDataPeriod.push([
      { v: formatDate(d.date), s: CELL_CENTER },
      { v: dayName.toUpperCase(), s: CELL_CENTER },
      { v: d.amLiters > 0 ? Number(d.amLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.pmLiters > 0 ? Number(d.pmLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.totalLiters > 0 ? Number(d.totalLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.cowsMilked || 0, s: CELL_CENTER },
      { v: d.salesLiters > 0 ? Number(d.salesLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.calvesLiters > 0 ? Number(d.calvesLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.farmLiters > 0 ? Number(d.farmLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.rejectedLiters > 0 ? Number(d.rejectedLiters.toFixed(1)) : 0, s: CELL_NUM },
      { v: d.isSettled ? '🟢 Liquidado' : (d.totalLiters > 0 ? '🟡 Pendiente' : '-'), s: CELL_CENTER },
      { v: d.notes || '', s: CELL_STYLE },
    ]);
  });

  // Fila de Totales Hoja Período
  wsDataPeriod.push([
    { v: 'TOTALES PERÍODO', s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: `${pSum.daysLogged} Días`, s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: Number(sumAm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumPm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumTot.toFixed(1)), s: TOTAL_STYLE },
    { v: pSum.avgCowsMilked > 0 ? `${Number(pSum.avgCowsMilked.toFixed(1))} prom.` : '-', s: TOTAL_STYLE },
    { v: Number(sumSales.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumCalves.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumFarm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(sumRej.toFixed(1)), s: TOTAL_STYLE },
    { v: `${Number(pSum.settledLiters.toFixed(0))} L liq.`, s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
  ]);

  const wsPeriod = XLSX.utils.aoa_to_sheet(wsDataPeriod);
  wsPeriod['!cols'] = [
    { wch: 15 }, // Fecha
    { wch: 10 }, // Día
    { wch: 15 }, // AM
    { wch: 15 }, // PM
    { wch: 16 }, // Total
    { wch: 16 }, // Vacas
    { wch: 18 }, // Venta
    { wch: 15 }, // Terneros
    { wch: 16 }, // Queso
    { wch: 18 }, // Descarte
    { wch: 18 }, // Estado
    { wch: 28 }, // Notas
  ];
  XLSX.utils.book_append_sheet(wb, wsPeriod, 'Control Diario & Períodos');

  // ==================== HOJA 2: LIQUIDACIONES & VENTAS DE LECHE ====================
  const wsDataSettlements = [
    [{ v: `💰 HISTORIAL DE LIQUIDACIONES & CIERRES DE LECHE • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
    [{ v: `Total Liquidaciones Registradas: ${milkSettlements.length}`, s: META_STYLE }],
    [],
    [
      { v: 'Período', s: HEADER_STYLE },
      { v: 'Tipo Período', s: HEADER_STYLE },
      { v: 'Fecha Inicio', s: HEADER_STYLE },
      { v: 'Fecha Fin', s: HEADER_STYLE },
      { v: 'Comprador / Planta', s: HEADER_STYLE },
      { v: 'Litros Liquidados (L)', s: HEADER_STYLE },
      { v: 'Precio Base ($/L)', s: HEADER_STYLE },
      { v: 'Subtotal Base ($)', s: HEADER_STYLE },
      { v: 'Bonificaciones ($)', s: HEADER_STYLE },
      { v: 'Deducciones ($)', s: HEADER_STYLE },
      { v: 'Total Neto Liquidado ($)', s: HEADER_STYLE },
      { v: 'Estado de Pago', s: HEADER_STYLE },
      { v: 'Fecha de Pago', s: HEADER_STYLE },
      { v: 'Observaciones', s: HEADER_STYLE },
    ]
  ];

  let sumSettleLiters = 0;
  let sumSettleNet = 0;

  milkSettlements.forEach(st => {
    const l = parseFloat(st.totalLiters) || 0;
    const net = parseFloat(st.totalValue) || 0;
    sumSettleLiters += l;
    sumSettleNet += net;

    wsDataSettlements.push([
      { v: `${formatDate(st.startDate)} al ${formatDate(st.endDate)}`, s: CELL_CENTER },
      { v: (st.periodType || 'quincenal').toUpperCase(), s: CELL_CENTER },
      { v: formatDate(st.startDate), s: CELL_CENTER },
      { v: formatDate(st.endDate), s: CELL_CENTER },
      { v: st.buyer || 'Planta / Acopio', s: CELL_STYLE },
      { v: l, s: CELL_NUM },
      { v: parseFloat(st.pricePerLiter) || 0, s: CELL_NUM },
      { v: parseFloat(st.baseAmount) || (l * (parseFloat(st.pricePerLiter) || 0)), s: CELL_NUM },
      { v: parseFloat(st.bonuses) || 0, s: CELL_NUM },
      { v: parseFloat(st.deductions) || 0, s: CELL_NUM },
      { v: net, s: CELL_NUM },
      { v: st.paymentStatus || 'Pagada', s: CELL_CENTER },
      { v: st.paymentDate ? formatDate(st.paymentDate) : '-', s: CELL_CENTER },
      { v: st.notes || '', s: CELL_STYLE },
    ]);
  });

  // Totales de Liquidaciones
  wsDataSettlements.push([
    { v: 'TOTALES LIQUIDADOS', s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: `${milkSettlements.length} Liquidaciones`, s: { ...TOTAL_STYLE, alignment: { horizontal: 'center' } } },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: Number(sumSettleLiters.toFixed(1)), s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: Number(sumSettleNet.toFixed(0)), s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
    { v: '', s: TOTAL_STYLE },
  ]);

  const wsSettlements = XLSX.utils.aoa_to_sheet(wsDataSettlements);
  wsSettlements['!cols'] = [
    { wch: 24 }, // Período
    { wch: 14 }, // Tipo
    { wch: 14 }, // Inicio
    { wch: 14 }, // Fin
    { wch: 22 }, // Comprador
    { wch: 18 }, // Litros
    { wch: 16 }, // Precio/L
    { wch: 18 }, // Subtotal
    { wch: 16 }, // Bonos
    { wch: 16 }, // Deduc
    { wch: 22 }, // Neto
    { wch: 16 }, // Estado
    { wch: 14 }, // Fecha Pago
    { wch: 28 }, // Notas
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlements, 'Liquidaciones & Ventas');

  // ==================== HOJA 3: PLANILLA INDIVIDUAL POR VACA ====================
  const wsData1 = [
    [{ v: `🐄 PLANILLA DE CONTROL LECHERO INDIVIDUAL • ${farmName.toUpperCase()}`, s: TITLE_STYLE }],
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

  let indSumAm = 0;
  let indSumPm = 0;
  let indSumTotal = 0;

  females.forEach(cow => {
    const record = milkRecords.find(r => String(r.cattleId) === String(cow.id) && r.date === selectedDate);
    const am = record ? (parseFloat(record.amLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.6 || 0);
    const pm = record ? (parseFloat(record.pmLiters) || 0) : (parseFloat(cow.dailyMilkLiters) * 0.4 || 0);
    const total = record ? (parseFloat(record.totalLiters) || (am + pm)) : (parseFloat(cow.dailyMilkLiters) || 0);
    const del = calculateDaysInMilk(cow, milkRecords);
    const pDays = parseInt(cow.pregnancyDays, 10) || 0;
    const daysToDry = pDays > 0 ? Math.max(0, 220 - pDays) : '-';

    indSumAm += am;
    indSumPm += pm;
    indSumTotal += total;

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
    { v: Number(indSumAm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(indSumPm.toFixed(1)), s: TOTAL_STYLE },
    { v: Number(indSumTotal.toFixed(1)), s: TOTAL_STYLE },
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
  XLSX.utils.book_append_sheet(wb, ws1, 'Pesaje Individual');

  // ==================== HOJA 4: DESPACHOS & TANQUE FRÍO ====================
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

  // Fila de Totales Hoja 4
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

  // ==================== HOJA 5: RANKING & CURVAS DE LACTANCIA ====================
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
  XLSX.utils.book_append_sheet(wb, ws3, 'Ranking & Curvas 305d');

  // Descarga del archivo Excel
  const cleanName = farmName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `control_lechero_${cleanName}_${selectedDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
