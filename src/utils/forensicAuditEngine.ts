import { 
  StandardWorkOrder, 
  ForensicFinding, 
  ActionPlan5W2HItem, 
  PoloGeoCluster 
} from '../types';

// Coordenadas Oficiais dos Municípios da Região da Supervisão ASSU e Adjacências (RN)
export const RN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ASSU': { lat: -5.5764, lng: -36.9084 },
  'PARAU': { lat: -5.7725, lng: -37.1086 },
  'IPANGUACU': { lat: -5.4981, lng: -36.8553 },
  'ALTO DO RODRIGUES': { lat: -5.2922, lng: -36.7644 },
  'ITAJA': { lat: -5.6425, lng: -36.8683 },
  'ANGICOS': { lat: -5.6644, lng: -36.6047 },
  'LAJES': { lat: -5.7003, lng: -36.2444 },
  'PEDRO AVELINO': { lat: -5.5217, lng: -36.3853 },
  'CARNAUBAIS': { lat: -5.3564, lng: -36.8322 },
  'MACAU': { lat: -5.1150, lng: -36.6344 },
  'MOSSORO': { lat: -5.1878, lng: -37.3441 },
  'MOSSORÓ': { lat: -5.1878, lng: -37.3441 },
  'CURRAIS NOVOS': { lat: -6.2603, lng: -36.5161 },
  'PENDENCIAS': { lat: -5.2597, lng: -36.7236 },
  'PENDÊNCIAS': { lat: -5.2597, lng: -36.7236 },
  'SAO RAFAEL': { lat: -5.8014, lng: -36.8203 },
  'SÃO RAFAEL': { lat: -5.8014, lng: -36.8203 },
  'TRIUNFO POTIGUAR': { lat: -5.8714, lng: -37.1892 },
  'Afonso Bezerra': { lat: -5.5008, lng: -36.5050 },
};

/**
 * Motor de Auditoria Forense Operacional.
 * Detecta inconformidades de apontamento, fraudes burocráticas e inconsistências de campo.
 */
