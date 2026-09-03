import { ColumnMappingConfig } from '../types';

export function detectColumnMapping(headers: string[]): ColumnMappingConfig {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const findMatch = (candidates: string[]): string => {
    for (const cand of candidates) {
      const candNorm = normalize(cand);
      for (const h of headers) {
        const hNorm = normalize(h);
        if (hNorm === candNorm || hNorm.includes(candNorm) || candNorm.includes(hNorm)) {
          return h;
        }
      }
    }
    return '';
  };

  return {
    id: findMatch(['id', 'codigo', 'ordem', 'ticket', 'workorder', 'identificador']),
    nota: findMatch(['nota', 'notificacao', 'sap', 'aviso']),
    supervisao: findMatch(['supervisa', 'supervisao', 'regional', 'polo', 'gerencia']),
    tipo: findMatch(['tipo', 'tp', 'macrotipo', 'categoria']),
    servico: findMatch(['servico', 'textocode', 'textogrup', 'atividade', 'subtipo']),
    criacao: findMatch(['criacao', 'dtcriacao', 'datacriacao', 'emissao', 'abertura']),
    vencimento: findMatch(['vencimento', 'concldesj', 'sla', 'prazo', 'datalimite']),
    cidade: findMatch(['cidade', 'local', 'municipio', 'localidade', 'comarca']),
    prioridade: findMatch(['prioridade', 'prio', 'urgencia', 'criticidade']),
    equipe: findMatch(['equipe', 'tecnico', 'viatura', 'executor', 'recurso']),
    retorno: findMatch(['retorno', 'desfecho', 'fechamento', 'conclusao']),
    motivo: findMatch(['motivo', 'impedimento', 'defeito', 'anomalia', 'recusa']),
    dataExecIni: findMatch(['dataexecini', 'dtexecini', 'datainicio', 'dtinicio']),
    horaExecIni: findMatch(['horaexecini', 'hrexecini', 'horainicio', 'hrinicio']),
    dataExecFim: findMatch(['dataexecfim', 'dtexecfim', 'datafim', 'dtfim']),
    horaExecFim: findMatch(['horaexecfim', 'hrexecfim', 'horafim', 'hrfim']),
    statusRetorno: findMatch(['statusretorno', 'statusretc', 'statususuar', 'status', 'situacao']),
    tentativa: findMatch(['tentativa', 'reincidencia', 'visita', 'reiteracao']),
    latitude: findMatch(['latitude', 'lat']),
    longitude: findMatch(['longitude', 'long', 'lng']),
  };
}

/**
 * Converte número serial do Excel (ex: 46234.65) para Date JavaScript nativo.
 * Considera a época base 1900 e o ajuste histórico de ano bissexto.
 */
export function excelSerialToDate(serial: number | string): Date | null {
  if (serial === null || serial === undefined || serial === '') return null;
  
  if (typeof serial === 'string') {
    // Pode vir com vírgula decimal como '46234,65'
    const cleanStr = serial.trim().replace(',', '.');
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num > 30000 && num < 70000) {
      serial = num;
    } else {
      // Tenta parse de data normal (ex: "01/08/2026" ou "2026-08-01" ou "30.04.2026")
      const ptBrMatch = cleanStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
      if (ptBrMatch) {
        const d = parseInt(ptBrMatch[1], 10);
        const m = parseInt(ptBrMatch[2], 10) - 1;
        let y = parseInt(ptBrMatch[3], 10);
        if (y < 100) y += 2000;
        return new Date(y, m, d);
      }
      const parsed = new Date(serial);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  if (typeof serial === 'number' && !isNaN(serial)) {
    // 25569 = diferença de dias entre 30/12/1899 e 01/01/1970
    // O Excel inclui o falso dia bissexto 29/02/1900
    const excelEpochDiff = (serial - 25569) * 86400 * 1000;
    const date = new Date(excelEpochDiff);
    // Compensação de fuso horário local para consistência UTC
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() + timezoneOffset);
  }

  return null;
}
