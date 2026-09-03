import React, { useEffect, useRef } from 'react';
import { BarChart3, PieChart, Users, MapPin, Layers } from 'lucide-react';
import { StandardWorkOrder } from '../types';
import { observePlotlyResize } from '../utils/plotlySafe';

interface OverviewChartsProps {
  orders: StandardWorkOrder[];
  onFilterByField?: (field: 'tipo' | 'equipe' | 'cidade', value: string) => void;
  darkMode: boolean;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  orders,
  onFilterByField,
  darkMode,
}) => {
  const slaByTypeRef = useRef<HTMLDivElement>(null);
  const teamPerfRef = useRef<HTMLDivElement>(null);
  const cityDonutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || orders.length === 0) return;

    // -------------------------------------------------------------------------
    // 1. SLA POR TIPO DE OS (Barras Empilhadas)
    // -------------------------------------------------------------------------
    if (slaByTypeRef.current) {
      const typeCounts: Record<string, { onTime: number; delayed: number; critical: number }> = {};
      for (const o of orders) {
        const t = o.tipo || 'Outros';
        if (!typeCounts[t]) typeCounts[t] = { onTime: 0, delayed: 0, critical: 0 };
        if (o.statusSla === 'NO_PRAZO') typeCounts[t].onTime++;
        else if (o.statusSla === 'ATRASADO') typeCounts[t].delayed++;
        else if (o.statusSla === 'CRITICO') typeCounts[t].critical++;
      }

      const types = Object.keys(typeCounts).slice(0, 8); // Top 8
      const onTimeData = types.map((t) => typeCounts[t].onTime);
      const delayedData = types.map((t) => typeCounts[t].delayed);
      const criticalData = types.map((t) => typeCounts[t].critical);

      const traceOnTime = {
        x: types,
        y: onTimeData,
        name: 'No Prazo',
        type: 'bar',
        marker: { color: '#078C28' },
        customdata: types,
      };

      const traceDelayed = {
        x: types,
        y: delayedData,
        name: 'Atrasado (< 24h)',
        type: 'bar',
        marker: { color: '#98BF0B' },
        customdata: types,
      };

      const traceCritical = {
        x: types,
        y: criticalData,
        name: 'Crítico (> 24h)',
        type: 'bar',
        marker: { color: '#ef4444' },
        customdata: types,
      };

      const layoutSla = {
        barmode: 'stack',
        title: {
          text: 'Distribuição de SLA por Tipo de Ordem',
          font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 13, family: 'monospace' },
          x: 0.02,
          y: 0.95,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 40, r: 20, t: 40, b: 70 },
        legend: {
          orientation: 'h',
          x: 0.5,
          y: 1.15,
          xanchor: 'center',
          font: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        },
        xaxis: {
          tickangle: -25,
          tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
          gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
        },
        yaxis: {
          title: { text: 'Volume de OS', font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 } },
          tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
          gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
        },
      };

      Plotly.newPlot(slaByTypeRef.current, [traceOnTime, traceDelayed, traceCritical], layoutSla, { responsive: true, displayModeBar: false }).then(() => {
        const el = slaByTypeRef.current as any;
        if (el && el.on && onFilterByField) {
          el.on('plotly_click', (data: any) => {
            if (data.points && data.points[0]) {
              const clickedType = data.points[0].customdata;
              if (clickedType) onFilterByField('tipo', clickedType);
            }
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // 2. VOLUME & DESEMPENHO POR EQUIPE TÉCNICA
    // -------------------------------------------------------------------------
    if (teamPerfRef.current) {
      const teamCounts: Record<string, { total: number; onTime: number }> = {};
      for (const o of orders) {
        const eq = o.equipe || 'Equipe Geral';
        if (!teamCounts[eq]) teamCounts[eq] = { total: 0, onTime: 0 };
        teamCounts[eq].total++;
        if (o.statusSla === 'NO_PRAZO') teamCounts[eq].onTime++;
      }

      const sortedTeams = Object.entries(teamCounts)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8);

      const teamNames = sortedTeams.map((t) => t[0]);
      const teamTotals = sortedTeams.map((t) => t[1].total);
      const teamRates = sortedTeams.map((t) => Math.round((t[1].onTime / t[1].total) * 100));

      const traceTeams = {
        x: teamTotals,
        y: teamNames,
        type: 'bar',
        orientation: 'h',
        marker: {
          color: teamRates.map((r) => (r >= 85 ? '#078C28' : r >= 70 ? '#049DD9' : '#ef4444')),
        },
        customdata: teamNames,
        text: teamRates.map((r) => `${r}% pontual`),
        textposition: 'auto',
        hovertemplate: '<b>%{y}</b><br>Total: %{x} OS<br>Pontualidade: %{text}<extra></extra>',
      };

      const layoutTeam = {
        title: {
          text: 'Volume & Taxa de SLA por Equipe Técnica',
          font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 13, family: 'monospace' },
          x: 0.02,
          y: 0.95,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 110, r: 30, t: 40, b: 40 },
        xaxis: {
          title: { text: 'Total de Ordens Atendidas', font: { color: darkMode ? '#94a3b8' : '#475569', size: 11 } },
          tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
          gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
        },
        yaxis: {
          autorange: 'reversed',
          tickfont: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
          gridcolor: darkMode ? '#1e293b' : '#e2e8f0',
        },
      };

      Plotly.newPlot(teamPerfRef.current, [traceTeams], layoutTeam, { responsive: true, displayModeBar: false }).then(() => {
        const el = teamPerfRef.current as any;
        if (el && el.on && onFilterByField) {
          el.on('plotly_click', (data: any) => {
            if (data.points && data.points[0]) {
              const clickedTeam = data.points[0].customdata;
              if (clickedTeam) onFilterByField('equipe', clickedTeam);
            }
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // 3. CONCENTRAÇÃO GEOGRÁFICA POR CIDADE / POLO (Donut Chart)
    // -------------------------------------------------------------------------
    if (cityDonutRef.current) {
      const cityCounts: Record<string, number> = {};
      for (const o of orders) {
        const c = o.cidade || 'Não Especificado';
        cityCounts[c] = (cityCounts[c] || 0) + 1;
      }

      const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      const cityLabels = sortedCities.map((c) => c[0]);
      const cityValues = sortedCities.map((c) => c[1]);

      const traceCity = {
        labels: cityLabels,
        values: cityValues,
        type: 'pie',
        hole: 0.55,
        marker: {
          colors: ['#049DD9', '#078C28', '#98BF0B', '#C1D96A', '#38bdf8', '#4ade80'],
        },
        textinfo: 'percent',
        hoverinfo: 'label+value+percent',
        customdata: cityLabels,
      };

      const layoutCity = {
        title: {
          text: 'Concentração por Cidade / Polo',
          font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 13, family: 'monospace' },
          x: 0.02,
          y: 0.95,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 20, r: 20, t: 40, b: 20 },
        legend: {
          orientation: 'h',
          x: 0.5,
          y: -0.1,
          xanchor: 'center',
          font: { color: darkMode ? '#94a3b8' : '#475569', size: 10 },
        },
      };

      Plotly.newPlot(cityDonutRef.current, [traceCity], layoutCity, { responsive: true, displayModeBar: false }).then(() => {
        const el = cityDonutRef.current as any;
        if (el && el.on && onFilterByField) {
          el.on('plotly_click', (data: any) => {
            if (data.points && data.points[0]) {
              const clickedCity = data.points[0].customdata;
              if (clickedCity) onFilterByField('cidade', clickedCity);
            }
          });
        }
      });
    }

    // ResizeObserver defensivo nos 3 containers de gráficos
    const cleanupResize = observePlotlyResize(() => [
      slaByTypeRef.current,
      teamPerfRef.current,
      cityDonutRef.current,
    ]);

    return () => {
      cleanupResize();
    };
  }, [orders, darkMode]);

  return (
    <div id="overview-charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. SLA por Tipo */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div ref={slaByTypeRef} style={{ width: '100%', height: '330px' }} />
      </div>

      {/* 2. Equipes */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div ref={teamPerfRef} style={{ width: '100%', height: '330px' }} />
      </div>

      {/* 3. Donut Cidades */}
      <div 
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div ref={cityDonutRef} style={{ width: '100%', height: '330px' }} />
      </div>
    </div>
  );
};
