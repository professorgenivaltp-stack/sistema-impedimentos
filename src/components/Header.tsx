import React from 'react';
import { 
  BarChart3, 
  Moon, 
  Sun, 
  Terminal, 
  SlidersHorizontal, 
  Upload, 
  Activity, 
  FileSpreadsheet,
  Search,
  Command
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  totalOrders: number;
  fileName: string | null;
  activeSheetName: string | null;
  onOpenUpload: () => void;
  onOpenMapping: () => void;
  onToggleLogs: () => void;
  hasLogs: boolean;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  totalOrders,
  fileName,
  activeSheetName,
  onOpenUpload,
  onOpenMapping,
  onToggleLogs,
  hasLogs,
  onOpenSearch,
}) => {
  return (
    <header 
      id="main-app-header" 
      className={`border-b transition-colors px-4 lg:px-8 py-3.5 ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-[#F2F2F2]' 
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      } backdrop-blur-md sticky top-0 z-40`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System Identity */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md shadow-[#049DD9]/20"
              style={{ backgroundColor: '#049DD9' }}
            >
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="text-[#F2F2F2]">{darkMode ? 'SISTEMA DE INTELIGÊNCIA OPERACIONAL' : 'INTELIGÊNCIA OPERACIONAL'}</span>
                  <span 
                    className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold tracking-wider"
                    style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
                  >
                    OS v2.6
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Auditoria de Ordens de Serviço &bull; Mapeamento Heurístico SAP &bull; Estatística &bull; ML
              </p>
            </div>
          </div>

          {/* Mobile upload trigger */}
          <button
            id="btn-upload-mobile"
            onClick={onOpenUpload}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            title="Importar Planilha"
          >
            <Upload className="w-4 h-4 text-[#049DD9]" />
          </button>
        </div>

        {/* Center File / Session Status */}
        <div className="flex items-center gap-2.5 text-xs">
          {fileName ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}>
              <FileSpreadsheet className="w-4 h-4 text-[#078C28]" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs truncate max-w-[180px] text-[#F2F2F2]" title={fileName}>
                  {fileName}
                </span>
                {activeSheetName && (
                  <span className="text-[10px] text-slate-400">Aba: {activeSheetName}</span>
                )}
              </div>
              <span 
                className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#049DD9', color: '#F2F2F2' }}
              >
                {totalOrders.toLocaleString()} OS
              </span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              darkMode ? 'bg-slate-800/50 border-dashed border-slate-700 text-slate-400' : 'bg-slate-50 border-dashed border-slate-300 text-slate-500'
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-medium">Aguardando Ingestão de Planilha</span>
            </div>
          )}
        </div>

        {/* Global Toolbar & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              id="btn-quick-search"
              onClick={onOpenSearch}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                darkMode 
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Busca Rápida de Ordens (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-[#049DD9]" />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-400 border border-slate-700/60">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Upload Button */}
          <button
            id="btn-upload-planilha"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:brightness-110 active:scale-95"
            style={{ backgroundColor: '#049DD9' }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar XLSX/CSV</span>
          </button>

          {/* Mapping settings modal button */}
          <button
            id="btn-mapeamento-colunas"
            onClick={onOpenMapping}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Mapeamento de Colunas da Planilha"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#98BF0B]" />
            <span className="hidden sm:inline">Colunas</span>
          </button>

          {/* Logs & Console */}
          <button
            id="btn-drawer-logs"
            onClick={onToggleLogs}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors relative ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Console de Auditoria e Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-[#C1D96A]" />
            <span className="hidden sm:inline">Logs</span>
            {hasLogs && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#078C28] absolute top-1 right-1"></span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border-slate-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
            }`}
            title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
