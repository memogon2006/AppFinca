import XLSX from 'xlsx-js-style';
import { db } from './db';
import { cloudPushData } from './cloudSync';
import { calculateWeightMetrics, formatNumber, formatDate, getDaysDifference } from './calculations';

/**
 * Genera el archivo Excel de la Planilla de Campo estandarizada
 */
export function generateFieldSheetExcel({
  cattle = [],
  weighings = [],
  farmName = 'Hacienda Ganadera',
  batchName = 'all',
  ownerName = 'all',
  sheetType = 'weighing', // 'weighing' | 'entry' | 'blank'
  extraBlankRows = 10,
  responsible = ''
}) {
  const wb = XLSX.utils.book_new();
  const todayStr = formatDate(new Date());

  let targetCattle = cattle.filter(c => c.status === 'Activo');
  if (batchName !== 'all') {
    targetCattle = targetCattle.filter(c => (c.entryBatch || c.paddock || '').trim() === batchName.trim());
  }
  if (ownerName !== 'all') {
    targetCattle = targetCattle.filter(c => (c.owner || 'Hacienda Principal').trim() === ownerName.trim());
  }

  // Ordenar por número de chapeta
  targetCattle.sort((a, b) => {
    const numA = parseInt(a.tagNumber, 10);
    const numB = parseInt(b.tagNumber, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.tagNumber || '').localeCompare(String(b.tagNumber || ''));
  });

  const title = sheetType === 'weighing' 
    ? 'PLANILLA DE CAMPO - JORNADA DE PESAJE DE CONTROL'
    : sheetType === 'entry'
    ? 'PLANILLA DE CAMPO - REGISTRO DE INGRESO DE GANADO'
    : 'PLANILLA DE CAMPO - REGISTRO GENERAL DE BÁSCULA';

  // Construcción de filas de datos
  const rows = [];

  // 1. Encabezado institucional
  rows.push([title]);
  rows.push([`Hacienda / Finca: ${farmName}`, '', '', `Fecha: ${todayStr}`, '', `Lote: ${batchName === 'all' ? 'Todos los Lotes' : batchName}`]);
  rows.push([`Dueño / Hierro: ${ownerName === 'all' ? 'Todos los Dueños' : ownerName}`, '', '', `Responsable: ${responsible || 'Mayordomo / Administrador'}`, '', 'Clima: [  ] Sol  [  ] Lluvia  [  ] Nublado']);
  rows.push([]); // Espacio

  // 2. Cabeceras de tabla
  if (sheetType === 'weighing') {
    rows.push([
      'N°',
      'CHAPETA (*)',
      'NOMBRE / REF',
      'SEXO',
      'HIERRO / MARCA',
      'LOTE',
      'PESO ANTERIOR (kg)',
      'NUEVO PESO (kg) [ESCRIBIR AQUÍ]',
      'OBSERVACIONES / SANIDAD / NOTAS'
    ]);

    // Renglones de animales existentes
    targetCattle.forEach((c, idx) => {
      const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(c.id));
      const wm = calculateWeightMetrics(c, animalWeighs);
      const prevWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;

      rows.push([
        idx + 1,
        c.tagNumber,
        c.name || '',
        c.sex || 'Macho',
        c.ironBrand || '',
        c.entryBatch || c.paddock || '',
        prevWeight > 0 ? Number(prevWeight.toFixed(1)) : '',
        '', // Espacio para escribir el nuevo peso
        ''  // Observaciones
      ]);
    });

    // Renglones en blanco adicionales para animales no registrados
    for (let i = 0; i < extraBlankRows; i++) {
      rows.push([
        targetCattle.length + i + 1,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }
  } else {
    // Planilla de Ingreso o General
    rows.push([
      'N°',
      'CHAPETA (*)',
      'NOMBRE / REF',
      'SEXO (M/H)',
      'HIERRO / MARCA',
      'DUEÑO',
      'RAZA / COLOR',
      'PESO ENTRADA (kg)',
      'PRECIO COMPRA ($)',
      'LOTE DESTINO',
      'OBSERVACIONES'
    ]);

    for (let i = 0; i < Math.max(30, extraBlankRows + 10); i++) {
      rows.push([i + 1, '', '', '', '', '', '', '', '', '', '']);
    }
  }

  // Crear Worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Estilos de celdas
  const blackBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '1E3A8A' } }, // Azul profesional
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: blackBorder
  };

  const inputHeaderStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '047857' } }, // Verde para la columna de nuevo peso
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: blackBorder
  };

  const dataStyle = {
    font: { sz: 10 },
    alignment: { vertical: 'center' },
    border: blackBorder
  };

  const dataCenterStyle = {
    font: { sz: 10, bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: blackBorder
  };

  const inputCellStyle = {
    font: { sz: 11, bold: true, color: { rgb: '047857' } },
    fill: { fgColor: { rgb: 'ECFDF5' } }, // Fondo verde claro para facilitar la escritura
    alignment: { horizontal: 'center', vertical: 'center' },
    border: blackBorder
  };

  // Aplicar anchos de columnas
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 16 }, // Chapeta
    { wch: 18 }, // Nombre
    { wch: 10 }, // Sexo
    { wch: 15 }, // Hierro
    { wch: 14 }, // Lote / Dueño
    { wch: 18 }, // Peso Anterior
    { wch: 24 }, // NUEVO PESO
    { wch: 30 }  // Observaciones
  ];

  // Aplicar estilos por celda
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = 4; R <= range.e.r; ++R) {
    const isHeaderRow = R === 4;
    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      
      if (isHeaderRow) {
        if (C === 7 && sheetType === 'weighing') {
          ws[cellRef].s = inputHeaderStyle;
        } else {
          ws[cellRef].s = headerStyle;
        }
      } else {
        if (C === 7 && sheetType === 'weighing') {
          ws[cellRef].s = inputCellStyle;
        } else if (C === 0 || C === 1 || C === 3) {
          ws[cellRef].s = dataCenterStyle;
        } else {
          ws[cellRef].s = dataStyle;
        }
      }
    }
  }

  // Estilo del título principal
  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleCell]) {
    ws[titleCell].s = {
      font: { bold: true, sz: 14, color: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Planilla de Campo');

  // Guardar archivo
  const filename = `Planilla_${sheetType === 'weighing' ? 'Pesaje' : 'Ingreso'}_${batchName === 'all' ? 'Hato' : `Lote_${batchName}`}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

/**
 * Lee y valida un archivo Excel diligenciado de la Planilla de Campo
 */
export async function parseFieldSheetExcel(file, existingCattle = [], weighings = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!json || json.length < 5) {
          throw new Error('El archivo Excel está vacío o no tiene el formato de planilla esperado.');
        }

        // Buscar la fila de encabezados
        let headerRowIndex = -1;
        let tagColIndex = -1;
        let weightColIndex = -1;
        let notesColIndex = -1;
        let prevWeightColIndex = -1;

        for (let i = 0; i < Math.min(json.length, 10); i++) {
          const row = json[i];
          if (!row || !Array.isArray(row)) continue;

          row.forEach((cell, colIdx) => {
            const str = String(cell || '').toUpperCase().trim();
            if (str.includes('CHAPETA') || str.includes('IDENTIFICACION') || str.includes('NUMERO') || str === 'TAG') {
              tagColIndex = colIdx;
              headerRowIndex = i;
            }
            if (str.includes('NUEVO PESO') || str.includes('PESO ACTUAL') || (str.includes('PESO') && !str.includes('ANTERIOR') && !str.includes('ENTRADA'))) {
              weightColIndex = colIdx;
            }
            if (str.includes('PESO ANTERIOR') || str.includes('PESO INICIAL')) {
              prevWeightColIndex = colIdx;
            }
            if (str.includes('OBSERVACION') || str.includes('SANIDAD') || str.includes('NOTAS') || str.includes('DETALLE')) {
              notesColIndex = colIdx;
            }
          });

          if (tagColIndex !== -1 && (weightColIndex !== -1 || headerRowIndex !== -1)) {
            break;
          }
        }

        if (tagColIndex === -1) {
          throw new Error('No se encontró la columna de "CHAPETA" en la planilla.');
        }

        // Si no encontró columna explícita de nuevo peso, asumir la columna 7 u 8
        if (weightColIndex === -1) {
          weightColIndex = 7;
        }

        // Mapa de animales existentes por chapeta
        const cattleMap = new Map();
        existingCattle.forEach(c => {
          if (c.tagNumber) {
            cattleMap.set(String(c.tagNumber).trim().toLowerCase(), c);
          }
        });

        const parsedRows = [];
        const unrecognizedTags = [];

        for (let r = headerRowIndex + 1; r < json.length; r++) {
          const row = json[r];
          if (!row || row.length === 0) continue;

          const rawTag = row[tagColIndex];
          if (rawTag === undefined || rawTag === null || String(rawTag).trim() === '') continue;

          const cleanTag = String(rawTag).trim();
          const rawWeight = row[weightColIndex];
          let cleanWeight = null;

          if (rawWeight !== undefined && rawWeight !== null && String(rawWeight).trim() !== '') {
            const num = parseFloat(String(rawWeight).replace(',', '.'));
            if (!isNaN(num) && num > 0) {
              cleanWeight = Number(num.toFixed(1));
            }
          }

          const rawNotes = notesColIndex !== -1 && row[notesColIndex] ? String(row[notesColIndex]).trim() : '';

          const existingAnimal = cattleMap.get(cleanTag.toLowerCase());

          let prevWeight = 0;
          let weightGain = 0;
          let estimatedGdp = 0;

          if (existingAnimal) {
            const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(existingAnimal.id));
            const wm = calculateWeightMetrics(existingAnimal, animalWeighs);
            prevWeight = wm.currentWeight || parseFloat(existingAnimal.currentWeight) || parseFloat(existingAnimal.entryWeight) || 0;

            if (cleanWeight && prevWeight > 0) {
              weightGain = Number((cleanWeight - prevWeight).toFixed(1));
              const days = wm.lastWeighDate ? getDaysDifference(wm.lastWeighDate, new Date()) : 30;
              estimatedGdp = days > 0 ? Number((weightGain / days).toFixed(3)) : 0;
            }
          } else {
            unrecognizedTags.push(cleanTag);
          }

          parsedRows.push({
            rowNumber: r + 1,
            tagNumber: cleanTag,
            newWeight: cleanWeight,
            prevWeight,
            weightGain,
            estimatedGdp,
            notes: rawNotes,
            exists: !!existingAnimal,
            animal: existingAnimal || null,
            status: cleanWeight ? (existingAnimal ? 'valid' : 'new_tag') : 'no_weight'
          });
        }

        resolve({
          totalRows: parsedRows.length,
          validRows: parsedRows.filter(p => p.status === 'valid'),
          unrecognizedTags,
          rows: parsedRows
        });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Aplica los pesajes y actualizaciones masivas en la base de datos
 */
export async function applyFieldSheetUpdates({
  rows = [],
  weighDate = new Date().toISOString().split('T')[0],
  userId,
  batchNotes = 'Jornada de pesaje por planilla de campo'
}) {
  const validUpdates = rows.filter(r => r.exists && r.newWeight > 0 && r.animal);
  if (validUpdates.length === 0) {
    throw new Error('No hay filas válidas con pesos para actualizar.');
  }

  const updatedCattleIds = [];
  const newWeighings = [];

  for (const item of validUpdates) {
    const animal = item.animal;
    const newWeight = item.newWeight;
    const notes = item.notes ? `${batchNotes} - ${item.notes}` : batchNotes;

    // 1. Crear nuevo registro de pesaje
    const weighingRecord = {
      cattleId: animal.id,
      date: weighDate,
      weight: newWeight,
      notes: notes,
      createdAt: new Date().toISOString(),
      userId: userId || animal.userId || null
    };

    const weighingId = await db.weighings.add(weighingRecord);
    newWeighings.push({ ...weighingRecord, id: weighingId });

    // 2. Actualizar animal
    await db.cattle.update(animal.id, {
      currentWeight: newWeight,
      lastWeighDate: weighDate,
      updatedAt: new Date().toISOString()
    });

    updatedCattleIds.push(animal.id);
  }

  // 3. Sincronizar en la nube si hay usuario activo
  if (userId) {
    try {
      await cloudPushData(userId);
    } catch (e) {
      console.warn('Error en sincronización post-planilla:', e);
    }
  }

  return {
    success: true,
    count: validUpdates.length,
    updatedCattleIds,
    newWeighings
  };
}

/**
 * Asistente inteligente para extracción de renglones desde foto de planilla escrita a mano
 */
export function extractRowsFromImageText(rawText = '', existingCattle = []) {
  if (!rawText || typeof rawText !== 'string') return [];

  const cattleMap = new Map();
  existingCattle.forEach(c => {
    if (c.tagNumber) {
      cattleMap.set(String(c.tagNumber).trim().toLowerCase(), c);
    }
  });

  const lines = rawText.split(/\r?\n/);
  const detectedRows = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Buscar patrones de [Chapeta] seguido o cercano a [Peso]
    // Ej: "105 480.5", "Chapeta: 102 - 510 kg", "103 / 465", "#104 490"
    const numberMatches = trimmed.match(/\b\d+(?:[.,]\d+)?\b/g);

    if (numberMatches && numberMatches.length >= 1) {
      let candidateTag = null;
      let candidateWeight = null;

      if (numberMatches.length === 1) {
        const num = parseFloat(numberMatches[0].replace(',', '.'));
        if (num >= 150 && num <= 900) {
          candidateWeight = num;
        } else {
          candidateTag = String(numberMatches[0]);
        }
      } else if (numberMatches.length >= 2) {
        // Asumir que el primer número es la chapeta y el segundo el peso o viceversa
        const first = parseFloat(numberMatches[0].replace(',', '.'));
        const second = parseFloat(numberMatches[1].replace(',', '.'));

        if (second >= 100 && second <= 950) {
          candidateTag = String(numberMatches[0]);
          candidateWeight = second;
        } else if (first >= 100 && first <= 950) {
          candidateWeight = first;
          candidateTag = String(numberMatches[1]);
        } else {
          candidateTag = String(numberMatches[0]);
          candidateWeight = second;
        }
      }

      if (candidateTag || candidateWeight) {
        const matchedAnimal = candidateTag ? cattleMap.get(candidateTag.toLowerCase()) : null;
        detectedRows.push({
          id: `row_${index}_${Date.now()}`,
          tagNumber: candidateTag || (matchedAnimal ? matchedAnimal.tagNumber : ''),
          newWeight: candidateWeight || '',
          notes: trimmed.replace(/\b\d+(?:[.,]\d+)?\b/g, '').replace(/[-_:#/]/g, ' ').trim(),
          exists: !!matchedAnimal,
          animal: matchedAnimal || null,
          rawLine: trimmed
        });
      }
    }
  });

  return detectedRows;
}
