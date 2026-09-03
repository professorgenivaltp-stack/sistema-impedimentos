export interface WorkOrderRaw {
  id?: string | number;
  nota?: string | number;
  supervisao?: string;
  tipo?: string;
  servico?: string;
  criacao?: number | string | Date;
  vencimento?: number | string | Date;
  cidade?: string;
  prioridade?: number | string;
  equipe?: string;
  retorno?: string;
  observacao?: string;
  dataExecIni?: string | Date;
  horaExecIni?: string;
  dataExecFim?: string | Date;
  horaExecFim?: string;
  statusRetorno?: string;
  motivo?: string;
  latitude?: number | string;
  longitude?: number | string;
  latitudeExec?: number | string;
  longitudeExec?: number | string;
  tentativa?: string | number;
  [key: string]: any;
}

export interface StandardWorkOrder {
  id: string;
  nota: string;
  supervisao: string;
  tipo: string;
  servico: string;
  dataCriacao: Date | null;
  dataVencimento: Date | null;
  dataExecFim: Date | null;
  cidade: string;
  prioridade: number;
  equipe: string;
  retorno: string;
  statusRetorno: string;
  motivo: string;
  duracaoMinutos: number;
  atrasoHoras: number;
  statusSla: 'NO_PRAZO' | 'ATRASADO' | 'CRITICO';
  ehReincidente: boolean;
  tentativa: number;
  latitude: number | null;
  longitude: number | null;
  custoEstimado: number;
  zScoreDuracao?: number;
  zScoreCusto?: number;
  isOutlier?: boolean;
}

export interface ColumnMappingConfig {
  id: string;
  nota: string;
  supervisao: string;
  tipo: string;
  servico: string;
  criacao: string;
  vencimento: string;
  cidade: string;
  prioridade: string;
  equipe: string;
  retorno: string;
  motivo: string;
  dataExecIni: string;
  horaExecIni: string;
  dataExecFim: string;
  horaExecFim: string;
  statusRetorno: string;
  tentativa: string;
  latitude: string;
  longitude: string;
}

export type TabId = 'overview' | 'pareto' | 'anomalies' | 'predictive' | 'whatif' | 'intelligence' | 'table';

export type ForensicSeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

export type ForensicRuleType = 
  | 'APONTAMENTO_RELAMPAGO'
  | 'SOBREPOSICAO_HORARIOS'
  | 'REINCIDENCIA_CRONICA'
  | 'IMPEDIMENTO_SEM_EVIDENCIA'
  | 'DESLOCAMENTO_FISICAMENTE_INVIAVEL'
  | 'DURACAO_DISCREPANTE';

export interface ForensicFinding {
  id: string;
  orderId: string;
  order: StandardWorkOrder;
  ruleType: ForensicRuleType;
  severity: ForensicSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendedAuditAction: string;
  impactScore: number; // 0 a 100
}

export interface ActionPlan5W2HItem {
  id: string;
  what: string;      // O que será feito?
  why: string;       // Por que será feito?
  where: string;     // Onde será feito?
  when: string;      // Quando será feito?
  who: string;       // Quem será o responsável?
  how: string;       // Como será feito?
  howMuch: string;   // Quanto custará / economia esperada
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  category: 'SLA' | 'REINCIDENCIA' | 'PRODUTIVIDADE' | 'CONFORMIDADE';
}

export interface PoloGeoCluster {
  cidade: string;
  latitude: number;
  longitude: number;
  totalOrders: number;
  delayedOrders: number;
  slaComplianceRate: number;
  revisitOrders: number;
  avgDuration: number;
  topTeam: string;
  topService: string;
  topImpediment: string;
  vulnerabilityScore: number; // 0 a 100
}

export interface IngestionDiagnostics {
  totalRawRows: number;
  validRows: number;
  skippedRows: number;
  missingFieldsCount: Record<string, number>;
  mappingConfidence: number;
  detectedHeadersCount: number;
  dateRange: { oldest: Date | null; newest: Date | null };
  uniqueTeamsCount: number;
  uniqueCitiesCount: number;
  uniqueTypesCount: number;
  sheetNames: string[];
  activeSheet: string;
  fileSizeKb: number;
  delimiterDetected?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

export type RiskLevel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';

export interface PredictiveOrderEvaluation {
  order: StandardWorkOrder;
  probability: number;
  predictedClass: 0 | 1;
  riskLevel: RiskLevel;
  primaryRiskFactor: string;
  recommendedAction: string;
  riskFactors: { factor: string; impact: number; description: string }[];
}

export interface ConfusionMatrixData {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  total: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1Score: number;
}

export interface RocPoint {
  threshold: number;
  fpr: number;
  tpr: number;
}

export interface FeatureImportanceItem {
  feature: string;
  weight: number;
  direction: 'aumenta_risco' | 'reduz_risco';
  impactPercent: number;
  description: string;
}

export interface ModelEvaluationResult {
  confusionMatrix: ConfusionMatrixData;
  rocPoints: RocPoint[];
  auc: number;
  featureImportance: FeatureImportanceItem[];
  evaluatedOrders: PredictiveOrderEvaluation[];
  threshold: number;
  sampleSize: number;
  baselineDelayRate: number;
}

export interface WhatIfSimulationParams {
  additionalTeams: number;
  tmaReductionPercent: number;
  reincidenceReductionPercent: number;
  demandChangePercent: number;
  costPerTeamMonth: number;
  costPerPenaltySla: number;
  costPerRevisit: number;
}

export interface WhatIfSimulationResult {
  baselineTeams: number;
  simulatedTeams: number;
  baselineDailyCapacity: number;
  simulatedDailyCapacity: number;
  baselineDemandDaily: number;
  simulatedDemandDaily: number;
  baselineCapacityUtilization: number;
  simulatedCapacityUtilization: number;
  baselineSlaCompliance: number;
  simulatedSlaCompliance: number;
  baselineDelayCount: number;
  simulatedDelayCount: number;
  baselineRevisitCount: number;
  simulatedRevisitCount: number;
  baselineMonthlyCost: number;
  simulatedMonthlyCost: number;
  teamInvestmentMonthly: number;
  penaltySavingsMonthly: number;
  revisitSavingsMonthly: number;
  efficiencySavingsMonthly: number;
  netSavingsMonthly: number;
  roiPercent: number;
  paybackMonths: number;
  recommendationSummary: string;
}
