import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  Sliders,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StandardWorkOrder, WhatIfSimulationParams } from '../types';
import { runWhatIfSimulation } from '../utils/whatIfEngine';

interface WhatIfSimulatorProps {
  orders: StandardWorkOrder[];
  darkMode: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ orders, darkMode }) => {
  // 1. Parâmetros de Simulação What-If
  const defaultParams: WhatIfSimulationParams = {
    additionalTeams: 2,
    tmaReductionPercent: 15,
    reincidenceReductionPercent: 25,
    demandChangePercent: 0,
    costPerTeamMonth: 14500,
    costPerPenaltySla: 85,
    costPerRevisit: 120,
  };

  const [params, setParams] = useState<WhatIfSimulationParams>(defaultParams);
  const [showCostSettings, setShowCostSettings] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // 2. Execução do Motor de Simulação
  const result = useMemo(() => {
    return runWhatIfSimulation(orders, params);
  }, [orders, params]);

  // 3. Gráficos Plotly: Capacidade vs Demanda & Decomposição Financeira
  const capacityChartRef = useRef<HTMLDivElement>(null);
  const financialChartRef = useRef<HTMLDivElement>(null);

  // Gráfico: Capacidade vs Demanda Diária
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !capacityChartRef.current) return;

    const data = [
      {
        x: ['Cenário Atual (Baseline)', 'Cenário Simulado (What-If)'],
        y: [result.baselineDailyCapacity, result.simulatedDailyCapacity],
        name: 'Capacidade Produtiva Diária (OS/Dia)',
        type: 'bar',
        marker: { color: '#078C28', opacity: 0.9 },
        text: [
          `${result.baselineDailyCapacity} OS/dia (${result.baselineTeams} equipes)`,
          `${result.simulatedDailyCapacity} OS/dia (${result.simulatedTeams} equipes)`,
        ],
        textposition: 'auto',
      },
      {
        x: ['Cenário Atual (Baseline)', 'Cenário Simulado (What-If)'],
        y: [result.baselineDemandDaily, result.simulatedDemandDaily],
        name: 'Demanda Média de OS (OS/Dia)',
        type: 'bar',
        marker: { color: '#049DD9', opacity: 0.9 },
        text: [`${result.baselineDemandDaily} OS/dia`, `${result.simulatedDemandDaily} OS/dia`],
        textposition: 'auto',
      },
    ];

    const layout = {
      title: {
        text: '<b>Balanço de Capacidade Operacional vs Demanda</b>',
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14 },
      },
      barmode: 'group',
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      autosize: true,
      margin: { l: 40, r: 20, t: 45, b: 50 },
      xaxis: {
        color: darkMode ? '#94a3b8' : '#475569',
        tickfont: { size: 11 },
      },
      yaxis: {
        title: { text: 'Volume de Ordens / Dia', font: { size: 11, color: '#94a3b8' } },
        gridcolor: darkMode ? '#334155' : '#e2e8f0',
        color: darkMode ? '#94a3b8' : '#475569',
      },
      legend: {
        orientation: 'h',
        y: -0.2,
        font: { size: 10, color: darkMode ? '#cbd5e1' : '#475569' },
      },
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.react(capacityChartRef.current, data, layout, config);
  }, [result, darkMode]);

  // Gráfico: Decomposição Financeira (Opex vs Economias)
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !financialChartRef.current) return;

    const categories = [
      'Investimento Equipes (Opex)',
      'Economia Multas SLA',
      'Economia Retrabalho',
      'Ganhos de Eficiência',
      'Saldo Líquido Mensal',
    ];

    const values = [
      -result.teamInvestmentMonthly,
      result.penaltySavingsMonthly,
      result.revisitSavingsMonthly,
      result.efficiencySavingsMonthly,
      result.netSavingsMonthly,
    ];

    const colors = values.map((v, i) => {
      if (i === 0) return '#ef4444'; // Custo
      if (i === 4) return v >= 0 ? '#078C28' : '#ef4444'; // Saldo final
      return '#049DD9'; // Economias
    });

    const formatBRL = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    const data = [
      {
        x: categories,
        y: values,
        type: 'bar',
        marker: { color: colors, opacity: 0.9 },
        text: values.map((v) => formatBRL(v)),
        textposition: 'auto',
        hovertemplate: '<b>%{x}</b><br>Valor: %{text}<extra></extra>',
      },
    ];

    const layout = {
      title: {
        text: '<b>Demonstrativo Financeiro Mensal (Impacto no Opex)</b>',
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14 },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      autosize: true,
      margin: { l: 50, r: 20, t: 45, b: 60 },
      xaxis: {
        color: darkMode ? '#94a3b8' : '#475569',
        tickfont: { size: 10 },
      },
      yaxis: {
        title: { text: 'Valores Mensais (R$)', font: { size: 11, color: '#94a3b8' } },
        gridcolor: darkMode ? '#334155' : '#e2e8f0',
        color: darkMode ? '#94a3b8' : '#475569',
      },
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.react(financialChartRef.current, data, layout, config);
  }, [result, darkMode]);

  // Formatação de Moeda
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  // Exportação CSV do Cenário
  const handleExportCsv = () => {
    const rows = [
      ['Métrica / Parâmetro', 'Cenário Base (Atual)', 'Cenário Simulado (What-If)', 'Variação / Impacto'],
      ['Equipes de Campo', result.baselineTeams, result.simulatedTeams, params.additionalTeams >= 0 ? `+${params.additionalTeams}` : `${params.additionalTeams}`],
      ['Capacidade Produtiva Diária (OS)', result.baselineDailyCapacity, result.simulatedDailyCapacity, `${result.simulatedDailyCapacity - result.baselineDailyCapacity} OS/dia`],
      ['Taxa de Cumprimento de SLA (%)', `${result.baselineSlaCompliance}%`, `${result.simulatedSlaCompliance}%`, `+${(result.simulatedSlaCompliance - result.baselineSlaCompliance).toFixed(1)} p.p.`],
      ['Atrasos Mensais Estimados (OS)', result.baselineDelayCount, result.simulatedDelayCount, `${result.simulatedDelayCount - result.baselineDelayCount} OS`],
      ['Retrabalhos Mensais (OS)', result.baselineRevisitCount, result.simulatedRevisitCount, `${result.simulatedRevisitCount - result.baselineRevisitCount} OS`],
      ['Investimento Adicional em Equipes', 'R$ 0,00', formatCurrency(result.teamInvestmentMonthly), `-${formatCurrency(result.teamInvestmentMonthly)}/mês`],
      ['Economia em Multas de SLA', 'R$ 0,00', formatCurrency(result.penaltySavingsMonthly), `+${formatCurrency(result.penaltySavingsMonthly)}/mês`],
      ['Economia em Retrabalhos', 'R$ 0,00', formatCurrency(result.revisitSavingsMonthly), `+${formatCurrency(result.revisitSavingsMonthly)}/mês`],
      ['Ganhos de Eficiência (Horas-Homem)', 'R$ 0,00', formatCurrency(result.efficiencySavingsMonthly), `+${formatCurrency(result.efficiencySavingsMonthly)}/mês`],
      ['Economia Líquida Mensal', 'R$ 0,00', formatCurrency(result.netSavingsMonthly), formatCurrency(result.netSavingsMonthly)],
      ['Economia Líquida Anualizada (12m)', 'R$ 0,00', formatCurrency(result.netSavingsMonthly * 12), formatCurrency(result.netSavingsMonthly * 12)],
      ['Retorno sobre Investimento (ROI)', '-', `${result.roiPercent}%`, `${result.roiPercent}%`],
      ['Payback Estimado (Meses)', '-', `${result.paybackMonths} meses`, `${result.paybackMonths} meses`],
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cenario_what_if_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="whatif-simulator-module" className="space-y-6">
      {/* 1. Header do Módulo What-If */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: '#078C28' }}
            >
              <Calculator className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Simulador de Cenários What-If &bull; Dimensionamento de Capacidade & ROI
                </h2>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase"
                  style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
                >
                  Fase 5 Concluída
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Simule o impacto de adicionar equipes de campo, otimizar rotas e reduzir o tempo médio de atendimento (TMA) e reincidências sobre o SLA e a rentabilidade do contrato.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="reset-scenario-btn"
              onClick={() => setParams(defaultParams)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              id="export-scenario-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              id="open-executive-report-btn"
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all"
              style={{ backgroundColor: '#049DD9' }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório Executivo</span>
            </button>
          </div>
        </div>

        {/* 2. SLIDERS PARAMÉTRICOS DE SIMULAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          {/* Slider 1: Variação de Equipes */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#049DD9]" />
                  <span>Equipes de Campo</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700">
                  {params.additionalTeams >= 0 ? `+${params.additionalTeams}` : params.additionalTeams} turmas ({result.simulatedTeams} total)
                </span>
              </div>
              <input
                type="range"
                min="-3"
                max="8"
                step="1"
                value={params.additionalTeams}
                onChange={(e) => setParams((prev) => ({ ...prev, additionalTeams: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#049DD9] cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>-3 Equipes</span>
              <span>Baseline: {result.baselineTeams}</span>
              <span>+8 Equipes</span>
            </div>
          </div>

          {/* Slider 2: Redução de TMA */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#078C28]" />
                  <span>Redução de TMA</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-[#078C28] border border-slate-700">
                  -{params.tmaReductionPercent}% tempo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={params.tmaReductionPercent}
                onChange={(e) => setParams((prev) => ({ ...prev, tmaReductionPercent: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#078C28] cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>0% (Atual)</span>
              <span>-20% Otimizado</span>
              <span>-40% Máx</span>
            </div>
          </div>

          {/* Slider 3: Redução de Reincidência */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#98BF0B]" />
                  <span>Queda no Retrabalho</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-[#98BF0B] border border-slate-700">
                  -{params.reincidenceReductionPercent}% visitas
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={params.reincidenceReductionPercent}
                onChange={(e) => setParams((prev) => ({ ...prev, reincidenceReductionPercent: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#98BF0B] cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>0% (Sem Ação)</span>
              <span>-30% Treinamento</span>
              <span>-60% Rigor</span>
            </div>
          </div>

          {/* Slider 4: Variação de Demanda */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Volume de Demanda</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {params.demandChangePercent >= 0 ? `+${params.demandChangePercent}%` : `${params.demandChangePercent}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                value={params.demandChangePercent}
                onChange={(e) => setParams((prev) => ({ ...prev, demandChangePercent: parseInt(e.target.value, 10) }))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>-30% Queda</span>
              <span>0% Estável</span>
              <span>+50% Chuvas/Pico</span>
            </div>
          </div>
        </div>

        {/* Toggle para Ajustes de Custos Unitários */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setShowCostSettings(!showCostSettings)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#078C28]" />
            <span>Configuração de Custos Unitários Contratuais</span>
            {showCostSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCostSettings && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Custo Mensal por Equipe (R$)</label>
                <input
                  type="number"
                  value={params.costPerTeamMonth}
                  onChange={(e) => setParams((prev) => ({ ...prev, costPerTeamMonth: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Salários, veículo e ferramental</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Multa por Quebra de SLA (R$)</label>
                <input
                  type="number"
                  value={params.costPerPenaltySla}
                  onChange={(e) => setParams((prev) => ({ ...prev, costPerPenaltySla: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Penalidade contratual ou ANEEL</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Custo por Visita Improdutiva / Retrabalho (R$)</label>
                <input
                  type="number"
                  value={params.costPerRevisit}
                  onChange={(e) => setParams((prev) => ({ ...prev, costPerRevisit: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Deslocamento indevido + hora técnica</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. CARDS DE RESULTADOS COMPARATIVOS (ANTES VS DEPOIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Taxa de Cumprimento de SLA */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Cumprimento de SLA</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                result.simulatedSlaCompliance >= result.baselineSlaCompliance
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {result.simulatedSlaCompliance >= result.baselineSlaCompliance ? '+' : ''}
              {(result.simulatedSlaCompliance - result.baselineSlaCompliance).toFixed(1)} p.p.
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-white">
              {result.simulatedSlaCompliance}%
            </span>
            <span className="text-xs text-slate-400">
              (Atual: {result.baselineSlaCompliance}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Atrasos mensais projetados caem de <strong>{result.baselineDelayCount}</strong> para{' '}
            <strong className="text-[#078C28]">{result.simulatedDelayCount} OS</strong>.
          </p>
        </div>

        {/* Card 2: Capacidade vs Demanda (Utilização) */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Utilização da Capacidade</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                result.simulatedCapacityUtilization <= 90
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {result.simulatedCapacityUtilization}% {result.simulatedCapacityUtilization <= 90 ? 'Ideal' : 'Sobrecarga'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-white">
              {result.simulatedDailyCapacity}
            </span>
            <span className="text-xs text-slate-400">
              OS/dia (Demanda: {result.simulatedDemandDaily})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Capacidade anterior era de <strong>{result.baselineDailyCapacity} OS/dia</strong> ({result.baselineCapacityUtilization}% de carga).
          </p>
        </div>

        {/* Card 3: Economia Líquida Mensal */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Economia Líquida Mensal</span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
              Líquido / Mês
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                result.netSavingsMonthly >= 0 ? 'text-[#078C28]' : 'text-rose-400'
              }`}
            >
              {formatCurrency(result.netSavingsMonthly)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Projeção anualizada de{' '}
            <strong className="text-white">{formatCurrency(result.netSavingsMonthly * 12)}</strong> em custos evitados.
          </p>
        </div>

        {/* Card 4: Retorno sobre Investimento (ROI) */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Retorno (ROI) & Payback</span>
            <span className="text-[11px] font-bold text-[#049DD9] bg-[#049DD9]/20 px-1.5 py-0.5 rounded">
              Payback: {result.paybackMonths}m
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-white">
              {result.roiPercent}%
            </span>
            <span className="text-xs text-slate-400">ROI Projetado</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Investimento mensal em equipes: <strong>{formatCurrency(result.teamInvestmentMonthly)}</strong>.
          </p>
        </div>
      </div>

      {/* 4. SEÇÃO DE GRÁFICOS ANALÍTICOS: BALANÇO DE CAPACIDADE & WATERFALL FINANCEIRO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Capacidade vs Demanda */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={capacityChartRef} className="w-full h-72" />
          <div className="mt-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Cenário Atual: <strong>{result.baselineTeams} equipes</strong> &bull; {result.baselineCapacityUtilization}% de utilização
            </span>
            <span className="text-[#078C28] font-bold">
              Simulado: {result.simulatedTeams} equipes &bull; {result.simulatedCapacityUtilization}% de utilização
            </span>
          </div>
        </div>

        {/* Gráfico Demonstrativo Financeiro */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={financialChartRef} className="w-full h-72" />
          <div className="mt-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Penalidades Evitadas: <strong>{formatCurrency(result.penaltySavingsMonthly)}</strong>
            </span>
            <span className="text-[#078C28] font-bold">
              Economia Líquida: {formatCurrency(result.netSavingsMonthly)}/mês
            </span>
          </div>
        </div>
      </div>

      {/* 5. PARECER TÉCNICO PRESCRITIVO */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: '#078C28' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Diagnóstico Prescritivo & Recomendações Estratégicas
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {result.recommendationSummary}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ação em Produtividade</span>
                <p className="text-slate-300 text-[11px]">
                  Reduzir o TMA em <strong>{params.tmaReductionPercent}%</strong> gera uma economia estimada de <strong>{formatCurrency(result.efficiencySavingsMonthly)}/mês</strong> em horas-homem liberadas.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Qualidade da 1ª Visita</span>
                <p className="text-slate-300 text-[11px]">
                  Reduzir o retrabalho em <strong>{params.reincidenceReductionPercent}%</strong> evita <strong>{result.baselineRevisitCount - result.simulatedRevisitCount} viagens improdutivas</strong> mensais ({formatCurrency(result.revisitSavingsMonthly)}/mês).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Proteção de Contrato</span>
                <p className="text-slate-300 text-[11px]">
                  Evitar <strong>{result.baselineDelayCount - result.simulatedDelayCount} estouros de SLA</strong> reduz a exposição a multas em <strong>{formatCurrency(result.penaltySavingsMonthly)}/mês</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL DO RELATÓRIO EXECUTIVO CONSOLIDADO (IMPRESSÃO / PDF) */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            id="printable-executive-report"
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl border shadow-2xl ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Barra de Ações do Modal */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#049DD9]" />
                <h3 className="text-base font-bold text-white">Relatório Executivo Consolidado de Inteligência Operacional</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#078C28] hover:bg-emerald-600 text-white transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Cabeçalho Formal do Relatório */}
            <div className="border-b-2 border-slate-700 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-white uppercase">
                    Plataforma de Inteligência Operacional & Analytics
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Supervisão ASSU &bull; Auditoria de Ordens de Serviço & Dimensionamento de Equipes
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Data de Emissão: <strong className="text-white">{new Date().toLocaleDateString('pt-BR')}</strong></div>
                  <div>Base Auditada: <strong className="text-white">{orders.length} Ordens de Serviço</strong></div>
                </div>
              </div>
            </div>

            {/* Seção 1: Sumário de Diagnóstico Atual (Baseline) */}
            <div className="space-y-4 mb-6">
              <h2 className="text-sm font-bold text-[#049DD9] uppercase tracking-wider flex items-center gap-2">
                <span>1. Diagnóstico da Operação Vigente (Baseline)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Cumprimento de SLA</span>
                  <div className="text-lg font-bold text-white mt-1">{result.baselineSlaCompliance}%</div>
                  <span className="text-[10px] text-slate-400">{result.baselineDelayCount} atrasos/mês</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Equipes de Campo</span>
                  <div className="text-lg font-bold text-white mt-1">{result.baselineTeams} Equipes</div>
                  <span className="text-[10px] text-slate-400">Capacidade: {result.baselineDailyCapacity} OS/dia</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Demanda Média</span>
                  <div className="text-lg font-bold text-white mt-1">{result.baselineDemandDaily} OS/dia</div>
                  <span className="text-[10px] text-slate-400">{result.baselineCapacityUtilization}% de carga</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Revisitas / Retrabalho</span>
                  <div className="text-lg font-bold text-white mt-1">{result.baselineRevisitCount} OS/mês</div>
                  <span className="text-[10px] text-slate-400">Reincidência de campo</span>
                </div>
              </div>
            </div>

            {/* Seção 2: Cenário What-If Proposto */}
            <div className="space-y-4 mb-6">
              <h2 className="text-sm font-bold text-[#078C28] uppercase tracking-wider flex items-center gap-2">
                <span>2. Parâmetros do Cenário Estratégico Simulado</span>
              </h2>
              <table className="w-full text-xs text-left border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-300 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Alavanca de Gestão</th>
                    <th className="p-2.5">Atual</th>
                    <th className="p-2.5">Proposta Simulada</th>
                    <th className="p-2.5">Impacto Esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  <tr>
                    <td className="p-2.5 font-semibold text-white">Dimensionamento de Equipes</td>
                    <td className="p-2.5">{result.baselineTeams} turmas</td>
                    <td className="p-2.5 text-[#078C28] font-bold">{result.simulatedTeams} turmas ({params.additionalTeams >= 0 ? `+${params.additionalTeams}` : params.additionalTeams})</td>
                    <td className="p-2.5">Alívio de sobrecarga e aumento de capacidade</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-white">Redução de TMA (Otimização de Rotas)</td>
                    <td className="p-2.5">0%</td>
                    <td className="p-2.5 text-[#078C28] font-bold">-{params.tmaReductionPercent}% de tempo</td>
                    <td className="p-2.5">{formatCurrency(result.efficiencySavingsMonthly)}/mês em horas liberadas</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-white">Qualidade e Eliminação de Retrabalho</td>
                    <td className="p-2.5">0%</td>
                    <td className="p-2.5 text-[#078C28] font-bold">-{params.reincidenceReductionPercent}% reincidências</td>
                    <td className="p-2.5">Menos {result.baselineRevisitCount - result.simulatedRevisitCount} viagens improdutivas</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-white">Cumprimento Final de SLA</td>
                    <td className="p-2.5">{result.baselineSlaCompliance}%</td>
                    <td className="p-2.5 text-[#078C28] font-bold">{result.simulatedSlaCompliance}%</td>
                    <td className="p-2.5">+{ (result.simulatedSlaCompliance - result.baselineSlaCompliance).toFixed(1) } p.p. no SLA contratual</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Seção 3: Demonstrativo de Resultados & ROI */}
            <div className="space-y-4 mb-6">
              <h2 className="text-sm font-bold text-[#98BF0B] uppercase tracking-wider flex items-center gap-2">
                <span>3. Retorno sobre Investimento & Benefício Econômico</span>
              </h2>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Investimento Equipes (Opex)</span>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      -{formatCurrency(result.teamInvestmentMonthly)}/mês
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Custos Evitados (Multas + Retrabalho)</span>
                    <div className="text-base font-bold text-[#049DD9] mt-0.5">
                      +{formatCurrency(result.penaltySavingsMonthly + result.revisitSavingsMonthly)}/mês
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Economia Líquida Mensal</span>
                    <div className="text-base font-bold text-[#078C28] mt-0.5">
                      {formatCurrency(result.netSavingsMonthly)}/mês
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Economia Líquida Anual</span>
                    <div className="text-base font-bold text-[#078C28] mt-0.5">
                      {formatCurrency(result.netSavingsMonthly * 12)}/ano
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Parecer Final da Supervisão */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <h3 className="font-bold text-white uppercase text-[11px] mb-1">
                Conclusão & Plano de Ação Recomendado
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {result.recommendationSummary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
