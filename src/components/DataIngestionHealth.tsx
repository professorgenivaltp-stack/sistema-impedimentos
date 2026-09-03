import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  Calendar, 
  MapPin, 
  FileText, 
  SlidersHorizontal, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Database,
  Search,
  Activity
} from 'lucide-react';
import { IngestionDiagnostics, ColumnMappingConfig } from '../types';

interface DataIngestionHealthProps {
  diagnostics: IngestionDiagnostics | null;
  mapping: ColumnMappingConfig;
  onOpenMapping: () => void;
  onSelectSheet: (sheet: string) => void;
  darkMode: boolean;
}

export const DataIngestionHealth: React.FC<DataIngestionHealthProps> = ({
  diagnostics,
  mapping,
  onOpenMapping,
  onSelectSheet,
  darkMode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!diagnostics || diagnostics.totalRawRows === 0) {
    return null;
  }

  const validPercent = Math.round((diagnostics.validRows / diagnostics.totalRawRows) * 100) || 100;
  const formatDate = (d: Date | null) => {
    if (!d) return 'Não detectado';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCompletenessRate = (missing: number) => {
    if (diagnostics.validRows === 0) return 100;
    const rate = Math.round(((diagnostics.validRows - missing) / diagnostics.validRows) * 100);
    return Math.max(0, Math.min(100, rate));
  };

  const completenessFields = [
    { label: 'Data de Criação', missing: diagnostics.missingFieldsCount.criacao || 0 },
    { label: 'Vencimento SLA', missing: diagnostics.missingFieldsCount.vencimento || 0 },
    { label: 'Equipe Técnica', missing: diagnostics.missingFieldsCount.equipe || 0 },
    { label: 'Cidade / Local', missing: diagnostics.missingFieldsCount.cidade || 0 },
    { label: 'Tipo / Serviço', missing: diagnostics.missingFieldsCount.tipo || 0 },
    { label: 'Coordenadas GPS', missing: diagnostics.missingFieldsCount.coordenadas || 0 },
    { label: 'Motivo de Falha', missing: diagnostics.missingFieldsCount.motivo || 0, isOptional: true },
  ];

  return (
    <section 
      id="data-ingestion-health-section"
      className={`rounded-2xl border transition-all overflow-hidden ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-[#F2F2F2]' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top Banner de Diagnóstico */}
      <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{ backgroundColor: '#078C28' }}
          >
            <ShieldCheck className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Diagnóstico de Integridade da Ingestão de Dados
              </h3>
              <span 
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#049DD9', color: '#F2F2F2' }}
              >
                Confiança Heurística: {diagnostics.mappingConfidence}%
              </span>
              <span 
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
              >
                Taxa de Validade: {validPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria de schema ativo: <span className="font-semibold text-slate-200">{diagnostics.validRows} ordens válidas</span> processadas ({diagnostics.skippedRows} linhas vazias descartadas).
            </p>
          </div>
        </div>

        {/* Métricas Rápidas & Ações */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] text-slate-400">Janela Operacional</span>
              <span className="font-mono font-bold text-slate-200">
                {formatDate(diagnostics.dateRange.oldest)} &rarr; {formatDate(diagnostics.dateRange.newest)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMapping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#98BF0B]" />
              <span>Ajustar Schema</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span>{isExpanded ? 'Recolher Detalhes' : 'Ver Detalhes'}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Grid de 4 Cards Informativos Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-800/80 bg-slate-950/40 text-xs">
        <div className="p-4 flex flex-col">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#049DD9]" /> Total de Registros
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
            {diagnostics.validRows.toLocaleString()} OS
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Tamanho: {diagnostics.fileSizeKb > 0 ? `${diagnostics.fileSizeKb.toFixed(1)} KB` : 'Memória local'}
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#078C28]" /> Equipes & Cidades
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
            {diagnostics.uniqueTeamsCount} Equipes &bull; {diagnostics.uniqueCitiesCount} Polos
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {diagnostics.uniqueTypesCount} Tipos Operacionais
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#98BF0B]" /> Época Serial Excel
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
            Época 1900 Ativa
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Fração decimal calculada em segundos
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#C1D96A]" /> Aba da Pasta Ativa
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1 truncate">
            {diagnostics.activeSheet || 'Planilha Padrão'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {diagnostics.sheetNames.length} folha(s) detectada(s)
          </span>
        </div>
      </div>

      {/* Painel Expansível de Detalhamento & Nulos Transparentes */}
      {isExpanded && (
        <div className="p-5 bg-slate-900/60 border-t border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Completude e Auditoria de Campos (Nulos Transparentes)</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  (Regra: Preservação de dados brutos sem distorção artificial)
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completenessFields.map((field) => {
                const completeness = getCompletenessRate(field.missing);
                return (
                  <div 
                    key={field.label}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">{field.label}</span>
                      <span 
                        className="font-mono font-bold text-xs"
                        style={{
                          color: completeness >= 95 ? '#078C28' : completeness >= 70 ? '#98BF0B' : '#ef4444'
                        }}
                      >
                        {completeness}%
                      </span>
                    </div>

                    {/* Barra de Progresso de Completude */}
                    <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${completeness}%`,
                          backgroundColor: completeness >= 95 ? '#078C28' : completeness >= 70 ? '#98BF0B' : '#ef4444' 
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{field.missing > 0 ? `${field.missing} nulos` : '100% preenchido'}</span>
                      <span className="font-mono">{field.isOptional ? 'Opcional' : 'Essencial'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abas da Pasta de Trabalho para Alternância Rápida */}
          {diagnostics.sheetNames.length > 1 && (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#049DD9]" />
                  Abas Detectadas na Pasta de Trabalho Excel:
                </span>
                <span className="text-[11px] text-slate-400">Clique para alternar o processamento do dataset</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {diagnostics.sheetNames.map((sheet) => (
                  <button
                    key={sheet}
                    onClick={() => onSelectSheet(sheet)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      diagnostics.activeSheet === sheet
                        ? 'bg-[#049DD9] text-white shadow-md font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {sheet} {diagnostics.activeSheet === sheet && '✓ (Ativa)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dicionário Atual de Mapeamento Heurístico Aplicado */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#078C28]" />
              Correspondência das Colunas Identificadas (Schema em Execução)
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono">
              {Object.entries(mapping).map(([key, val]) => (
                <div key={key} className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">{key}:</span>
                  <span className={`truncate ${val ? 'text-emerald-400 font-semibold' : 'text-slate-500 italic'}`}>
                    {val || '(não mapeado)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
