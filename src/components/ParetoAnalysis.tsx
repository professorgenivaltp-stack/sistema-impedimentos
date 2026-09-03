import React, { useEffect, useRef, useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Target, 
  AlertCircle, 
  TrendingUp, 
  Filter, 
  Info, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { StandardWorkOrder } from '../types';
import { computePareto, ParetoItem } from '../utils/statistics';
import { observePlotlyResize } from '../utils/plotlySafe';

interface ParetoAnalysisProps {
  orders: StandardWorkOrder[];
  onSelectFilterValue?: (field: 'motivo' | 'tipo' | 'equipe' | 'cidade', value: string) => void;
  darkMode: boolean;
}

export const ParetoAnalysis: React.FC<ParetoAnalysisProps> = ({
  orders,
  onSelectFilterValue,
  darkMode,
}) => {
  const [dimension, setDimension] = useState<'motivo' | 'tipo' | 'equipe' | 'cidade'>('motivo');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { items, totalOccurrences, vitalCutIndex } = computePareto(orders, dimension);

  // Renderiza o gráfico Plotly e configura o Cross-Filtering
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !chartContainerRef.current || items.length === 0) return;

    const topItems = items.slice(0, 15); // Top 15 para clareza visual impecável
    const xLabels = topItems.map((i) => (i.key.length > 25 ? i.key.substring(0, 23) + '...' : i.key));
    const fullKeys = topItems.map((i) => i.key);
    const yCounts = topItems.map((i) => i.count);
    const yCumulative = topItems.map((i) => i.cumulativePercent);

    // Cores: Verde Operacional (#078C28) para zona Vital 80%, e Azul Técnico (#049DD9) para zona Trivial
    const barColors = topItems.map((i) => (i.isVital80 ? '#078C28' : '#049DD9'));

    const traceBars = {
      x: xLabels,
      y: yCounts,
      name: 'Ocorrências (Qtd)',
      type: 'bar',
      marker: {
        color: barColors,
        opacity: 0.9,
      },
      customdata: fullKeys,
      hovertemplate: '<b>%{customdata}</b><br>Ocorrências: %{y}<br>% Individual: %{text}%<extra></extra>',
      text: topItems.map((i) => i.individualPercent),
    };

    const traceLine = {
      x: xLabels,
      y: yCumulative,
      name: '% Acumulado',
      type: 'scatter',
      mode: 'lines+markers',
      yaxis: 'y2',
      line: {
        color: '#98BF0B',
        width: 3,
        shape: 'spline',
      },
      marker: {
        color: '#C1D96A',
        size: 7,
        line: { color: '#078C28', width: 1.5 },
      },
      hovertemplate: '<b>Acumulado: %{y:.1f}%</b><extra></extra>',
    };

    const layout = {
      title: {
        text: `Curva de Pareto 80/20 &bull; Dimensão: ${
          dimension === 'motivo' ? 'Motivo de Falha / Impedimento' :
          dimension === 'tipo' ? 'Tipo de Ordem (Macro)' :
          dimension === 'equipe' ? 'Equipe Técnica' : 'Cidade / Polo'
        }`,
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14, family: 'monospace' },
        x: 0.02,
        y: 0.96,
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 50, r: 60, t: 50, b: 90 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0.5,
        y: 1.15,
        xanchor: 'center',
        font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 },
      },
      xaxis: {
        tickangle: -35,
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
      yaxis: {
        title: { text: 'Frequência de Falhas / Ocorrências', font: { color: '#078C28', size: 11 } },
        tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
      },
      yaxis2: {
        title: { text: '% Acumulado', font: { color: '#98BF0B', size: 11 } },
        tickfont: { color: '#98BF0B', size: 10 },
        overlaying: 'y',
        side: 'right',
        range: [0, 105],
        ticksuffix: '%',
        showgrid: false,
      },
      shapes: [
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          yref: 'y2',
          y0: 80,
          y1: 80,
          line: {
            color: '#ef4444',
            width: 2,
            dash: 'dot',
          },
        },
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.98,
          yref: 'y2',
          y: 80,
          text: 'Linha de Corte 80%',
          showarrow: false,
          font: { color: '#ef4444', size: 10, family: 'monospace' },
          xanchor: 'right',
          yanchor: 'bottom',
        },
      ],
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(chartContainerRef.current, [traceBars, traceLine], layout, config).then(() => {
      // Cross-filtering bidirecional via clique no gráfico
      const el = chartContainerRef.current as any;
      if (el && el.on) {
        el.on('plotly_click', (data: any) => {
          if (data.points && data.points[0] && onSelectFilterValue) {
            const clickedKey = data.points[0].customdata;
            if (clickedKey) {
              onSelectFilterValue(dimension, clickedKey);
            }
          }
        });
      }
    });

    // ResizeObserver defensivo para garantir redimensionamento e evitar colapso de abas
    const cleanupResize = observePlotlyResize(() => [chartContainerRef.current]);

    return () => {
      cleanupResize();
    };
  }, [items, dimension, darkMode]);

  const vitalItems = items.filter((i) => i.isVital80);
  const vitalCount = vitalItems.length;
  const vitalPercentageOfCategories = items.length > 0 ? Math.round((vitalCount / items.length) * 100) : 0;

  return (
    <div id="pareto-analysis-module" className="space-y-6">
      {/* Barra de Controle de Dimensão & Diagnóstico Rápido */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: '#078C28' }}
            >
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Análise de Pareto Multidimensional (Princípio 80/20)</span>
                <span 
                  className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#98BF0B', color: '#1e293b' }}
                >
                  Poucos Vitais
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Identificação matemática dos fatores que concentram a grande maioria das falhas e custos de campo.
              </p>
            </div>
          </div>

          {/* Seletor de Dimensões */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setDimension('motivo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dimension === 'motivo'
                  ? 'bg-[#078C28] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Motivo de Falha
            </button>
            <button
              onClick={() => setDimension('tipo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dimension === 'tipo'
                  ? 'bg-[#078C28] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tipo de Ordem
            </button>
            <button
              onClick={() => setDimension('equipe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dimension === 'equipe'
                  ? 'bg-[#078C28] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipe Técnica
            </button>
            <button
              onClick={() => setDimension('cidade')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                dimension === 'cidade'
                  ? 'bg-[#078C28] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cidade / Polo
            </button>
          </div>
        </div>

        {/* Card de Diagnóstico Tático Automático */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              <strong className="text-white font-mono">{vitalCount} de {items.length} categorias ({vitalPercentageOfCategories}%)</strong> são responsáveis por aproximadamente <strong className="text-emerald-400 font-mono">80%</strong> de todas as {totalOccurrences} ocorrências analisadas.
            </span>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            Dica: Clique em qualquer barra do gráfico para aplicar filtro imediato.
          </span>
        </div>
      </div>

      {/* Container do Gráfico Plotly */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div ref={chartContainerRef} style={{ width: '100%', height: '420px' }} />
      </div>

      {/* Tabela Estruturada de Pareto */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <span>Classificação Detalhada &bull; Fatores Vitais vs Triviais</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({items.length} itens mapeados)
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Ranking</th>
                <th className="px-4 py-3">Dimensão ({dimension.toUpperCase()})</th>
                <th className="px-4 py-3 text-right">Ocorrências</th>
                <th className="px-4 py-3 text-right">% Individual</th>
                <th className="px-4 py-3 text-right">% Acumulado</th>
                <th className="px-4 py-3 text-center">Classificação</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {items.map((item, idx) => (
                <tr 
                  key={item.key} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    item.isVital80 ? 'bg-emerald-950/10' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-slate-400 font-bold">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-2.5 text-slate-200 font-semibold">
                    {item.key}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-white font-bold">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                    {item.individualPercent}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold" style={{ color: item.isVital80 ? '#078C28' : '#98BF0B' }}>
                    {item.cumulativePercent}%
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: item.isVital80 ? 'rgba(7, 140, 40, 0.2)' : 'rgba(4, 157, 217, 0.15)',
                        color: item.isVital80 ? '#078C28' : '#049DD9',
                        border: `1px solid ${item.isVital80 ? '#078C28' : '#049DD9'}`,
                      }}
                    >
                      {item.isVital80 ? '80% Vital (Prioridade)' : '20% Trivial'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {onSelectFilterValue && (
                      <button
                        onClick={() => onSelectFilterValue(dimension, item.key)}
                        className="p-1 rounded hover:bg-slate-700 text-[#049DD9] transition-colors"
                        title={`Filtrar dashboard por '${item.key}'`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
