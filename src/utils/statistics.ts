import { StandardWorkOrder } from '../types';

export interface OperationalKPIs {
  totalOrders: number;
  slaOnTimeCount: number;
  slaOnTimePercent: number;
  slaDelayedCount: number;
  slaDelayedPercent: number;
  slaCriticalCount: number;
  slaCriticalPercent: number;
  recurrentCount: number;
  recurrentPercent: number;
  avgDurationMinutes: number;
  medianDurationMinutes: number;
  totalEstimatedCost: number;
  avgCostPerOrder: number;
  outlierCount: number;
  outlierPercent: number;
}

export interface ParetoItem {
  key: string;
  count: number;
  costSum: number;
  individualPercent: number;
  cumulativePercent: number;
  isVital80: boolean;
}

export interface ZScoreResult {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  threshold: number;
  outliersCount: number;
  normalCount: number;
}

/**
 * Calcula a média aritmética de um array numérico.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Calcula a mediana de um array numérico.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula o desvio padrão amostral s = sqrt( (1 / (N - 1)) * sum( (x - mean)^2 ) ).
 */
export function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Motor de KPIs em tempo real para os dados (filtrados ou totais).
 */
export function computeKPIs(orders: StandardWorkOrder[]): OperationalKPIs {
  const total = orders.length;
  if (total === 0) {
    return {
      totalOrders: 0,
      slaOnTimeCount: 0,
      slaOnTimePercent: 0,
      slaDelayedCount: 0,
      slaDelayedPercent: 0,
      slaCriticalCount: 0,
      slaCriticalPercent: 0,
      recurrentCount: 0,
      recurrentPercent: 0,
      avgDurationMinutes: 0,
      medianDurationMinutes: 0,
      totalEstimatedCost: 0,
      avgCostPerOrder: 0,
      outlierCount: 0,
      outlierPercent: 0,
    };
  }

  let onTime = 0;
  let delayed = 0;
  let critical = 0;
  let recurrent = 0;
  let costSum = 0;
  const durations: number[] = [];
  let outliers = 0;

  for (let i = 0; i < total; i++) {
    const o = orders[i];
    if (o.statusSla === 'NO_PRAZO') onTime++;
    else if (o.statusSla === 'ATRASADO') delayed++;
    else if (o.statusSla === 'CRITICO') critical++;

    if (o.ehReincidente) recurrent++;
    costSum += o.custoEstimado || 0;
    durations.push(o.duracaoMinutos);
    if (o.isOutlier) outliers++;
  }

  const meanDuration = calculateMean(durations);
  const medDuration = calculateMedian(durations);

  return {
    totalOrders: total,
    slaOnTimeCount: onTime,
    slaOnTimePercent: Math.round((onTime / total) * 100),
    slaDelayedCount: delayed,
    slaDelayedPercent: Math.round((delayed / total) * 100),
    slaCriticalCount: critical,
    slaCriticalPercent: Math.round((critical / total) * 100),
    recurrentCount: recurrent,
    recurrentPercent: Math.round((recurrent / total) * 100),
    avgDurationMinutes: Math.round(meanDuration),
    medianDurationMinutes: Math.round(medDuration),
    totalEstimatedCost: costSum,
    avgCostPerOrder: Math.round(costSum / total),
    outlierCount: outliers,
    outlierPercent: Math.round((outliers / total) * 100),
  };
}

/**
 * Motor de Curva de Pareto 80/20 Multidimensional.
 * Agrupa pela dimensão indicada, ordena em ordem decrescente de ocorrências e calcula o percentual acumulado.
 */
export function computePareto(
  orders: StandardWorkOrder[],
  dimension: 'motivo' | 'tipo' | 'servico' | 'equipe' | 'cidade'
): { items: ParetoItem[]; totalOccurrences: number; vitalCutIndex: number } {
  if (orders.length === 0) {
    return { items: [], totalOccurrences: 0, vitalCutIndex: 0 };
  }

  const groups: Record<string, { count: number; costSum: number }> = {};
  let totalOccurrences = 0;

  for (const o of orders) {
    let rawKey = '';
    if (dimension === 'motivo') {
      rawKey = o.motivo ? o.motivo.trim() : 'Sem impedimento / Normal';
    } else if (dimension === 'tipo') {
      rawKey = o.tipo || 'Outros';
    } else if (dimension === 'servico') {
      rawKey = o.servico || 'Serviço Padrão';
    } else if (dimension === 'equipe') {
      rawKey = o.equipe || 'Equipe Geral';
    } else if (dimension === 'cidade') {
      rawKey = o.cidade || 'Não Especificado';
    }

    if (!groups[rawKey]) {
      groups[rawKey] = { count: 0, costSum: 0 };
    }
    groups[rawKey].count += 1;
    groups[rawKey].costSum += o.custoEstimado || 0;
    totalOccurrences += 1;
  }

  // Ordena por maior frequência (ordem decrescente de volume de falhas/ocorrências)
  const sortedEntries = Object.entries(groups).sort((a, b) => b[1].count - a[1].count);

  let accumulated = 0;
  let vitalCutIndex = 0;
  let cutFound = false;

  const items: ParetoItem[] = sortedEntries.map(([key, data], idx) => {
    accumulated += data.count;
    const individualPercent = (data.count / totalOccurrences) * 100;
    const cumulativePercent = (accumulated / totalOccurrences) * 100;
    const isVital80 = cumulativePercent <= 80 || (!cutFound && cumulativePercent > 80);

    if (cumulativePercent >= 80 && !cutFound) {
      vitalCutIndex = idx;
      cutFound = true;
    }

    return {
      key,
      count: data.count,
      costSum: data.costSum,
      individualPercent: Number(individualPercent.toFixed(1)),
      cumulativePercent: Number(cumulativePercent.toFixed(1)),
      isVital80,
    };
  });

  return { items, totalOccurrences, vitalCutIndex };
}

/**
 * Motor de Detecção de Outliers via Z-Score.
 * Z = (X - média) / desvio_padrão.
 * Sinaliza ordens com |Z| > threshold (padrão |Z| > 2.5).
 */
export function applyZScoreAnalysis(
  orders: StandardWorkOrder[],
  metric: 'duracaoMinutos' | 'custoEstimado',
  threshold = 2.5
): {
  enrichedOrders: StandardWorkOrder[];
  stats: ZScoreResult;
} {
  if (orders.length === 0) {
    return {
      enrichedOrders: [],
      stats: {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        threshold,
        outliersCount: 0,
        normalCount: 0,
      },
    };
  }

  const values = orders.map((o) => o[metric] as number);
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);

  let outliersCount = 0;
  let minVal = Infinity;
  let maxVal = -Infinity;

  const enrichedOrders = orders.map((o) => {
    const val = o[metric] as number;
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;

    let zScore = 0;
    if (stdDev > 0) {
      zScore = (val - mean) / stdDev;
    }

    const isOutlier = Math.abs(zScore) > threshold;
    if (isOutlier) outliersCount++;

    return {
      ...o,
      zScoreDuracao: metric === 'duracaoMinutos' ? Number(zScore.toFixed(2)) : o.zScoreDuracao,
      zScoreCusto: metric === 'custoEstimado' ? Number(zScore.toFixed(2)) : o.zScoreCusto,
      isOutlier,
    };
  });

  return {
    enrichedOrders,
    stats: {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      min: minVal === Infinity ? 0 : minVal,
      max: maxVal === -Infinity ? 0 : maxVal,
      threshold,
      outliersCount,
      normalCount: orders.length - outliersCount,
    },
  };
}
