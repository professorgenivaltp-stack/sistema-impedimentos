import { StandardWorkOrder, WhatIfSimulationParams, WhatIfSimulationResult } from '../types';

/**
 * Motor de Simulação de Cenários Operacionais (What-If) e Dimensionamento de Capacidade.
 */
export function runWhatIfSimulation(
  orders: StandardWorkOrder[],
  params: WhatIfSimulationParams
): WhatIfSimulationResult {
  // 1. Levantamento de Parâmetros Base a partir do Conjunto Ativo
  const distinctTeams = new Set<string>();
  let totalMinutes = 0;
  let delayOrders = 0;
  let revisitOrders = 0;

  orders.forEach((o) => {
    if (o.equipe) distinctTeams.add(o.equipe);
    totalMinutes += o.duracaoMinutos || 75;
    if (o.statusSla === 'ATRASADO' || o.statusSla === 'CRITICO') {
      delayOrders += 1;
    }
    if (o.ehReincidente || o.tentativa > 1) {
      revisitOrders += 1;
    }
  });

  const totalOrdersCount = orders.length || 1;
  const baselineTeams = Math.max(1, distinctTeams.size);
  const baselineTma = Math.max(30, Math.round(totalMinutes / totalOrdersCount));

  // Estimativa de dias úteis da amostragem (padrão 22 dias/mês de operação)
  const workingDaysMonth = 22;
  const baselineDemandDaily = Math.max(1, Math.round(totalOrdersCount / Math.min(22, Math.max(5, Math.ceil(totalOrdersCount / 20)))));

  // Capacidade produtiva por equipe em minutos diários (7 horas líquidas = 420 minutos)
  const productiveMinutesPerDay = 420;
  const ordersPerTeamDaily = Math.max(1, Math.floor(productiveMinutesPerDay / baselineTma));
  const baselineDailyCapacity = baselineTeams * ordersPerTeamDaily;

  const baselineCapacityUtilization = Math.min(
    140,
    Math.round((baselineDemandDaily / Math.max(1, baselineDailyCapacity)) * 100)
  );

  const baselineDelayRate = (delayOrders / totalOrdersCount) * 100;
  const baselineSlaCompliance = Math.max(0, Math.min(100, Math.round((100 - baselineDelayRate) * 10) / 10));

  // 2. Projeções no Cenário Simulado
  const simulatedTeams = Math.max(1, baselineTeams + params.additionalTeams);
  const simulatedTma = Math.max(20, Math.round(baselineTma * (1 - params.tmaReductionPercent / 100)));
  const simOrdersPerTeamDaily = Math.max(1, Math.floor(productiveMinutesPerDay / simulatedTma));
  const simulatedDailyCapacity = simulatedTeams * simOrdersPerTeamDaily;

  const simulatedDemandDaily = Math.max(
    1,
    Math.round(baselineDemandDaily * (1 + params.demandChangePercent / 100))
  );

  const simulatedCapacityUtilization = Math.min(
    140,
    Math.round((simulatedDemandDaily / Math.max(1, simulatedDailyCapacity)) * 100)
  );

  // Efeito da utilização e redução de reincidência no SLA
  // Quanto maior o descompasso de capacidade vs demanda (utilização > 90%), maior o risco de atraso
  const utilizationRatio = simulatedCapacityUtilization / Math.max(1, baselineCapacityUtilization);
  const reincidenceFactor = 1 - (params.reincidenceReductionPercent / 100) * 0.4;
  const tmaFactor = 1 - (params.tmaReductionPercent / 100) * 0.3;

  let simulatedDelayRate = baselineDelayRate * utilizationRatio * reincidenceFactor * tmaFactor;
  // Limites realistas de mercado (mínimo 3% devido a imprevistos climáticos/trânsito)
  simulatedDelayRate = Math.max(3.0, Math.min(75.0, Math.round(simulatedDelayRate * 10) / 10));
  const simulatedSlaCompliance = Math.max(0, Math.min(100, Math.round((100 - simulatedDelayRate) * 10) / 10));

  // Contagens mensais estimadas
  const monthlyDemand = simulatedDemandDaily * workingDaysMonth;
  const baselineMonthlyDemand = baselineDemandDaily * workingDaysMonth;

  const baselineMonthlyDelays = Math.round(baselineMonthlyDemand * (baselineDelayRate / 100));
  const simulatedMonthlyDelays = Math.round(monthlyDemand * (simulatedDelayRate / 100));

  const baselineRevisitRate = revisitOrders / totalOrdersCount;
  const simulatedRevisitRate = baselineRevisitRate * (1 - params.reincidenceReductionPercent / 100);

  const baselineMonthlyRevisits = Math.round(baselineMonthlyDemand * baselineRevisitRate);
  const simulatedMonthlyRevisits = Math.round(monthlyDemand * simulatedRevisitRate);

  // 3. Modelagem Financeira & Economia Líquida
  // Investimento adicional em equipes (mensal)
  const teamInvestmentMonthly = Math.max(0, params.additionalTeams * params.costPerTeamMonth);

  // Economia por multas de SLA evitadas
  const avoidedDelays = Math.max(0, baselineMonthlyDelays - simulatedMonthlyDelays);
  const penaltySavingsMonthly = Math.round(avoidedDelays * params.costPerPenaltySla);

  // Economia por visitas improdutivas/reincidências eliminadas
  const avoidedRevisits = Math.max(0, baselineMonthlyRevisits - simulatedMonthlyRevisits);
  const revisitSavingsMonthly = Math.round(avoidedRevisits * params.costPerRevisit);

  // Ganhos de eficiência com redução de TMA (libera horas homem valoradas)
  const hoursSavedPerDay = (baselineTeams * (baselineTma - simulatedTma) * ordersPerTeamDaily) / 60;
  const efficiencySavingsMonthly = Math.round(hoursSavedPerDay * workingDaysMonth * 45); // R$ 45/hora técnica de valor agregado

  const totalGrossSavings = penaltySavingsMonthly + revisitSavingsMonthly + efficiencySavingsMonthly;
  const netSavingsMonthly = totalGrossSavings - teamInvestmentMonthly;

  // ROI (%) = (Ganho Líquido / Investimento) * 100
  let roiPercent = 0;
  if (teamInvestmentMonthly > 0) {
    roiPercent = Math.round((netSavingsMonthly / teamInvestmentMonthly) * 100);
  } else if (netSavingsMonthly > 0) {
    roiPercent = 100; // Sem capex adicional com ganho operacional puro
  }

  // Payback em meses
  const paybackMonths =
    teamInvestmentMonthly > 0 && totalGrossSavings > 0
      ? Math.max(0.1, Math.round((teamInvestmentMonthly / totalGrossSavings) * 10) / 10)
      : 0;

  // Custo operacional global estimado
  const baselineMonthlyCost =
    baselineTeams * params.costPerTeamMonth +
    baselineMonthlyDelays * params.costPerPenaltySla +
    baselineMonthlyRevisits * params.costPerRevisit;

  const simulatedMonthlyCost =
    simulatedTeams * params.costPerTeamMonth +
    simulatedMonthlyDelays * params.costPerPenaltySla +
    simulatedMonthlyRevisits * params.costPerRevisit;

  // 4. Síntese Prescritiva Executiva
  let recommendationSummary = '';
  if (netSavingsMonthly > 15000 && simulatedSlaCompliance >= 92) {
    recommendationSummary =
      'Cenário Altamente Viável: Forte incremento no SLA (+ ' +
      (simulatedSlaCompliance - baselineSlaCompliance).toFixed(1) +
      ' p.p.) com economia líquida de ' +
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netSavingsMonthly) +
      '/mês. O retorno sobre investimento (ROI de ' +
      roiPercent +
      '%) viabiliza a expansão com amortização rápida.';
  } else if (netSavingsMonthly > 0) {
    recommendationSummary =
      'Cenário Equilibrado: Apresenta redução nos atrasos e ganhos marginais sustentáveis. A redução do tempo médio de execução e foco na reincidência são as principais alavancas sem onerar excessivamente o Opex.';
  } else {
    recommendationSummary =
      'Cenário com Sobredimensionamento de Opex: O investimento adicional em equipes supera os custos evitados de penalidades. Recomenda-se priorizar ganho de produtividade (redução de TMA e retrabalho) antes de contratar novas turmas de campo.';
  }

  return {
    baselineTeams,
    simulatedTeams,
    baselineDailyCapacity,
    simulatedDailyCapacity,
    baselineDemandDaily,
    simulatedDemandDaily,
    baselineCapacityUtilization,
    simulatedCapacityUtilization,
    baselineSlaCompliance,
    simulatedSlaCompliance,
    baselineDelayCount: baselineMonthlyDelays,
    simulatedDelayCount: simulatedMonthlyDelays,
    baselineRevisitCount: baselineMonthlyRevisits,
    simulatedRevisitCount: simulatedMonthlyRevisits,
    baselineMonthlyCost,
    simulatedMonthlyCost,
    teamInvestmentMonthly,
    penaltySavingsMonthly,
    revisitSavingsMonthly,
    efficiencySavingsMonthly,
    netSavingsMonthly,
    roiPercent,
    paybackMonths,
    recommendationSummary,
  };
}
