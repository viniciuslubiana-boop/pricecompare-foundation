import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";
import type { RankingDimension } from "../types/analytics.types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  summary: () => [...analyticsKeys.all, "summary"] as const,
  inventory: () => [...analyticsKeys.all, "inventory"] as const,
  competitors: () => [...analyticsKeys.all, "competitors"] as const,
  market: () => [...analyticsKeys.all, "market"] as const,
  distribution: () => [...analyticsKeys.all, "distribution"] as const,
  ranking: (dim: RankingDimension, limit: number) =>
    [...analyticsKeys.all, "ranking", dim, limit] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: () => analyticsService.getExecutiveSummary(),
  });
}

export function useInventoryStatistics() {
  return useQuery({
    queryKey: analyticsKeys.inventory(),
    queryFn: () => analyticsService.getInventoryStatistics(),
  });
}

export function useCompetitorStatistics() {
  return useQuery({
    queryKey: analyticsKeys.competitors(),
    queryFn: () => analyticsService.getCompetitorStatistics(),
  });
}

export function useMarketStatistics() {
  return useQuery({
    queryKey: analyticsKeys.market(),
    queryFn: () => analyticsService.getMarketIndicators(),
  });
}

export function usePriceDistribution() {
  return useQuery({
    queryKey: analyticsKeys.distribution(),
    queryFn: () => analyticsService.getPriceDistribution(),
  });
}

export function useRanking(dimension: RankingDimension, limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.ranking(dimension, limit),
    queryFn: () => analyticsService.getRanking(dimension, limit),
  });
}

export function useAnalytics() {
  const summary = useDashboardSummary();
  const market = useMarketStatistics();
  const distribution = usePriceDistribution();
  return { summary, market, distribution };
}
