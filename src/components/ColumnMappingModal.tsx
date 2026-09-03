import React from 'react';
import { X, Check, SlidersHorizontal, ArrowRight, RefreshCw } from 'lucide-react';
import { ColumnMappingConfig } from '../types';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableColumns: string[];
  mapping: ColumnMappingConfig;
  onSaveMapping: (newMapping: ColumnMappingConfig) => void;
  onResetToHeuristics: () => void;
  darkMode: boolean;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  availableColumns,
  mapping,
  onSaveMapping,
  onResetToHeuristics,
  darkMode,
}) => {
  const [localMapping, setLocalMapping] = React.useState<ColumnMappingConfig>(mapping);

  React.useEffect(() => {
    setLocalMapping(mapping);
  }, [mapping]);

  if (!isOpen) return null;

  const fields: { key: keyof ColumnMappingConfig; label: string; description: string; required?: boolean }[] = [
    { key: 'id', label: 'ID / Código da OS', description: 'Número de rastreio ou ID primário', required: true },
    { key: 'nota', label: 'Nota SAP', description: 'Código da Nota ou Notificação SAP (ex: 4,6E+09)' },
    { key: 'supervisao', label: 'Supervisão / Regional', description: 'Ex: ASSU, REGIONAL LESTE' },
    { key: 'tipo', label: 'Tipo / Macro-Tipo', description: 'Ex: Religação, Substituição, Desligamento' },
    { key: 'servico', label: 'Serviço Operacional', description: 'Descrição específica da atividade técnica' },
    { key: 'criacao', label: 'Data de Criação', description: 'Data de emissão (suporta número serial do Excel ex: 46234,65)', required: true },
    { key: 'vencimento', label: 'Vencimento SLA', description: 'Data e hora limite de cumprimento do SLA', required: true },
    { key: 'cidade', label: 'Cidade / Município', description: 'Localidade de execução da OS' },
    { key: 'equipe', label: 'Equipe Técnica', description: 'Código do técnico ou viatura (ex: ASS011)' },
    { key: 'retorno', label: 'Retorno de Campo', description: 'Descrição da execução ou encerramento' },
    { key: 'motivo', label: 'Motivo de Falha / Impedimento', description: 'Justificativa de recusa ou anomalia' },
    { key: 'dataExecIni', label: 'Data Início Execução', description: 'Data do início do atendimento em campo' },
    { key: 'horaExecIni', label: 'Hora Início Execução', description: 'Horário em formato HH:MM:SS' },
    { key: 'dataExecFim', label: 'Data Fim Execução', description: 'Data de conclusão do serviço' },
    { key: 'horaExecFim', label: 'Hora Fim Execução', description: 'Horário em formato HH:MM:SS' },
    { key: 'statusRetorno', label: 'Status de Retorno', description: 'Código operacional (ex: VREL, ENC, EXEC)' },
    { key: 'tentativa', label: 'Tentativa de Execução', description: 'Contador de visitas (ex: 1ª, 2ª - flag de reincidência)' },
    { key: 'latitude', label: 'Latitude GPS', description: 'Coordenada geográfica de latitude' },
    { key: 'longitude', label: 'Longitude GPS', description: 'Coordenada geográfica de longitude' },
  ];

  const handleFieldChange = (key: keyof ColumnMappingConfig, val: string) => {
    setLocalMapping((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = () => {
    onSaveMapping(localMapping);
    onClose();
  };

  return (
    <div 
      id="modal-mapeamento-colunas-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div 
        id="modal-mapeamento-colunas-dialog"
        className={`w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-[#F2F2F2]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#049DD9' }}
            >
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Mapeamento Heurístico de Colunas da Planilha
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste a correspondência entre os cabeçalhos do arquivo e o modelo de dados operacional.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal (Grid de Colunas) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const currentValue = localMapping[field.key] || '';
              return (
                <div 
                  key={field.key}
                  className={`p-3 rounded-xl border transition-colors ${
                    darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span>{field.label}</span>
                      {field.required && <span className="text-red-400 font-bold">*</span>}
                    </label>
                    {currentValue && (
                      <span className="text-[10px] font-bold text-[#078C28] flex items-center gap-1 bg-[#078C28]/15 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Mapeado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                    {field.description}
                  </p>
                  
                  <select
                    value={currentValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className={`w-full text-xs rounded-lg px-2.5 py-1.5 border font-medium transition-colors ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-[#049DD9]' 
                        : 'bg-white border-slate-300 text-slate-800 focus:border-[#049DD9]'
                    }`}
                  >
                    <option value="">-- Não Mapeado / Ignorar --</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onResetToHeuristics}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Redetectar Heurística Padrão</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: '#049DD9' }}
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Mapeamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
