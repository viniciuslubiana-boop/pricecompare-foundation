import type { MyVehicle, CompetitorVehicle } from "@/types/database.types";

export type { MyVehicle, CompetitorVehicle };

export type MatchStatus = "perfect" | "partial" | "review" | "none";
export type WinnerKind = "me" | "competitor" | "tie" | "unmatched";
export type ResultKind =
  | "match"
  | "opportunity" // concorrente tem, eu não
  | "differential"; // eu tenho, concorrente não

export type CommercialStatus =
  | "best_price"
  | "very_competitive"
  | "competitive"
  | "above_market"
  | "far_above_market"
  | "insufficient_data";

export type RecommendedActionKind =
  | "keep"
  | "reduce"
  | "follow_market"
  | "excellent_opportunity"
  | "insufficient_data";

export interface RecommendedAction {
  kind: RecommendedActionKind;
  label: string;
  /** Quando aplicável (reduce/excellent_opportunity), valor sugerido em R$ */
  amount: number | null;
}

export interface ScoreBreakdown {
  brand: number;
  model: number;
  year: number;
  price: number;
  km: number;
  total: number; // 0..100
}

export interface MarketIntelligence {
  min: number | null;
  max: number | null;
  avg: number | null;
  myPrice: number | null;
  /** Número de veículos equivalentes encontrados no mercado */
  competitorCount: number;
  /** Posição do meu preço no ranking (1 = mais barato). null se não houver mercado */
  rankPosition: number | null;
  /** me - min */
  diffFromMin: number | null;
  /** me - avg */
  diffFromAvg: number | null;
  /** 0..100 — quanto maior, mais competitivo */
  competitiveness: number;
  status: CommercialStatus;
  action: RecommendedAction;
}

/** @deprecated use MarketIntelligence */
export type MarketPriceInfo = MarketIntelligence;

export interface ComparisonRow {
  id: string;
  kind: ResultKind;
  myVehicle: MyVehicle | null;
  competitorVehicle: CompetitorVehicle | null;
  score: ScoreBreakdown;
  status: MatchStatus;
  winner: WinnerKind;
  priceDiff: number | null; // competitor - me (positivo = você está mais barato)
  market: MarketIntelligence;
}

export interface ComparisonSummary {
  totalMatches: number;
  meCheaper: number;
  competitorCheaper: number;
  ties: number;
  opportunities: number;
  differentials: number;
  totalSavings: number;
  // ===== Intelligence =====
  totalCompared: number;
  bestPriceCount: number;
  aboveMarketCount: number;
  avgCompetitiveness: number;
  biggestOpportunityValue: number;
  biggestOpportunityLabel: string | null;
}

export interface ComparisonResult {
  rows: ComparisonRow[];
  summary: ComparisonSummary;
  competitorId: string;
  competitorName: string;
  /** Nomes de concorrentes presentes no pool de mercado */
  marketCompetitors: string[];
}

export interface ComparisonFilters {
  minScore?: number; // 0..100
  onlyMatches?: boolean;
  onlyOpportunities?: boolean;
  onlyDifferentials?: boolean;
  onlyMeCheaper?: boolean;
  onlyCompetitorCheaper?: boolean;
  // ===== Intelligence filters =====
  onlyAboveMarket?: boolean;
  onlyBestPrice?: boolean;
  onlyLowCompetitiveness?: boolean; // < 80
  competitorName?: string; // restringe linhas ao concorrente específico
  search?: string;
}

// ============================================================
// Radar de Competitividade
// ============================================================

export type CommercialPriority = "high" | "medium" | "low" | "best_price" | "none";

export type RadarActionKind =
  | "review_today"
  | "reduce"
  | "follow_market"
  | "keep"
  | "excellent_position"
  | "insufficient_data";

export interface RadarAction {
  kind: RadarActionKind;
  label: string;
  amount: number | null;
}

export interface RadarRow {
  id: string;
  myVehicle: MyVehicle;
  market: MarketIntelligence;
  priority: CommercialPriority;
  action: RadarAction;
  /** Veículos do mercado considerados equivalentes (mesma marca/modelo/ano). */
  equivalents: CompetitorVehicle[];
}

export interface RadarSummary {
  totalActionable: number;
  biggestDiffValue: number;
  biggestDiffLabel: string | null;
  biggestOpportunityValue: number;
  biggestOpportunityLabel: string | null;
  avgCompetitiveness: number;
  highCount: number;
  mediumCount: number;
  bestPriceCount: number;
}

