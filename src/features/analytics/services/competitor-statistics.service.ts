import { buildRanking } from "../aggregators/ranking";
import { computePriceStats } from "../statistics/price-stats";
import type { Competitor, CompetitorStatistics, CompetitorVehicle } from "../types/analytics.types";

export const competitorStatisticsService = {
  compute(competitors: Competitor[], vehicles: CompetitorVehicle[]): CompetitorStatistics {
    return {
      totalCompetitors: competitors.length,
      totalVehicles: vehicles.length,
      byCompetitor: buildRanking(vehicles.map((v) => ({ key: v.competitor_name, price: v.price }))),
      byBrand: buildRanking(vehicles.map((v) => ({ key: v.brand, price: v.price }))),
      price: computePriceStats(vehicles.map((v) => v.price)),
    };
  },
};
