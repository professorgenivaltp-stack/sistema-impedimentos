import { 
  WorkOrderRaw, 
  StandardWorkOrder, 
  ColumnMappingConfig, 
  IngestionDiagnostics, 
  AuditLog 
} from '../types';

/**
 * Normaliza strings para comparação heurística removendo acentos e pontuação.
 */
export function normalizeToken(str: string): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Detecta automaticamente o melhor delimitador para arquivos CSV brutos (;, ,, \t, |).
 */
export function detectCsvDelimiter(text: string): string {
  const sampleLines = text.split(/\r?\n/).slice(0, 10).filter(l => l.trim().length > 0);
  if (sampleLines.length === 0) return ';';

  const delimiters = [';', ',', '\t', '|'];
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0, '|': 0 };

  for (const line of sampleLines) {
    for (const d of delimiters) {
      counts[d] += (line.split(d).length - 1);
    }
  }

  let best = ';';
  let max = -1;
  for (const d of delimiters) {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  }
  return best;
}

/**
 * Algoritmo Heurístico de Detecção do Índice da Linha de Cabeçalho.
 * Analisa as primeiras 25 linhas da planilha atribuindo score por relevância semântica.
 */
export function findHeaderRowIndex(matrix: any[][]): { rowIndex: number; score: number } {
  const keywords = [
    'supervisa', 'supervisao', 'regional', 'tipo', 'tp', 'servico', 'serviço', 'textocode', 'textogrup',
    'nota', 'notificacao', 'criacao', 'criação', 'dtcriacao', 'vencimento', 'concldesj', 'sla',
    'cidade', 'local', 'prioridade', 'equipe', 'retorno', 'motivo', 'dataexecini', 'horaexecini',
    'dataexecfim', 'horaexecfim', 'statusretorno', 'statusretc', 'statususuar', 'tentativa', 'latitude', 'longitude'
  ];

  let bestRow = 0;
  let maxScore = -1;

  const limit = Math.min(matrix.length, 25);
  for (let r = 0; r < limit; r++) {
    const row = matrix[r];
    if (!row || !Array.isArray(row)) continue;

    let score = 0;
    const tokens = row.map((cell) => normalizeToken(String(cell || ''))).filter(Boolean);

    for (const token of tokens) {
      for (const kw of keywords) {
        if (token === kw) {
          score += 5;
        } else if (token.includes(kw) || kw.includes(token)) {
          score += 2;
        }
      }
    }

    // Se tiver mais de 4 colunas com texto e boa pontuação
    if (tokens.length >= 4 && score > maxScore) {
      maxScore = score;
      bestRow = r;
    }
  }

  return { rowIndex: bestRow, score: maxScore };
}

/**
 * Mapeador Heurístico Bilíngue e Multi-Padrão (SAP PM / LISTAGEM / Planilhas de Campo).
 */
