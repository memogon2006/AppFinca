import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Upload, 
  Camera, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Boxes, 
  Tag, 
  Calendar, 
  User, 
  Sparkles, 
  RefreshCw, 
  Scale, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  ArrowRight,
  Check,
  RotateCw
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateWeightMetrics } from '../../services/calculations';
import { generateFieldSheetExcel, parseFieldSheetExcel, applyFieldSheetUpdates, extractRowsFromImageText } from '../../services/fieldSheetService';
import { useAuth } from '../../context/AuthContext';

export function FieldSheetModal({ 
  isOpen, 
  onClose, 
  cattle = [], 
  weighings = [], 
  farmName = 'Hacienda Ganadera',
  onDataChanged,
  zIndex = 'z-[75]'
}) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'uploadExcel' | 'uploadPhoto'

  // Opciones de Generación
  const [sheetType, setSheetType] = useState('weighing'); // 'weighing' | 'entry' | 'blank'
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [extraRowsCount, setExtraRowsCount] = useState(10);
  const [responsibleName, setResponsibleName] = useState(currentUser?.name || '');
  const [weighDate, setWeighDate] = useState(new Date().toISOString().split('T')[0]);

  // Estado de Carga Excel
  const [excelFile, setExcelFile] = useState(null);
  const [excelParsing, setExcelParsing] = useState(false);
  const [excelResult, setExcelResult] = useState(null);
  const [excelError, setExcelError] = useState(null);
  const [isApplyingExcel, setIsApplyingExcel] = useState(false);
  const fileInputRef = useRef(null);

  // Estado de Carga por Foto (OCR / Escaneo Asistido)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [scannedRows, setScannedRows] = useState([]);
  const [manualNoteText, setManualNoteText] = useState('');
  const [isApplyingPhoto, setIsApplyingPhoto] = useState(false);
  const cameraInputRef = useRef(null);

  // Mensaje de éxito o notificación
  const [statusMessage, setStatusMessage] = useState(null);

  // Reiniciar estados al abrir
  useEffect(() => {
    if (isOpen) {
      setExcelFile(null);
      setExcelResult(null);
      setExcelError(null);
      setPhotoFile(null);
      setPhotoPreviewUrl(null);
      setScannedRows([]);
      setPhotoError(null);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lista de lotes únicos
  const batchesList = Array.from(
    new Set(cattle.map(c => c.entryBatch || c.paddock).filter(Boolean))
  ).sort();

  // Lista de dueños únicos
  const ownersList = Array.from(
    new Set(cattle.map(c => (c.owner || 'Hacienda Principal').trim()).filter(Boolean))
  ).sort();

  // Animales filtrados para la planilla imprimible
  const targetCattle = cattle.filter(c => {
    if (c.status !== 'Activo') return false;
    if (selectedBatch !== 'all' && (c.entryBatch || c.paddock || '').trim() !== selectedBatch.trim()) {
      return false;
    }
    if (selectedOwner !== 'all' && (c.owner || 'Hacienda Principal').trim() !== selectedOwner.trim()) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    const numA = parseInt(a.tagNumber, 10);
    const numB = parseInt(b.tagNumber, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.tagNumber || '').localeCompare(String(b.tagNumber || ''));
  });

  // 1. Manejo de Descarga de Excel
  const handleDownloadExcel = () => {
    try {
      generateFieldSheetExcel({
        cattle,
        weighings,
        farmName,
        batchName: selectedBatch,
        ownerName: selectedOwner,
        sheetType,
        extraBlankRows: parseInt(extraRowsCount, 10) || 10,
        responsible: responsibleName
      });
      setStatusMessage({ type: 'success', text: '📥 Plantilla de Excel descargada exitosamente en tu dispositivo.' });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error al generar Excel: ' + e.message });
    }
  };

  // 2. Manejo de Impresión Física (PDF nativo)
  const handlePrint = () => {
    window.print();
  };

  // 3. Manejo de Carga y Lectura de Archivo Excel
  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setExcelParsing(true);
    setExcelError(null);
    setExcelResult(null);

    try {
      const result = await parseFieldSheetExcel(file, cattle, weighings);
      setExcelResult(result);
    } catch (err) {
      setExcelError(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setExcelParsing(false);
    }
  };

  // 4. Aplicar Pesajes desde Excel
  const handleApplyExcelUpdates = async () => {
    if (!excelResult || !excelResult.validRows || excelResult.validRows.length === 0) {
      alert('No hay filas válidas con pesos reconocidos para guardar.');
      return;
    }

    if (!window.confirm(`¿Confirmas la actualización de ${excelResult.validRows.length} pesajes de animales en el sistema con fecha ${formatDate(weighDate)}?`)) {
      return;
    }

    try {
      setIsApplyingExcel(true);
      await applyFieldSheetUpdates({
        rows: excelResult.validRows,
        weighDate,
        userId,
        batchNotes: `Jornada Planilla Excel (${excelFile?.name || 'Archivo'})`
      });

      setStatusMessage({ 
        type: 'success', 
        text: `✅ ¡Éxito! Se actualizaron correctamente ${excelResult.validRows.length} pesajes en el inventario.` 
      });

      if (onDataChanged) onDataChanged();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setExcelError(err.message || 'Error al aplicar los pesajes.');
    } finally {
      setIsApplyingExcel(false);
    }
  };

  // 5. Manejo de Carga de Foto de Planilla
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoError(null);
    const preview = URL.createObjectURL(file);
    setPhotoPreviewUrl(preview);

    // Iniciar asistente de extracción de datos
    setIsProcessingPhoto(true);
    
    // Simulación / Extracción de prueba inicial y preparación de filas
    setTimeout(() => {
      // Intentar auto-generar las filas basadas en los animales del lote seleccionado
      // o inicializar filas vacías/reconocidas para validación rápida
      const initialRows = targetCattle.slice(0, 15).map((c, idx) => {
        const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(c.id));
        const wm = calculateWeightMetrics(c, animalWeighs);
        const prevWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;

        return {
          id: `photo_row_${idx}`,
          tagNumber: c.tagNumber,
          newWeight: '',
          prevWeight,
          notes: '',
          exists: true,
          animal: c
        };
      });

      setScannedRows(initialRows);
      setIsProcessingPhoto(false);
    }, 1200);
  };

  // 6. Asistente para procesar texto pegado o reconocido
  const handleProcessRawText = () => {
    if (!manualNoteText.trim()) return;
    const extracted = extractRowsFromImageText(manualNoteText, cattle);
    if (extracted.length > 0) {
      setScannedRows(extracted);
      setStatusMessage({ type: 'success', text: `Se reconocieron ${extracted.length} registros del texto.` });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('No se detectaron pares de Chapeta y Peso en el texto. Verifica el formato (ej. 101 480).');
    }
  };

  // 7. Modificar fila en tabla de foto
  const handleUpdateScannedRow = (id, field, value) => {
    setScannedRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'tagNumber') {
        const found = cattle.find(c => String(c.tagNumber).trim().toLowerCase() === String(value).trim().toLowerCase());
        updated.exists = !!found;
        updated.animal = found || null;
        if (found) {
          const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(found.id));
          const wm = calculateWeightMetrics(found, animalWeighs);
          updated.prevWeight = wm.currentWeight || parseFloat(found.currentWeight) || parseFloat(found.entryWeight) || 0;
        }
      }
      return updated;
    }));
  };

  const handleAddScannedRow = () => {
    setScannedRows(prev => [
      ...prev,
      {
        id: `row_new_${Date.now()}`,
        tagNumber: '',
        newWeight: '',
        prevWeight: 0,
        notes: '',
        exists: false,
        animal: null
      }
    ]);
  };

  const handleDeleteScannedRow = (id) => {
    setScannedRows(prev => prev.filter(r => r.id !== id));
  };

  // 8. Aplicar Pesajes desde Foto Escaneada
  const handleApplyPhotoUpdates = async () => {
    const validRows = scannedRows
      .filter(r => r.exists && r.newWeight && parseFloat(r.newWeight) > 0 && r.animal)
      .map(r => ({
        ...r,
        newWeight: parseFloat(r.newWeight)
      }));

    if (validRows.length === 0) {
      alert('Debes ingresar al menos un nuevo peso válido para un animal registrado.');
      return;
    }

    if (!window.confirm(`¿Confirmas la actualización de ${validRows.length} pesajes en el sistema con fecha ${formatDate(weighDate)}?`)) {
      return;
    }

    try {
      setIsApplyingPhoto(true);
      await applyFieldSheetUpdates({
        rows: validRows,
        weighDate,
        userId,
        batchNotes: 'Jornada Planilla de Campo (Foto/Escaneo)'
      });

      setStatusMessage({ 
        type: 'success', 
        text: `✅ ¡Éxito! Se actualizaron correctamente ${validRows.length} pesajes en el inventario.` 
      });

      if (onDataChanged) onDataChanged();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setPhotoError(err.message || 'Error al guardar los pesajes.');
    } finally {
      setIsApplyingPhoto(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SECCIÓN DE IMPRESIÓN FÍSICA OCULTA EN PANTALLA, VISIBLE SOLO EN PRINT   */}
      {/* ========================================================================= */}
      <div id="field-sheet-print-area" className="hidden print:block text-black bg-white p-4 font-sans">
        {/* Cabecera de la Planilla */}
        <div className="border-b-2 border-black pb-3 mb-3">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-black">
                {farmName}
              </h1>
              <h2 className="text-sm font-bold text-gray-800 uppercase mt-0.5">
                {sheetType === 'weighing' ? '📋 PLANILLA DE CAMPO - JORNADA DE PESAJE DE BÁSCULA' : '📋 PLANILLA DE CAMPO - INGRESO DE GANADO'}
              </h2>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Fecha: <span className="font-normal underline decoration-dotted">{formatDate(weighDate)}</span></p>
              <p className="font-bold mt-1">Lote / Potrero: <span className="font-normal">{selectedBatch === 'all' ? 'Todos los lotes' : selectedBatch}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-gray-400 text-[11px]">
            <div>
              <span className="font-bold">Dueño / Hierro: </span>
              <span>{selectedOwner === 'all' ? 'Todos los dueños' : selectedOwner}</span>
            </div>
            <div>
              <span className="font-bold">Responsable Pesaje: </span>
              <span>{responsibleName || '________________________'}</span>
            </div>
            <div className="text-right">
              <span className="font-bold">Clima: </span>
              <span>[  ] Sol &nbsp; [  ] Lluvia &nbsp; [  ] Nublado</span>
            </div>
          </div>
        </div>

        {/* Tabla Cuadriculada de Alta Legibilidad */}
        <table className="w-full border-collapse border-2 border-black text-[10px]">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-black text-center font-bold">
              <th className="border border-black p-1.5 w-7">N°</th>
              <th className="border border-black p-1.5 w-20 text-left">CHAPETA</th>
              <th className="border border-black p-1.5 w-24 text-left">NOMBRE / REF</th>
              <th className="border border-black p-1.5 w-14">SEXO</th>
              <th className="border border-black p-1.5 w-16">HIERRO</th>
              <th className="border border-black p-1.5 w-20">PESO ANT.</th>
              <th className="border-2 border-black p-1.5 w-28 bg-gray-300 text-black">NUEVO PESO (kg)</th>
              <th className="border border-black p-1.5">OBSERVACIONES / SANIDAD</th>
            </tr>
          </thead>
          <tbody>
            {targetCattle.map((c, idx) => {
              const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(c.id));
              const wm = calculateWeightMetrics(c, animalWeighs);
              const prevWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;

              return (
                <tr key={c.id} className="border-b border-black h-8 text-center">
                  <td className="border border-black font-bold text-gray-700">{idx + 1}</td>
                  <td className="border border-black font-black text-left px-1.5 text-xs">#{c.tagNumber}</td>
                  <td className="border border-black text-left px-1.5 truncate max-w-[100px]">{c.name || '-'}</td>
                  <td className="border border-black font-medium">{c.sex === 'Hembra' ? 'H' : 'M'}</td>
                  <td className="border border-black font-bold">{c.ironBrand || '-'}</td>
                  <td className="border border-black font-medium text-gray-800">{prevWeight > 0 ? `${formatNumber(prevWeight, 1)} kg` : '-'}</td>
                  <td className="border-2 border-black bg-gray-50/50"></td>
                  <td className="border border-black"></td>
                </tr>
              );
            })}

            {/* Filas en blanco adicionales */}
            {Array.from({ length: parseInt(extraRowsCount, 10) || 10 }).map((_, idx) => (
              <tr key={`blank_${idx}`} className="border-b border-black h-8 text-center">
                <td className="border border-black text-gray-400 font-bold">{targetCattle.length + idx + 1}</td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border-2 border-black bg-gray-50/50"></td>
                <td className="border border-black"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Firmas de Control */}
        <div className="mt-8 pt-6 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-black w-3/4 mx-auto pt-1 font-bold">Firma del Pesador / Mayordomo</div>
            <p className="text-[10px] text-gray-600">Responsable de captura en báscula</p>
          </div>
          <div>
            <div className="border-t border-black w-3/4 mx-auto pt-1 font-bold">Firma del Administrador / Propietario</div>
            <p className="text-[10px] text-gray-600">Verificación y liquidación</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODAL INTERACTIVO PRINCIPAL DE LA APLICACIÓN                            */}
      {/* ========================================================================= */}
      <div className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm ${zIndex} flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:hidden`}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in my-auto">
          
          {/* Cabecera Principal */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-xl">
                📋
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Planillas de Campo & Báscula</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    Estandarizado
                  </span>
                </h2>
                <p className="text-xs text-blue-100 font-medium">
                  Imprime planillas físicas de campo, carga datos diligenciados en Excel o sube una foto con los datos escritos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas Principales */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>1. Generar & Imprimir Planilla</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('uploadExcel')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'uploadExcel'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>2. Cargar Planilla en Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('uploadPhoto')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'uploadPhoto'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>3. Cargar Foto de Planilla Escrita</span>
            </button>
          </div>

          {/* Banner de Notificaciones de Estado */}
          {statusMessage && (
            <div className={`p-3 text-xs font-bold flex items-center justify-between border-b ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ======================================================================= */}
          {/* CUERPO DE LAS PESTAÑAS                                                  */}
          {/* ======================================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
            {/* PESTAÑA 1: GENERAR E IMPRIMIR PLANILLA */}
            {activeTab === 'generate' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Opciones de Configuración (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Configurar Planilla a Imprimir</span>
                    </h3>

                    {/* Tipo de Planilla */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Tipo de Labor / Planilla:
                      </label>
                      <select
                        value={sheetType}
                        onChange={(e) => setSheetType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="weighing">⚖️ Jornada de Pesaje de Control (Báscula)</option>
                        <option value="entry">🐂 Ingreso / Compra de Ganado Nuevo</option>
                      </select>
                    </div>

                    {/* Filtro por Lote */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Boxes className="w-3.5 h-3.5 text-blue-500" />
                        <span>Filtrar por Lote:</span>
                      </label>
                      <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">🌐 Todos los Lotes ({cattle.filter(c => c.status === 'Activo').length} activos)</option>
                        {batchesList.map(b => (
                          <option key={b} value={b}>
                            🏷️ Lote {b} ({cattle.filter(c => c.status === 'Activo' && (c.entryBatch || c.paddock) === b).length} animales)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por Dueño */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span>Filtrar por Dueño / Marca:</span>
                      </label>
                      <select
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">👥 Todos los Dueños</option>
                        {ownersList.map(o => (
                          <option key={o} value={o}>
                            👤 {o} ({cattle.filter(c => c.status === 'Activo' && (c.owner || 'Hacienda Principal') === o).length} animales)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filas en blanco adicionales */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Filas vacías extra:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={extraRowsCount}
                          onChange={(e) => setExtraRowsCount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Fecha de pesaje:
                        </label>
                        <input
                          type="date"
                          value={weighDate}
                          onChange={(e) => setWeighDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Responsable / Pesador:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Juan Pérez (Mayordomo)"
                        value={responsibleName}
                        onChange={(e) => setResponsibleName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Botones de Acción para Imprimir y Descargar */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>🖨️ Imprimir Planilla Física (o Guardar en PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>📥 Descargar Planilla en Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Vista Previa de la Planilla en Pantalla (7 cols) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Vista Previa de la Planilla:</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                      {targetCattle.length} animales precargados + {extraRowsCount} vacías
                    </span>
                  </div>

                  {/* Hoja de papel simulada */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner flex-1 max-h-[460px] overflow-y-auto">
                    <div className="bg-white text-slate-900 p-5 rounded-xl shadow-md border border-slate-300 text-xs font-sans space-y-3">
                      
                      {/* Cabecera simulación */}
                      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-tight">{farmName}</h4>
                          <p className="text-[10px] font-bold text-slate-600 uppercase">
                            {sheetType === 'weighing' ? 'Planilla de Báscula y Control de Pesajes' : 'Planilla de Ingreso de Ganado'}
                          </p>
                        </div>
                        <div className="text-right text-[10px]">
                          <p><strong>Fecha:</strong> {formatDate(weighDate)}</p>
                          <p><strong>Lote:</strong> {selectedBatch === 'all' ? 'Todos' : selectedBatch}</p>
                        </div>
                      </div>

                      {/* Tabla previa */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-400 text-[10px]">
                          <thead>
                            <tr className="bg-slate-200 border-b border-slate-400 font-bold text-center">
                              <th className="border border-slate-400 p-1 w-6">N°</th>
                              <th className="border border-slate-400 p-1 text-left">Chapeta</th>
                              <th className="border border-slate-400 p-1 text-left">Nombre</th>
                              <th className="border border-slate-400 p-1">Sexo</th>
                              <th className="border border-slate-400 p-1">Peso Ant.</th>
                              <th className="border-2 border-blue-600 bg-blue-50 p-1 text-blue-900 font-black">Nuevo Peso (kg)</th>
                              <th className="border border-slate-400 p-1">Observaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {targetCattle.slice(0, 8).map((c, idx) => {
                              const animalWeighs = (weighings || []).filter(w => String(w.cattleId) === String(c.id));
                              const wm = calculateWeightMetrics(c, animalWeighs);
                              const prevWeight = wm.currentWeight || parseFloat(c.currentWeight) || parseFloat(c.entryWeight) || 0;

                              return (
                                <tr key={c.id} className="border-b border-slate-300 text-center">
                                  <td className="border border-slate-300 font-bold text-slate-500">{idx + 1}</td>
                                  <td className="border border-slate-300 font-black text-left px-1.5 text-blue-700">#{c.tagNumber}</td>
                                  <td className="border border-slate-300 text-left px-1.5 truncate max-w-[80px]">{c.name || '-'}</td>
                                  <td className="border border-slate-300">{c.sex === 'Hembra' ? 'H' : 'M'}</td>
                                  <td className="border border-slate-300 font-medium">{prevWeight > 0 ? `${formatNumber(prevWeight, 1)} kg` : '-'}</td>
                                  <td className="border-2 border-blue-500 bg-blue-50/40 text-center text-slate-400 italic">Escribir a mano</td>
                                  <td className="border border-slate-300 text-slate-400 italic">Sanidad / notas</td>
                                </tr>
                              );
                            })}
                            {targetCattle.length > 8 && (
                              <tr className="bg-slate-50 text-slate-500 italic text-center">
                                <td colSpan="7" className="p-2 border border-slate-300">
                                  ... y {targetCattle.length - 8} animales más listados para la hoja impresa ...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* PESTAÑA 2: CARGAR PLANILLA DILIGENCIADA EN EXCEL */}
            {activeTab === 'uploadExcel' && (
              <div className="space-y-5">
                
                {/* Zona de Drop & Carga */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 rounded-3xl text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleExcelFileChange}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {excelFile ? excelFile.name : 'Haz clic para seleccionar o arrastra aquí tu archivo Excel diligenciado'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Acepta la planilla de campo estándar o cualquier archivo Excel con columnas de <strong>Chapeta</strong> y <strong>Nuevo Peso</strong>.
                  </p>
                </div>

                {excelParsing && (
                  <div className="flex items-center justify-center gap-2 p-6 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analizando archivo Excel y validando animales...</span>
                  </div>
                )}

                {excelError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{excelError}</span>
                  </div>
                )}

                {/* Previsualización de los datos parseados del Excel */}
                {excelResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>Pesajes Encontrados en el Excel:</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                            {excelResult.validRows.length} válidos para actualizar
                          </span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Fecha del pesaje:
                        </label>
                        <input
                          type="date"
                          value={weighDate}
                          onChange={(e) => setWeighDate(e.target.value)}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Tabla interactiva con diferencias de peso */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2.5">Chapeta</th>
                            <th className="p-2.5">Nombre / Lote</th>
                            <th className="p-2.5">Peso Anterior</th>
                            <th className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black">Nuevo Peso</th>
                            <th className="p-2.5">Ganancia</th>
                            <th className="p-2.5">GDP Est.</th>
                            <th className="p-2.5">Notas / Sanidad</th>
                            <th className="p-2.5 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {excelResult.rows.map((row, i) => (
                            <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!row.exists ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                              <td className="p-2.5 font-black text-slate-900 dark:text-white">
                                #{row.tagNumber}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                {row.animal ? `${row.animal.name || ''} ${row.animal.entryBatch ? `(Lote ${row.animal.entryBatch})` : ''}` : <span className="text-amber-600 font-bold">No registrado en hato</span>}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400 tabular-nums font-medium">
                                {row.prevWeight > 0 ? `${formatNumber(row.prevWeight, 1)} kg` : '-'}
                              </td>
                              <td className="p-2.5 font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 tabular-nums">
                                {row.newWeight ? `${formatNumber(row.newWeight, 1)} kg` : <span className="text-slate-400 font-normal italic">Sin peso</span>}
                              </td>
                              <td className="p-2.5 font-bold tabular-nums">
                                {row.weightGain > 0 ? (
                                  <span className="text-emerald-600">+{formatNumber(row.weightGain, 1)} kg</span>
                                ) : row.weightGain < 0 ? (
                                  <span className="text-rose-600">{formatNumber(row.weightGain, 1)} kg</span>
                                ) : '-'}
                              </td>
                              <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                {row.estimatedGdp > 0 ? `+${formatNumber(row.estimatedGdp, 3)} kg/d` : '-'}
                              </td>
                              <td className="p-2.5 text-slate-500 text-[11px] truncate max-w-[140px]">
                                {row.notes || '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                {row.status === 'valid' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                    <Check className="w-3 h-3" /> Válido
                                  </span>
                                ) : row.status === 'new_tag' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                    Chapeta no existe
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                                    Vacio
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Botón de Confirmar Actualización Masiva */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyExcelUpdates}
                        disabled={isApplyingExcel || excelResult.validRows.length === 0}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isApplyingExcel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>✅ Confirmar y Actualizar {excelResult.validRows.length} Animales en el Hato</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* PESTAÑA 3: CARGAR FOTO DE PLANILLA ESCRITA A MANO (OCR) */}
            {activeTab === 'uploadPhoto' && (
              <div className="space-y-5">
                
                {/* Si no hay foto cargada */}
                {!photoPreviewUrl ? (
                  <div className="space-y-4">
                    <div 
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-400 dark:border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 p-8 rounded-3xl text-center cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 transition group"
                    >
                      <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handlePhotoFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />
                      <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition">
                        <Camera className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Tomar Foto con el Celular o Subir Imagen de la Planilla
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Toma una foto clara y bien iluminada de la hoja de papel donde anotaste las chapetas y los pesos a mano.
                      </p>
                    </div>

                    {/* Alternativa rápida: Pegar texto o notas dictadas por voz */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>O también puedes pegar texto / dictado de pesaje:</span>
                        <span className="text-[10px] text-slate-400">Ej: 101 480 / 102 510</span>
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          rows="2"
                          value={manualNoteText}
                          onChange={(e) => setManualNoteText(e.target.value)}
                          placeholder="Ejemplo: #101 485.5 novillo listo, #102 490, 103 460.5..."
                          className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleProcessRawText}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 self-end transition cursor-pointer"
                        >
                          Extraer Renglones
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Vista Dividida: Foto a la izquierda + Tabla Editable a la derecha */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Panel de la Foto (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-purple-600" />
                          <span>Foto de la Planilla:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreviewUrl(null);
                            setPhotoFile(null);
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          Cambiar Foto
                        </button>
                      </div>

                      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 max-h-[380px] overflow-hidden flex items-center justify-center relative group">
                        <img
                          src={photoPreviewUrl}
                          alt="Planilla de campo"
                          className="max-h-[360px] w-auto object-contain rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Tabla de Verificación y Edición Rápida (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                            Validar Datos Reconocidos:
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Verifica o corrige los números antes de confirmar la actualización
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddScannedRow}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center gap-1 hover:bg-purple-200 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Fila</span>
                        </button>
                      </div>

                      {/* Tabla editable */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            <tr>
                              <th className="p-2 w-28">Chapeta</th>
                              <th className="p-2 w-24">Nuevo Peso (kg)</th>
                              <th className="p-2">Notas / Sanidad</th>
                              <th className="p-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                            {scannedRows.map((row) => (
                              <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!row.exists ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                                <td className="p-1.5">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={row.tagNumber}
                                      onChange={(e) => handleUpdateScannedRow(row.id, 'tagNumber', e.target.value)}
                                      placeholder="Chapeta"
                                      className={`w-full px-2 py-1 rounded-lg font-black text-xs border ${
                                        row.exists 
                                          ? 'border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white' 
                                          : 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
                                      }`}
                                    />
                                  </div>
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={row.newWeight}
                                    onChange={(e) => handleUpdateScannedRow(row.id, 'newWeight', e.target.value)}
                                    placeholder="Ej: 480"
                                    className="w-full px-2 py-1 rounded-lg font-black text-xs border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 tabular-nums focus:ring-2 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.notes}
                                    onChange={(e) => handleUpdateScannedRow(row.id, 'notes', e.target.value)}
                                    placeholder="Observación"
                                    className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteScannedRow(row.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Eliminar fila"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Botón de Confirmar Actualización */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleApplyPhotoUpdates}
                          disabled={isApplyingPhoto || scannedRows.filter(r => r.exists && r.newWeight).length === 0}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isApplyingPhoto ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>✅ Confirmar y Registrar Pesajes</span>
                        </button>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </>
  );
}
