import React, { useState, useMemo } from 'react';
import { CattleCard } from './CattleCard';
import { CattleFilters } from './CattleFilters';
import { Badge, StatusBadge, ReproductiveBadge, MilkingBadge, ProductionTypeBadge } from '../Common/Badge';
import { 
  formatCurrency, 
  formatNumber, 
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
  Tag
} from 'lucide-react';

export function CattleListView({ 
  cattle = [], 
  weighings = [], 
  onSelectAnimal, 
  onOpenNewAnimal, 
  onOpenSell, 
  onOpenAddWeight,
  onDeleteAnimal 
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
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
        if (
          !tag.includes(query) &&
          !name.includes(query) &&
          !brand.includes(query) &&
          !owner.includes(query) &&
          !breed.includes(query) &&
          !batch.includes(query)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
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
    let totalKg = 0;
    let totalValue = 0;
    let totalProfit = 0;

    filteredCattle.forEach(c => {
      const w = weighings.filter(item => item.cattleId === c.id);
      const wm = calculateWeightMetrics(c, w);
      const fin = calculateFinancials(c);
      totalKg += wm.currentWeight;
      totalValue += c.status === 'Vendido' ? (parseFloat(c.exitPrice) || 0) : (parseFloat(c.entryPrice) || 0);
      totalProfit += fin.netProfit;
    });

    return { totalCount, totalKg, totalValue, totalProfit };
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

      {/* Barra de Herramientas y Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
            {summary.totalCount} {summary.totalCount === 1 ? 'bovino' : 'bovinos'}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Biomasa: <strong className="text-emerald-600 dark:text-emerald-400">{formatNumber(summary.totalKg, 0)} kg</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Utilidad Neta: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(summary.totalProfit)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Selector de modo Vista */}
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewAnimal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition min-h-[38px]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
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
              : 'Prueba cambiando los criterios de búsqueda o el filtro de Ingreso #.'}
          </p>
          <button
            onClick={onOpenNewAnimal}
            className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md min-h-[44px]"
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
              onOpenAddWeight={onOpenAddWeight}
              onDelete={onDeleteAnimal}
            />
          ))}
        </div>
      )}

      {/* Vista en Tabla Detallada */}
      {viewMode === 'table' && filteredCattle.length > 0 && (
        <div className="custom-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Arete / Chapa</th>
                  <th className="p-3.5">Ingreso #</th>
                  <th className="p-3.5">Hierro & Dueño</th>
                  <th className="p-3.5">Raza & Sexo</th>
                  <th className="p-3.5">Producción</th>
                  <th className="p-3.5">Peso Actual</th>
                  <th className="p-3.5">Ganancia Total</th>
                  <th className="p-3.5">GDP</th>
                  <th className="p-3.5">Estado Hembra</th>
                  <th className="p-3.5">Utilidad Neta</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCattle.map(animal => {
                  const aWeighs = weighings.filter(w => w.cattleId === animal.id);
                  const wm = calculateWeightMetrics(animal, aWeighs);
                  const fin = calculateFinancials(animal);
                  const repro = calculateReproduction(animal);
                  const batch = animal.entryBatch || animal.paddock || 'Ingreso #1';

                  return (
                    <tr 
                      key={animal.id} 
                      onClick={() => onSelectAnimal(animal)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      {/* Arete y Nombre */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{animal.tagNumber}</span>
                          {animal.name && <span className="text-slate-500 dark:text-slate-400 font-normal">({animal.name})</span>}
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
                        <div className="text-slate-800 dark:text-slate-200">{animal.breed}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{animal.sex} • {animal.category}</div>
                      </td>

                      {/* Producción */}
                      <td className="p-3.5 whitespace-nowrap">
                        <ProductionTypeBadge type={animal.productionType} />
                      </td>

                      {/* Peso Actual */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {wm.currentWeight} kg
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Entrada: {animal.entryWeight} kg</div>
                      </td>

                      {/* Ganancia Total */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{wm.totalGain} kg</span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{wm.totalDays} días</div>
                      </td>

                      {/* GDP */}
                      <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {formatNumber(wm.overallGdp, 3)} kg/d
                      </td>

                      {/* Estado Hembra */}
                      <td className="p-3.5">
                        {animal.sex === 'Hembra' ? (
                          <div className="space-y-1">
                            {animal.reproductiveStatus === 'Preñada' && (
                              <ReproductiveBadge status={animal.reproductiveStatus} isPregnant={repro.isPregnant} daysUntilCalving={repro.daysUntilCalving} />
                            )}
                            {animal.milkingStatus === 'En ordeño' && (
                              <MilkingBadge status={animal.milkingStatus} liters={animal.dailyMilkLiters} />
                            )}
                            {animal.isBreedingOnly && <Badge variant="purple" size="sm">Solo Cría</Badge>}
                            {animal.reproductiveStatus === 'Vacía' && <Badge variant="gray" size="sm">Vacía</Badge>}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>

                      {/* Utilidad Neta */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`font-bold ${fin.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(fin.netProfit)}
                        </span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">ROI: {fin.roi}%</div>
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAddWeight(animal)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 transition"
                            title="Registrar Pesaje"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          {animal.status === 'Activo' && (
                            <button
                              onClick={() => onOpenSell(animal)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 text-slate-600 hover:text-white dark:text-slate-300 transition"
                              title="Vender / Liquidar"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectAnimal(animal)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                            title="Ver Ficha"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePrompt(animal, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-400 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 transition"
                            title="Eliminar bovino"
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
        </div>
      )}

    </div>
  );
}
