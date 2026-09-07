import XLSX from 'xlsx-js-style';
import { calculateWeightMetrics, calculateFinancials, formatNumber, formatCurrency, formatDate } from './calculations';

/**
 * Genera una barra gráfica de texto visual proporcional utilizando bloques Unicode
 * @param {number} value - Valor actual
 * @param {number} max - Valor máximo para la escala (100%)
 * @param {number} barLength - Longitud máxima en caracteres
 */
export function generateVisualBar(value, max, barLength = 20) {
  if (!max || max <= 0 || !value || value <= 0) return '░░░░░░░░░░░░░░░░░░░░ 0%';
  const ratio = Math.min(1, Math.max(0, value / max));
  const filledCount = Math.round(ratio * barLength);
  const emptyCount = Math.max(0, barLength - filledCount);
  const percent = (ratio * 100).toFixed(0);
  return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)} ${percent}%`;
}

/**
 * Construye la hoja de cálculo estilizada de "Comparativa de Lotes con Gráficas"
 */
export function buildBatchComparisonWorksheet(cattle = [], weighings = [], farmName = 'Finca Ganadera') {
  // 1. Agrupar animales por lote
  const batchNames = Array.from(
    new Set(cattle.map(c => c.entryBatch || c.paddock || 'Ingreso #1').filter(Boolean))
  ).sort();

  if (batchNames.length === 0) return null;

  const batchesData = batchNames.map(name => {
    const animals = cattle.filter(c => (c.entryBatch || c.paddock || 'Ingreso #1') === name);
    const headCount = animals.length;
    const activeCount = animals.filter(c => c.status === 'Activo').length;
    const soldCount = animals.filter(c => c.status === 'Vendido').length;
    const deadCount = animals.filter(c => c.status === 'Muerto').length;

    const dates = animals.map(c => c.entryDate).filter(Boolean).sort();
    const earliestDate = dates[0] || 'N/A';

    let totalPurchaseCost = 0;
    let totalEntryWeight = 0;
    let totalCurrentWeight = 0;
    let totalGainKg = 0;
    let gdpSum = 0;
    let gdpCount = 0;
    let totalDaysSum = 0;
    let readyToSellCount = 0;

    animals.forEach(animal => {
      const animalWeighs = weighings.filter(w => String(w.cattleId) === String(animal.id));
      const wm = calculateWeightMetrics(animal, animalWeighs);

      const entryPrice = parseFloat(animal.entryPrice) || 0;
      const entryWeight = parseFloat(animal.entryWeight) || 0;

      totalPurchaseCost += entryPrice;
      totalEntryWeight += entryWeight;
      totalCurrentWeight += wm.currentWeight;
      totalGainKg += wm.totalGain;

      if (wm.overallGdp > 0) {
        gdpSum += wm.overallGdp;
        gdpCount++;
      }

      totalDaysSum += wm.totalDays;
      if (animal.status === 'Activo' && wm.currentWeight >= 480) {
        readyToSellCount++;
      }
    });

    const avgPricePerHead = headCount > 0 ? (totalPurchaseCost / headCount) : 0;
    const costPerEntryKg = totalEntryWeight > 0 ? (totalPurchaseCost / totalEntryWeight) : 0;
    const avgEntryWeight = headCount > 0 ? (totalEntryWeight / headCount) : 0;
    const avgCurrentWeight = headCount > 0 ? (totalCurrentWeight / headCount) : 0;
    const avgGainKg = headCount > 0 ? (totalGainKg / headCount) : 0;
    const avgGdp = gdpCount > 0 ? (gdpSum / gdpCount) : 0;
    const avgDays = headCount > 0 ? Math.round(totalDaysSum / headCount) : 0;

    return {
      batchName: name,
      headCount,
      activeCount,
      soldCount,
      deadCount,
      earliestDate,
      totalPurchaseCost,
      avgPricePerHead,
      totalEntryWeight,
      costPerEntryKg,
      totalCurrentWeight,
      avgEntryWeight,
      avgCurrentWeight,
      totalGainKg,
      avgGainKg,
      avgGdp,
      avgDays,
      readyToSellCount
    };
  });

  // Identificar los lotes destacados
  const validPurchase = batchesData.filter(b => b.costPerEntryKg > 0);
  const bestPurchase = validPurchase.length > 0
    ? validPurchase.reduce((best, cur) => cur.costPerEntryKg < best.costPerEntryKg ? cur : best, validPurchase[0])
    : null;

  const validGdp = batchesData.filter(b => b.avgGdp > 0);
  const bestGdp = validGdp.length > 0
    ? validGdp.reduce((best, cur) => cur.avgGdp > best.avgGdp ? cur : best, validGdp[0])
    : null;

  const validGain = batchesData.filter(b => b.avgGainKg > 0);
  const bestGain = validGain.length > 0
    ? validGain.reduce((best, cur) => cur.avgGainKg > best.avgGainKg ? cur : best, validGain[0])
    : null;

  // Encontrar valores máximos para escalar las barras gráficas
  const maxGdp = Math.max(...batchesData.map(b => b.avgGdp), 0.8) * 1.1;
  const maxGain = Math.max(...batchesData.map(b => b.totalGainKg), 100) * 1.1;
  const maxPurchase = Math.max(...batchesData.map(b => b.totalPurchaseCost), 1000000) * 1.1;

  // 2. Construcción de filas de datos (AOA)
  const aoa = [];

  // Fila 0: Título Principal
  aoa.push([`⚖️ COMPARATIVA EJECUTIVA DE LOTES & INGRESOS • ${farmName.toUpperCase()}`]);
  // Fila 1: Subtítulo con fecha
  aoa.push([`Análisis de Precios de Compra, Valor de Ingreso, Rendimientos (GDP), Biomasa y Tiempo en Finca | Generado: ${formatDate(new Date())}`]);
  // Fila 2: Vacía
  aoa.push([]);

  // Fila 3: Sección Medallero
  aoa.push(['🏆 CUADRO DE HONOR Y EFICIENCIA DE LOTES']);
  // Fila 4: Medallas
  const med1 = bestPurchase ? `🥇 MEJOR PRECIO COMPRA ($/kg): ${bestPurchase.batchName} (${formatCurrency(bestPurchase.costPerEntryKg)}/kg • ${formatCurrency(bestPurchase.avgPricePerHead)}/cab)` : '🥇 MEJOR PRECIO: N/A';
  const med2 = bestGdp ? `⚡ MAYOR RENDIMIENTO (GDP): ${bestGdp.batchName} (${formatNumber(bestGdp.avgGdp, 3)} kg/día)` : '⚡ MAYOR GDP: N/A';
  const med3 = bestGain ? `🥩 MÁS CARNE GANADA: ${bestGain.batchName} (+${formatNumber(bestGain.avgGainKg, 1)} kg/cab • +${formatNumber(bestGain.totalGainKg, 0)} kg total)` : '🥩 MÁS CARNE: N/A';
  aoa.push([med1, '', '', '', med2, '', '', '', med3]);
  // Fila 5: Vacía
  aoa.push([]);

  // Fila 6: Título Tabla Matriz
  aoa.push(['📊 MATRIZ COMPARATIVA DE LOTES & INGRESOS']);

  // Fila 7: Encabezados de Tabla
  const tableHeaders = [
    'Lote / Ingreso #',
    'En Finca (Activos)',
    'Vendidos',
    'Total Cab',
    'Valor Compra Total ($)',
    'Precio / Animal ($)',
    'Valor Kilo Entrada ($/kg)',
    'Peso Entrada Prom (kg)',
    'Peso Actual Prom (kg)',
    'Ganancia Prom (+kg/cab)',
    'Ganancia Total Lote (+kg)',
    'Rendimiento GDP (kg/día)',
    'Tiempo Finca (Días)',
    'Listos ≥ 480kg'
  ];
  aoa.push(tableHeaders);

  const tableStartRow = aoa.length; // Fila donde inician los datos

  // Filas de datos de cada lote
  batchesData.forEach(b => {
    aoa.push([
      b.batchName,
      b.activeCount,
      b.soldCount,
      b.headCount,
      b.totalPurchaseCost,
      Math.round(b.avgPricePerHead),
      Math.round(b.costPerEntryKg),
      Number(b.avgEntryWeight.toFixed(1)),
      Number(b.avgCurrentWeight.toFixed(1)),
      Number(b.avgGainKg.toFixed(1)),
      Number(b.totalGainKg.toFixed(1)),
      Number(b.avgGdp.toFixed(3)),
      b.avgDays,
      b.readyToSellCount
    ]);
  });

  const tableEndRow = aoa.length; // Fila donde terminan los datos de lotes

  // Fila de Totales y Promedios
  const totalCattle = batchesData.reduce((acc, b) => acc + b.headCount, 0);
  const totalAct = batchesData.reduce((acc, b) => acc + b.activeCount, 0);
  const totalSold = batchesData.reduce((acc, b) => acc + b.soldCount, 0);
  const totPurchase = batchesData.reduce((acc, b) => acc + b.totalPurchaseCost, 0);
  const totGain = batchesData.reduce((acc, b) => acc + b.totalGainKg, 0);
  const totEntryW = batchesData.reduce((acc, b) => acc + b.totalEntryWeight, 0);
  const totCurrW = batchesData.reduce((acc, b) => acc + b.totalCurrentWeight, 0);
  const readyTot = batchesData.reduce((acc, b) => acc + b.readyToSellCount, 0);

  const avgPurHead = totalCattle > 0 ? Math.round(totPurchase / totalCattle) : 0;
  const avgCostKg = totEntryW > 0 ? Math.round(totPurchase / totEntryW) : 0;
  const avgEW = totalCattle > 0 ? Number((totEntryW / totalCattle).toFixed(1)) : 0;
  const avgCW = totalCattle > 0 ? Number((totCurrW / totalCattle).toFixed(1)) : 0;
  const avgGHead = totalCattle > 0 ? Number((totGain / totalCattle).toFixed(1)) : 0;
  const gdpValid = batchesData.map(b => b.avgGdp).filter(v => v > 0);
  const overallAvgGdp = gdpValid.length > 0 ? Number((gdpValid.reduce((a, b) => a + b, 0) / gdpValid.length).toFixed(3)) : 0;
  const avgDaysTotal = batchesData.length > 0 ? Math.round(batchesData.reduce((a, b) => a + b.avgDays, 0) / batchesData.length) : 0;

  aoa.push([
    'TOTALES / PROMEDIOS GENERALES',
    totalAct,
    totalSold,
    totalCattle,
    totPurchase,
    avgPurHead,
    avgCostKg,
    avgEW,
    avgCW,
    avgGHead,
    Number(totGain.toFixed(1)),
    overallAvgGdp,
    avgDaysTotal,
    readyTot
  ]);

  const totalsRowIndex = aoa.length - 1;

  // Filas Vacías
  aoa.push([]);
  aoa.push([]);

  // =========================================================================
  // SECCIÓN DE GRÁFICAS VISUALES COMPARATIVAS EN EXCEL
  // =========================================================================
  aoa.push(['📈 GRÁFICAS COMPARATIVAS DE RENDIMIENTO & BIOMASA EN EXCEL']);
  aoa.push(['Visualización de barras proporcionales calculadas directamente a partir del desempeño zootécnico y financiero']);
  aoa.push([]);

  // GRÁFICA 1: RITMO DE ENGORDE (GDP kg/día)
  const graph1TitleRow = aoa.length;
  aoa.push(['⚡ GRÁFICA 1: RITMO DE GANANCIA DIARIA DE PESO (GDP kg/día)']);
  aoa.push(['Lote / Ingreso', 'GDP (kg/día)', 'Gráfica de Rendimiento Diario (Escala Comparativa)', 'Clasificación Desempeño', 'Kilos Ganados/Cab']);
  
  const graph1StartRow = aoa.length;
  batchesData.forEach(b => {
    const bar = generateVisualBar(b.avgGdp, maxGdp, 24);
    const label = b.avgGdp >= 0.75 ? '🚀 Excelente' : b.avgGdp >= 0.40 ? '⚡ Aceptable' : '⚠️ Regular';
    aoa.push([
      b.batchName,
      Number(b.avgGdp.toFixed(3)),
      bar,
      label,
      `+${Number(b.avgGainKg.toFixed(1))} kg`
    ]);
  });
  const graph1EndRow = aoa.length;

  aoa.push([]);

  // GRÁFICA 2: GANANCIA TOTAL DE CARNE PRODUCIDA (+kg)
  const graph2TitleRow = aoa.length;
  aoa.push(['🥩 GRÁFICA 2: BIOMASA TOTAL DE CARNE GANADA EN FINCA (+kg totales)']);
  aoa.push(['Lote / Ingreso', 'Carne Ganada (+kg)', 'Gráfica de Biomasa Producida (Escala Comparativa)', 'Peso Entrada Prom.', 'Peso Actual Prom.']);

  const graph2StartRow = aoa.length;
  batchesData.forEach(b => {
    const bar = generateVisualBar(b.totalGainKg, maxGain, 24);
    aoa.push([
      b.batchName,
      Number(b.totalGainKg.toFixed(1)),
      bar,
      `${Number(b.avgEntryWeight.toFixed(1))} kg`,
      `${Number(b.avgCurrentWeight.toFixed(1))} kg`
    ]);
  });
  const graph2EndRow = aoa.length;

  aoa.push([]);

  // GRÁFICA 3: VALOR COMPRA TOTAL DE LOS ANIMALES ($ COP)
  const graph3TitleRow = aoa.length;
  aoa.push(['💰 GRÁFICA 3: VALOR COMPRA TOTAL DE LOS ANIMALES & VALOR DEL KILO ($/kg)']);
  aoa.push(['Lote / Ingreso', 'Valor Compra Total ($ COP)', 'Gráfica de Inversión Monetaria', 'Valor Kilo ($/kg)', 'Precio / Animal']);

  const graph3StartRow = aoa.length;
  batchesData.forEach(b => {
    const bar = generateVisualBar(b.totalPurchaseCost, maxPurchase, 24);
    aoa.push([
      b.batchName,
      b.totalPurchaseCost,
      bar,
      `$${Math.round(b.costPerEntryKg).toLocaleString('es-CO')}/kg`,
      `$${Math.round(b.avgPricePerHead).toLocaleString('es-CO')}/cab`
    ]);
  });
  const graph3EndRow = aoa.length;

  // 3. Crear hoja de cálculo con XLSX
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Configurar anchos de columna (anchos generosos para visualización óptima)
  ws['!cols'] = [
    { wch: 26 }, // Col A: Lote / Ingreso
    { wch: 18 }, // Col B: Activos / GDP
    { wch: 38 }, // Col C: Vendidos / Barra Gráfica
    { wch: 16 }, // Col D: Total Cab / Clasificación
    { wch: 24 }, // Col E: Valor Compra Total
    { wch: 20 }, // Col F: Precio / Animal
    { wch: 22 }, // Col G: Valor Kilo Entrada
    { wch: 20 }, // Col H: Kilos Entrada Prom
    { wch: 20 }, // Col I: Kilos Actual Prom
    { wch: 22 }, // Col J: Ganancia Prom
    { wch: 22 }, // Col K: Ganancia Total
    { wch: 22 }, // Col L: Rendimiento GDP
    { wch: 18 }, // Col M: Tiempo Finca
    { wch: 16 }  // Col N: Listos ≥480kg
  ];

  // Configurar Merges (Combinación de celdas)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Título A1:N1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Subtítulo A2:N2
    { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } }, // Cuadro de Honor A4:N4
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },  // Medalla 1 A5:D5
    { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },  // Medalla 2 E5:H5
    { s: { r: 4, c: 8 }, e: { r: 4, c: 13 } }, // Medalla 3 I5:N5
    { s: { r: 6, c: 0 }, e: { r: 6, c: 13 } }, // Título Matriz A7:N7
    // Gráfica Headers
    { s: { r: totalsRowIndex + 3, c: 0 }, e: { r: totalsRowIndex + 3, c: 13 } },
    { s: { r: totalsRowIndex + 4, c: 0 }, e: { r: totalsRowIndex + 4, c: 13 } },
    { s: { r: graph1TitleRow, c: 0 }, e: { r: graph1TitleRow, c: 13 } },
    { s: { r: graph2TitleRow, c: 0 }, e: { r: graph2TitleRow, c: 13 } },
    { s: { r: graph3TitleRow, c: 0 }, e: { r: graph3TitleRow, c: 13 } }
  ];

  // Estilos de Bordes
  const blackBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const headerBorder = {
    top: { style: 'medium', color: { rgb: '000000' } },
    bottom: { style: 'medium', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const totalBorder = {
    top: { style: 'medium', color: { rgb: '000000' } },
    bottom: { style: 'double', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  // 4. Aplicar estilos celda por celda
  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;
      const cell = ws[cellAddress];

      // Fila 0: Título Principal
      if (R === 0) {
        cell.s = {
          fill: { fgColor: { rgb: '065F46' } }, // Verde esmeralda oscuro
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // Fila 1: Subtítulo
      else if (R === 1) {
        cell.s = {
          fill: { fgColor: { rgb: 'E2E8F0' } },
          font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '334155' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // Fila 3: Título Cuadro de Honor
      else if (R === 3) {
        cell.s = {
          fill: { fgColor: { rgb: '1E293B' } },
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
      // Fila 4: Medallas
      else if (R === 4) {
        if (C <= 3) {
          // Medalla Compra (Verde)
          cell.s = {
            fill: { fgColor: { rgb: 'D1FAE5' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '065F46' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: blackBorder
          };
        } else if (C <= 7) {
          // Medalla GDP (Morado)
          cell.s = {
            fill: { fgColor: { rgb: 'EDE9FE' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '5B21B6' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: blackBorder
          };
        } else {
          // Medalla Ganancia (Azul)
          cell.s = {
            fill: { fgColor: { rgb: 'DBEAFE' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E40AF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: blackBorder
          };
        }
      }
      // Fila 6: Título Matriz
      else if (R === 6) {
        cell.s = {
          fill: { fgColor: { rgb: '0F172A' } },
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
      // Fila 7: Encabezados de Tabla Matriz
      else if (R === 7) {
        const isAmberHeader = C === 4 || C === 5;
        const isEmeraldHeader = C === 6;
        const isBlueHeader = C === 9 || C === 10;
        const isPurpleHeader = C === 11;

        let fgColor = '1E293B';
        if (isAmberHeader) fgColor = '78350F';
        if (isEmeraldHeader) fgColor = '065F46';
        if (isBlueHeader) fgColor = '1E40AF';
        if (isPurpleHeader) fgColor = '581C87';

        cell.s = {
          fill: { fgColor: { rgb: fgColor } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: headerBorder
        };
      }
      // Filas de Datos de Tabla Matriz
      else if (R >= tableStartRow && R < tableEndRow) {
        const isEven = R % 2 === 0;
        const isAmberCell = C === 4 || C === 5;
        const isEmeraldCell = C === 6;
        const isBlueCell = C === 9 || C === 10;
        const isPurpleCell = C === 11;

        let bgRgb = isEven ? 'F8FAFC' : 'FFFFFF';
        let fontColor = '0F172A';
        let isBold = C === 0;

        if (isAmberCell) {
          bgRgb = isEven ? 'FEF3C7' : 'FFFBEB';
          fontColor = '78350F';
          isBold = C === 4;
        } else if (isEmeraldCell) {
          bgRgb = isEven ? 'D1FAE5' : 'ECFDF5';
          fontColor = '065F46';
          isBold = true;
        } else if (isBlueCell) {
          bgRgb = isEven ? 'DBEAFE' : 'EFF6FF';
          fontColor = '1E40AF';
          isBold = true;
        } else if (isPurpleCell) {
          bgRgb = isEven ? 'EDE9FE' : 'F5F3FF';
          fontColor = '581C87';
          isBold = true;
        }

        cell.s = {
          fill: { fgColor: { rgb: bgRgb } },
          font: { name: 'Calibri', sz: 10, bold: isBold, color: { rgb: fontColor } },
          alignment: {
            horizontal: C === 0 ? 'left' : (typeof cell.v === 'number' ? 'right' : 'center'),
            vertical: 'center'
          },
          border: blackBorder
        };
      }
      // Fila de Totales de Tabla Matriz
      else if (R === totalsRowIndex) {
        cell.s = {
          fill: { fgColor: { rgb: 'D1FAE5' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '064E3B' } },
          alignment: {
            horizontal: C === 0 ? 'left' : (typeof cell.v === 'number' ? 'right' : 'center'),
            vertical: 'center'
          },
          border: totalBorder
        };
      }
      // Encabezados de Gráficas
      else if (R === graph1TitleRow || R === graph2TitleRow || R === graph3TitleRow) {
        const titleColors = {
          [graph1TitleRow]: '4C1D95', // Morado
          [graph2TitleRow]: '1E3A8A', // Azul
          [graph3TitleRow]: '78350F'  // Ámbar
        };
        cell.s = {
          fill: { fgColor: { rgb: titleColors[R] || '1E293B' } },
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
      // Cabeceras de columnas de Gráficas
      else if (R === graph1TitleRow + 1 || R === graph2TitleRow + 1 || R === graph3TitleRow + 1) {
        cell.s = {
          fill: { fgColor: { rgb: '334155' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: headerBorder
        };
      }
      // Filas de Barras Gráficas
      else if (
        (R >= graph1StartRow && R < graph1EndRow) ||
        (R >= graph2StartRow && R < graph2EndRow) ||
        (R >= graph3StartRow && R < graph3EndRow)
      ) {
        const isBarCol = C === 2;
        const isEven = R % 2 === 0;
        cell.s = {
          fill: isEven ? { fgColor: { rgb: 'F8FAFC' } } : { fgColor: { rgb: 'FFFFFF' } },
          font: {
            name: isBarCol ? 'Consolas' : 'Calibri', // Consolas para alineación monospace perfecta de bloques
            sz: isBarCol ? 11 : 10,
            bold: isBarCol || C === 0,
            color: isBarCol ? { rgb: '047857' } : { rgb: '0F172A' }
          },
          alignment: {
            horizontal: isBarCol ? 'left' : (typeof cell.v === 'number' ? 'right' : (C === 0 ? 'left' : 'center')),
            vertical: 'center'
          },
          border: blackBorder
        };
      }
    }
  }

  return ws;
}

/**
 * Genera y descarga directamente un archivo Excel exclusivo de Comparativa de Lotes con Gráficas
 */
export function exportBatchComparisonExcel(cattle = [], weighings = [], farmName = 'Finca Ganadera') {
  const wb = XLSX.utils.book_new();
  const ws = buildBatchComparisonWorksheet(cattle, weighings, farmName);
  
  if (!ws) {
    throw new Error('No hay lotes con animales disponibles para exportar.');
  }

  XLSX.utils.book_append_sheet(wb, ws, '⚖️ Comparativa de Lotes');

  const cleanFarm = farmName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Comparativa_Lotes_${cleanFarm}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