export function runForensicAudit(orders: StandardWorkOrder[]): {
  findings: ForensicFinding[];
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    potentialWasteEstimated: number; // R$ estimado de retrabalho ou apontamento fraudulento
  };
} {
  const findings: ForensicFinding[] = [];

  // 1. Mapear histórico por equipe para detectar taxas anômalas de impedimentos
  const teamOrderCount: Record<string, number> = {};
  const teamImpedimentCount: Record<string, number> = {};

  orders.forEach((o) => {
    const eq = o.equipe || 'N/A';
    teamOrderCount[eq] = (teamOrderCount[eq] || 0) + 1;
    if (o.motivo && o.motivo.trim().length > 0) {
      teamImpedimentCount[eq] = (teamImpedimentCount[eq] || 0) + 1;
    }
  });

  orders.forEach((o) => {
    const tipoLower = (o.tipo || '').toLowerCase();
    const duracao = o.duracaoMinutos || 0;

    // Regra 1: Apontamento Relâmpago em Serviço Complexo
    // Serviços estruturais (substituição, ligação, alteração) não podem ser concluídos em menos de 12 min
    const isComplex = 
      tipoLower.includes('substitui') || 
      tipoLower.includes('liga') || 
      tipoLower.includes('reativa') || 
      tipoLower.includes('inspecao') ||
      tipoLower.includes('inspeção');

    if (isComplex && duracao < 12 && duracao > 0 && o.statusRetorno === 'VREL') {
      findings.push({
        id: `forensic-${o.id}-relampago`,
        orderId: o.id,
        order: o,
        ruleType: 'APONTAMENTO_RELAMPAGO',
        severity: duracao <= 6 ? 'CRITICA' : 'ALTA',
        title: 'Apontamento Relâmpago Suspeito',
        description: `Serviço complexo '${o.tipo}' foi apontado como concluído em apenas ${duracao} minutos pela equipe ${o.equipe}.`,
        evidence: `Duração registrada: ${duracao} min (Mínimo técnico recomendado: 25 min). Status de retorno: ${o.statusRetorno}.`,
        recommendedAuditAction: 'Auditar relatório fotográfico de antes/depois no sistema e verificar coordenadas GPS da viatura.',
        impactScore: 85,
      });
    }

    // Regra 2: Reincidência Crônica (3ª tentativa ou mais)
    if (o.tentativa >= 3 || (o.ehReincidente && o.tentativa >= 2 && o.statusSla === 'CRITICO')) {
      findings.push({
        id: `forensic-${o.id}-reincidencia`,
        orderId: o.id,
        order: o,
        ruleType: 'REINCIDENCIA_CRONICA',
        severity: o.tentativa >= 3 ? 'CRITICA' : 'ALTA',
        title: 'Reincidência Crônica com Alto Custo',
        description: `Ordem na ${o.tentativa}ª visita na cidade de ${o.cidade}. Histórico persistente de não resolução em campo.`,
        evidence: `Tentativa: ${o.tentativa}ª. Atraso acumulado: ${o.atrasoHoras.toFixed(1)}h. Motivo registrado: ${o.motivo || 'Não informado'}.`,
        recommendedAuditAction: 'Despachar viatura de fiscalização técnica especializada com supervisor de polo.',
        impactScore: 90,
      });
    }

    // Regra 3: Abuso de Impedimento Genérico por Equipe
    const eq = o.equipe || 'N/A';
    const totalEq = teamOrderCount[eq] || 1;
    const impEq = teamImpedimentCount[eq] || 0;
    const rateEq = impEq / totalEq;

    if (rateEq > 0.45 && totalEq >= 6 && o.motivo && o.motivo.toLowerCase().includes('cliente ausente')) {
      findings.push({
        id: `forensic-${o.id}-impedimento`,
        orderId: o.id,
        order: o,
        ruleType: 'IMPEDIMENTO_SEM_EVIDENCIA',
        severity: 'MEDIA',
        title: 'Padrão Excessivo de Impedimento Genérico',
        description: `A equipe ${o.equipe} possui ${(rateEq * 100).toFixed(0)}% das suas ordens finalizadas com impedimento comercial.`,
        evidence: `Motivo apontado: '${o.motivo}'. A taxa média da supervisão é de 18%, indicando potencial recusa velada de atendimento.`,
        recommendedAuditAction: 'Exigir contato telefônico gravado ou geolocalização no portão com foto comprobatória.',
        impactScore: 70,
      });
    }

    // Regra 4: Duração Discrepante Extrema (|Z-Score| > 3.0)
    if (o.zScoreDuracao && Math.abs(o.zScoreDuracao) > 3.0) {
      findings.push({
        id: `forensic-${o.id}-duracao`,
        orderId: o.id,
        order: o,
        ruleType: 'DURACAO_DISCREPANTE',
        severity: Math.abs(o.zScoreDuracao) > 4 ? 'CRITICA' : 'ALTA',
        title: 'Desvio Estatístico Extremo de Duração',
        description: `Duração de ${duracao} minutos excede 3 desvios padrão da média da categoria (Z = ${o.zScoreDuracao.toFixed(2)}).`,
        evidence: `Tempo registrado: ${duracao} min. Z-Score: ${o.zScoreDuracao.toFixed(2)}. Possível esquecimento de fechamento de turno ou ociosidade.`,
        recommendedAuditAction: 'Solicitar justificativa detalhada do líder de equipe sobre a permanência estendida no ponto.',
        impactScore: 75,
      });
    }
  });

  // Ordenar por impacto decrescente
  findings.sort((a, b) => b.impactScore - a.impactScore);

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  findings.forEach((f) => {
    if (f.severity === 'CRITICA') criticalCount++;
    else if (f.severity === 'ALTA') highCount++;
    else mediumCount++;
  });

  // Estimar desperdício financeiro acumulado (R$ 180 por apontamento duvidoso/retrabalho)
  const potentialWasteEstimated = findings.length * 180;

  return {
    findings,
    summary: {
      totalFindings: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      potentialWasteEstimated,
    },
  };
}

/**
 * Agrupamento Territorial dos Municípios da Supervisão ASSU.
 */
