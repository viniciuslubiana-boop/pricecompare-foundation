import type { MyVehicle, CompetitorVehicle, Comparison, Competitor } from "@/types/database.types";

export type { MyVehicle, CompetitorVehicle, Comparison, Competitor };

export interface PriceStats {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  median: number | null;
  sum: number;
}

export interface RankingEntry {
  key: string;
  count: number;
  avgPrice: number | null;
}

export interface InventoryStatistics {
  total: number;
  byBrand: RankingEntry[];
  bySource: RankingEntry[];
  price: PriceStats;
  km: PriceStats;
}

export interface CompetitorStatistics {
  totalCompetitors: number;
  totalVehicles: number;
  byCompetitor: RankingEntry[];
  byBrand: RankingEntry[];
  price: PriceStats;
}

export interface ComparisonStatistics {
  total: number;
  meCheaper: number;
  competitorCheaper: number;
  ties: number;
  unmatched: number;
  totalSavings: number;
  avgScore: number | null;
  avgDiff: number | null;
}

export interface MarketIndicators {
  cheapest: { mine: MyVehicle | null; competitor: CompetitorVehicle | null };
  mostExpensive: {
    mine: MyVehicle | null;
    competitor: CompetitorVehicle | null;
  };
  avgPriceMine: number | null;
  avgPriceCompetitor: number | null;
  potentialSavings: number;
  avgPriceDiff: number | null;
}

export interface PriceBucket {
  label: string;
  min: number;
  max: number;
  mine: number;
  competitor: number;
}

export interface PriceDistribution {
  buckets: PriceBucket[];
}

export interface ExecutiveSummary {
  totalMyVehicles: number;
  totalCompetitorVehicles: number;
  totalCompetitors: number;
  totalComparisons: number;
  opportunities: number;
  differentials: number;
  potentialSavings: number;
  avgPriceMine: number | null;
  avgPriceCompetitor: number | null;
}

export type RankingDimension = "brand-mine" | "brand-competitor" | "competitor" | "source";
