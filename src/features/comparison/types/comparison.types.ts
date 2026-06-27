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
