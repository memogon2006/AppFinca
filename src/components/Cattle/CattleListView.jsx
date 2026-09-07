import React, { useState, useMemo } from 'react';
import { CattleCard } from './CattleCard';
import { CattleFilters } from './CattleFilters';
import { Badge, StatusBadge, FemaleStatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  calculateWeightMetrics, 
  calculateFinancials, 
  calculateReproduction 
} from '../../services/calculations';
import { 
  LayoutGrid, 
  List, 
  PlusCircle, 
  Scale, 
  DollarSign, 
  Layers, 
  Eye, 
  Trash2, 
  Tag, 
  Skull, 
  ShoppingBag, 
  Calendar, 
  BookOpen, 
  HelpCircle,
  Users,
  PackagePlus
} from 'lucide-react';

export function CattleListView({ 
  cattle = [], 
  weighings = [], 
  onSelectAnimal, 
  onOpenNewAnimal,
  onOpenNew,
  onOpenBatchEntry,
  onOpenEdit,
  onOpenSell, 
  onOpenAddWeight,
  onAddWeight,
  onOpenDeath,
  onRevertDeath,
  onDeleteAnimal,
  onDelete,
  onOpenGlossary,
  onOpenPartnershipModal
}) {
  const handleOpenNewAnimalSafe = onOpenNewAnimal || onOpenNew;
  const handleDeleteAnimalSafe = onDeleteAnimal || onDelete;
  const handleAddWeightSafe = onOpenAddWeight || onAddWeight;
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    sex: '',
    productionType: '',
    status: 'Activo',
    saleType: '',
    reproductiveStatus: '',
    milkingStatus: '',
    isBreedingOnly: false,
    performanceFilter: '',
    owner: '',
    entryBatch: '',
    entryDateStart: '',
    entryDateEnd: '',
    saleDateStart: '',
    saleDateEnd: '',
    sortBy: 'tagNumber',
  });

  const ownersList = useMemo(() => {
    const set = new Set(cattle.map(c => c.owner).filter(Boolean));
    return Array.from(set);
  }, [cattle]);

  // Lista única de Ingreso #
  const entryBatchesList = useMemo(() => {
    const set = new Set(cattle.map(c => c.entryBatch || c.paddock).filter(Boolean));
    return Array.from(set);
  }, [cattle]);

  const filteredCattle = useMemo(() => {
    return cattle.filter(animal => {
      if (filters.status !== 'Todos' && animal.status !== filters.status) return false;
      
      // Filtro de modalidad de venta (Compañía vs Directa)
      if (filters.status === 'Vendido' && filters.saleType) {
        const isCompany = animal.exitType === 'En Compañía' || !!animal.partnershipDetails;
        if (filters.saleType === 'Compania' && !isCompany) return false;
        if (filters.saleType === 'Directa' && isCompany) return false;
      }

      // Filtro de Rendimiento / Ceba (Meta 480 kg y Semáforo)
      if (filters.status === 'Activo' && filters.performanceFilter) {
        const aWeighs = weighings.filter(w => w.cattleId === animal.id);
        const wm = calculateWeightMetrics(animal, aWeighs);
        if (filters.performanceFilter === 'ready480' && !wm.cebaProjection?.isReady) return false;
        if (filters.performanceFilter === 'highGdp' && wm.performance?.level !== 'excelente') return false;
        if (filters.performanceFilter === 'lowGdp' && wm.performance?.level !== 'bajo' && wm.performance?.level !== 'estancado') return false;
      }

      // Filtro por Fecha de Compra / Ingreso
      if (filters.entryDateStart && (animal.entryDate || '') < filters.entryDateStart) return false;
      if (filters.entryDateEnd && (animal.entryDate || '') > filters.entryDateEnd) return false;

      // Filtro por Fecha de Venta / Salida
      if (filters.saleDateStart && (animal.exitDate || '') < filters.saleDateStart) return false;
      if (filters.saleDateEnd && (animal.exitDate || '') > filters.saleDateEnd) return false;

      if (filters.sex && animal.sex !== filters.sex) return false;
      if (filters.productionType && animal.productionType !== filters.productionType) return false;
      if (filters.reproductiveStatus && animal.reproductiveStatus !== filters.reproductiveStatus) return false;
      if (filters.milkingStatus && animal.milkingStatus !== filters.milkingStatus) return false;
      if (filters.isBreedingOnly && !animal.isBreedingOnly) return false;
      if (filters.owner && animal.owner !== filters.owner) return false;
      
      // Filtro específico por Ingreso #
      if (filters.entryBatch) {
        const batch = animal.entryBatch || animal.paddock || '';
        if (batch !== filters.entryBatch) return false;
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const tag = (animal.tagNumber || '').toLowerCase();
        const name = (animal.name || '').toLowerCase();
        const brand = (animal.ironBrand || '').toLowerCase();
        const owner = (animal.owner || '').toLowerCase();
        const breed = (animal.breed || '').toLowerCase();
        const batch = (animal.entryBatch || animal.paddock || '').toLowerCase();
        const entryDate = (animal.entryDate || '').toLowerCase();
        const exitDate = (animal.exitDate || '').toLowerCase();
        const buyer = (animal.saleBuyer || animal.buyer || '').toLowerCase();
        const color = (animal.color || '').toLowerCase();
        if (
          !tag.includes(query) &&
          !name.includes(query) &&
          !brand.includes(query) &&
          !owner.includes(query) &&
          !breed.includes(query) &&
          !batch.includes(query) &&
          !entryDate.includes(query) &&
          !exitDate.includes(query) &&
          !buyer.includes(query) &&
          !color.includes(query)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Prioridad: Mostrar primero los ganados Activos que aún siguen en la finca
      const statusOrder = { 'Activo': 1, 'Vendido': 2, 'Muerto': 3 };
      const statusA = statusOrder[a.status] || 99;
      const statusB = statusOrder[b.status] || 99;
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const aWeighs = weighings.filter(w => w.cattleId === a.id);
      const bWeighs = weighings.filter(w => w.cattleId === b.id);
      const aWeight = calculateWeightMetrics(a, aWeighs);
      const bWeight = calculateWeightMetrics(b, bWeighs);
      const aFin = calculateFinancials(a);
      const bFin = calculateFinancials(b);

      switch (filters.sortBy) {
        case 'weightDesc':
          return bWeight.currentWeight - aWeight.currentWeight;
        case 'gainDesc':
          return bWeight.totalGain - aWeight.totalGain;
        case 'gdpDesc':
          return bWeight.overallGdp - aWeight.overallGdp;
        case 'entryDateDesc':
          return new Date(b.entryDate) - new Date(a.entryDate);
        case 'profitDesc':
          return bFin.netProfit - aFin.netProfit;
        case 'tagNumber':
        default:
          return (a.tagNumber || '').localeCompare(b.tagNumber || '', undefined, { numeric: true });
      }
    });
  }, [cattle, weighings, filters]);

  const summary = useMemo(() => {
    const totalCount = filteredCattle.length;
    let activeCount = 0;
    let soldCount = 0;
    let deadCount = 0;
    let totalKg = 0;
    let totalValue = 0;
    let totalProfit = 0;

    filteredCattle.forEach(c => {
      if (c.status === 'Activo') activeCount++;
      else if (c.status === 'Vendido') soldCount++;
      else if (c.status === 'Muerto') deadCount++;

      const w = weighings.filter(item => item.cattleId === c.id);
      const wm = calculateWeightMetrics(c, w);
      const fin = calculateFinancials(c);
      if (c.status === 'Activo') {
        totalKg += wm.currentWeight;
      }
      totalValue += c.status === 'Vendido' ? (parseFloat(c.exitPrice) || 0) : (parseFloat(c.entryPrice) || 0);
      totalProfit += fin.netProfit;
    });

    return { totalCount, activeCount, soldCount, deadCount, totalKg, totalValue, totalProfit };
  }, [filteredCattle, weighings]);

  const handleDeletePrompt = (animal, e) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al bovino ${animal.tagNumber} (${animal.name || 'Sin nombre'})?\n\nEsta acción borrará también su historial de pesajes.`)) {
      onDeleteAnimal(animal.id);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Barra de Filtros con Ingreso # */}
      <CattleFilters 
        filters={filters} 
        setFilters={setFilters} 
        owners={ownersList} 
        entryBatches={entryBatchesList}
      />

      {/* Barra de Herramientas y Resumen Unificada */}
      <div className="custom-card p-2.5 sm:p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3 shadow-sm border border-slate-200/80 dark:border-slate-800">
        
        {/* Indicadores Resumen a la Izquierda */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-extrabold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap">
            Total: <strong className="text-slate-950 dark:text-white font-black">{summary.totalCount}</strong> {summary.totalCount === 1 ? 'bovino' : 'bovinos'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm whitespace-nowrap">
            🟢 <strong>{summary.activeCount}</strong> en finca
          </span>

          {summary.soldCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black bg-amber-100/90 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm whitespace-nowrap">
              🏷️ <strong>{summary.soldCount}</strong> vendidas
            </span>
          )}

          {summary.deadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold bg-rose-100/90 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-sm whitespace-nowrap">
              💀 <strong>{summary.deadCount}</strong> bajas
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700 shadow-sm whitespace-nowrap">
            Biomasa: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatNumber(summary.totalKg, 0)} kg</strong>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 text-slate-700 dark:text-slate-300 font-semibold border border-blue-200 dark:border-blue-800 shadow-sm whitespace-nowrap">
            Utilidad: <strong className="text-blue-600 dark:text-blue-400 font-black">{formatCurrency(summary.totalProfit)}</strong>
          </span>
        </div>

        {/* Botones de Acción a la Derecha */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar py-0.5 justify-start xl:justify-end shrink-0">
          {/* Botón Liquidar Lote / Compañía */}
          {onOpenPartnershipModal && (
            <button
              onClick={onOpenPartnershipModal}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center gap-1 sm:gap-1.5 transition border border-teal-300 dark:border-teal-700 shadow-sm cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px]"
              title="Liquidar venta de varios animales en compañía (50/50)"
            >
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>🤝 Liquidar Compañía</span>
            </button>
          )}

          {/* Botón Glosario */}
          {onOpenGlossary && (
            <button
              onClick={onOpenGlossary}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 sm:gap-1.5 transition border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px]"
              title="Explicación de GDP, ROI, Biomasa y Fórmulas"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Guía</span>
            </button>
          )}

          {/* Selector de modo Vista */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 min-h-[36px] sm:min-h-[38px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition min-w-[28px] sm:min-w-[30px] flex items-center justify-center cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition min-w-[28px] sm:min-w-[30px] flex items-center justify-center cursor-pointer ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              title="Vista en Tabla"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón Ingresar Lote Completo */}
          {onOpenBatchEntry && (
            <button
              onClick={onOpenBatchEntry}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[38px]"
              title="Registrar un lote completo con cálculo por kilo o precio fijo"
            >
              <PackagePlus className="w-3.5 h-3.5 shrink-0" />
              <span>📦 Ingresar Lote</span>
            </button>
          )}
        </div>
      </div>

      {/* Mensaje si no hay resultados */}
      {filteredCattle.length === 0 && (
        <div className="custom-card p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No se encontraron bovinos</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {cattle.length === 0 
              ? 'El inventario está en ceros. Registra el primer bovino de tu finca para comenzar.'
              : 'Prueba cambiando los criterios de búsqueda o el filtro de estado.'}
          </p>
          <button
            onClick={handleOpenNewAnimalSafe}
            className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md min-h-[44px] cursor-pointer"
          >
            Registrar Bovino Ahora
          </button>
        </div>
      )}

      {/* Vista en Tarjetas / Cuadrícula */}
      {viewMode === 'grid' && filteredCattle.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredCattle.map(animal => (
            <CattleCard
              key={animal.id}
              animal={animal}
              weighings={weighings}
              onSelect={onSelectAnimal}
              onOpenSell={onOpenSell}
              onOpenAddWeight={handleAddWeightSafe}
              onOpenDeath={onOpenDeath}
              onDelete={handleDeleteAnimalSafe}
              onOpenGlossary={onOpenGlossary}
            />
          ))}
        </div>
      )}

      {/* Vista en Tabla Detallada */}
      {viewMode === 'table' && filteredCattle.length > 0 && (
        <div className="custom-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Arete / Chapa</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Ingreso #</th>
                  <th className="p-3.5">Hierro & Dueño</th>
                  <th className="p-3.5">Raza & Categoría</th>
                  <th className="p-3.5">Compra / Inicial</th>
                  <th className="p-3.5">Peso Actual</th>
                  <th className="p-3.5">Ganancia Total</th>
                  <th className="p-3.5 cursor-pointer" onClick={onOpenGlossary} title="Ver qué significa GDP">
                    <span className="flex items-center gap-1">GDP & Días <HelpCircle className="w-3 h-3 text-slate-400" /></span>
                  </th>
                  <th className="p-3.5 cursor-pointer" onClick={onOpenGlossary} title="Ver qué significa ROI y Utilidad">
                    <span className="flex items-center gap-1">Utilidad <HelpCircle className="w-3 h-3 text-slate-400" /></span>
                  </th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCattle.map(animal => {
                  const aWeighs = weighings.filter(w => w.cattleId === animal.id);
                  const wm = calculateWeightMetrics(animal, aWeighs);
                  const fin = calculateFinancials(animal);
                  const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';
                  const isSold = animal.status === 'Vendido';
                  const isDead = animal.status === 'Muerto';

                  const femaleStatus = animal.femaleStatus || (
                    animal.reproductiveStatus === 'Preñada' ? 'Gestación' : animal.milkingStatus === 'En ordeño' ? 'Producción de leche' : 'Vacía'
                  );

                  const entryWeightStr = animal.entryWeight && parseFloat(animal.entryWeight) > 0 
                    ? `${animal.entryWeight} kg` 
                    : (animal.origin === 'Nacido en finca' || animal.entryType === 'Nacimiento' ? '0 kg (Nacido)' : 'Sin peso');

                  const entryPriceStr = animal.entryPrice && parseFloat(animal.entryPrice) > 0 
                    ? formatCurrency(animal.entryPrice) 
                    : '$0';

                  const rowClass = isSold
                    ? 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border-l-4 border-l-amber-500'
                    : isDead
                      ? 'bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border-l-4 border-l-rose-500 opacity-80'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent hover:border-l-emerald-500';

                  return (
                    <tr 
                      key={animal.id} 
                      onClick={() => onSelectAnimal(animal)}
                      className={`cursor-pointer transition ${rowClass}`}
                    >
                      {/* Arete y Nombre */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold ${isSold ? 'text-amber-800 dark:text-amber-300' : isDead ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {animal.tagNumber}
                          </span>
                          {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal">({animal.name})</span>}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={animal.status} />
                          {animal.status === 'Vendido' && (
                            (animal.exitType === 'En Compañía' || animal.partnershipDetails) ? (
                              <span className="inline-flex items-center gap-1 font-black text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-400 dark:border-teal-700 text-[10px] shadow-sm">
                                <Users className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" /> 🤝 En Compañía
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-700 text-[10px]">
                                <DollarSign className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" /> 💰 Directa
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Ingreso # */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 text-[11px]">
                          <Tag className="w-3 h-3" /> {batch}
                        </span>
                      </td>

                      {/* Hierro & Dueño */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{animal.ironBrand || '-'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">{animal.owner}</div>
                      </td>

                      {/* Raza & Sexo */}
                      <td className="p-3.5">
                        <div className="text-slate-800 dark:text-slate-200">{animal.breed || 'Sin especificar'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {animal.sex === 'Macho' ? '🐂 Macho' : '🐄 Hembra'} • {animal.category}
                        </div>
                        {animal.sex === 'Hembra' && (
                          <div className="mt-1">
                            <FemaleStatusBadge status={femaleStatus} liters={animal.dailyMilkLiters} />
                          </div>
                        )}
                      </td>

                      {/* Compra / Inicial */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Scale className="w-3 h-3 text-slate-400" />
                          <span>{entryWeightStr}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <ShoppingBag className="w-3 h-3 text-slate-400" />
                          <span>{entryPriceStr}</span>
                        </div>
                      </td>

                      {/* Peso Actual */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black">{wm.hasWeight ? `${wm.currentWeight} kg` : (animal.sex === 'Hembra' ? 'Vientre' : 'Sin pesaje')}</span>
                          {wm.cebaProjection?.isReady && animal.status === 'Activo' && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-sm">
                              🎯 ≥ 480 kg
                            </span>
                          )}
                        </div>
                        {wm.lastWeighDate && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-0.5 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span>Pesaje: {formatDate(wm.lastWeighDate)}</span>
                          </div>
                        )}
                      </td>

                      {/* Ganancia Total */}
                      <td className="p-3.5 whitespace-nowrap">
                        {wm.hasEntryWeight ? (
                          <>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">+{wm.totalGain} kg</span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{wm.totalDays} días</div>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* GDP & Días */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span>{wm.hasEntryWeight ? `${formatNumber(wm.overallGdp, 3)} kg/d` : '-'}</span>
                          {wm.hasEntryWeight && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${wm.performance.colorBg} ${wm.performance.colorText}`}>
                              {wm.performance.icon} {wm.performance.shortLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{wm.totalDays} días en finca</div>
                      </td>

                      {/* Utilidad Neta */}
                      <td className="p-3.5 whitespace-nowrap">
                        {animal.status === 'Vendido' && (animal.exitType === 'En Compañía' || animal.partnershipDetails) ? (
                          (() => {
                            const partDetails = animal.partnershipDetails || {
                              farmShare: Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5,
                              partnerTotalReturn: (parseFloat(animal.entryPrice) || 0) + (Math.max(0, (parseFloat(animal.exitPrice) || 0) - (parseFloat(animal.entryPrice) || 0)) * 0.5),
                            };
                            return (
                              <div>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-xs">
                                  🏢 Finca: {formatCurrency(partDetails.farmShare)}
                                </span>
                                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold block mt-0.5">
                                  👤 Dueño: {formatCurrency(partDetails.partnerTotalReturn)}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <>
                            <span className={`font-bold ${fin.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(fin.netProfit)}
                            </span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <span>ROI: {fin.roi}%</span>
                              {fin.pricePerKgUsed > 0 && (
                                <span className="text-[9px] text-blue-700 dark:text-blue-300 font-bold bg-blue-100/70 dark:bg-blue-900/40 px-1 rounded">
                                  {formatCurrency(fin.pricePerKgUsed)}/kg
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAddWeightSafe(animal)}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            title="Registrar pesaje"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenSell(animal)}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="Vender animal"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          {animal.status === 'Activo' && (
                            <button
                              onClick={() => onOpenDeath(animal)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Baja por muerte"
                            >
                              <Skull className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al bovino ${animal.tagNumber} (${animal.name || 'Sin nombre'})?\n\nEsta acción borrará también su historial de pesajes.`)) {
                                handleDeleteAnimalSafe(animal.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-emerald-50/80 dark:bg-emerald-950/60 text-slate-800 dark:text-slate-200 font-extrabold border-t-2 border-emerald-600 dark:border-emerald-500">
                <tr>
                  <td className="p-3.5 whitespace-nowrap text-emerald-800 dark:text-emerald-300 font-black">
                    📊 Total: {summary.totalCount} {summary.totalCount === 1 ? 'cabeza' : 'cabezas'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="space-y-0.5 text-[11px]">
                      <span className="inline-block font-black text-emerald-700 dark:text-emerald-300">
                        🟢 {summary.activeCount} en finca
                      </span>
                      {summary.soldCount > 0 && (
                        <span className="block font-black text-amber-800 dark:text-amber-300">
                          🏷️ {summary.soldCount} vendidas
                        </span>
                      )}
                      {summary.deadCount > 0 && (
                        <span className="block font-bold text-rose-700 dark:text-rose-400">
                          💀 {summary.deadCount} bajas
                        </span>
                      )}
                    </div>
                  </td>
                  <td colSpan={4} className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    Totales del Inventario
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-black text-emerald-700 dark:text-emerald-400 text-xs">
                    {formatNumber(summary.totalKg, 0)} kg
                  </td>
                  <td colSpan={2} className="p-3.5"></td>
                  <td className="p-3.5 whitespace-nowrap font-black text-blue-700 dark:text-blue-300 text-xs">
                    {formatCurrency(summary.totalProfit)}
                  </td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