export interface RadarResult {
  rows: RadarRow[];
  /** Linhas elegíveis para o painel (Alta + Média) */
  actionableRows: RadarRow[];
  summary: RadarSummary;
  brands: string[];
  competitors: string[];
}

export interface RadarFilters {
  onlyHigh?: boolean;
  onlyMedium?: boolean;
  onlyBestPrice?: boolean;
  brand?: string;
  competitorName?: string;
  search?: string;
}

// ============================================================
// Estratégia de Preço
// ============================================================

export interface PriceScenario {
  /** Identificador estável do cenário */
  id: "reduce_500" | "reduce_1000" | "reduce_1500" | "reach_min";
  label: string;
  /** Valor da redução em R$ (positivo) */
  reduction: number;
  /** Preço resultante após a redução */
  newPrice: number;
  /** Nova posição estimada no ranking (1 = mais barato) */
  newRank: number | null;
  /** Total de participantes considerando este cenário */
  totalRanked: number;
  /** Quantas posições ganhou em relação à posição atual */
  positionsGained: number;
  /** Se o cenário coloca o veículo no melhor preço */
  becomesBestPrice: boolean;
  /** Se o cenário é aplicável (ex.: reach_min faz sentido apenas se está acima do mínimo) */
  applicable: boolean;
}

export type StrategyRecommendationKind =
  | "keep"
  | "reduce"
  | "excellent_position"
  | "market_up"
  | "market_down"
  | "insufficient_data";

export interface StrategyRecommendation {
  kind: StrategyRecommendationKind;
  label: string;
  /** Valor sugerido em R$ (positivo) quando aplicável */
  amount: number | null;
  /** Texto curto descrevendo o impacto esperado */
  impact: string;
}

export interface StrategyRow {
  id: string;
  myVehicle: MyVehicle;
  market: MarketIntelligence;
  scenarios: PriceScenario[];
  recommendation: StrategyRecommendation;
  /** Maior impacto possível observado nos cenários simulados (em R$) */
  maxImpact: number;
  /** Veículos do mercado considerados equivalentes (mesma marca/modelo/ano). */
  equivalents: CompetitorVehicle[];
}

export interface StrategySummary {
  totalWithRecommendation: number;
  reduceCount: number;
  keepCount: number;
  excellentCount: number;
  totalSuggestedReduction: number;
  biggestOpportunityValue: number;
  biggestOpportunityLabel: string | null;
  avgCompetitiveness: number;
}

export interface StrategyResult {
  rows: StrategyRow[];
  /** Linhas elegíveis para o painel (qualquer recomendação válida) */
  recommendedRows: StrategyRow[];
  summary: StrategySummary;
  brands: string[];
  competitors: string[];
}

export type StrategySortKey = "max_impact" | "suggested_reduction" | "best_opportunity" | "none";

export interface StrategyFilters {
  /** Ordena por maior impacto possível (qualquer cenário) */
  sort?: StrategySortKey;
  /** Apenas linhas cuja recomendação é "Reduzir R$ X" */
  onlyReduce?: boolean;
  brand?: string;
  competitorName?: string;
  search?: string;
}

// ============================================================
// Visão 360° do Veículo
// ============================================================

export interface Vehicle360CompetitorEntry {
  id: string;
  competitorName: string;
  competitorId: string | null;
  competitorUrl: string | null;
  store: string;
  city: string | null;
  state?: string | null;
  /** Rótulo da fonte do anúncio (hostname do source_url ou nome do concorrente). */
  source?: string | null;
  brand: string;
  model: string;
  yearModel: string;
  km: number | null;
  price: number;
  /** competitor.price - myVehicle.price (positivo = está mais caro que eu) */
  diffFromMe: number | null;
  diffPctFromMe: number | null;
  lastCollectedAt: string;
  sourceUrl: string | null;
}

export interface Vehicle360HistoryEntry {
  id: string;
  competitorName: string;
  previousPrice: number | null;
  currentPrice: number | null;
  diff: number | null;
  diffPct: number | null;
  detectedAt: string;
  summary: string | null;
}

export interface Vehicle360Result {
  myVehicle: MyVehicle;
  market: MarketIntelligence;
  competitors: Vehicle360CompetitorEntry[];
  history: Vehicle360HistoryEntry[];
}

export type Vehicle360SortKey = "price" | "km" | "date";

export interface Vehicle360Filters {
  sameYear?: boolean;
  versionTerm?: string;
  city?: string;
  maxKmDistance?: number | null;
  sort?: Vehicle360SortKey;
}


