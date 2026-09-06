import React, { useState, useMemo } from 'react';
import { 
  Baby, 
  PlusCircle, 
  Search, 
  Calendar, 
  TrendingUp, 
  HeartCrack, 
  CheckCircle2, 
  DollarSign, 
  Filter, 
  Sparkles, 
  Eye, 
  Trash2, 
  MapPin, 
  Scale, 
  ExternalLink,
  Info,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../services/calculations';
import { BirthFormModal } from './BirthFormModal';
import { BirthDetailModal } from './BirthDetailModal';

export function BirthsView({ 
  cattle = [], 
  births = [], 
  onSaveBirth, 
  onDeleteBirth, 
  onSelectAnimal,
  onNavigateToInventory 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState('all'); // 'all' | 'Macho' | 'Hembra'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'Vivo' | 'Muerto al nacimiento'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all' | 'thisMonth' | 'thisYear'

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBirth, setSelectedBirth] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fechas actuales para indicadores
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = String(currentYear);

  // 1. INDICADORES EXCLUSIVOS DEL MÓDULO DE NACIMIENTOS
  const metrics = useMemo(() => {
    let totalBirths = births.length;
    let birthsThisMonth = 0;
    let birthsThisYear = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let aliveCount = 0;
    let deadAtBirthCount = 0;
    let totalEstimatedValueIncorporated = 0;

    births.forEach(b => {
      const bDate = b.birthDate || '';
      if (bDate.startsWith(currentMonthStr)) {
        birthsThisMonth++;
      }
      if (bDate.startsWith(currentYearStr)) {
        birthsThisYear++;
      }

      if (b.sex === 'Macho') maleCount++;
      if (b.sex === 'Hembra') femaleCount++;

      if (b.status === 'Vivo') {
        aliveCount++;
        totalEstimatedValueIncorporated += parseFloat(b.estimatedValue) || 0;
      } else {
        deadAtBirthCount++;
      }
    });

    return {
      totalBirths,
      birthsThisMonth,
      birthsThisYear,
      maleCount,
      femaleCount,
      aliveCount,
      deadAtBirthCount,
      totalEstimatedValueIncorporated
    };
  }, [births, currentMonthStr, currentYearStr]);

  // 2. FILTRADO Y BÚSQUEDA
  const filteredBirths = useMemo(() => {
    return births.filter(b => {
      // Filtro por Sexo
      if (filterSex !== 'all' && b.sex !== filterSex) return false;

      // Filtro por Estado
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;

      // Filtro por Período
      if (filterPeriod === 'thisMonth' && !(b.birthDate || '').startsWith(currentMonthStr)) return false;
      if (filterPeriod === 'thisYear' && !(b.birthDate || '').startsWith(currentYearStr)) return false;

      // Búsqueda de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const tag = (b.tagNumber || '').toLowerCase();
        const mother = (b.motherTag || '').toLowerCase();
        const father = (b.fatherTag || '').toLowerCase();
        const farm = (b.farmName || '').toLowerCase();
        const paddock = (b.paddock || '').toLowerCase();
        const breed = (b.breed || '').toLowerCase();

        return (
          tag.includes(query) ||
          mother.includes(query) ||
          father.includes(query) ||
          farm.includes(query) ||
          paddock.includes(query) ||
          breed.includes(query)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.birthDate || 0) - new Date(a.birthDate || 0));
  }, [births, searchTerm, filterSex, filterStatus, filterPeriod, currentMonthStr, currentYearStr]);

  const handleOpenDetail = (birth) => {
    setSelectedBirth(birth);
    setIsDetailModalOpen(true);
  };

  const handleNavigateToAnimalFromBirth = (tagNumber) => {
    const animal = cattle.find(c => (c.tagNumber || '').toUpperCase() === (tagNumber || '').toUpperCase());
    if (animal && onSelectAnimal) {
      onSelectAnimal(animal);
    } else if (onNavigateToInventory) {
      onNavigateToInventory();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. ENCABEZADO PRINCIPAL DEL MÓDULO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 flex-shrink-0">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Módulo de Nacimientos
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-700">
                {metrics.aliveCount} Incorporados
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Registro de partos, trazabilidad maternal e incorporación automática al inventario (+1)
            </p>
          </div>
        </div>

        {/* Botón Principal: + Registrar Nacimiento */}
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Nacimiento</span>
        </button>
      </div>

      {/* 2. INDICADORES SUPERIORES DEL MÓDULO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        
        {/* KPI 1: Nacimientos del Mes */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Este Mes
          </span>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.birthsThisMonth}
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Nacimientos</span>
        </div>

        {/* KPI 2: Nacimientos del Año */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Año {currentYear}
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.birthsThisYear}
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Acumulado año</span>
        </div>

        {/* KPI 3: Total Histórico */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Total Partos
          </span>
          <p className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {metrics.totalBirths}
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Histórico total</span>
        </div>

        {/* KPI 4: Machos Nacidos */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Machos 🐂
          </span>
          <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {metrics.maleCount}
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Terneros machos</span>
        </div>

        {/* KPI 5: Hembras Nacidas */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            Hembras 🐄
          </span>
          <p className="text-lg sm:text-xl font-black text-pink-600 dark:text-pink-400 mt-1">
            {metrics.femaleCount}
          </p>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Terneras hembras</span>
        </div>

        {/* KPI 6: Nacimientos Vivos */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-tight flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Vivos
          </span>
          <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {metrics.aliveCount}
          </p>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">+1 al inventario</span>
        </div>

        {/* KPI 7: Muertes al Nacimiento */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-tight flex items-center gap-1">
            <HeartCrack className="w-3 h-3 text-rose-600" /> Muertos
          </span>
          <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {metrics.deadAtBirthCount}
          </p>
          <span className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold">Trazabilidad</span>
        </div>

        {/* KPI 8: Valor Incorporado */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[10px] font-extrabold uppercase tracking-tight text-white/90 truncate flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Valor Incorp.
          </span>
          <p className="text-sm sm:text-base font-black truncate mt-1">
            {formatCurrency(metrics.totalEstimatedValueIncorporated)}
          </p>
          <span className="text-[9px] text-emerald-100 font-semibold truncate">Patrimonio vivo</span>
        </div>

      </div>

      {/* 3. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por arete, arete de la madre, padre, finca, potrero..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filtros Rápidos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            
            {/* Filtro Sexo */}
            <select
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Sexos</option>
              <option value="Macho">🐂 Solo Machos</option>
              <option value="Hembra">🐄 Solo Hembras</option>
            </select>

            {/* Filtro Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="Vivo">🟢 Vivos (Incorporados)</option>
              <option value="Muerto al nacimiento">🔴 Muertos al Nacer</option>
            </select>

            {/* Filtro Período */}
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todo el Historial</option>
              <option value="thisMonth">Nacidos Este Mes</option>
              <option value="thisYear">Nacidos Este Año</option>
            </select>

          </div>

        </div>

        {/* Resumen de resultados filtrados */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium border-t border-slate-100 dark:border-slate-800">
          <span>Mostrando <strong>{filteredBirths.length}</strong> de {births.length} nacimientos</span>
          {(searchTerm || filterSex !== 'all' || filterStatus !== 'all' || filterPeriod !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSex('all');
                setFilterStatus('all');
                setFilterPeriod('all');
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* 4. TABLA Y LISTADO DE NACIMIENTOS */}
      {filteredBirths.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          {/* Vista Tabla Desktop (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Identificación</th>
                  <th className="p-3.5">Sexo & Raza</th>
                  <th className="p-3.5">Madre</th>
                  <th className="p-3.5">Padre</th>
                  <th className="p-3.5">Finca & Potrero</th>
                  <th className="p-3.5">Peso al Nacer</th>
                  <th className="p-3.5">Valor Incorporado</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBirths.map((b) => {
                  const isAlive = b.status === 'Vivo';
                  const birthWeight = parseFloat(b.birthWeight) || 0;
                  const estimatedVal = parseFloat(b.estimatedValue) || 0;

                  return (
                    <tr 
                      key={b.id}
                      onClick={() => handleOpenDetail(b)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                        !isAlive ? 'bg-rose-50/20 dark:bg-rose-950/10 opacity-80' : ''
                      }`}
                    >
                      {/* Fecha */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.birthDate}</span>
                        </div>
                      </td>

                      {/* Arete / Identificación */}
                      <td className="p-3.5 font-black whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                          isAlive 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        }`}>
                          {b.tagNumber}
                        </span>
                      </td>

                      {/* Sexo & Raza */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {b.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                          {b.breed || 'Sin raza'}
                        </div>
                      </td>

                      {/* Madre */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-purple-900 dark:text-purple-300">
                        {b.motherTag}
                      </td>

                      {/* Padre */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-semibold">
                        {b.fatherTag || '-'}
                      </td>

                      {/* Finca & Potrero */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                          {b.farmName || 'Finca'}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                          {b.paddock || 'Maternidad'}
                        </div>
                      </td>

                      {/* Peso al nacer */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                        {birthWeight > 0 ? `${formatNumber(birthWeight, 1)} kg` : '-'}
                      </td>

                      {/* Valor Incorporado */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`font-black text-xs ${
                          isAlive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          {isAlive ? formatCurrency(estimatedVal) : '$0'}
                        </span>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Valor patrimonial</div>
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isAlive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Vivo (+1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-extrabold text-[11px] border border-rose-300 dark:border-rose-700">
                            <HeartCrack className="w-3 h-3 text-rose-600" /> Muerto al Nacer
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(b)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Ver trazabilidad completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAlive && (
                            <button
                              onClick={() => handleNavigateToAnimalFromBirth(b.tagNumber)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                              title="Ver ficha del bovino en inventario"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`¿Deseas eliminar el registro de nacimiento del arete ${b.tagNumber}?`)) {
                                onDeleteBirth(b.id, b.tagNumber);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar nacimiento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Tarjetas Móvil (< md) */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {filteredBirths.map(b => {
              const isAlive = b.status === 'Vivo';
              const birthWeight = parseFloat(b.birthWeight) || 0;
              const estimatedVal = parseFloat(b.estimatedValue) || 0;

              return (
                <div 
                  key={b.id} 
                  onClick={() => handleOpenDetail(b)}
                  className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        isAlive 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      }`}>
                        {b.tagNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {b.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      isAlive 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}>
                      {isAlive ? '🟢 Vivo (+1)' : '🔴 Muerto al Nacer'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">Madre:</span>
                      <span className="font-bold text-purple-900 dark:text-purple-300">{b.motherTag}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">Fecha:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.birthDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Valor Incorporado:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(estimatedVal)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold text-right">Peso al nacer:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 block text-right">{birthWeight > 0 ? `${birthWeight} kg` : '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Estado Vacío */
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Baby className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              No se encontraron nacimientos
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || filterSex !== 'all' || filterStatus !== 'all' || filterPeriod !== 'all'
                ? 'Ningún nacimiento coincide con los filtros de búsqueda aplicados.'
                : 'Registra los partos de tu hato para incorporar automáticamente los nuevos terneros/as al inventario ganadero.'}
            </p>
          </div>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-emerald-700/25 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Primer Nacimiento (+1)</span>
          </button>
        </div>
      )}

      {/* 5. MODALES */}
      <BirthFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        cattle={cattle}
        births={births}
        onSaveBirth={onSaveBirth}
      />

      <BirthDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBirth(null);
        }}
        birth={selectedBirth}
        onNavigateToAnimal={handleNavigateToAnimalFromBirth}
        onDeleteBirth={onDeleteBirth}
      />

    </div>
  );
}
