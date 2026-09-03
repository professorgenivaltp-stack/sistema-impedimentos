import React from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Compass, 
  Wrench,
  Cpu,
  FileSpreadsheet
} from 'lucide-react';
import { StandardWorkOrder } from '../types';

interface OrderDetailModalProps {
  order: StandardWorkOrder | null;
  onClose: () => void;
  darkMode: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  darkMode,
}) => {
  if (!order) return null;

  const formatDate = (d: Date | null) => {
    if (!d) return 'Não informado';
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Status visual
  const slaBadge = 
    order.statusSla === 'NO_PRAZO'
      ? { label: 'No Prazo', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
      : order.statusSla === 'ATRASADO'
      ? { label: 'Atrasado', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
      : { label: 'Crítico (>24h)', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 transition-all ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: '#049DD9' }}
            >
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white">
                  Ordem #{order.id}
                </h3>
                {order.nota && (
                  <span className="text-xs text-slate-400 font-mono">
                    (Nota: {order.nota})
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${slaBadge.bg}`}>
                  {slaBadge.label}
                </span>
                {order.ehReincidente && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                    {order.tentativa}ª Visita (Reincidente)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {order.tipo} &bull; {order.servico} &bull; Supervisão {order.supervisao || 'ASSU'}
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

        {/* Linha do Tempo Visual */}
        <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Linha do Tempo Operacional & Prazos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">1. Abertura / Criação</span>
              <div className="font-semibold text-white mt-0.5">{formatDate(order.dataCriacao)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">2. Vencimento Contratual SLA</span>
              <div className={`font-semibold mt-0.5 ${order.statusSla !== 'NO_PRAZO' ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                {formatDate(order.dataVencimento)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">3. Conclusão / Execução</span>
              <div className="font-semibold text-white mt-0.5">{formatDate(order.dataExecFim)}</div>
            </div>
          </div>

          {order.atrasoHoras > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Estouro de SLA registrado: <strong>+{order.atrasoHoras.toFixed(1)} horas</strong> além do prazo limite.</span>
            </div>
          )}
        </div>

        {/* Grid de Detalhes Técnicos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Duração em Campo</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {order.duracaoMinutos} min
            </div>
            <span className="text-[10px] text-slate-400">Tempo de atendimento</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Desvio Estatístico (Z)</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {order.zScoreDuracao ? `${order.zScoreDuracao > 0 ? '+' : ''}${order.zScoreDuracao.toFixed(2)}σ` : '0.00σ'}
            </div>
            <span className={`text-[10px] ${order.isOutlier ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
              {order.isOutlier ? 'Outlier Detectado' : 'Dentro do Padrão'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Equipe Responsável</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {order.equipe || 'Geral'}
            </div>
            <span className="text-[10px] text-slate-400">Viatura / Turma</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Custo Estimado</span>
            <div className="text-lg font-bold font-mono text-[#078C28] mt-1">
              {formatCurrency(order.custoEstimado)}
            </div>
            <span className="text-[10px] text-slate-400">Inclui insumos e retrabalho</span>
          </div>
        </div>

        {/* Localização e Impedimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#049DD9]" />
              <span>Localização & Polo Operacional</span>
            </span>
            <div className="text-sm font-semibold text-white">
              Município de {order.cidade} - RN
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Coordenadas: {order.latitude ? `${order.latitude.toFixed(5)}, ${order.longitude?.toFixed(5)}` : 'Não georreferenciado'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Desfecho & Impedimento de Campo</span>
            </span>
            <div className="text-sm font-semibold text-white">
              Status de Retorno: {order.statusRetorno} {order.retorno ? `(${order.retorno})` : ''}
            </div>
            <div className="text-[11px] text-slate-300">
              Motivo apontado: <strong>{order.motivo || 'Nenhum impedimento registrado (Concluído normalmente)'}</strong>
            </div>
          </div>
        </div>

        {/* Recomendações Prescritivas para o Supervisor */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
          <h4 className="font-bold text-white uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#078C28]" />
            <span>Parecer Operacional da Supervisão</span>
          </h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {order.ehReincidente
              ? `Esta ordem é uma reincidência (${order.tentativa}ª tentativa). Recomenda-se acionar o encarregado do polo ${order.cidade} para acompanhamento presencial do fechamento definitivo antes do encerramento da fatura.`
              : order.statusSla !== 'NO_PRAZO'
              ? `Estouro de SLA gerou passivo contratual de multa. Verificar se o despacho inicial respeitou a janela de prioridade ${order.prioridade}.`
              : `Atendimento regular concluído dentro dos padrões estipulados pela supervisão ASSU.`}
          </p>
        </div>
      </div>
    </div>
  );
};
