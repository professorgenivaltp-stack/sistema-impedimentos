import React from 'react';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Layers, 
  MapPin 
} from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  supervisao: string;
  tipo: string;
  equipe: string;
  cidade: string;
  statusSla: string; // 'ALL' | 'NO_PRAZO' | 'ATRASADO' | 'CRITICO'
  reincidencia: string; // 'ALL' | 'PRIMEIRA' | 'REINCIDENTE'
}

interface GlobalFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalRows: number;
  filteredRowsCount: number;
  availableSupervisoes: string[];
  availableTipos: string[];
  availableEquipes: string[];
  availableCidades: string[];
  darkMode: boolean;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalRows,
  filteredRowsCount,
  availableSupervisoes,
  availableTipos,
  availableEquipes,
  availableCidades,
  darkMode,
}) => {
  const isFiltered = 
    filters.searchQuery !== '' ||
    filters.supervisao !== 'ALL' ||
    filters.tipo !== 'ALL' ||
    filters.equipe !== 'ALL' ||
    filters.cidade !== 'ALL' ||
    filters.statusSla !== 'ALL' ||
    filters.reincidencia !== 'ALL';

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div 
      id="global-filters-container"
      className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Linha Superior: Cabeçalho do Filtro & Contador */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: '#049DD9' }}
          >
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Filtros Globais Reativos</span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: filteredRowsCount === totalRows ? 'rgba(7, 140, 40, 0.2)' : 'rgba(4, 157, 217, 0.2)',
                  color: filteredRowsCount === totalRows ? '#078C28' : '#049DD9',
                  border: `1px solid ${filteredRowsCount === totalRows ? '#078C28' : '#049DD9'}`,
                }}
              >
                {filteredRowsCount} de {totalRows} OS ({totalRows > 0 ? Math.round((filteredRowsCount / totalRows) * 100) : 0}%)
              </span>
            </h3>
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      {/* Grid de Controles de Filtragem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Busca Textual */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Search className="w-3 h-3 text-[#049DD9]" /> Busca Rápida
          </label>
          <input
            type="text"
            placeholder="ID, Nota, Motivo..."
            value={filters.searchQuery}
            onChange={(e) => handleChange('searchQuery', e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#049DD9]"
          />
        </div>

        {/* 2. Tipo de OS */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#98BF0B]" /> Tipo de OS
          </label>
          <select
            value={filters.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-[#98BF0B]"
          >
            <option value="ALL">Todos os Tipos ({availableTipos.length})</option>
            {availableTipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Equipe Técnica */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#078C28]" /> Equipe Técnica
          </label>
          <select
            value={filters.equipe}
            onChange={(e) => handleChange('equipe', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-[#078C28]"
          >
            <option value="ALL">Todas as Equipes ({availableEquipes.length})</option>
            {availableEquipes.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Cidade / Polo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#C1D96A]" /> Cidade / Polo
          </label>
          <select
            value={filters.cidade}
            onChange={(e) => handleChange('cidade', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-[#C1D96A]"
          >
            <option value="ALL">Todas as Cidades ({availableCidades.length})</option>
            {availableCidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Status SLA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Status do SLA
          </label>
          <select
            value={filters.statusSla}
            onChange={(e) => handleChange('statusSla', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Todos os Status</option>
            <option value="NO_PRAZO">No Prazo (Dentro SLA)</option>
            <option value="ATRASADO">Atrasado (&lt; 24h)</option>
            <option value="CRITICO">Crítico (&gt; 24h)</option>
          </select>
        </div>

        {/* 6. Retrabalho / Reincidência */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Tentativa / Retrabalho
          </label>
          <select
            value={filters.reincidencia}
            onChange={(e) => handleChange('reincidencia', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-400"
          >
            <option value="ALL">Todas as Tentativas</option>
            <option value="PRIMEIRA">1ª Execução (Primeira Visita)</option>
            <option value="REINCIDENTE">Reincidente (2ª+ Visitas)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
