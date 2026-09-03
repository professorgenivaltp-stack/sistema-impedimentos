import React, { useEffect, useRef, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Sliders, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Filter,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { StandardWorkOrder } from '../types';
import { applyZScoreAnalysis } from '../utils/statistics';
import { observePlotlyResize } from '../utils/plotlySafe';

interface AnomalyDetectionProps {
  orders: StandardWorkOrder[];
  onSelectOrder?: (orderId: string) => void;
  darkMode: boolean;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  orders,
  onSelectOrder,
  darkMode,
}) => {
  const [metric, setMetric] = useState<'duracaoMinutos' | 'custoEstimado'>('duracaoMinutos');
  const [threshold, setThreshold] = useState<number>(2.5);

  const histContainerRef = useRef<HTMLDivElement>(null);
  const scatterContainerRef = useRef<HTMLDivElement>(null);

  const { enrichedOrders, stats } = applyZScoreAnalysis(orders, metric, threshold);
  const outliersList = enrichedOrders.filter((o) => o.isOutlier);

  // Renderiza os gráficos de Anomalia no Plotly
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !histContainerRef.current || !scatterContainerRef.current || orders.length === 0) return;

    const values = enrichedOrders.map((o) => o[metric] as number);
    const zScores = enrichedOrders.map((o) => 
      metric === 'duracaoMinutos' ? (o.zScoreDuracao || 0) : (o.zScoreCusto || 0)
    );

    // 1. Histograma com demarcação de Outliers
    const histTrace = {
      x: values,
      type: 'histogram',
      name: 'Frequência de Ordens',
      marker: {
        color: '#049DD9',
        line: { color: darkMode ? '#0f172a' : '#ffffff', width: 1 },
      },
      opacity: 0.85,
      hovertemplate: 'Faixa: %{x}<br>Ordens: %{y}<extra></extra>',
    };

    const upperCut = stats.mean + threshold * stats.stdDev;
    const lowerCut = Math.max(0, stats.mean - threshold * stats.stdDev);

    const histLayout = {
      title: {
        text: `Distribuição Estatística & Limiares de Anomalia (|Z| > ${threshold})`,
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 13, family: 'monospace' },
        x: 0.02,
        y: 0.95,
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 50, r: 30, t: 45, b: 50 },
      xaxis: {
        title: { 
          text: metric === 'duracaoMinutos' ? 'Duração da Execução (minutos)' : 'Custo Estimado (R$)',
          font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 }
        },
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
      yaxis: {
        title: { text: 'Contagem de OS', font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 } },
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
      shapes: [
        {
          type: 'line',
          x0: upperCut,
          x1: upperCut,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: { color: '#ef4444', width: 2.5, dash: 'dash' },
        },
        {
          type: 'line',
          x0: stats.mean,
          x1: stats.mean,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: { color: '#078C28', width: 2 },
        },
      ],
      annotations: [
        {
          x: upperCut,
          y: 0.95,
          yref: 'paper',
          text: `+${threshold}σ (${Math.round(upperCut)})`,
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#ef4444',
          font: { color: '#ef4444', size: 10, family: 'monospace' },
        },
        {
          x: stats.mean,
          y: 0.85,
          yref: 'paper',
          text: `Média μ (${stats.mean})`,
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#078C28',
          font: { color: '#078C28', size: 10, family: 'monospace' },
        },
      ],
    };

    Plotly.newPlot(histContainerRef.current, [histTrace], histLayout, { responsive: true, displayModeBar: false });

    // 2. Scatter Plot: Duração vs Custo
    const normalOrders = enrichedOrders.filter((o) => !o.isOutlier);
    const outlierOrders = enrichedOrders.filter((o) => o.isOutlier);

    const normalScatter = {
      x: normalOrders.map((o) => o.duracaoMinutos),
      y: normalOrders.map((o) => o.custoEstimado),
      mode: 'markers',
      type: 'scatter',
      name: 'Operação Padrão',
      marker: {
        color: '#049DD9',
        size: 7,
        opacity: 0.65,
      },
      text: normalOrders.map((o) => `${o.id} - ${o.equipe}`),
      hovertemplate: '<b>%{text}</b><br>Duração: %{x} min<br>Custo: R$ %{y}<extra></extra>',
    };

    const outlierScatter = {
      x: outlierOrders.map((o) => o.duracaoMinutos),
      y: outlierOrders.map((o) => o.custoEstimado),
      mode: 'markers',
      type: 'scatter',
      name: `Outliers (|Z| > ${threshold})`,
      marker: {
        color: '#ef4444',
        size: 11,
        symbol: 'diamond',
        line: { color: '#ffffff', width: 1 },
      },
      text: outlierOrders.map((o) => `${o.id} - ${o.equipe} (${o.motivo || o.tipo})`),
      hovertemplate: '<b>ANOMALIA: %{text}</b><br>Duração: %{x} min<br>Custo: R$ %{y}<extra></extra>',
    };

    const scatterLayout = {
      title: {
        text: 'Dispersão Multivariada: Duração (min) vs Custo Estimado (R$)',
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 13, family: 'monospace' },
        x: 0.02,
        y: 0.95,
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 60, r: 30, t: 45, b: 50 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0.5,
        y: 1.15,
        xanchor: 'center',
        font: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
      },
      xaxis: {
        title: { text: 'Duração da Execução (minutos)', font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 } },
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
      yaxis: {
        title: { text: 'Custo Estimado (R$)', font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 } },
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
    };

    Plotly.newPlot(scatterContainerRef.current, [normalScatter, outlierScatter], scatterLayout, { responsive: true, displayModeBar: false });

    // ResizeObserver defensivo nos dois gráficos para prevenir colapso de layout
    const cleanupResize = observePlotlyResize(() => [
       histContainerRef.current,
       scatterContainerRef.current,
    ]);

    return () => {
      cleanupResize();
    };
  }, [enrichedOrders, metric, threshold, darkMode]);

  return (
    <div id="anomaly-detection-module" className="space-y-6">
      {/* Header com Controles Paramétricos */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: '#ef4444' }}
            >
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Motor Estatístico de Detecção de Outliers (Z-Score)</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {stats.outliersCount} anomalias detectadas
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo de desvio padronizado Z = (X - μ) / σ para isolar desvios operacionais atípicos.
              </p>
            </div>
          </div>

          {/* Seletores de Métrica & Slider de Sensibilidade */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* Seletor de Métrica */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
              <button
                onClick={() => setMetric('duracaoMinutos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  metric === 'duracaoMinutos'
                    ? 'bg-[#049DD9] text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Duração (min)</span>
              </button>

              <button
                onClick={() => setMetric('custoEstimado')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  metric === 'custoEstimado'
                    ? 'bg-[#078C28] text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Custo (R$)</span>
              </button>
            </div>

            {/* Slider de Limiar */}
            <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
                Limiar |Z| &gt; {threshold}
              </span>
              <input
                type="range"
                min="1.5"
                max="3.5"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-24 accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Resumo Estatístico dos Parâmetros μ e σ */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-sans block">Média Aritmética (μ)</span>
            <span className="text-sm font-bold text-white">
              {stats.mean} {metric === 'duracaoMinutos' ? 'min' : 'R$'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-sans block">Desvio Padrão (σ)</span>
            <span className="text-sm font-bold text-emerald-400">
              &plusmn; {stats.stdDev} {metric === 'duracaoMinutos' ? 'min' : 'R$'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-sans block">Limiar de Corte (+{threshold}σ)</span>
            <span className="text-sm font-bold text-rose-400">
              {Math.round(stats.mean + threshold * stats.stdDev)} {metric === 'duracaoMinutos' ? 'min' : 'R$'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-sans block">Taxa de Anomalia</span>
            <span className="text-sm font-bold text-amber-400">
              {orders.length > 0 ? ((stats.outliersCount / orders.length) * 100).toFixed(1) : 0}% da base
            </span>
          </div>
        </div>
      </div>

      {/* Grid de 2 Gráficos Plotly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={histContainerRef} style={{ width: '100%', height: '360px' }} />
        </div>

        <div 
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={scatterContainerRef} style={{ width: '100%', height: '360px' }} />
        </div>
      </div>

      {/* Tabela de Casos Críticos de Outlier para Auditoria */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <span>Ordens Sinalizadas pelo Motor de Outliers (|Z| &gt; {threshold})</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({outliersList.length} ocorrências isoladas)
            </span>
          </h3>
        </div>

        {outliersList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>Nenhuma ordem de serviço ultrapassa o limiar de anomalia configurado (|Z| &gt; {threshold}).</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ID / Nota</th>
                  <th className="px-4 py-3">Tipo de Ordem</th>
                  <th className="px-4 py-3">Equipe</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3 text-right">Duração</th>
                  <th className="px-4 py-3 text-right">Custo Estimado</th>
                  <th className="px-4 py-3 text-center">Score Z</th>
                  <th className="px-4 py-3">Motivo / Causa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {outliersList.map((os) => {
                  const zVal = metric === 'duracaoMinutos' ? os.zScoreDuracao : os.zScoreCusto;
                  return (
                    <tr key={os.id} className="hover:bg-slate-800/40 transition-colors bg-rose-950/10">
                      <td className="px-4 py-2.5 font-mono text-white font-bold">
                        {os.id}
                        {os.nota && <span className="block text-[10px] text-slate-400 font-normal">{os.nota}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-200">{os.tipo}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{os.equipe}</td>
                      <td className="px-4 py-2.5 text-slate-300">{os.cidade}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-400">
                        {os.duracaoMinutos} min
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                        R$ {os.custoEstimado}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Z = +{zVal}σ
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {os.motivo || os.retorno || 'Duração anormal sem justificativa'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
