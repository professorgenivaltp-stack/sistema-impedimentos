import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { FileDropzone } from './components/FileDropzone';
import { ColumnMappingModal } from './components/ColumnMappingModal';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { DataIngestionHealth } from './components/DataIngestionHealth';
import { GlobalFilters, FilterState } from './components/GlobalFilters';
import { KpiCards } from './components/KpiCards';
import { OverviewCharts } from './components/OverviewCharts';
import { ParetoAnalysis } from './components/ParetoAnalysis';
import { AnomalyDetection } from './components/AnomalyDetection';
import { WorkOrdersTable } from './components/WorkOrdersTable';
import { PredictiveRiskModule } from './components/PredictiveRiskModule';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ForensicAuditModule } from './components/ForensicAuditModule';
import { OrderDetailModal } from './components/OrderDetailModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { 
  TabId, 
  AuditLog, 
  ColumnMappingConfig, 
  WorkOrderRaw, 
  StandardWorkOrder,
  IngestionDiagnostics 
} from './types';
import { 
  detectColumnMappingAdvanced, 
  findHeaderRowIndex, 
  detectCsvDelimiter,
  normalizeWorkOrdersAndDiagnose 
} from './utils/dataIngestion';
import { generateSampleOperationalData } from './utils/sampleData';
import { 
  computeKPIs, 
  applyZScoreAnalysis 
} from './utils/statistics';
import { runForensicAudit } from './utils/forensicAuditEngine';
import { getXLSX } from './utils/excel';
import { 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  Calculator, 
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  SlidersHorizontal,
  RefreshCw,
  Info,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // 1. Estados Globais de Configuração & Governança
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isPending, startTransition] = useTransition();

  // 2. Estados de Ingestão de Dados & Diagnóstico
  const [rawRows, setRawRows] = useState<WorkOrderRaw[]>([]);
  const [parsedOrders, setParsedOrders] = useState<StandardWorkOrder[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<IngestionDiagnostics | null>(null);
  const [mappingConfidence, setMappingConfidence] = useState<number>(90);
  const workbookRef = useRef<any>(null);
  const currentFileSizeRef = useRef<number>(0);

  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>({
    id: 'ID',
    nota: 'Nota',
    supervisao: 'Supervisa',
    tipo: 'Tipo',
    servico: 'Serviço',
    criacao: 'Criação',
    vencimento: 'Vencimento',
    cidade: 'Cidade',
    prioridade: 'Prioridade',
    equipe: 'Equipe',
    retorno: 'Retorno',
    motivo: 'Motivo',
    dataExecIni: 'DataExecIni',
    horaExecIni: 'HoraExecIni',
    dataExecFim: 'DataExecFim',
    horaExecFim: 'HoraExecFim',
    statusRetorno: 'StatusRetorno',
    tentativa: 'Tentativa',
    latitude: 'Latitude',
    longitude: 'Longitude',
  });

  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Estados de Modais & Drawers
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<StandardWorkOrder | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(),
      level: 'info',
      message: 'Fase 4 inicializada: Modelos Preditivos de Atraso, Matriz de Confusão, Curva ROC e Simulador de Pré-Despacho.',
    },
    {
      id: 'log-2',
      timestamp: new Date(),
      level: 'success',
      message: 'Paleta corporativa ativa (#049DD9, #078C28, #98BF0B, #C1D96A, #F2F2F2).',
    }
  ]);

  // 4. Estados de Filtros Globais Reativos (FASE 3)
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    supervisao: 'ALL',
    tipo: 'ALL',
    equipe: 'ALL',
    cidade: 'ALL',
    statusSla: 'ALL',
    reincidencia: 'ALL',
  });

  const addLog = (level: AuditLog['level'], message: string, details?: string) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(),
        level,
        message,
        details,
      },
      ...prev.slice(0, 99),
    ]);
  };

  // Carregamento inicial automático para exibição instantânea da aplicação
  useEffect(() => {
    handleLoadSample();
  }, []);

  // 4. Sincronização do Dark Mode no root document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 4.1 Atalho Global de Busca Rápida (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 5. Ingestão de Arquivo com SheetJS (XLSX, XLS e CSV com delimitadores flexíveis)
  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    const fileSizeKb = file.size / 1024;
    currentFileSizeRef.current = fileSizeKb;
    setFileName(file.name);

    addLog(
      'info', 
      `Iniciando ingestão de '${file.name}' (${fileSizeKb.toFixed(1)} KB)`,
      `Tipo MIME detectado: ${file.type || 'application/octet-stream'}`
    );

    try {
      const XLSX = getXLSX();
      if (!XLSX) {
        throw new Error('Biblioteca SheetJS (XLSX) não encontrada no contexto de execução.');
      }

      let workbook: any;

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const bestDelimiter = detectCsvDelimiter(text);
        addLog('info', `Arquivo CSV detectado. Delimitador identificado: '${bestDelimiter}'`);
        workbook = XLSX.read(text, { type: 'string', FS: bestDelimiter, cellDates: true });
      } else {
        const data = await file.arrayBuffer();
        workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
      }

      workbookRef.current = workbook;
      const sheets = workbook.SheetNames || ['Planilha1'];
      setSheetNames(sheets);
      addLog('success', `Pasta de trabalho lida com sucesso. Abas encontradas: ${sheets.join(', ')}`);

      // Seleciona preferencialmente a aba LISTAGEM ou IW58 ou a primeira disponível
      let targetSheet = sheets[0];
      const matchSpecial = sheets.find(s => 
        s.toUpperCase().includes('LISTAGEM') || s.toUpperCase().includes('IW58')
      );
      if (matchSpecial) {
        targetSheet = matchSpecial;
        addLog('info', `Aba prioritária detectada automaticamente: '${targetSheet}'`);
      }

      setActiveSheet(targetSheet);
      processWorksheet(workbook.Sheets[targetSheet], targetSheet, file.name, sheets, fileSizeKb);
    } catch (err: any) {
      addLog('error', `Falha crítica na ingestão: ${err.message}`, err.stack);
      alert(`Erro na leitura do arquivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Processamento de Worksheet com Heurísticas
  const processWorksheet = (
    worksheet: any, 
    sheetName: string, 
    fName: string, 
    allSheets: string[], 
    fileSizeKb: number
  ) => {
    const XLSX = getXLSX();
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawMatrix || rawMatrix.length === 0) {
      addLog('warn', `Aba '${sheetName}' está vazia ou sem linhas de dados.`);
      return;
    }

    // Algoritmo de identificação da linha de cabeçalho
    const { rowIndex: headerRowIndex, score: headerScore } = findHeaderRowIndex(rawMatrix);
    const headers: string[] = (rawMatrix[headerRowIndex] || [])
      .map((h: any) => String(h || '').trim())
      .filter(Boolean);

    if (headers.length === 0) {
      addLog('error', `Nenhum cabeçalho válido identificado na aba '${sheetName}'.`);
      return;
    }

    setAvailableColumns(headers);
    addLog(
      'success',
      `Cabeçalho identificado na linha ${headerRowIndex + 1} (Score heurístico: ${headerScore})`,
      `${headers.length} colunas encontradas: ${headers.slice(0, 8).join(', ')}...`
    );

    // Mapeamento Heurístico Avançado
    const { mapping: detectedMapping, confidence } = detectColumnMappingAdvanced(headers);
    setColumnMapping(detectedMapping);
    setMappingConfidence(confidence);

    addLog(
      confidence >= 75 ? 'success' : 'warn',
      `Mapeamento heurístico concluído com índice de confiança de ${confidence}%`,
      `Campos essenciais mapeados: Tipo='${detectedMapping.tipo}', Criação='${detectedMapping.criacao}', Vencimento='${detectedMapping.vencimento}'`
    );

    // Converte as linhas subsequentes em objetos
    const rows: WorkOrderRaw[] = [];
    for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
      const rowData = rawMatrix[r];
      if (!rowData || rowData.every((c: any) => c === '' || c === null || c === undefined)) {
        continue;
      }
      const rowObj: any = {};
      headers.forEach((colName, colIdx) => {
        rowObj[colName] = rowData[colIdx];
      });
      rows.push(rowObj);
    }

    setRawRows(rows);
    addLog('info', `${rows.length} linhas de registros brutos extraídas da planilha.`);

    // Normalização dos registros e geração do diagnóstico
    const { orders, diagnostics: diagResult } = normalizeWorkOrdersAndDiagnose(
      rows,
      detectedMapping,
      fName,
      sheetName,
      allSheets,
      fileSizeKb,
      confidence
    );

    setParsedOrders(orders);
    setDiagnostics(diagResult);

    addLog(
      'success',
      `Normalização estrutural concluída: ${orders.length} ordens de serviço válidas prontas para análise operacional.`,
      `Governança estrita: Nulos preservados de forma transparente sem imputação arbitrária de medianas.`
    );
  };

  // 7. Alternar Aba de Planilha da mesma Pasta de Trabalho
  const handleSelectSheet = (sheet: string) => {
    if (!workbookRef.current || !workbookRef.current.Sheets[sheet]) {
      addLog('warn', `Aba '${sheet}' não disponível no buffer.`);
      return;
    }
    setActiveSheet(sheet);
    addLog('info', `Alternando processamento para a aba '${sheet}'...`);
    processWorksheet(
      workbookRef.current.Sheets[sheet], 
      sheet, 
      fileName || 'Pasta_Trabalho.xlsx', 
      sheetNames, 
      currentFileSizeRef.current
    );
  };

  // 8. Carregar Amostra Operacional Baseada no Modelo Real
  const handleLoadSample = () => {
    setIsLoading(true);
    addLog('info', 'Gerando conjunto amostral fundamentado na estrutura real das ordens de serviço ASSU/IW58...');

    setTimeout(() => {
      const sampleRows = generateSampleOperationalData();
      const mockFileName = 'Planilha_Operacional_ASSU_Modelo.xlsx';
      const mockSheets = ['LISTAGEM', 'IW58'];
      const mockActiveSheet = 'LISTAGEM';

      setFileName(mockFileName);
      setSheetNames(mockSheets);
      setActiveSheet(mockActiveSheet);
      currentFileSizeRef.current = 64.5;

      const headers = Object.keys(sampleRows[0]);
      setAvailableColumns(headers);

      const { mapping: detectedMapping, confidence } = detectColumnMappingAdvanced(headers);
      setColumnMapping(detectedMapping);
      setMappingConfidence(confidence);
      setRawRows(sampleRows);

      const { orders, diagnostics: diagResult } = normalizeWorkOrdersAndDiagnose(
        sampleRows,
        detectedMapping,
        mockFileName,
        mockActiveSheet,
        mockSheets,
        64.5,
        confidence
      );

      setParsedOrders(orders);
      setDiagnostics(diagResult);
      setIsLoading(false);

      addLog('success', `Amostra de ${orders.length} Ordens de Serviço carregada e diagnosticada com sucesso.`);
      addLog('info', 'Mapeamento heurístico aplicado com correspondência 100% nas colunas operacionais da ASSU.');
    }, 200);
  };

  // 9. Re-execução quando o usuário altera manualmente o mapeamento
  const handleApplyUserMapping = (newMapping: ColumnMappingConfig) => {
    setColumnMapping(newMapping);
    addLog('info', 'Mapeamento de colunas atualizado manualmente pelo operador.');
    if (rawRows.length > 0) {
      const { orders, diagnostics: diagResult } = normalizeWorkOrdersAndDiagnose(
        rawRows,
        newMapping,
        fileName || 'arquivo',
        activeSheet,
        sheetNames,
        currentFileSizeRef.current,
        100 // Ajuste manual tem confiança 100% atribuída pelo operador
      );
      setParsedOrders(orders);
      setDiagnostics(diagResult);
      addLog('success', `Base re-normalizada com ${orders.length} ordens a partir do schema atualizado.`);
    }
  };

  // 10. Listas únicas para dropdowns de filtros
  const availableSupervisoes = useMemo(() => {
    const s = new Set<string>();
    parsedOrders.forEach((o) => {
      if (o.supervisao) s.add(o.supervisao);
    });
    return Array.from(s).sort();
  }, [parsedOrders]);

  const availableTipos = useMemo(() => {
    const s = new Set<string>();
    parsedOrders.forEach((o) => {
      if (o.tipo) s.add(o.tipo);
    });
    return Array.from(s).sort();
  }, [parsedOrders]);

  const availableEquipes = useMemo(() => {
    const s = new Set<string>();
    parsedOrders.forEach((o) => {
      if (o.equipe) s.add(o.equipe);
    });
    return Array.from(s).sort();
  }, [parsedOrders]);

  const availableCidades = useMemo(() => {
    const s = new Set<string>();
    parsedOrders.forEach((o) => {
      if (o.cidade) s.add(o.cidade);
    });
    return Array.from(s).sort();
  }, [parsedOrders]);

  // 11. Filtragem Global Reativa
  const filteredOrders = useMemo(() => {
    return parsedOrders.filter((o) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          o.id.toLowerCase().includes(q) ||
          o.nota.toLowerCase().includes(q) ||
          o.motivo.toLowerCase().includes(q) ||
          o.servico.toLowerCase().includes(q) ||
          o.tipo.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.supervisao !== 'ALL' && o.supervisao !== filters.supervisao) return false;
      if (filters.tipo !== 'ALL' && o.tipo !== filters.tipo) return false;
      if (filters.equipe !== 'ALL' && o.equipe !== filters.equipe) return false;
      if (filters.cidade !== 'ALL' && o.cidade !== filters.cidade) return false;
      if (filters.statusSla !== 'ALL' && o.statusSla !== filters.statusSla) return false;
      if (filters.reincidencia === 'PRIMEIRA' && o.ehReincidente) return false;
      if (filters.reincidencia === 'REINCIDENTE' && !o.ehReincidente) return false;

      return true;
    });
  }, [parsedOrders, filters]);

  // 12. Enriquecimento Estatístico com Detecção Z-Score
  const { enrichedOrders: finalOrders } = useMemo(() => {
    return applyZScoreAnalysis(filteredOrders, 'duracaoMinutos', 2.5);
  }, [filteredOrders]);

  // 13. KPIs em Tempo Real
  const kpis = useMemo(() => {
    return computeKPIs(finalOrders);
  }, [finalOrders]);

  // 13.1 Auditoria Forense e Indicadores de Conformidade
  const forensicAuditResult = useMemo(() => {
    return runForensicAudit(finalOrders);
  }, [finalOrders]);

  // 14. Handlers de Cross-Filtering Interativo
  const handleCrossFilter = (field: 'motivo' | 'tipo' | 'equipe' | 'cidade', value: string) => {
    if (field === 'motivo') {
      setFilters((prev) => ({ ...prev, searchQuery: value }));
      addLog('info', `Filtro cruzado aplicado via Pareto: Busca por '${value}'.`);
    } else if (field === 'tipo') {
      setFilters((prev) => ({ ...prev, tipo: value }));
      addLog('info', `Filtro cruzado aplicado via Gráfico: Tipo de Ordem '${value}'.`);
    } else if (field === 'equipe') {
      setFilters((prev) => ({ ...prev, equipe: value }));
      addLog('info', `Filtro cruzado aplicado via Gráfico: Equipe Técnica '${value}'.`);
    } else if (field === 'cidade') {
      setFilters((prev) => ({ ...prev, cidade: value }));
      addLog('info', `Filtro cruzado aplicado via Gráfico: Cidade '${value}'.`);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      supervisao: 'ALL',
      tipo: 'ALL',
      equipe: 'ALL',
      cidade: 'ALL',
      statusSla: 'ALL',
      reincidencia: 'ALL',
    });
    addLog('info', 'Filtros globais resetados.');
  };

  // Contagens para badges da barra de navegação
  const totalOrders = parsedOrders.length;
  const criticalOrders = finalOrders.filter(
    (o) => o.statusSla === 'CRITICO' || o.statusSla === 'ATRASADO'
  ).length;
  const reincidentOrders = finalOrders.filter((o) => o.ehReincidente).length;
  const outlierOrdersCount = finalOrders.filter((o) => o.isOutlier).length;

  return (
    <div 
      id="root-dashboard-app"
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode ? 'bg-slate-950 text-[#F2F2F2]' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* HEADER OPERACIONAL */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        totalOrders={totalOrders}
        fileName={fileName}
        activeSheetName={activeSheet}
        onOpenUpload={() => {
          const input = document.getElementById('file-input-element') as HTMLInputElement;
          input?.click();
        }}
        onOpenMapping={() => setIsMappingModalOpen(true)}
        onToggleLogs={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
        hasLogs={logs.length > 0}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* ABAS DE NAVEGAÇÃO */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={(tab) => startTransition(() => setActiveTab(tab))}
        counts={{
          total: totalOrders,
          paretoTop: Math.min(5, Math.ceil(totalOrders * 0.2)),
          anomalies: outlierOrdersCount,
          highRisk: criticalOrders + reincidentOrders,
          forensics: forensicAuditResult.summary.totalFindings,
        }}
        darkMode={darkMode}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Zona de Ingestão de Arquivos (Dropzone) */}
        <FileDropzone
          darkMode={darkMode}
          onFileLoaded={handleProcessFile}
          onLoadTemplateSample={handleLoadSample}
          isLoading={isLoading}
          fileName={fileName}
          sheetNames={sheetNames}
          activeSheet={activeSheet}
          onSelectSheet={handleSelectSheet}
        />

        {/* Diagnóstico de Integridade da Ingestão de Dados (FASE 2) */}
        {diagnostics && (
          <DataIngestionHealth
            diagnostics={diagnostics}
            mapping={columnMapping}
            onOpenMapping={() => setIsMappingModalOpen(true)}
            onSelectSheet={handleSelectSheet}
            darkMode={darkMode}
          />
        )}

        {/* FILTROS GLOBAIS REATIVOS (FASE 3) */}
        {totalOrders > 0 && (
          <GlobalFilters
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            totalRows={totalOrders}
            filteredRowsCount={finalOrders.length}
            availableSupervisoes={availableSupervisoes}
            availableTipos={availableTipos}
            availableEquipes={availableEquipes}
            availableCidades={availableCidades}
            darkMode={darkMode}
          />
        )}

        {/* CARDS DE KPIS ESTATÍSTICOS EM TEMPO REAL (FASE 3) */}
        {totalOrders > 0 && (
          <KpiCards kpis={kpis} darkMode={darkMode} />
        )}

        {/* CONTEÚDO BASEADO NA ABA ATIVA */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Gráficos Principais da Visão Geral */}
            <OverviewCharts
              orders={finalOrders}
              onFilterByField={handleCrossFilter}
              darkMode={darkMode}
            />

            {/* Card Informativo de Conclusão da Plataforma Completa (Fases 1 a 5) */}
            <div 
              id="platform-completion-status-card"
              className={`p-6 rounded-2xl border transition-all ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: '#078C28' }}
                  >
                    <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#F2F2F2]">
                        PLATAFORMA COMPLETA INTEGRADA (FASES 1 A 5 CONCLUÍDAS)
                      </h2>
                      <span 
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase"
                        style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
                      >
                        100% Operacional
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ingestão multi-formato, auditoria estatística, Pareto 80/20, anomalias Z-Score, predição de risco ML com ROC/AUC, simulador de cenários What-If e relatório executivo.
                    </p>
                  </div>
                </div>

                {/* Paleta Oficial do Projeto */}
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1.5">Paleta Obrigatória:</span>
                  <div className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: '#049DD9' }} title="#049DD9 (Azul Técnico)"></div>
                  <div className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: '#078C28' }} title="#078C28 (Verde Operacional)"></div>
                  <div className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: '#98BF0B' }} title="#98BF0B (Verde Oliva)"></div>
                  <div className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: '#C1D96A' }} title="#C1D96A (Chartreuse Suave)"></div>
                  <div className="w-5 h-5 rounded-md shadow-sm border border-slate-600" style={{ backgroundColor: '#F2F2F2' }} title="#F2F2F2 (Neutro Alto Contraste)"></div>
                </div>
              </div>

              {/* Cards dos Pilares da Plataforma */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#049DD9]" />
                    <h4 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">Pareto 80/20</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Identificação cirúrgica dos motivos e tipos vitais de intervenção responsáveis por 80% dos atrasos de campo.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">Anomalias Z-Score</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Detecção de durações atípicas (|Z| &gt; 2.5), histograma com faixas de desvio padrão e dispersão analítica.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-[#049DD9]" />
                    <h4 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">Modelos Preditivos</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Classificação de probabilidade de atraso, Curva ROC, matriz de confusão com limiar dinâmico e calculadora de pré-despacho.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-[#078C28]" />
                    <h4 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">Simulador What-If</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Projeção de SLA, dimensionamento de equipes, análise de payback/ROI e geração de relatório executivo consolidado.
                  </p>
                </div>
              </div>
            </div>

            {/* Prévia da Base com Acesso Rápido */}
            <div className={`p-6 rounded-2xl border transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Amostra das Ordens Filtradas</span>
                    <span 
                      className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
                    >
                      {finalOrders.length} OS Ativas
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visualização rápida das 5 primeiras ocorrências de campo de acordo com os filtros selecionados.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('table')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-[#049DD9] transition-colors"
                >
                  <span>Abrir Tabela Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">ID / Nota</th>
                      <th className="px-4 py-3">Tipo de OS</th>
                      <th className="px-4 py-3">Serviço</th>
                      <th className="px-4 py-3">Cidade</th>
                      <th className="px-4 py-3">Equipe</th>
                      <th className="px-4 py-3">Tentativa</th>
                      <th className="px-4 py-3">Status SLA</th>
                      <th className="px-4 py-3">Duração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {finalOrders.slice(0, 5).map((os) => (
                      <tr 
                        key={os.id} 
                        onClick={() => setSelectedOrder(os)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                        title="Clique para ver raio-X completo da ordem"
                      >
                        <td className="px-4 py-2.5 font-mono text-slate-200">
                          {os.id}
                          {os.nota && <span className="block text-[10px] text-slate-400">{os.nota}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-200">{os.tipo}</td>
                        <td className="px-4 py-2.5 text-slate-300">{os.servico}</td>
                        <td className="px-4 py-2.5 text-slate-300">{os.cidade}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{os.equipe}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            os.ehReincidente ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {os.tentativa}ª
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: os.statusSla === 'NO_PRAZO' ? 'rgba(7, 140, 40, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: os.statusSla === 'NO_PRAZO' ? '#078C28' : '#ef4444'
                            }}
                          >
                            {os.statusSla.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 font-mono">
                          {os.duracaoMinutos} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA: ANÁLISE DE PARETO 80/20 (FASE 3) */}
        {activeTab === 'pareto' && (
          <ParetoAnalysis
            orders={finalOrders}
            onSelectFilterValue={handleCrossFilter}
            darkMode={darkMode}
          />
        )}

        {/* ABA: DETECÇÃO DE OUTLIERS Z-SCORE (FASE 3) */}
        {activeTab === 'anomalies' && (
          <AnomalyDetection
            orders={finalOrders}
            darkMode={darkMode}
          />
        )}

        {/* ABA: TABELA ANALÍTICA COMPLETA (FASE 3) */}
        {activeTab === 'table' && (
          <WorkOrdersTable
            orders={finalOrders}
            darkMode={darkMode}
            onSelectOrder={(orderId) => {
              const o = finalOrders.find((x) => x.id === orderId);
              if (o) setSelectedOrder(o);
            }}
          />
        )}

        {/* ABA: MODELOS PREDITIVOS (FASE 4) */}
        {activeTab === 'predictive' && (
          <PredictiveRiskModule
            orders={finalOrders}
            darkMode={darkMode}
          />
        )}

        {/* ABA: SIMULADOR WHAT-IF & ROI (FASE 5) */}
        {activeTab === 'whatif' && (
          <WhatIfSimulator
            orders={finalOrders}
            darkMode={darkMode}
          />
        )}

        {/* ABA: INTELIGÊNCIA OPERACIONAL & AUDITORIA FORENSE */}
        {activeTab === 'intelligence' && (
          <ForensicAuditModule
            orders={finalOrders}
            darkMode={darkMode}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        )}
      </main>

      {/* MODAL RAIO-X 360° DA ORDEM */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        darkMode={darkMode}
      />

      {/* BUSCA RÁPIDA INSTANTÂNEA SPOTLIGHT */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        orders={finalOrders}
        onSelectOrder={(order) => setSelectedOrder(order)}
        darkMode={darkMode}
      />

      {/* MODAL DE MAPEAMENTO DE COLUNAS */}
      <ColumnMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        availableColumns={availableColumns}
        mapping={columnMapping}
        onSaveMapping={handleApplyUserMapping}
        onResetToHeuristics={() => {
          const { mapping: detected, confidence } = detectColumnMappingAdvanced(availableColumns);
          setColumnMapping(detected);
          setMappingConfidence(confidence);
          addLog('info', 'Mapeamento restaurado para as heurísticas padrão.');
          if (rawRows.length > 0) {
            const { orders, diagnostics: diagResult } = normalizeWorkOrdersAndDiagnose(
              rawRows,
              detected,
              fileName || 'arquivo',
              activeSheet,
              sheetNames,
              currentFileSizeRef.current,
              confidence
            );
            setParsedOrders(orders);
            setDiagnostics(diagResult);
          }
        }}
        darkMode={darkMode}
      />

      {/* DRAWER DE AUDITORIA & LOGS */}
      <AuditLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        logs={logs}
        onClearLogs={() => {
          setLogs([]);
          addLog('info', 'Histórico de logs limpo pelo operador.');
        }}
        darkMode={darkMode}
      />
    </div>
  );
}