export function detectColumnMappingAdvanced(headers: string[]): { 
  mapping: ColumnMappingConfig; 
  confidence: number;
} {
  const dictionary: Record<keyof ColumnMappingConfig, string[]> = {
    id: ['id', 'codigo', 'ordem', 'ticket', 'workorder', 'identificador', 'numos', 'os'],
    nota: ['nota', 'notificacao', 'sap', 'aviso', 'notif', 'notificação'],
    supervisao: ['supervisa', 'supervisao', 'regional', 'polo', 'gerencia', 'unidade', 'setor', 'supervisão'],
    tipo: ['tipo', 'tp', 'macrotipo', 'categoria', 'tiposervico', 'ordemtipo'],
    servico: ['servico', 'serviço', 'textocode', 'textogrup', 'atividade', 'subtipo', 'descricao', 'operacao'],
    criacao: ['criacao', 'criação', 'dtcriacao', 'datacriacao', 'emissao', 'abertura', 'dt.criacao', 'data_abertura'],
    vencimento: ['vencimento', 'concldesj', 'sla', 'prazo', 'datalimite', 'dt.limite', 'concl.desj', 'limitesla'],
    cidade: ['cidade', 'local', 'municipio', 'localidade', 'comarca', 'cidade/uf', 'polo_cidade'],
    prioridade: ['prioridade', 'prio', 'urgencia', 'criticidade', 'grau'],
    equipe: ['equipe', 'tecnico', 'viatura', 'executor', 'recurso', 'profissional', 'operador'],
    retorno: ['retorno', 'desfecho', 'fechamento', 'conclusao', 'resultado', 'obsretorno'],
    motivo: ['motivo', 'impedimento', 'defeito', 'anomalia', 'recusa', 'justificativa', 'causa'],
    dataExecIni: ['dataexecini', 'dtexecini', 'datainicio', 'dtinicio', 'dt_exec_ini', 'data_inicio'],
    horaExecIni: ['horaexecini', 'hrexecini', 'horainicio', 'hrinicio', 'hr_exec_ini', 'hora_inicio'],
    dataExecFim: ['dataexecfim', 'dtexecfim', 'datafim', 'dtfim', 'dt_exec_fim', 'data_fim', 'dt_conclusao'],
    horaExecFim: ['horaexecfim', 'hrexecfim', 'horafim', 'hrfim', 'hr_exec_fim', 'hora_fim'],
    statusRetorno: ['statusretorno', 'statusretc', 'statususuar', 'status', 'situacao', 'estado', 'stat.usuar'],
    tentativa: ['tentativa', 'reincidencia', 'visita', 'reiteracao', 'revisita', 'ordem_tentativa'],
    latitude: ['latitude', 'lat', 'coord_lat', 'y'],
    longitude: ['longitude', 'long', 'lng', 'coord_long', 'x'],
  };

  const mapping: ColumnMappingConfig = {
    id: '',
    nota: '',
    supervisao: '',
    tipo: '',
    servico: '',
    criacao: '',
    vencimento: '',
    cidade: '',
    prioridade: '',
    equipe: '',
    retorno: '',
    motivo: '',
    dataExecIni: '',
    horaExecIni: '',
    dataExecFim: '',
    horaExecFim: '',
    statusRetorno: '',
    tentativa: '',
    latitude: '',
    longitude: '',
  };

  const usedHeaders = new Set<string>();
  let matchedCount = 0;

  // 1ª Passada: Casamento Exato
  (Object.keys(dictionary) as (keyof ColumnMappingConfig)[]).forEach((fieldKey) => {
    const candidates = dictionary[fieldKey];
    for (const cand of candidates) {
      const candNorm = normalizeToken(cand);
      for (const h of headers) {
        if (!usedHeaders.has(h) && normalizeToken(h) === candNorm) {
          mapping[fieldKey] = h;
          usedHeaders.add(h);
          matchedCount++;
          return;
        }
      }
    }
  });

  // 2ª Passada: Casamento por Substring / Contém
  (Object.keys(dictionary) as (keyof ColumnMappingConfig)[]).forEach((fieldKey) => {
    if (mapping[fieldKey]) return; // já mapeado
    const candidates = dictionary[fieldKey];
    for (const cand of candidates) {
      const candNorm = normalizeToken(cand);
      for (const h of headers) {
        if (!usedHeaders.has(h)) {
          const hNorm = normalizeToken(h);
          if (hNorm.includes(candNorm) || candNorm.includes(hNorm)) {
            mapping[fieldKey] = h;
            usedHeaders.add(h);
            matchedCount++;
            return;
          }
        }
      }
    }
  });

  // Cálculo de confiança ponderada (campos essenciais têm peso maior)
  const criticalFields: (keyof ColumnMappingConfig)[] = ['tipo', 'criacao', 'vencimento', 'equipe', 'cidade'];
  let criticalMatches = 0;
  for (const cf of criticalFields) {
    if (mapping[cf]) criticalMatches++;
  }

  const confidence = Math.round(
    (criticalMatches / criticalFields.length) * 60 +
    (matchedCount / Object.keys(dictionary).length) * 40
  );

  return { mapping, confidence };
}

/**
 * Converte número serial do Excel (ex: 46234.65) ou strings para Date nativo do JS.
 * Compensa o bug bissexto do Lotus 1-2-3 (ano 1900) e trata frações de dia.
 */
