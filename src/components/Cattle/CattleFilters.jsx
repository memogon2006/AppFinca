import React from 'react';
import { Search, X, RefreshCw, Layers } from 'lucide-react';
import { PRODUCTION_TYPES } from '../../types/cattle';

export function CattleFilters({ filters, setFilters, owners = [], entryBatches = [] }) {
  const handleClear = () => {
    setFilters({
      search: '',
      sex: '',
      productionType: '',
      status: 'Activo',
      reproductiveStatus: '',
      milkingStatus: '',
      isBreedingOnly: false,
      owner: '',
      entryBatch: '',
      sortBy: 'tagNumber',
    });
  };

  const isFiltered = filters.search || filters.sex || filters.productionType || 
    filters.status !== 'Activo' || filters.reproductiveStatus || 
    filters.milkingStatus || filters.isBreedingOnly || filters.owner || filters.entryBatch;

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900/90 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-md">
      {/* Search and Quick Toggles */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por arete, nombre, hierro, raza, dueño o Ingreso #..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition min-h-[42px]"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs (Activo, Vendido, Todos) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-stretch md:self-auto justify-center">
          {[
            { id: 'Activo', label: 'En Finca' },
            { id: 'Vendido', label: 'Vendidos' },
            { id: 'Todos', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilters(prev => ({ ...prev, status: tab.id }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition min-h-[34px] ${
                filters.status === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
        
        {/* FILTRO: Ingreso # */}
        <select
          value={filters.entryBatch || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, entryBatch: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-400 dark:border-emerald-600/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="">🏷️ Todo Ingreso #</option>
          {entryBatches.map(b => (
            <option key={b} value={b}>Ingreso: {b}</option>
          ))}
        </select>

        {/* Sexo */}
        <select
          value={filters.sex}
          onChange={(e) => setFilters(prev => ({ ...prev, sex: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="">Todos los Sexos</option>
          <option value="Macho">🐂 Machos</option>
          <option value="Hembra">🐄 Hembras</option>
        </select>

        {/* Tipo de Producción */}
        <select
          value={filters.productionType}
          onChange={(e) => setFilters(prev => ({ ...prev, productionType: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="">Toda Producción</option>
          {PRODUCTION_TYPES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Estado Reproductivo */}
        <select
          value={filters.reproductiveStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, reproductiveStatus: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="">Cualquier Reprod.</option>
          <option value="Preñada">🤰 Preñadas</option>
          <option value="Vacía">⭕ Vacías</option>
          <option value="En Servicio">⏳ En Servicio</option>
        </select>

        {/* Dueño / Propietario */}
        <select
          value={filters.owner}
          onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="">Todos los Dueños</option>
          {owners.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        {/* Ordenar Por */}
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[40px]"
        >
          <option value="tagNumber">Ordenar: N° Arete</option>
          <option value="weightDesc">Mayor Peso Actual</option>
          <option value="gainDesc">Mayor Ganancia Peso</option>
          <option value="gdpDesc">Mayor GDP (kg/día)</option>
          <option value="entryDateDesc">Ingreso Más Reciente</option>
          <option value="profitDesc">Mayor Utilidad</option>
        </select>
      </div>

      {/* Checkbox solo de cría y limpiar filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-purple-700 dark:text-purple-300 font-medium py-1">
          <input
            type="checkbox"
            checked={filters.isBreedingOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, isBreedingOnly: e.target.checked }))}
            className="w-4 h-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500"
          />
          <span>Mostrar solo hembras de cría / vientres reproductoras</span>
        </label>

        {isFiltered && (
          <button
            onClick={handleClear}
            className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold transition py-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
}
