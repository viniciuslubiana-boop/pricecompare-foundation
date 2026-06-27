import { buildRanking } from "../aggregators/ranking";
import { computePriceStats } from "../statistics/price-stats";
import type { InventoryStatistics, MyVehicle } from "../types/analytics.types";

export const inventoryStatisticsService = {
  compute(vehicles: MyVehicle[]): InventoryStatistics {
    return {
      total: vehicles.length,
      byBrand: buildRanking(vehicles.map((v) => ({ key: v.brand, price: v.price }))),
      bySource: buildRanking(vehicles.map((v) => ({ key: v.source, price: v.price }))),
      price: computePriceStats(vehicles.map((v) => v.price)),
      km: computePriceStats(vehicles.map((v) => v.km)),
    };
  },
};