export function parseExcelOrStandardDate(value: any): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  // Se for número serial (ex: 46234.65 ou 46241.99999)
  let numVal: number | null = null;
  if (typeof value === 'number') {
    numVal = value;
  } else if (typeof value === 'string') {
    const cleanStr = value.trim().replace(',', '.');
    const parsedFloat = parseFloat(cleanStr);
    if (!isNaN(parsedFloat) && parsedFloat > 25000 && parsedFloat < 85000) {
      numVal = parsedFloat;
    }
  }

  if (numVal !== null && !isNaN(numVal)) {
    // 25569 = Dias de 30/12/1899 até 01/01/1970 UTC
    const wholeDays = Math.floor(numVal);
    const fraction = numVal - wholeDays;
    const milliseconds = Math.round(fraction * 86400 * 1000);

    const baseMs = (wholeDays - 25569) * 86400 * 1000;
    const utcTime = baseMs + milliseconds;
    const date = new Date(utcTime);

    // Ajusta para fuso local para evitar perda de dia na renderização
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() + timezoneOffset);
  }

  // Se for string de data formatada (ex: "30.04.2026", "01/08/2026", "2026-08-01")
  if (typeof value === 'string') {
    const str = value.trim();

    // Formato Brasileiro: DD.MM.YYYY ou DD/MM/YYYY ou DD-MM-YYYY
    const brMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10) - 1;
      let year = parseInt(brMatch[3], 10);
      if (year < 100) year += 2000;
      const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
      const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
      const sec = brMatch[6] ? parseInt(brMatch[6], 10) : 0;

      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO parsing padrão
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }

  return null;
}

/**
 * Extrai duração em minutos comparando horários de início e fim (HH:MM:SS) ou datas.
 */
export function extractDurationMinutes(horaIni?: string, horaFim?: string, defaultDuration = 30): number {
  if (!horaIni || !horaFim) return defaultDuration;

  const parseTime = (timeStr: string): number | null => {
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = match[3] ? parseInt(match[3], 10) : 0;
    return h * 3600 + m * 60 + s;
  };

  const s1 = parseTime(horaIni);
  const s2 = parseTime(horaFim);

  if (s1 !== null && s2 !== null) {
    let diff = s2 - s1;
    if (diff < 0) diff += 86400; // Virada de meia-noite
    const minutes = Math.round(diff / 60);
    if (minutes > 0 && minutes < 1440) {
      return minutes;
    }
  }

  return defaultDuration;
}

/**
 * Normaliza os registros brutos em StandardWorkOrder e gera o diagnóstico detalhado de integridade.
 */
