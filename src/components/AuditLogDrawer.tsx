import React from 'react';
import { X, Terminal, Trash2, CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  onClearLogs: () => void;
  darkMode: boolean;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  darkMode,
}) => {
  if (!isOpen) return null;

  const getLogIcon = (level: AuditLog['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#078C28]" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-[#98BF0B]" />;
      case 'error':
        return <AlertOctagon className="w-4 h-4 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#049DD9]" />;
    }
  };

  return (
    <div 
      id="drawer-logs-auditoria-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="drawer-logs-auditoria-panel"
        className={`w-full max-w-md h-full flex flex-col border-l shadow-2xl transition-transform animate-in slide-in-from-right duration-200 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-[#F2F2F2]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header do Drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#049DD9' }}
            >
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Console de Auditoria & Logs</h3>
              <p className="text-[11px] text-slate-400">Rastreabilidade em tempo real do parser e dos motores</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Limpar Histórico de Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Terminal className="w-10 h-10 mb-2 opacity-30 stroke-1" />
              <p className="text-sm font-semibold">Nenhum evento registrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Os eventos de ingestão, sanitização e execução dos motores serão exibidos aqui.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border transition-colors ${
                  darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getLogIcon(log.level)}
                    <span className="font-bold text-[11px] tracking-wide uppercase text-slate-300">
                      {log.level}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {log.message}
                </p>
                {log.details && (
                  <div className="mt-2 p-2 rounded bg-black/40 text-[10px] text-slate-400 overflow-x-auto border border-slate-800">
                    <pre>{log.details}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total de eventos: <strong className="text-slate-200">{logs.length}</strong></span>
          <span className="text-[10px] text-slate-500">Engenharia de Confiabilidade SRE</span>
        </div>
      </div>
    </div>
  );
};
