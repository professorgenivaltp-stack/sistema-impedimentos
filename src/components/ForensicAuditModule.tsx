import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Filter, 
  Search, 
  Compass, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Layers,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { 
  StandardWorkOrder, 
  ForensicFinding, 
  ActionPlan5W2HItem, 
  PoloGeoCluster 
} from '../types';
import { 
  runForensicAudit, 
  buildTerritorialClusters, 
  generatePrescriptive5W2HPlan 
} from '../utils/forensicAuditEngine';

interface ForensicAuditModuleProps {
  orders: StandardWorkOrder[];
  darkMode: boolean;
  onSelectOrder?: (order: StandardWorkOrder) => void;
}

export const ForensicAuditModule: React.FC<ForensicAuditModuleProps> = ({
  orders,
  darkMode,
  onSelectOrder,
}) => {
  const [subTab, setSubTab] = useState<'forensics' | 'geomap' | 'rootcause' | 'plan5w2h'>('forensics');
  const [severityFilter, setSeverityFilter] = useState<string>('TODAS');
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Executar auditoria forense
  const { findings, summary } = useMemo(() => runForensicAudit(orders), [orders]);

  // 2. Agrupar polos territoriais
  const clusters = useMemo(() => buildTerritorialClusters(orders), [orders]);

  // 3. Gerar plano 5W2H
  const plans = useMemo(() => generatePrescriptive5W2HPlan(orders, findings), [orders, findings]);

  // Filtragem de apontamentos forenses
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSeverity = severityFilter === 'TODAS' || f.severity === severityFilter;
      const matchSearch = 
        !searchTerm.trim() ||
        f.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.order.equipe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.order.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.order.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSeverity && matchSearch;
    });
  }, [findings, severityFilter, searchTerm]);

  // Formatação monetária
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  // Copiar Plano 5W2H formatado para a área de transferência
  const handleCopyPlan = () => {
    const text = plans
      .map(
        (p, idx) =>
          `[AÇÃO ${idx + 1}] ${p.what.toUpperCase()}\n` +
          `• Por quê (Why): ${p.why}\n` +
          `• Onde (Where): ${p.where}\n` +
          `• Quando (When): ${p.when}\n` +
          `• Quem (Who): ${p.who}\n` +
          `• Como (How): ${p.how}\n` +
          `• Quanto (How Much): ${p.howMuch}\n` +
          `----------------------------------------------------`
      )
      .join('\n\n');

    navigator.clipboard.writeText(`PLANO DE AÇÃO 5W2H - SUPERVISÃO OPERACIONAL ASSU\n\n${text}`);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  // Exportar Plano 5W2H em CSV
  const handleExport5W2HCsv = () => {
    const headers = ['ID', 'O Que (What)', 'Por Que (Why)', 'Onde (Where)', 'Quando (When)', 'Quem (Who)', 'Como (How)', 'Quanto (How Much)', 'Prioridade', 'Categoria'];
    const rows = plans.map((p) => [
      p.id,
      `"${p.what.replace(/"/g, '""')}"`,
      `"${p.why.replace(/"/g, '""')}"`,
      `"${p.where.replace(/"/g, '""')}"`,
      `"${p.when.replace(/"/g, '""')}"`,
      `"${p.who.replace(/"/g, '""')}"`,
      `"${p.how.replace(/"/g, '""')}"`,
      `"${p.howMuch.replace(/"/g, '""')}"`,
      p.priority,
      p.category,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano_acao_5w2h_supervisao_assu_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar Achados Forenses em CSV
  const handleExportForensicsCsv = () => {
    const headers = ['ID Ordem', 'Severidade', 'Tipo Inconformidade', 'Equipe', 'Cidade', 'Tipo Servico', 'Duracao (min)', 'Titulo', 'Descricao', 'Evidencia', 'Acao Recomendada'];
    const rows = findings.map((f) => [
      f.orderId,
      f.severity,
      f.ruleType,
      `"${f.order.equipe}"`,
      `"${f.order.cidade}"`,
      `"${f.order.tipo}"`,
      f.order.duracaoMinutos,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${f.description.replace(/"/g, '""')}"`,
      `"${f.evidence.replace(/"/g, '""')}"`,
      `"${f.recommendedAuditAction.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_forense_campo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="forensic-audit-module" className="space-y-6">
      {/* Banner de Status com Métricas Forenses de Alto Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className={`p-4 rounded-xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Inconformidades Detectadas</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {summary.totalFindings}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.criticalCount} de severidade crítica requerem auditoria
          </p>
        </div>

        <div 
          className={`p-4 rounded-xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Desperdício Estimado</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(summary.potentialWasteEstimated)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Custos de retrabalho e viagens improdutivas
          </p>
        </div>

        <div 
          className={`p-4 rounded-xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Polos Operacionais (RN)</span>
            <MapPin className="w-4 h-4 text-[#049DD9]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#049DD9]">
            {clusters.length} Municípios
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Supervisão ASSU e cidades integradas
          </p>
        </div>

        <div 
          className={`p-4 rounded-xl border transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Planos 5W2H Prescritivos</span>
            <CheckCircle2 className="w-4 h-4 text-[#078C28]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#078C28]">
            {plans.length} Ações Imediatas
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Metas calibradas com base nos dados reais
          </p>
        </div>
      </div>

      {/* Navegação de Sub-Abas do Módulo de Inteligência */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => setSubTab('forensics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'forensics'
                ? 'bg-[#049DD9] text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Auditoria Forense ({summary.totalFindings})</span>
          </button>

          <button
            onClick={() => setSubTab('geomap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'geomap'
                ? 'bg-[#049DD9] text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Mapa Territorial dos Polos</span>
          </button>

          <button
            onClick={() => setSubTab('rootcause')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'rootcause'
                ? 'bg-[#049DD9] text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Matriz de Causa-Raiz</span>
          </button>

          <button
            onClick={() => setSubTab('plan5w2h')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'plan5w2h'
                ? 'bg-[#078C28] text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plano Prescritivo 5W2H</span>
          </button>
        </div>

        {subTab === 'forensics' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportForensicsCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Auditoria (CSV)</span>
            </button>
          </div>
        )}

        {subTab === 'plan5w2h' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPlan}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlan ? 'Copiado!' : 'Copiar Plano'}</span>
            </button>
            <button
              onClick={handleExport5W2HCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#078C28] hover:bg-[#078C28]/90 text-white flex items-center gap-1.5 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar 5W2H (CSV)</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB-ABA 1: AUDITORIA FORENSE DE CAMPO */}
      {subTab === 'forensics' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por OS, equipe, cidade ou tipo..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#049DD9]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-400 whitespace-nowrap">Severidade:</span>
              {['TODAS', 'CRITICA', 'ALTA', 'MEDIA'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    severityFilter === sev
                      ? sev === 'CRITICA'
                        ? 'bg-rose-500 text-white'
                        : sev === 'ALTA'
                        ? 'bg-amber-500 text-slate-950'
                        : sev === 'MEDIA'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
              Nenhuma inconsistência forense encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFindings.map((finding) => {
                const sevBadge = 
                  finding.severity === 'CRITICA'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : finding.severity === 'ALTA'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

                return (
                  <div
                    key={finding.id}
                    onClick={() => onSelectOrder && onSelectOrder(finding.order)}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${sevBadge}`}>
                          {finding.severity}
                        </span>
                        <h4 className="text-xs font-bold text-white font-mono">
                          OS #{finding.orderId}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          &bull; Equipe {finding.order.equipe}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {finding.order.cidade}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-200">
                        {finding.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {finding.description}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Evidência Identificada:</span>
                      <p className="text-slate-300 mt-0.5 font-mono text-[10px]">
                        {finding.evidence}
                      </p>
                    </div>

                    <div className="text-[11px] flex items-start gap-1.5 text-[#049DD9]">
                      <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Ação de Campo Recomendada:</strong> {finding.recommendedAuditAction}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-ABA 2: MAPA TERRITORIAL DOS POLOS */}
      {subTab === 'geomap' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#049DD9]" />
              <span>Painel Territorial dos Municípios da Supervisão ASSU</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              Geolocalização calibrada dos chamados no Rio Grande do Norte com taxa de conformidade contratual (SLA) e identificação de polos sob alta vulnerabilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map((cluster) => {
              const slaColor = 
                cluster.slaComplianceRate >= 80 
                  ? 'text-emerald-400' 
                  : cluster.slaComplianceRate >= 65 
                  ? 'text-amber-400' 
                  : 'text-rose-400';

              const vulnBadge = 
                cluster.vulnerabilityScore > 40
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : cluster.vulnerabilityScore > 20
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

              return (
                <div 
                  key={cluster.cidade}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {cluster.cidade}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        GPS: {cluster.latitude.toFixed(4)}, {cluster.longitude.toFixed(4)}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${vulnBadge}`}>
                      Vulnerabilidade {cluster.vulnerabilityScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Total de OS</span>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {cluster.totalOrders}
                      </div>
                      <span className="text-[10px] text-slate-500">{cluster.revisitOrders} reincidências</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Conformidade SLA</span>
                      <div className={`text-base font-bold font-mono mt-0.5 ${slaColor}`}>
                        {cluster.slaComplianceRate}%
                      </div>
                      <span className="text-[10px] text-slate-500">{cluster.delayedOrders} em atraso</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <div className="flex justify-between">
                      <span>Equipe Principal:</span>
                      <span className="text-white font-mono font-semibold">{cluster.topTeam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Serviço Dominante:</span>
                      <span className="text-white font-semibold truncate max-w-[150px]">{cluster.topService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TMA Médio:</span>
                      <span className="text-white font-mono">{cluster.avgDuration} min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-ABA 3: MATRIZ DE CAUSA-RAIZ */}
      {subTab === 'rootcause' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Matriz de Diagnóstico Causal & Correlação Multidimensional</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              O motor correlaciona as variáveis operacionais para revelar as verdadeiras raízes dos gargalos de atendimento na concessão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco Causa 1: Equipes com Maior Taxa de Estouro */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Equipes com Maior Sensibilidade a Quebra de SLA</span>
              </h4>
              <div className="space-y-2 text-xs">
                {(() => {
                  const teamStats: Record<string, { total: number; delays: number; revisits: number }> = {};
                  orders.forEach((o) => {
                    const eq = o.equipe || 'Geral';
                    if (!teamStats[eq]) teamStats[eq] = { total: 0, delays: 0, revisits: 0 };
                    teamStats[eq].total++;
                    if (o.statusSla === 'ATRASADO' || o.statusSla === 'CRITICO') teamStats[eq].delays++;
                    if (o.ehReincidente) teamStats[eq].revisits++;
                  });

                  return Object.entries(teamStats)
                    .filter(([_, v]) => v.total >= 4)
                    .sort((a, b) => (b[1].delays / b[1].total) - (a[1].delays / a[1].total))
                    .slice(0, 5)
                    .map(([eq, st]) => {
                      const rate = Math.round((st.delays / st.total) * 100);
                      return (
                        <div key={eq} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <div className="font-bold font-mono text-white">Equipe {eq}</div>
                            <span className="text-[10px] text-slate-400">{st.total} ordens &bull; {st.revisits} reincidências</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-rose-400">{rate}% Atraso</span>
                            <span className="text-[10px] text-slate-500 block">({st.delays} atrasadas)</span>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>

            {/* Bloco Causa 2: Serviços com Maior TMA e Variação */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-[#049DD9]" />
                <span>Tipos de Serviço com Maior Dispersão de Duração</span>
              </h4>
              <div className="space-y-2 text-xs">
                {(() => {
                  const typeStats: Record<string, number[]> = {};
                  orders.forEach((o) => {
                    const tp = o.tipo || 'Geral';
                    if (!typeStats[tp]) typeStats[tp] = [];
                    typeStats[tp].push(o.duracaoMinutos || 30);
                  });

                  return Object.entries(typeStats)
                    .map(([tp, durs]) => {
                      const avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
                      return { tp, count: durs.length, avg };
                    })
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.tp} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{item.tp}</div>
                          <span className="text-[10px] text-slate-400">{item.count} ordens executadas</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-[#049DD9]">{item.avg} min</span>
                          <span className="text-[10px] text-slate-500 block">TMA Médio</span>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 4: PLANO PRESCRITIVO 5W2H */}
      {subTab === 'plan5w2h' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#078C28]" />
              <span>Plano Estratégico 5W2H Gerado sob Demanda para a Supervisão</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              Metodologia de gestão da qualidade industrial que define com clareza O Quê, Por Quê, Onde, Quando, Quem, Como e Quanto custará cada intervenção tática.
            </p>
          </div>

          <div className="space-y-4">
            {plans.map((plan, idx) => (
              <div 
                key={plan.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#078C28]/20 text-[#078C28] text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {plan.what}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                      {plan.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                      Prioridade {plan.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Por quê (Why)</span>
                    <p className="text-slate-200 mt-1 leading-relaxed">{plan.why}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Onde & Quando (Where / When)</span>
                    <p className="text-slate-200 mt-1"><strong>Local:</strong> {plan.where}</p>
                    <p className="text-slate-300 mt-0.5"><strong>Prazo:</strong> {plan.when}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Quem (Who)</span>
                    <p className="text-white font-semibold mt-1">{plan.who}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Como será executado (How)</span>
                    <p className="text-slate-300 mt-1 leading-relaxed">{plan.how}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#078C28]/10 border border-[#078C28]/20">
                    <span className="text-[10px] font-bold text-[#078C28] uppercase block">Impacto Financeiro (How Much)</span>
                    <p className="text-emerald-300 font-semibold mt-1">{plan.howMuch}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
