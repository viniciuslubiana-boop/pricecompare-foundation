import type { MyVehicle, CompetitorVehicle } from "@/types/database.types";

export type { MyVehicle, CompetitorVehicle };

export type MatchStatus = "perfect" | "partial" | "review" | "none";
export type WinnerKind = "me" | "competitor" | "tie" | "unmatched";
export type ResultKind =
  | "match"
  | "opportunity" // concorrente tem, eu não
  | "differential"; // eu tenho, concorrente não

export interface ScoreBreakdown {
  brand: number;
  model: number;
  year: number;
  price: number;
  km: number;
  total: number; // 0..100
}

export interface MarketPriceInfo {
  min: number | null;
  max: number | null;
  avg: number | null;
  myPrice: number | null;
  diffFromAvg: number | null;
}

export interface ComparisonRow {
  id: string;
  kind: ResultKind;
  myVehicle: MyVehicle | null;
  competitorVehicle: CompetitorVehicle | null;
  score: ScoreBreakdown;
  status: MatchStatus;
  winner: WinnerKind;
  priceDiff: number | null; // competitor - me (positivo = você está mais barato)
  market: MarketPriceInfo;
}

export interface ComparisonSummary {
  totalMatches: number;
  meCheaper: number;
  competitorCheaper: number;
  ties: number;
  opportunities: number;
  differentials: number;
  totalSavings: number;
}

export interface ComparisonResult {
  rows: ComparisonRow[];
  summary: ComparisonSummary;
  competitorId: string;
  competitorName: string;
}

export interface ComparisonFilters {
  minScore?: number; // 0..100
  onlyMatches?: boolean;
  onlyOpportunities?: boolean;
  onlyDifferentials?: boolean;
  onlyMeCheaper?: boolean;
  onlyCompetitorCheaper?: boolean;
  search?: string;
}
