import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Wrench, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CornerDownLeft,
  Calendar
} from 'lucide-react';
import { StandardWorkOrder } from '../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StandardWorkOrder[];
  onSelectOrder: (order: StandardWorkOrder) => void;
  darkMode: boolean;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
  darkMode,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.nota.toLowerCase().includes(q) ||
          o.tipo.toLowerCase().includes(q) ||
          o.servico.toLowerCase().includes(q) ||
          o.equipe.toLowerCase().includes(q) ||
          o.cidade.toLowerCase().includes(q) ||
          o.motivo.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [orders, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Barra de Busca */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-[#049DD9] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por OS, Nota SAP, equipe, cidade, serviço ou motivo..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/50">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p>Digite qualquer termo para localizar ordens na base ativa.</p>
              <p className="text-[11px] text-slate-600">Dica: Tente pesquisar por uma equipe como "ASS010" ou cidade "ASSU".</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma ordem localizada para "<span className="text-white font-semibold">{query}</span>".
            </div>
          ) : (
            results.map((order) => {
              const slaBadge = 
                order.statusSla === 'NO_PRAZO'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : order.statusSla === 'ATRASADO'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: '#049DD9' }}
                    >
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          OS #{order.id}
                        </span>
                        {order.nota && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({order.nota})
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase ${slaBadge}`}>
                          {order.statusSla === 'NO_PRAZO' ? 'No Prazo' : 'Atrasada'}
                        </span>
                        {order.ehReincidente && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 uppercase">
                            {order.tentativa}ª Visita
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{order.tipo} &bull; {order.servico}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <div className="text-white font-mono font-semibold">
                      {order.cidade}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Eq. {order.equipe} &bull; {order.duracaoMinutos} min
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{results.length} resultados encontrados</span>
          <span className="flex items-center gap-1">
            Pressione <CornerDownLeft className="w-3 h-3 text-slate-400" /> para inspecionar
          </span>
        </div>
      </div>
    </div>
  );
};