export function normalizeWorkOrdersAndDiagnose(
  rawRows: WorkOrderRaw[],
  mapping: ColumnMappingConfig,
  fileName: string,
  activeSheet: string,
  sheetNames: string[],
  fileSizeKb: number,
  mappingConfidence: number
): {
  orders: StandardWorkOrder[];
  diagnostics: IngestionDiagnostics;
} {
  const missingCounts: Record<string, number> = {
    id: 0,
    nota: 0,
    supervisao: 0,
    tipo: 0,
    servico: 0,
    criacao: 0,
    vencimento: 0,
    cidade: 0,
    equipe: 0,
    retorno: 0,
    motivo: 0,
    coordenadas: 0,
  };

  let validRows = 0;
  let skippedRows = 0;

  const uniqueTeams = new Set<string>();
  const uniqueCities = new Set<string>();
  const uniqueTypes = new Set<string>();

  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;

  const orders: StandardWorkOrder[] = [];

  rawRows.forEach((row, idx) => {
    // Validação mínima de existência de conteúdo na linha
    const hasAnyContent = Object.values(row).some(v => v !== '' && v !== null && v !== undefined);
    if (!hasAnyContent) {
      skippedRows++;
      return;
    }

    const idVal = row[mapping.id] !== undefined && row[mapping.id] !== '' 
      ? String(row[mapping.id]) 
      : `OS-${idx + 1}`;
    if (!row[mapping.id]) missingCounts.id++;

    const notaVal = String(row[mapping.nota] || '');
    if (!row[mapping.nota]) missingCounts.nota++;

    const supervisaoVal = String(row[mapping.supervisao] || 'ASSU');
    if (!row[mapping.supervisao]) missingCounts.supervisao++;

    const tipoVal = String(row[mapping.tipo] || 'Geral').trim();
    if (!row[mapping.tipo]) missingCounts.tipo++;
    uniqueTypes.add(tipoVal);

    const servicoVal = String(row[mapping.servico] || row[mapping.tipo] || 'Serviço de Campo').trim();
    if (!row[mapping.servico]) missingCounts.servico++;

    const cidadeVal = String(row[mapping.cidade] || 'Não Informada').trim();
    if (!row[mapping.cidade]) missingCounts.cidade++;
    uniqueCities.add(cidadeVal);

    const equipeVal = String(row[mapping.equipe] || 'Equipe Geral').trim();
    if (!row[mapping.equipe]) missingCounts.equipe++;
    uniqueTeams.add(equipeVal);

    const retornoVal = String(row[mapping.retorno] || '').trim();
    if (!row[mapping.retorno]) missingCounts.retorno++;

    const motivoVal = String(row[mapping.motivo] || '').trim();
    if (!row[mapping.motivo]) missingCounts.motivo++;

    const statusRetornoVal = String(row[mapping.statusRetorno] || 'VREL').trim();
    const tentativaRaw = String(row[mapping.tentativa] || '1ª');
    const tentativaNum = parseInt(tentativaRaw.replace(/\D/g, ''), 10) || 1;
    const ehReincidente = tentativaNum > 1 || tentativaRaw.includes('2ª') || tentativaRaw.includes('3ª');

    const prioridadeNum = Number(row[mapping.prioridade] || 0);

    // Datas
    const dataCriacao = parseExcelOrStandardDate(row[mapping.criacao]);
    if (!dataCriacao) missingCounts.criacao++;

    const dataVencimento = parseExcelOrStandardDate(row[mapping.vencimento]);
    if (!dataVencimento) missingCounts.vencimento++;

    const dataExecFim = parseExcelOrStandardDate(row[mapping.dataExecFim]) || dataCriacao;

    // Atualiza range de datas
    if (dataCriacao) {
      if (!oldestDate || dataCriacao < oldestDate) oldestDate = dataCriacao;
      if (!newestDate || dataCriacao > newestDate) newestDate = dataCriacao;
    }

    // Horários e Duração
    const horaIni = String(row[mapping.horaExecIni] || '');
    const horaFim = String(row[mapping.horaExecFim] || '');
    const duracaoMinutos = extractDurationMinutes(horaIni, horaFim, 30);

    // SLA e Atraso
    let statusSla: 'NO_PRAZO' | 'ATRASADO' | 'CRITICO' = 'NO_PRAZO';
    let atrasoHoras = 0;
    if (dataVencimento && dataExecFim) {
      const diffMs = dataExecFim.getTime() - dataVencimento.getTime();
      atrasoHoras = diffMs / (1000 * 60 * 60);
      if (atrasoHoras > 24) {
        statusSla = 'CRITICO';
      } else if (atrasoHoras > 0) {
        statusSla = 'ATRASADO';
      }
    }

    // Coordenadas GPS
    let lat: number | null = parseFloat(String(row[mapping.latitude]).replace(',', '.'));
    let lng: number | null = parseFloat(String(row[mapping.longitude]).replace(',', '.'));
    if (isNaN(lat) || lat === 0) lat = null;
    if (isNaN(lng) || lng === 0) lng = null;
    if (lat === null || lng === null) missingCounts.coordenadas++;

    // Custo estimado com acréscimo para retrabalhos
    let custoBase = 120;
    const tipoLower = tipoVal.toLowerCase();
    if (tipoLower.includes('substitui')) custoBase = 380;
    else if (tipoLower.includes('ligacao') || tipoLower.includes('ligação')) custoBase = 450;
    else if (tipoLower.includes('desligam')) custoBase = 95;
    else if (tipoLower.includes('reativa')) custoBase = 150;
    if (ehReincidente) custoBase *= 1.6;

    orders.push({
      id: idVal,
      nota: notaVal,
      supervisao: supervisaoVal,
      tipo: tipoVal,
      servico: servicoVal,
      dataCriacao,
      dataVencimento,
      dataExecFim,
      cidade: cidadeVal,
      prioridade: prioridadeNum,
      equipe: equipeVal,
      retorno: retornoVal,
      statusRetorno: statusRetornoVal,
      motivo: motivoVal,
      duracaoMinutos,
      atrasoHoras: Math.max(0, atrasoHoras),
      statusSla,
      ehReincidente,
      tentativa: tentativaNum,
      latitude: lat,
      longitude: lng,
      custoEstimado: Math.round(custoBase),
    });

    validRows++;
  });

  const diagnostics: IngestionDiagnostics = {
    totalRawRows: rawRows.length,
    validRows,
    skippedRows,
    missingFieldsCount: missingCounts,
    mappingConfidence,
    detectedHeadersCount: Object.keys(mapping).filter(k => !!mapping[k as keyof ColumnMappingConfig]).length,
    dateRange: { oldest: oldestDate, newest: newestDate },
    uniqueTeamsCount: uniqueTeams.size,
    uniqueCitiesCount: uniqueCities.size,
    uniqueTypesCount: uniqueTypes.size,
    sheetNames,
    activeSheet,
    fileSizeKb,
  };

  return { orders, diagnostics };
}
