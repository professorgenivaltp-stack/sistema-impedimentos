import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Cpu,
  Sliders,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  BrainCircuit,
  Info,
  Layers,
  Search,
  Download,
  Flame,
  Clock,
  MapPin,
  Users,
  Briefcase,
  Play
} from 'lucide-react';
import { StandardWorkOrder, RiskLevel } from '../types';
import { trainPredictiveModel, predictSingleOrder } from '../utils/predictiveModel';

interface PredictiveRiskModuleProps {
  orders: StandardWorkOrder[];
  darkMode: boolean;
}

export const PredictiveRiskModule: React.FC<PredictiveRiskModuleProps> = ({
  orders,
  darkMode,
}) => {
  // 1. Estados dos Controles Preditivos
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.5);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const rowsPerPage = 10;

  // 2. Estados do Simulador de Pré-Despacho
  const availableTipos = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.tipo) set.add(o.tipo); });
    return Array.from(set).sort();
  }, [orders]);

  const availableEquipes = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.equipe) set.add(o.equipe); });
    return Array.from(set).sort();
  }, [orders]);

  const availableCidades = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.cidade) set.add(o.cidade); });
    return Array.from(set).sort();
  }, [orders]);

  const [simParams, setSimParams] = useState({
    tipo: availableTipos[0] || 'RELIGAÇÃO',
    equipe: availableEquipes[0] || 'EQUIPE_01',
    cidade: availableCidades[0] || 'ASSU',
    prioridade: 2,
    ehReincidente: false,
    tentativa: 1,
  });

  // 3. Execução do Modelo Preditivo (Regressão Logística Calibrada)
  const modelResult = useMemo(() => {
    return trainPredictiveModel(orders, decisionThreshold);
  }, [orders, decisionThreshold]);

  // 4. Execução do Simulador de Pré-Despacho
  const simResult = useMemo(() => {
    return predictSingleOrder(simParams, modelResult);
  }, [simParams, modelResult]);

  // 5. Gráficos Plotly: Matriz de Confusão, Curva ROC e Feature Importance
  const confusionRef = useRef<HTMLDivElement>(null);
  const rocRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);

  // Renderização da Matriz de Confusão
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !confusionRef.current) return;

    const cm = modelResult.confusionMatrix;
    const zValues = [
      [cm.tn, cm.fp],
      [cm.fn, cm.tp],
    ];

    const textValues = [
      [`VN: ${cm.tn}<br>(${Math.round((cm.tn / (cm.total || 1)) * 100)}%)`, `FP: ${cm.fp}<br>(${Math.round((cm.fp / (cm.total || 1)) * 100)}%)`],
      [`FN: ${cm.fn}<br>(${Math.round((cm.fn / (cm.total || 1)) * 100)}%)`, `VP: ${cm.tp}<br>(${Math.round((cm.tp / (cm.total || 1)) * 100)}%)`],
    ];

    const data = [
      {
        z: zValues,
        x: ['Previsto: No Prazo', 'Previsto: Atraso/Crítico'],
        y: ['Real: No Prazo', 'Real: Atrasado'],
        type: 'heatmap',
        hoverongaps: false,
        colorscale: [
          [0, '#049DD9'],
          [0.5, '#078C28'],
          [1, '#98BF0B'],
        ],
        showscale: false,
        text: textValues,
        texttemplate: '%{text}',
        textfont: {
          family: 'Inter, sans-serif',
          size: 14,
          color: '#ffffff',
          weight: 'bold',
        },
      },
    ];

    const layout = {
      title: {
        text: '<b>Matriz de Confusão (Classificação 2x2)</b>',
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14 },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      autosize: true,
      margin: { l: 120, r: 30, t: 40, b: 50 },
      xaxis: {
        color: darkMode ? '#94a3b8' : '#475569',
        tickfont: { size: 11 },
      },
      yaxis: {
        color: darkMode ? '#94a3b8' : '#475569',
        tickfont: { size: 11 },
        autorange: 'reversed',
      },
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.react(confusionRef.current, data, layout, config);
  }, [modelResult.confusionMatrix, darkMode]);

  // Renderização da Curva ROC
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !rocRef.current || modelResult.rocPoints.length === 0) return;

    const fprs = modelResult.rocPoints.map((p) => p.fpr);
    const tprs = modelResult.rocPoints.map((p) => p.tpr);

    // Ponto operacional atual para o limiar selecionado
    const currentFpr = 1 - (modelResult.confusionMatrix.specificity / 100);
    const currentTpr = modelResult.confusionMatrix.recall / 100;

    const data = [
      {
        x: fprs,
        y: tprs,
        mode: 'lines',
        name: `Curva ROC (AUC = ${modelResult.auc})`,
        line: { color: '#078C28', width: 3.5, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(7, 140, 40, 0.12)',
        hovertemplate: 'FPR: %{x:.2f}<br>TPR (Recall): %{y:.2f}<extra></extra>',
      },
      {
        x: [0, 1],
        y: [0, 1],
        mode: 'lines',
        name: 'Aleatório (AUC = 0.50)',
        line: { color: '#64748b', width: 1.5, dash: 'dash' },
        hoverinfo: 'none',
      },
      {
        x: [currentFpr],
        y: [currentTpr],
        mode: 'markers',
        name: `Ponto Operacional (θ = ${decisionThreshold.toFixed(2)})`,
        marker: { color: '#049DD9', size: 12, line: { color: '#ffffff', width: 2 } },
        hovertemplate: `Limiar θ: ${decisionThreshold.toFixed(2)}<br>FPR: ${currentFpr.toFixed(2)}<br>Recall: ${currentTpr.toFixed(2)}<extra></extra>`,
      },
    ];

    const layout = {
      title: {
        text: `<b>Curva ROC & Discriminação (AUC = ${modelResult.auc})</b>`,
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14 },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      autosize: true,
      margin: { l: 50, r: 20, t: 40, b: 50 },
      xaxis: {
        title: { text: 'Taxa de Falsos Positivos (1 - Especificidade)', font: { size: 11, color: '#94a3b8' } },
        range: [-0.02, 1.02],
        gridcolor: darkMode ? '#334155' : '#e2e8f0',
        color: darkMode ? '#94a3b8' : '#475569',
      },
      yaxis: {
        title: { text: 'Taxa de Verdadeiros Positivos (Sensibilidade/Recall)', font: { size: 11, color: '#94a3b8' } },
        range: [-0.02, 1.05],
        gridcolor: darkMode ? '#334155' : '#e2e8f0',
        color: darkMode ? '#94a3b8' : '#475569',
      },
      legend: {
        orientation: 'h',
        y: -0.25,
        font: { size: 10, color: darkMode ? '#cbd5e1' : '#475569' },
      },
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.react(rocRef.current, data, layout, config);
  }, [modelResult, decisionThreshold, darkMode]);

  // Renderização da Importância das Features
  useEffect(() => {
    const Plotly = (window as any).Plotly;
    if (!Plotly || !featureRef.current || modelResult.featureImportance.length === 0) return;

    const sortedFeatures = [...modelResult.featureImportance].reverse();
    const names = sortedFeatures.map((f) => f.feature);
    const impacts = sortedFeatures.map((f) => f.impactPercent);

    const data = [
      {
        y: names,
        x: impacts,
        type: 'bar',
        orientation: 'h',
        marker: {
          color: impacts.map((v) => (v >= 70 ? '#078C28' : v >= 50 ? '#049DD9' : '#98BF0B')),
          opacity: 0.9,
        },
        text: impacts.map((v) => `${v}%`),
        textposition: 'auto',
        hovertemplate: '<b>%{y}</b><br>Peso Relativo: %{x}%<extra></extra>',
      },
    ];

    const layout = {
      title: {
        text: '<b>Importância dos Preditores de Atraso (Feature Weights)</b>',
        font: { color: darkMode ? '#F2F2F2' : '#0f172a', size: 14 },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      autosize: true,
      margin: { l: 240, r: 30, t: 40, b: 40 },
      xaxis: {
        title: { text: 'Impacto Relativo (%)', font: { size: 11, color: '#94a3b8' } },
        gridcolor: darkMode ? '#334155' : '#e2e8f0',
        color: darkMode ? '#94a3b8' : '#475569',
        range: [0, 100],
      },
      yaxis: {
        color: darkMode ? '#94a3b8' : '#475569',
        tickfont: { size: 11 },
      },
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.react(featureRef.current, data, layout, config);
  }, [modelResult.featureImportance, darkMode]);

  // 6. Filtragem da Lista de Ordens Avaliadas
  const filteredEvaluatedOrders = useMemo(() => {
    return modelResult.evaluatedOrders.filter((item) => {
      if (selectedRiskFilter !== 'ALL' && item.riskLevel !== selectedRiskFilter) {
        return false;
      }
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const match =
          item.order.id.toLowerCase().includes(q) ||
          item.order.nota.toLowerCase().includes(q) ||
          item.order.tipo.toLowerCase().includes(q) ||
          item.order.equipe.toLowerCase().includes(q) ||
          item.primaryRiskFactor.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [modelResult.evaluatedOrders, selectedRiskFilter, searchFilter]);

  const totalPages = Math.ceil(filteredEvaluatedOrders.length / rowsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredEvaluatedOrders.slice(start, start + rowsPerPage);
  }, [filteredEvaluatedOrders, tablePage]);

  // Exportação CSV das Ordens com Probabilidade de Risco
  const handleExportRiskCsv = () => {
    const headers = [
      'ID_OS',
      'Nota',
      'Tipo',
      'Equipe',
      'Cidade',
      'Prioridade',
      'Tentativa',
      'SLA_Real',
      'Probabilidade_Atraso_Percent',
      'Classificacao_Risco',
      'Fator_Preponderante',
      'Acao_Recomendada',
    ];

    const rows = filteredEvaluatedOrders.map((i) => [
      `"${i.order.id}"`,
      `"${i.order.nota}"`,
      `"${i.order.tipo}"`,
      `"${i.order.equipe}"`,
      `"${i.order.cidade}"`,
      i.order.prioridade,
      i.order.tentativa,
      i.order.statusSla,
      i.probability,
      i.riskLevel,
      `"${i.primaryRiskFactor}"`,
      `"${i.recommendedAction}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `predicao_risco_os_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cm = modelResult.confusionMatrix;

  return (
    <div id="predictive-risk-module" className="space-y-6">
      {/* 1. Header do Módulo & Painel Informativo */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: '#049DD9' }}
            >
              <BrainCircuit className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Modelos Preditivos de Atraso & Risco Operacional
                </h2>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase"
                  style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
                >
                  Fase 4 Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Classificador probabilístico baseado em regressão logística e matriz de confusão.
                Estima a chance de estouro de SLA antes do despacho para campo a partir de características operacionais históricas.
              </p>
            </div>
          </div>

          {/* Botão de Exportação */}
          <button
            id="export-risk-csv-btn"
            onClick={handleExportRiskCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm hover:brightness-110 shrink-0"
            style={{ backgroundColor: '#078C28' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Predições CSV</span>
          </button>
        </div>

        {/* Barra de KPIs do Modelo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Acurácia Global</span>
            <div className="text-lg font-bold text-white mt-0.5">{cm.accuracy}%</div>
            <span className="text-[10px] text-slate-400">Acertos totais</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Precisão</span>
            <div className="text-lg font-bold text-[#049DD9] mt-0.5">{cm.precision}%</div>
            <span className="text-[10px] text-slate-400">VP / (VP + FP)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Recall / Sensibilidade</span>
            <div className="text-lg font-bold text-[#078C28] mt-0.5">{cm.recall}%</div>
            <span className="text-[10px] text-slate-400">Captura de atrasos</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">F1-Score</span>
            <div className="text-lg font-bold text-[#98BF0B] mt-0.5">{cm.f1Score}%</div>
            <span className="text-[10px] text-slate-400">Média harmônica</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Área ROC (AUC)</span>
            <div className="text-lg font-bold text-[#C1D96A] mt-0.5">{modelResult.auc}</div>
            <span className="text-[10px] text-slate-400">Discriminação</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Atraso Histórico Base</span>
            <div className="text-lg font-bold text-slate-200 mt-0.5">{modelResult.baselineDelayRate}%</div>
            <span className="text-[10px] text-slate-400">Taxa base na amostra</span>
          </div>
        </div>

        {/* Controle Paramétrico: Slider de Limiar de Decisão (Cutoff Theta) */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="threshold-slider" className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#049DD9]" />
                <span>Limiar de Decisão / Cutoff ($\theta$):</span>
                <span className="font-mono text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {decisionThreshold.toFixed(2)} ({Math.round(decisionThreshold * 100)}%)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDecisionThreshold(0.35)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                    decisionThreshold === 0.35
                      ? 'bg-[#078C28] text-white border-[#078C28]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Alto Recall (0.35)
                </button>
                <button
                  onClick={() => setDecisionThreshold(0.5)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                    decisionThreshold === 0.5
                      ? 'bg-[#049DD9] text-white border-[#049DD9]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Equilibrado (0.50)
                </button>
                <button
                  onClick={() => setDecisionThreshold(0.65)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                    decisionThreshold === 0.65
                      ? 'bg-[#98BF0B] text-white border-[#98BF0B]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Alta Precisão (0.65)
                </button>
              </div>
            </div>
            <input
              id="threshold-slider"
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={decisionThreshold}
              onChange={(e) => setDecisionThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#049DD9] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.10 (Mais Agressivo: Captura todos os riscos, tolera mais FP)</span>
              <span>0.50 (Neutro)</span>
              <span>0.90 (Conservador: Alerta apenas com evidência contundente)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Seção de Gráficos Analíticos (Plotly): Matriz de Confusão & Curva ROC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico da Matriz de Confusão */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={confusionRef} className="w-full h-72" />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-[#078C28] block">Verdadeiro Positivo ({cm.tp})</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                OSs atrasadas identificadas previamente com sucesso para mitigação.
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-amber-400 block">Falso Positivo ({cm.fp})</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Alarme falso: ordem concluída no prazo que o modelo sinalizou como risco.
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-rose-400 block">Falso Negativo ({cm.fn})</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Falha crítica: atraso real não antecipado pelo modelo no limiar atual.
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-[#049DD9] block">Verdadeiro Negativo ({cm.tn})</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Ordens sem risco operacional que foram executadas pontualmente.
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico da Curva ROC */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div ref={rocRef} className="w-full h-72" />
          <div className="mt-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <p>
              A Curva ROC mede a capacidade discriminatória global do classificador ao variar o limiar de decisão.
              Um valor de <strong className="text-white">AUC de {modelResult.auc}</strong> confirma excelência discriminatória
              (muito acima da linha diagonal de escolha aleatória 0.50).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Ranking de Importância dos Drivers de Risco (Feature Weights) */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div ref={featureRef} className="w-full h-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
            <span className="font-bold text-white flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Maior Alavanca: Reincidência</span>
            </span>
            <p className="text-slate-400 text-[11px]">
              Ordens que representam 2ª ou 3ª visita apresentam chance desproporcionalmente maior de estouro de SLA devido à frustração prévia do cliente ou defeito crônico.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
            <span className="font-bold text-white flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#049DD9]" />
              <span>Tipo & Duração Média</span>
            </span>
            <p className="text-slate-400 text-[11px]">
              Serviços de rede subterrânea ou manutenção corretiva exigem maior alocação de tempo, justificando rotas dedicadas sem intercalação de vistorias rápidas.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
            <span className="font-bold text-white flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#078C28]" />
              <span>Logística & Dispersão</span>
            </span>
            <p className="text-slate-400 text-[11px]">
              Polos com maior dispersão territorial necessitam de agrupamento geográfico rigoroso no despacho inicial matutino para mitigar tempo em trânsito.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SIMULADOR INTERATIVO DE PRÉ-DESPACHO (LIVE RISK CALCULATOR) */}
      <div
        id="pre-dispatch-simulator"
        className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: '#078C28' }}
          >
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Simulador Interativo de Pré-Despacho (Calculadora de Risco em Tempo Real)
            </h3>
            <p className="text-xs text-slate-400">
              Configure os parâmetros de uma nova ordem de serviço e veja a probabilidade calculada antes de atribuir a equipe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Configuração */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            {/* Tipo de OS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#049DD9]" />
                <span>Tipo de Ordem</span>
              </label>
              <select
                value={simParams.tipo}
                onChange={(e) => setSimParams((prev) => ({ ...prev, tipo: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#049DD9]"
              >
                {availableTipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipe Técnica */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#078C28]" />
                <span>Equipe Atribuída</span>
              </label>
              <select
                value={simParams.equipe}
                onChange={(e) => setSimParams((prev) => ({ ...prev, equipe: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#078C28]"
              >
                {availableEquipes.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade / Polo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#98BF0B]" />
                <span>Cidade / Polo Operacional</span>
              </label>
              <select
                value={simParams.cidade}
                onChange={(e) => setSimParams((prev) => ({ ...prev, cidade: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#98BF0B]"
              >
                {availableCidades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Nível de Prioridade</span>
              </label>
              <select
                value={simParams.prioridade}
                onChange={(e) => setSimParams((prev) => ({ ...prev, prioridade: parseInt(e.target.value, 10) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value={1}>1 - Emergência (Prazo Crítico)</option>
                <option value={2}>2 - Alta Prioridade</option>
                <option value={3}>3 - Média / Normal</option>
                <option value={4}>4 - Baixa / Programada</option>
              </select>
            </div>

            {/* Toggle de Reincidência */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Ordem é Reincidente / Retrabalho?</span>
                <span className="text-[11px] text-slate-400">
                  Sinaliza se esta OS já teve tentativa prévia não resolvida.
                </span>
              </div>
              <div className="flex items-center gap-3">
                {simParams.ehReincidente && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-300 font-semibold">Tentativa:</span>
                    <select
                      value={simParams.tentativa}
                      onChange={(e) => setSimParams((prev) => ({ ...prev, tentativa: parseInt(e.target.value, 10) }))}
                      className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-white"
                    >
                      <option value={2}>2ª Tentativa</option>
                      <option value={3}>3ª Tentativa</option>
                      <option value={4}>4ª+ Tentativa</option>
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setSimParams((prev) => ({
                      ...prev,
                      ehReincidente: !prev.ehReincidente,
                      tentativa: !prev.ehReincidente ? 2 : 1,
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    simParams.ehReincidente ? 'bg-rose-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      simParams.ehReincidente ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Resultado do Score da Simulação */}
          <div className="flex flex-col justify-between p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Score Preditivo de Estouro de SLA
              </span>

              {/* Medidor de Probabilidade */}
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className="text-4xl font-extrabold font-mono"
                  style={{
                    color:
                      simResult.riskLevel === 'CRITICO'
                        ? '#ef4444'
                        : simResult.riskLevel === 'ALTO'
                        ? '#f59e0b'
                        : simResult.riskLevel === 'MODERADO'
                        ? '#98BF0B'
                        : '#078C28',
                  }}
                >
                  {simResult.probability}%
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor:
                      simResult.riskLevel === 'CRITICO'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : simResult.riskLevel === 'ALTO'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : simResult.riskLevel === 'MODERADO'
                        ? 'rgba(152, 191, 11, 0.2)'
                        : 'rgba(7, 140, 40, 0.2)',
                    color:
                      simResult.riskLevel === 'CRITICO'
                        ? '#ef4444'
                        : simResult.riskLevel === 'ALTO'
                        ? '#f59e0b'
                        : simResult.riskLevel === 'MODERADO'
                        ? '#98BF0B'
                        : '#078C28',
                  }}
                >
                  Risco {simResult.riskLevel}
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${simResult.probability}%`,
                    backgroundColor:
                      simResult.riskLevel === 'CRITICO'
                        ? '#ef4444'
                        : simResult.riskLevel === 'ALTO'
                        ? '#f59e0b'
                        : simResult.riskLevel === 'MODERADO'
                        ? '#98BF0B'
                        : '#078C28',
                  }}
                />
              </div>

              {/* Drivers do Score */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Fatores de Influência Identificados:
                </span>
                {simResult.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{f.name}</span>
                    <span
                      className={`text-[11px] font-bold ${
                        f.weight > 0 ? 'text-rose-400' : 'text-[#078C28]'
                      }`}
                    >
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ação Prescritiva Recomendada */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#078C28]" />
                <span>Recomendação de Despacho:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {simResult.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABELA DE ORDENS COM RISCO PREDITIVO & MITIGAÇÃO OPERACIONAL */}
      <div
        id="predictive-orders-table-card"
        className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Ordens Classificadas pelo Modelo de Risco</span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: '#049DD9', color: '#F2F2F2' }}
              >
                {filteredEvaluatedOrders.length} Registros
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Score probabilístico calculado para cada ordem com indicação do fator de risco preponderante e ação mitigadora.
            </p>
          </div>

          {/* Filtros da Tabela */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Campo de Busca */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Buscar OS, Nota, Equipe..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#049DD9]"
              />
            </div>

            {/* Pílulas de Nível de Risco */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['ALL', 'CRITICO', 'ALTO', 'MODERADO', 'BAIXO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedRiskFilter(lvl);
                    setTablePage(1);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    selectedRiskFilter === lvl
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'Todos' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID / Nota</th>
                <th className="px-4 py-3">Tipo & Equipe</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">SLA Real</th>
                <th className="px-4 py-3">Score Preditivo</th>
                <th className="px-4 py-3">Classificação</th>
                <th className="px-4 py-3">Fator Preponderante</th>
                <th className="px-4 py-3">Mitigação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma ordem de serviço corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((item) => (
                  <tr key={item.order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-200">
                      {item.order.id}
                      {item.order.nota && (
                        <span className="block text-[10px] text-slate-400">{item.order.nota}</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-slate-200 block font-semibold">{item.order.tipo}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.order.equipe}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-300">{item.order.cidade}</td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor:
                            item.order.statusSla === 'NO_PRAZO'
                              ? 'rgba(7, 140, 40, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color: item.order.statusSla === 'NO_PRAZO' ? '#078C28' : '#ef4444',
                        }}
                      >
                        {item.order.statusSla.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{item.probability}%</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.probability}%`,
                              backgroundColor:
                                item.riskLevel === 'CRITICO'
                                  ? '#ef4444'
                                  : item.riskLevel === 'ALTO'
                                  ? '#f59e0b'
                                  : item.riskLevel === 'MODERADO'
                                  ? '#98BF0B'
                                  : '#078C28',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor:
                            item.riskLevel === 'CRITICO'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : item.riskLevel === 'ALTO'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : item.riskLevel === 'MODERADO'
                              ? 'rgba(152, 191, 11, 0.2)'
                              : 'rgba(7, 140, 40, 0.2)',
                          color:
                            item.riskLevel === 'CRITICO'
                              ? '#ef4444'
                              : item.riskLevel === 'ALTO'
                              ? '#f59e0b'
                              : item.riskLevel === 'MODERADO'
                              ? '#98BF0B'
                              : '#078C28',
                        }}
                      >
                        {item.riskLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={item.primaryRiskFactor}>
                      {item.primaryRiskFactor}
                    </td>

                    <td className="px-4 py-3 text-slate-400 text-[11px] max-w-sm truncate" title={item.recommendedAction}>
                      {item.recommendedAction}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação da Tabela */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Página {tablePage} de {totalPages} ({filteredEvaluatedOrders.length} ordens filtradas)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={tablePage === 1}
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white"
              >
                Anterior
              </button>
              <button
                disabled={tablePage === totalPages}
                onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
