import React, { useState } from 'react';
import { Modal } from './Modal';
import { Download, Upload, RefreshCw, FileSpreadsheet, Database, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { exportBackupData, importBackupData, loadSampleData, clearAllData, db } from '../../services/db';
import * as XLSX from 'xlsx';

export function ExportImportModal({ isOpen, onClose, onDataChanged }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleClearAll = async () => {
    if (window.confirm('⚠️ ¿Estás seguro de que deseas ELIMINAR TODOS los animales, pesajes y registros para quedar en CEROS?\n\nEsta acción no se puede deshacer (te recomendamos descargar un respaldo antes).')) {
      try {
        setLoading(true);
        await clearAllData();
        setMessage({ type: 'success', text: '¡Inventario limpiado por completo! Ahora estás en ceros para ingresar tu ganado.' });
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
      await exportBackupData();
      setMessage({ type: 'success', text: 'Copia de seguridad JSON descargada correctamente.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al exportar: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const cattle = await db.cattle.toArray();
      const weighings = await db.weighings.toArray();

      if (cattle.length === 0) {
        setMessage({ type: 'error', text: 'No hay animales en el inventario para exportar a Excel.' });
        return;
      }

      const excelData = cattle.map(c => ({
        'Número Chapa / Arete': c.tagNumber,
        'Nombre': c.name || '',
        'Ingreso #': c.entryBatch || c.paddock || 'Ingreso #1',
        'Hierro / Marca': c.ironBrand || '',
        'Propietario / Dueño': c.owner || '',
        'Sexo': c.sex,
        'Raza': c.breed || '',
        'Categoría': c.category || '',
        'Tipo Producción': c.productionType || '',
        'Estado': c.status || 'Activo',
        'Estado Reproductivo': c.reproductiveStatus || 'N/A',
        'Fecha Servicio': c.serviceDate || '',
        'Estado Leche': c.milkingStatus || 'N/A',
        'Litros/Día': c.dailyMilkLiters || 0,
        'Es Solo Cría': c.isBreedingOnly ? 'Sí' : 'No',
        'Fecha Entrada': c.entryDate || '',
        'Tipo Entrada': c.entryType || '',
        'Peso Entrada (kg)': c.entryWeight || 0,
        'Valor Compra ($)': c.entryPrice || 0,
        'Costos Adicionales ($)': c.additionalCosts || 0,
        'Peso Actual (kg)': c.currentWeight || c.entryWeight || 0,
        'Fecha Salida': c.exitDate || '',
        'Peso Salida (kg)': c.exitWeight || '',
        'Valor Venta ($)': c.exitPrice || '',
        'Comprador / Destino': c.buyer || '',
        'Notas': c.notes || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Inventario Bovino");

      const wsPesajes = XLSX.utils.json_to_sheet(weighings);
      XLSX.utils.book_append_sheet(wb, wsPesajes, "Historial Pesajes");

      XLSX.writeFile(wb, `Inventario_Bovino_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setMessage({ type: 'success', text: 'Archivo Excel generado y descargado exitosamente.' });
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
        const result = await importBackupData(evt.target.result);
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
      await loadSampleData();
      setMessage({ type: 'success', text: 'Datos de ejemplo cargados correctamente.' });
      if (onDataChanged) onDataChanged();
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Datos & Copias de Seguridad" subtitle="Exporta a Excel, descarga respaldos JSON, carga datos o limpia a ceros" maxWidth="max-w-3xl">
      {message && (
        <div className={`p-3.5 sm:p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-xs sm:text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Botón Destacado: Limpiar Todo a Ceros */}
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            Limpiar Todos los Inventarios (Comenzar en Ceros)
          </h4>
          <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-0.5">
            Borra todos los bovinos, pesajes y ventas para que puedas registrar desde cero los animales reales de tu finca.
          </p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap shadow transition min-h-[40px]"
        >
          Limpiar a Ceros
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Exportar Excel */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 sm:mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Exportar a Microsoft Excel</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Descarga una hoja de cálculo con animales, Ingreso #, pesajes, costos y utilidades.</p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition min-h-[44px] text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" /> Exportar Excel (.xlsx)
          </button>
        </div>

        {/* Respaldo JSON */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 sm:mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Copia de Seguridad (JSON)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Guarda una copia exacta de tu base de datos para transferir a otro equipo o guardar un respaldo.</p>
          </div>
          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition min-h-[44px] text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" /> Descargar Respaldo JSON
          </button>
        </div>

        {/* Importar JSON */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 sm:mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Restaurar Respaldo</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Carga un archivo de respaldo JSON previamente descargado para recuperar tu información.</p>
          </div>
          <label className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-center min-h-[44px] text-xs sm:text-sm">
            <Upload className="w-4 h-4" /> Seleccionar Archivo JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        {/* Datos de ejemplo opcionales */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 sm:mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Cargar Datos de Demostración</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Carga un lote de prueba para explorar gráficas y reportes ganaderos si lo deseas.</p>
          </div>
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-amber-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition border border-slate-300 dark:border-amber-500/30 min-h-[44px] text-xs sm:text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Cargar Lote Demo
          </button>
        </div>
      </div>
    </Modal>
  );
}
