import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { StandardWorkOrder } from '../types';

interface WorkOrdersTableProps {
  orders: StandardWorkOrder[];
  darkMode: boolean;
  onSelectOrder?: (orderId: string) => void;
}

export const WorkOrdersTable: React.FC<WorkOrdersTableProps> = ({
  orders,
  darkMode,
  onSelectOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [sortField, setSortField] = useState<keyof StandardWorkOrder>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtragem local complementar por busca rápida
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.nota.toLowerCase().includes(term) ||
        o.tipo.toLowerCase().includes(term) ||
        o.equipe.toLowerCase().includes(term) ||
        o.cidade.toLowerCase().includes(term) ||
        o.motivo.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // Ordenação
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const vA = a[sortField];
      const vB = b[sortField];

      if (vA === null || vA === undefined) return 1;
      if (vB === null || vB === undefined) return -1;

      if (vA instanceof Date && vB instanceof Date) {
        return sortDirection === 'asc' ? vA.getTime() - vB.getTime() : vB.getTime() - vA.getTime();
      }

      if (typeof vA === 'number' && typeof vB === 'number') {
        return sortDirection === 'asc' ? vA - vB : vB - vA;
      }

      return sortDirection === 'asc'
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });
  }, [filtered, sortField, sortDirection]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentRecords = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof StandardWorkOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (d: Date | null) => {
    if (!d) return '-';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Exportar registros filtrados para CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nota',
      'Supervisao',
      'Tipo',
      'Servico',
      'Cidade',
      'Equipe',
      'Tentativa',
      'StatusSLA',
      'DuracaoMin',
      'CustoEstimado',
      'Motivo',
    ];

    const csvRows = [headers.join(';')];
    for (const o of sorted) {
      csvRows.push(
        [
          `"${o.id}"`,
          `"${o.nota}"`,
          `"${o.supervisao}"`,
          `"${o.tipo}"`,
          `"${o.servico}"`,
          `"${o.cidade}"`,
          `"${o.equipe}"`,
          `"${o.tentativa}ª"`,
          `"${o.statusSla}"`,
          o.duracaoMinutos,
          o.custoEstimado,
          `"${(o.motivo || '').replace(/"/g, '""')}"`,
        ].join(';')
      );
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Ordens_Servico_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="work-orders-table-container"
      className={`p-6 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Header com Busca e Exportação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Tabela Analítica Completa de Ordens de Serviço</span>
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#078C28', color: '#F2F2F2' }}
            >
              {sorted.length} registros
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dados higienizados e ordenáveis por qualquer coluna operacional da Supervisão ASSU.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar em qualquer campo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#049DD9]"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
            title="Exportar CSV formatado com delimitador brasileiro (;)"
          >
            <Download className="w-3.5 h-3.5 text-[#049DD9]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela de Ordens */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950/80 text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>ID / Nota</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('tipo')}
              >
                <div className="flex items-center gap-1">
                  <span>Tipo de OS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('cidade')}
              >
                <div className="flex items-center gap-1">
                  <span>Cidade</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('equipe')}
              >
                <div className="flex items-center gap-1">
                  <span>Equipe</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('tentativa')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Tentativa</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('statusSla')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SLA</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('duracaoMinutos')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Duração</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('custoEstimado')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Custo</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Motivo / Retorno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-medium">
            {currentRecords.map((os) => (
              <tr 
                key={os.id} 
                onClick={() => onSelectOrder && onSelectOrder(os.id)}
                className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                  os.isOutlier ? 'bg-rose-950/15' : ''
                }`}
                title="Clique para inspecionar raio-X completo desta OS"
              >
                <td className="px-4 py-2.5 font-mono text-slate-200">
                  <div className="font-bold text-white">{os.id}</div>
                  {os.nota && <span className="text-[10px] text-slate-400">Nota: {os.nota}</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-200 font-semibold">
                  {os.tipo}
                  <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
                    {os.servico}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-300">{os.cidade}</td>
                <td className="px-4 py-2.5 font-mono text-slate-400">{os.equipe}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    os.ehReincidente ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {os.tentativa}ª
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span 
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: os.statusSla === 'NO_PRAZO' 
                        ? 'rgba(7, 140, 40, 0.2)' 
                        : os.statusSla === 'ATRASADO' 
                        ? 'rgba(152, 191, 11, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)',
                      color: os.statusSla === 'NO_PRAZO' 
                        ? '#078C28' 
                        : os.statusSla === 'ATRASADO' 
                        ? '#98BF0B' 
                        : '#ef4444',
                      border: `1px solid ${
                        os.statusSla === 'NO_PRAZO' ? '#078C28' : os.statusSla === 'ATRASADO' ? '#98BF0B' : '#ef4444'
                      }`,
                    }}
                  >
                    {os.statusSla.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                  {os.duracaoMinutos} min
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                  R$ {os.custoEstimado}
                </td>
                <td className="px-4 py-2.5 text-slate-300 truncate max-w-[200px]">
                  {os.motivo || os.retorno || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Exibindo {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sorted.length)} de {sorted.length} ordens</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs px-2 py-1 rounded bg-slate-950/60 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={15}>15 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-200 font-bold px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