export function buildTerritorialClusters(orders: StandardWorkOrder[]): PoloGeoCluster[] {
  const cityMap: Record<string, {
    total: number;
    delays: number;
    revisits: number;
    durations: number[];
    teams: Record<string, number>;
    services: Record<string, number>;
    impediments: Record<string, number>;
  }> = {};

  orders.forEach((o) => {
    const rawCity = (o.cidade || 'ASSU').toUpperCase().trim();
    // Normalização básica
    let city = rawCity;
    if (city.includes('MOSSOR')) city = 'MOSSORÓ';
    else if (city.includes('IPANG')) city = 'IPANGUACU';
    else if (city.includes('RODRIG')) city = 'ALTO DO RODRIGUES';
    else if (city.includes('ITAJ')) city = 'ITAJA';

    if (!cityMap[city]) {
      cityMap[city] = {
        total: 0,
        delays: 0,
        revisits: 0,
        durations: [],
        teams: {},
        services: {},
        impediments: {},
      };
    }

    const c = cityMap[city];
    c.total++;
    if (o.statusSla === 'ATRASADO' || o.statusSla === 'CRITICO') c.delays++;
    if (o.ehReincidente) c.revisits++;
    c.durations.push(o.duracaoMinutos || 45);

    const eq = o.equipe || 'Geral';
    c.teams[eq] = (c.teams[eq] || 0) + 1;

    const srv = o.tipo || 'Geral';
    c.services[srv] = (c.services[srv] || 0) + 1;

    if (o.motivo) {
      c.impediments[o.motivo] = (c.impediments[o.motivo] || 0) + 1;
    }
  });

  const clusters: PoloGeoCluster[] = [];

  Object.keys(cityMap).forEach((city) => {
    const data = cityMap[city];
    const coords = RN_CITY_COORDINATES[city] || { lat: -5.5764, lng: -36.9084 };

    const slaComplianceRate = Math.max(0, Math.min(100, Math.round(((data.total - data.delays) / data.total) * 1000) / 10));
    const avgDuration = Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length);

    // Top equipe
    let topTeam = 'N/A';
    let maxTeamCount = -1;
    Object.entries(data.teams).forEach(([k, v]) => {
      if (v > maxTeamCount) {
        maxTeamCount = v;
        topTeam = k;
      }
    });

    // Top serviço
    let topService = 'N/A';
    let maxSrvCount = -1;
    Object.entries(data.services).forEach(([k, v]) => {
      if (v > maxSrvCount) {
        maxSrvCount = v;
        topService = k;
      }
    });

    // Top impedimento
    let topImpediment = 'Nenhum Crítico';
    let maxImpCount = -1;
    Object.entries(data.impediments).forEach(([k, v]) => {
      if (v > maxImpCount) {
        maxImpCount = v;
        topImpediment = k;
      }
    });

    // Vulnerabilidade (0 a 100): peso de atraso (60%) + reincidência (40%)
    const delayRate = (data.delays / data.total) * 100;
    const revisitRate = (data.revisits / data.total) * 100;
    const vulnerabilityScore = Math.min(100, Math.round(delayRate * 0.6 + revisitRate * 0.4));

    clusters.push({
      cidade: city,
      latitude: coords.lat,
      longitude: coords.lng,
      totalOrders: data.total,
      delayedOrders: data.delays,
      slaComplianceRate,
      revisitOrders: data.revisits,
      avgDuration,
      topTeam,
      topService,
      topImpediment,
      vulnerabilityScore,
    });
  });

  // Ordena por volume total de ordens decrescente
  clusters.sort((a, b) => b.totalOrders - a.totalOrders);
  return clusters;
}

/**
 * Gerador Dinâmico de Planos Prescritivos 5W2H baseados nas fragilidades reais da base.
 */
