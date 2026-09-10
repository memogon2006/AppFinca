import React, { useMemo } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Syringe, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  Building2, 
  Tag, 
  Clock, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatDate } from '../../services/calculations';

export function VaccinationCensusModal({
  isOpen,
  onClose,
  cattle = [],
  vaccinations = [],
  farmName = 'Mi Finca Ganadera',
  farmerName = 'Ganadero',
  onOpenVaccinationModal,
  zIndex = 'z-[60]'
}) {
  if (!isOpen) return null;

  const activeCattle = useMemo(() => cattle.filter(c => c.status === 'Activo'), [cattle]);
  const totalActive = activeCattle.length;

  // Clasificación oficial sanitaria ICA / FEDEGAN
  const census = useMemo(() => {
    let cows = 0;              // Vacas adultas
    let heifers = 0;           // Novillas de vientre 1-3 años
    let brucellosisCalves = 0; // Terneras 3 a 9 meses
    let babyFemales = 0;       // Terneras < 3 meses
    let bulls = 0;             // Toros reproductores
    let steers = 0;            // Toretes y Novillos de ceba 1-3 años
    let maleCalves = 0;        // Terneros machos < 1 año

    activeCattle.forEach(c => {
      const cat = (c.category || '').toLowerCase();
      const sex = c.sex || 'Macho';

      if (sex === 'Hembra') {
        if (cat.includes('vaca')) {
          cows++;
        } else if (cat.includes('novilla')) {
          heifers++;
        } else if (cat.includes('ternera')) {
          // Si tiene fecha de nacimiento, verificar si está entre 3 y 9 meses
          if (c.birthDate) {
            const ageMonths = (new Date() - new Date(c.birthDate)) / (1000 * 60 * 60 * 24 * 30.4375);
            if (ageMonths >= 3 && ageMonths <= 9) {
              brucellosisCalves++;
            } else if (ageMonths < 3) {
              babyFemales++;
            } else {
              heifers++;
            }
          } else {
            brucellosisCalves++;
          }
        } else {
          cows++;
        }
      } else {
        // Macho
        if (cat.includes('toro')) {
          bulls++;
        } else if (cat.includes('novillo') || cat.includes('torete') || cat.includes('ceba')) {
          steers++;
        } else if (cat.includes('ternero')) {
          maleCalves++;
        } else {
          steers++;
        }
      }
    });

    const totalFemales = cows + heifers + brucellosisCalves + babyFemales;
    const totalMales = bulls + steers + maleCalves;

    return {
      cows,
      heifers,
      brucellosisCalves,
      babyFemales,
      bulls,
      steers,
      maleCalves,
      totalFemales,
      totalMales,
      total: activeCattle.length
    };
  }, [activeCattle]);

  // Últimas vacunaciones registradas
  const aftosaRecords = useMemo(() => {
    return vaccinations.filter(v => 
      (v.vaccineCode === 'aftosa' || (v.vaccineType && v.vaccineType.toLowerCase().includes('aftosa')))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [vaccinations]);

  const brucellosisRecords = useMemo(() => {
    return vaccinations.filter(v => 
      (v.vaccineCode === 'brucelosis' || (v.vaccineType && v.vaccineType.toLowerCase().includes('brucelosis')))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [vaccinations]);

  const lastAftosa = aftosaRecords[0] || null;
  const lastBrucellosis = brucellosisRecords[0] || null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 ${zIndex} overflow-y-auto animate-fadeIn`}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Censo Sanitario Oficial FEDEGAN / ICA</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  RUV & SIGMA
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planilla de censo poblacional discriminada por categoría para el vacunador oficial
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 print:p-0 print:space-y-4">

          {/* Membrete Oficial del Reporte */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  REPÚBLICA DE COLOMBIA • INSTITUTO COLOMBIANO AGROPECUARIO (ICA)
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase">
                  {farmName}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Propietario / Responsable: <strong>{farmerName}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                <p><strong>Fecha de Emisión:</strong> {formatDate(new Date())}</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">Total Hato Activo: {totalActive} bovinos</p>
              </div>
            </div>

            {/* Tarjetas de Resumen RUV Aftosa y Brucelosis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">Último RUV Fiebre Aftosa:</p>
                  {lastAftosa ? (
                    <p className="text-emerald-600 dark:text-emerald-400 font-black mt-0.5 truncate">
                      {lastAftosa.ruvNumber ? `RUV: ${lastAftosa.ruvNumber}` : 'Registrado'} • {formatDate(lastAftosa.date)} ({lastAftosa.animalCount} cab.)
                    </p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                      Sin registro de RUV oficial cargado
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 mt-0.5">
                  <Syringe className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">Vacunación Brucelosis Bovina:</p>
                  {lastBrucellosis ? (
                    <p className="text-purple-600 dark:text-purple-400 font-black mt-0.5 truncate">
                      {formatDate(lastBrucellosis.date)} • {lastBrucellosis.animalCount} hembras jóvenes
                    </p>
                  ) : (
                    <p className="text-slate-500 font-semibold mt-0.5">
                      {census.brucellosisCalves} hembras aptas (3-9m) pendientes
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* TABLA DE CENSO POBLACIONAL OFICIAL */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>Distribución por Categorías Etarias y Sexo</span>
              <span className="text-slate-500 text-[11px] font-bold">Base para Expedición de RUV</span>
            </h4>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Categoría de Bovinos (ICA / FEDEGAN)</th>
                    <th className="p-3 text-center">Sexo</th>
                    <th className="p-3 text-center">Rango Etario</th>
                    <th className="p-3 text-right">Cantidad (Cabezas)</th>
                    <th className="p-3 text-right">Vacuna Obligatoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  
                  {/* 1. Vacas adultas */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🐄 1. Vacas Reproductoras (Ordeño / Horras)</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Hembra</td>
                    <td className="p-3 text-center text-slate-500">&gt; 3 años</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.cows}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                  {/* 2. Novillas de vientre */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🐄 2. Novillas de Vientre</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Hembra</td>
                    <td className="p-3 text-center text-slate-500">1 a 3 años</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.heifers}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                  {/* 3. Terneras 3 a 9 meses (Brucelosis) */}
                  <tr className="bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                    <td className="p-3 font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <span>⭐ 3. Terneras Hembras Aptas para Brucelosis</span>
                    </td>
                    <td className="p-3 text-center font-bold text-purple-700 dark:text-purple-300">Hembra</td>
                    <td className="p-3 text-center font-extrabold text-purple-800 dark:text-purple-300">3 a 9 meses</td>
                    <td className="p-3 text-right font-black text-purple-700 dark:text-purple-300 text-sm">{census.brucellosisCalves}</td>
                    <td className="p-3 text-right font-black text-purple-700 dark:text-purple-300">Aftosa + Brucelosis</td>
                  </tr>

                  {/* 4. Terneras menores de 3 meses */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🍼 4. Terneras Hembras Lactantes</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Hembra</td>
                    <td className="p-3 text-center text-slate-500">&lt; 3 meses</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.babyFemales}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                  {/* 5. Toros reproductores */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🐂 5. Toros Reproductores</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Macho</td>
                    <td className="p-3 text-center text-slate-500">&gt; 2 años</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.bulls}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                  {/* 6. Toretes y Novillos de ceba */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🐂 6. Novillos / Toretes de Levante & Ceba</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Macho</td>
                    <td className="p-3 text-center text-slate-500">1 a 3 años</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.steers}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                  {/* 7. Terneros machos */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🍼 7. Terneros Machos Jóvenes</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">Macho</td>
                    <td className="p-3 text-center text-slate-500">&lt; 1 año</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">{census.maleCalves}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Aftosa 100%</td>
                  </tr>

                </tbody>

                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td className="p-3 uppercase tracking-wider" colSpan={3}>
                      TOTAL CENSO BOVINO EN FINCA:
                    </td>
                    <td className="p-3 text-right text-base text-emerald-400">
                      {census.total} CABEZAS
                    </td>
                    <td className="p-3 text-right text-[11px] text-slate-300">
                      100% HATO
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECCIÓN DE FIRMAS PARA EL BRIGADISTA ICA / FEDEGAN */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 print:pt-8">
            <div className="space-y-2 text-center">
              <div className="border-b border-slate-400 dark:border-slate-600 h-12"></div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Firma del Ganadero / Administrador</p>
              <p className="text-[10px] text-slate-500">C.C. _______________________</p>
            </div>

            <div className="space-y-2 text-center">
              <div className="border-b border-slate-400 dark:border-slate-600 h-12"></div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Firma del Vacunador Oficial FEDEGAN / ICA</p>
              <p className="text-[10px] text-slate-500">Código Brigadista: _________________</p>
            </div>
          </div>

        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {onOpenVaccinationModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVaccinationModal();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Vacunación</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
