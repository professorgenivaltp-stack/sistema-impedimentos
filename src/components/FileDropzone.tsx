import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface FileDropzoneProps {
  darkMode: boolean;
  onFileLoaded: (file: File) => void;
  onLoadTemplateSample: () => void;
  isLoading: boolean;
  fileName: string | null;
  sheetNames?: string[];
  activeSheet?: string;
  onSelectSheet?: (sheet: string) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  darkMode,
  onFileLoaded,
  onLoadTemplateSample,
  isLoading,
  fileName,
  sheetNames = [],
  activeSheet,
  onSelectSheet,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcess(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcess(file);
    }
  };

  const validateAndProcess = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const nameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      alert('Formato não suportado. Por favor, envie um arquivo .xlsx, .xls ou .csv.');
      return;
    }

    onFileLoaded(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 px-4">
      {/* Container Principal do Dropzone */}
      <div
        id="file-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-200 group ${
          isDragOver
            ? 'border-[#049DD9] bg-[#049DD9]/10 scale-[1.005]'
            : darkMode
            ? 'border-slate-700 bg-slate-800/40 hover:border-[#049DD9] hover:bg-slate-800/80'
            : 'border-slate-300 bg-slate-50/70 hover:border-[#049DD9] hover:bg-slate-100/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
          id="file-input-element"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Ícone com Halo da Paleta */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
            style={{ 
              backgroundColor: '#049DD9',
              boxShadow: '0 10px 25px -5px rgba(4, 157, 217, 0.3)' 
            }}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : fileName ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <Upload className="w-8 h-8 text-white stroke-[2.2]" />
            )}
          </div>

          {/* Texto de Ação */}
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-[#F2F2F2]">
              {isLoading
                ? 'Processando e indexando dados operacionais...'
                : fileName
                ? `Planilha ativa: ${fileName}`
                : 'Arraste e solte sua planilha de OS aqui'}
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              {fileName
                ? 'Clique ou arraste outro arquivo para substituir a base atual.'
                : 'Compatível com relatórios SAP PM (LISTAGEM / IW58 / IW28), planilhas de campo em .xlsx, .xls e .csv.'}
            </p>
          </div>

          {/* Badges de recursos nativos */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-medium text-slate-300">
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/80"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#078C28]" />
              XLSX &bull; XLS &bull; CSV
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/80">
              <Sparkles className="w-3.5 h-3.5 text-[#98BF0B]" />
              Detecção automática de cabeçalho (Linha 5/6)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C1D96A]" />
              Conversão de Datas Seriais (Época 1900)
            </span>
          </div>

          {/* Alternância de Abas quando o arquivo tem mais de uma */}
          {sheetNames.length > 1 && (
            <div 
              className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#049DD9]" />
                  Abas da Pasta de Trabalho:
                </span>
                <span className="text-[10px] text-slate-400">{sheetNames.length} detectadas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sheetNames.map((sheet) => (
                  <button
                    key={sheet}
                    onClick={() => onSelectSheet && onSelectSheet(sheet)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      activeSheet === sheet
                        ? 'bg-[#049DD9] text-white shadow-sm font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Informativo com o Reconhecimento do Modelo (LISTAGEM / IW58) */}
      <div className={`mt-4 p-4 rounded-xl border transition-colors ${
        darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg mt-0.5"
              style={{ backgroundColor: 'rgba(4, 157, 217, 0.12)' }}
            >
              <Info className="w-4 h-4 text-[#049DD9]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2F2F2]">
                Estrutura Reconhecida da Planilha Operacional
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Detecta automaticamente colunas de <span className="text-slate-200 font-semibold">Supervisão, Tipo, Serviço, Criação/Vencimento em Serial Excel, Equipe, Retorno, Coordenadas GPS e Tentativa</span>.
              </p>
            </div>
          </div>

          <button
            id="btn-carregar-amostra-modelo"
            onClick={(e) => {
              e.stopPropagation();
              onLoadTemplateSample();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:brightness-110 active:scale-95 whitespace-nowrap self-end sm:self-auto"
            style={{ backgroundColor: '#078C28' }}
          >
            <span>Carregar Base Real (Amostra Operacional)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