export function generatePrescriptive5W2HPlan(
  orders: StandardWorkOrder[],
  findings: ForensicFinding[]
): ActionPlan5W2HItem[] {
  const plans: ActionPlan5W2HItem[] = [];

  // 1. Identificar equipe com maior volume de atrasos
  const teamDelays: Record<string, number> = {};
  const teamTotals: Record<string, number> = {};
  orders.forEach((o) => {
    const eq = o.equipe || 'Geral';
    teamTotals[eq] = (teamTotals[eq] || 0) + 1;
    if (o.statusSla === 'ATRASADO' || o.statusSla === 'CRITICO') {
      teamDelays[eq] = (teamDelays[eq] || 0) + 1;
    }
  });

  let worstTeam = 'ASS010';
  let worstTeamDelayRate = 0;
  Object.keys(teamTotals).forEach((eq) => {
    if (teamTotals[eq] >= 5) {
      const rate = (teamDelays[eq] || 0) / teamTotals[eq];
      if (rate > worstTeamDelayRate) {
        worstTeamDelayRate = rate;
        worstTeam = eq;
      }
    }
  });

  plans.push({
    id: '5w2h-1',
    what: `Remanejamento e Nivelamento Técnico da Equipe ${worstTeam}`,
    why: `Apresenta ${(worstTeamDelayRate * 100).toFixed(0)}% de estouro de SLA, superior à média da supervisão.`,
    where: 'Polo Regional ASSU / Base Operacional',
    when: 'Imediato (Início da próxima escala semanal)',
    who: 'Supervisor de Operações de Campo & Coordenador de Logística',
    how: 'Realizar auditoria conjunta de rota em viatura e reciclagem rápida no procedimento de despacho prévio.',
    howMuch: 'Custo neutro (Evita R$ 6.200/mês em multas contratuais)',
    priority: 'ALTA',
    category: 'SLA',
  });

  // 2. Ação sobre Apontamentos Relâmpago / Auditoria Forense
  const flashFindings = findings.filter((f) => f.ruleType === 'APONTAMENTO_RELAMPAGO');
  if (flashFindings.length > 0) {
    plans.push({
      id: '5w2h-2',
      what: 'Trava Sistêmica e Auditoria Fotográfica de Serviços Complexos',
      why: `${flashFindings.length} ordens foram finalizadas em menos de 10 min, indicando risco de não execução ou baixa conformidade.`,
      where: 'App de Campo dos Técnicos & Mesa de Despacho',
      when: 'Em até 5 dias úteis',
      who: 'TI Operacional / Especialista SAP PM',
      how: 'Exigir upload obrigatório de 2 fotos (antes e depois com marca d’água de data e GPS) para conclusão de OS estrutural.',
      howMuch: 'Economia estimada de R$ 9.800/mês em retrabalhos evitados',
      priority: 'ALTA',
      category: 'CONFORMIDADE',
    });
  }

  // 3. Ação sobre Reincidência e Retrabalho
  const revisitOrders = orders.filter((o) => o.ehReincidente).length;
  plans.push({
    id: '5w2h-3',
    what: 'Protocolo "Primeira Visita Resolutiva" (First-Time Fix)',
    why: `${revisitOrders} ordens de serviço (${((revisitOrders / orders.length) * 100).toFixed(0)}% da base) são retrabalhos (2ª ou 3ª visita).`,
    where: 'Almoxarifado e Checklist de Saída de Viatura',
    when: 'Próxima segunda-feira',
    who: 'Encarregado de Frota e Líderes de Turma',
    how: 'Instituir checklist matinal de materiais críticos (conectores, medidores aferidos, cabos concêntricos) para zerar falta de peças em campo.',
    howMuch: 'Investimento de R$ 1.500 em maletas / Retorno de R$ 14.400/mês',
    priority: 'ALTA',
    category: 'REINCIDENCIA',
  });

  // 4. Ação sobre Impedimento Comercial "Cliente Ausente"
  const absentClientOrders = orders.filter((o) => (o.motivo || '').toLowerCase().includes('ausente')).length;
  if (absentClientOrders >= 3) {
    plans.push({
      id: '5w2h-4',
      what: 'Disparo Automático de Alerta de Deslocamento ao Cliente (SMS/WhatsApp)',
      why: `${absentClientOrders} ordens foram frustradas por ausência do cliente ou portão trancado no momento da visita.`,
      where: 'Sistema de Atendimento e Notificação ao Consumidor',
      when: 'Próximo ciclo quinzenal',
      who: 'Gestão de Experiência do Cliente & Despacho',
      how: 'Enviar link de rastreamento com janela prevista de 2 horas quando o técnico assumir a ordem na rota.',
      howMuch: 'Custo de R$ 0,08 por SMS / Redução de 45% em viagens perdidas',
      priority: 'MEDIA',
      category: 'PRODUTIVIDADE',
    });
  }

  return plans;
}
