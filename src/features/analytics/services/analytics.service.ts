import { analyticsRepository } from "../repositories/analytics.repository";
import { computePriceDistribution } from "../calculators/price-distribution";
import { buildRanking } from "../aggregators/ranking";
import { comparisonStatisticsService } from "./comparison-statistics.service";
import { competitorStatisticsService } from "./competitor-statistics.service";
import { inventoryStatisticsService } from "./inventory-statistics.service";
import { marketStatisticsService } from "./market-statistics.service";
import type {
  Comparison,
  Competitor,
  CompetitorVehicle,
  ExecutiveSummary,
  MarketIndicators,
  MyVehicle,
  PriceDistribution,
  RankingDimension,
  RankingEntry,
} from "../types/analytics.types";

interface AnalyticsSnapshot {
  myVehicles: MyVehicle[];
  competitorVehicles: CompetitorVehicle[];
  competitors: Competitor[];
  comparisons: Comparison[];
}

async function loadSnapshot(baseCompanyId?: string | null): Promise<AnalyticsSnapshot> {
  const [myVehicles, competitorVehicles, competitors, comparisons] = await Promise.all([
    analyticsRepository.listMyVehicles(baseCompanyId),
    analyticsRepository.listCompetitorVehicles(),
    analyticsRepository.listCompetitors(),
    analyticsRepository.listComparisons(),
  ]);
  return { myVehicles, competitorVehicles, competitors, comparisons };
}

export const analyticsService = {
  loadSnapshot,

  async getExecutiveSummary(baseCompanyId?: string | null): Promise<ExecutiveSummary> {
    const snap = await loadSnapshot(baseCompanyId);
    const inv = inventoryStatisticsService.compute(snap.myVehicles);
    const comp = competitorStatisticsService.compute(snap.competitors, snap.competitorVehicles);
    const cmp = comparisonStatisticsService.compute(snap.comparisons);
    const market = marketStatisticsService.compute(snap.myVehicles, snap.competitorVehicles);
    return {
      totalMyVehicles: inv.total,
      totalCompetitorVehicles: comp.totalVehicles,
      totalCompetitors: comp.totalCompetitors,
      totalComparisons: cmp.total,
      opportunities: cmp.competitorCheaper,
      differentials: cmp.meCheaper,
      potentialSavings: market.potentialSavings,
      avgPriceMine: market.avgPriceMine,
      avgPriceCompetitor: market.avgPriceCompetitor,
    };
  },

  async getInventoryStatistics(baseCompanyId?: string | null) {
    const vehicles = await analyticsRepository.listMyVehicles(baseCompanyId);
    return inventoryStatisticsService.compute(vehicles);
  },

  async getCompetitorStatistics() {
    const [competitors, vehicles] = await Promise.all([
      analyticsRepository.listCompetitors(),
      analyticsRepository.listCompetitorVehicles(),
    ]);
    return competitorStatisticsService.compute(competitors, vehicles);
  },

  async getMarketIndicators(baseCompanyId?: string | null): Promise<MarketIndicators> {
    const [mine, competitor] = await Promise.all([
      analyticsRepository.listMyVehicles(baseCompanyId),
      analyticsRepository.listCompetitorVehicles(),
    ]);
    return marketStatisticsService.compute(mine, competitor);
  },

  async getPriceDistribution(baseCompanyId?: string | null): Promise<PriceDistribution> {
    const [mine, competitor] = await Promise.all([
      analyticsRepository.listMyVehicles(baseCompanyId),
      analyticsRepository.listCompetitorVehicles(),
    ]);
    return computePriceDistribution(mine, competitor);
  },

  async getRanking(dimension: RankingDimension, limit = 10): Promise<RankingEntry[]> {
    const snap = await loadSnapshot();
    switch (dimension) {
      case "brand-mine":
        return buildRanking(
          snap.myVehicles.map((v) => ({ key: v.brand, price: v.price })),
          limit,
        );
      case "brand-competitor":
        return buildRanking(
          snap.competitorVehicles.map((v) => ({ key: v.brand, price: v.price })),
          limit,
        );
      case "competitor":
        return buildRanking(
          snap.competitorVehicles.map((v) => ({
            key: v.competitor_name,
            price: v.price,
          })),
          limit,
        );
      case "source":
        return buildRanking(
          snap.myVehicles.map((v) => ({ key: v.source, price: v.price })),
          limit,
        );
    }
  },
};
