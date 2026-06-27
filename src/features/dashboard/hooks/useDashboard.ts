import { useQuery } from "@tanstack/react-query";
import {
  analyticsKeys,
  analyticsService,
  competitorStatisticsService,
  comparisonStatisticsService,
  inventoryStatisticsService,
  marketStatisticsService,
} from "@/features/analytics";
import { buildInsights, deriveCompetitiveness } from "../services/dashboard.derive";
import { computePriceDistribution } from "@/features/analytics/calculators/price-distribution";

export const dashboardKeys = {
  all: [...analyticsKeys.all, "dashboard"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: async () => {
      const snap = await analyticsService.loadSnapshot();
      const inventory = inventoryStatisticsService.compute(snap.myVehicles);
      const competitors = competitorStatisticsService.compute(
        snap.competitors,
        snap.competitorVehicles,
      );
      const comparison = comparisonStatisticsService.compute(snap.comparisons);
      const market = marketStatisticsService.compute(
        snap.myVehicles,
        snap.competitorVehicles,
      );
      const distribution = computePriceDistribution(
        snap.myVehicles,
        snap.competitorVehicles,
      );
      const competitiveness = deriveCompetitiveness(comparison);
      const summary = {
        totalMyVehicles: inventory.total,
        totalCompetitorVehicles: competitors.totalVehicles,
        totalCompetitors: competitors.totalCompetitors,
        totalComparisons: comparison.total,
        opportunities: comparison.competitorCheaper,
        differentials: comparison.meCheaper,
        potentialSavings: market.potentialSavings,
        avgPriceMine: market.avgPriceMine,
        avgPriceCompetitor: market.avgPriceCompetitor,
      };
      const insights = buildInsights({
        summary,
        inventory,
        market,
        competitiveness,
      });
      return {
        summary,
        inventory,
        competitors,
        comparison,
        market,
        distribution,
        competitiveness,
        insights,
      };
    },
    staleTime: 30_000,
  });
}
