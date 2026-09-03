import React from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Zap,
  TrendingDown
} from 'lucide-react';
import { OperationalKPIs } from '../utils/statistics';

interface KpiCardsProps {
  kpis: OperationalKPIs;
  darkMode: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, darkMode }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="kpi-cards-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Volume Total de OS */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total de OS
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: '#049DD9' }}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {kpis.totalOrders.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Base filtrada ativa
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Amostragem</span>
          <span className="text-[#049DD9] font-bold">100% Auditada</span>
        </div>
      </div>

      {/* 2. Taxa de SLA no Prazo */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            SLA no Prazo
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: '#078C28' }}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight" style={{ color: '#078C28' }}>
            {kpis.slaOnTimePercent}%
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {kpis.slaOnTimeCount} ordens pontuais
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Atrasos Críticos</span>
          <span className="text-rose-400 font-bold">{kpis.slaCriticalCount} OS</span>
        </div>
      </div>

      {/* 3. Retrabalho / Reincidência */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Reincidência
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: kpis.recurrentPercent > 15 ? '#ef4444' : '#98BF0B' }}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div 
            className="text-xl sm:text-2xl font-bold font-mono tracking-tight"
            style={{ color: kpis.recurrentPercent > 15 ? '#f87171' : '#98BF0B' }}
          >
            {kpis.recurrentPercent}%
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {kpis.recurrentCount} reincidentes (2ª+)
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>1ª Tentativa</span>
          <span className="text-[#078C28] font-bold">{100 - kpis.recurrentPercent}%</span>
        </div>
      </div>

      {/* 4. Duração Média e Mediana */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tempo Médio
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: '#C1D96A', color: '#1e293b' }}
          >
            <Clock className="w-4 h-4 text-slate-900" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {kpis.avgDurationMinutes} <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Mediana: {kpis.medianDurationMinutes} min
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Métrica Robusta</span>
          <span className="text-[#98BF0B] font-bold">Mediana P50</span>
        </div>
      </div>

      {/* 5. Custo Operacional Consolidado */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Custo Total
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: '#078C28' }}
          >
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tracking-tight truncate">
            {formatCurrency(kpis.totalEstimatedCost)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Média: {formatCurrency(kpis.avgCostPerOrder)} / OS
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Retrabalhos</span>
          <span className="text-amber-400 font-bold">+60% Custo</span>
        </div>
      </div>

      {/* 6. Outliers Estatísticos Z-Score */}
      <div 
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Outliers |Z| &gt; 2.5
          </span>
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: kpis.outlierCount > 0 ? '#ef4444' : '#049DD9' }}
          >
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div 
            className="text-xl sm:text-2xl font-bold font-mono tracking-tight"
            style={{ color: kpis.outlierCount > 0 ? '#f87171' : '#049DD9' }}
          >
            {kpis.outlierCount} <span className="text-xs font-normal text-slate-400">OS</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {kpis.outlierPercent}% desvios extremos
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Limiar Estatístico</span>
          <span className="text-slate-300 font-bold">&plusmn; 2.5 &sigma;</span>
        </div>
      </div>
    </div>
  );
};
