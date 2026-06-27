import { computePriceStats } from "../statistics/price-stats";
import type { CompetitorVehicle, MarketIndicators, MyVehicle } from "../types/analytics.types";

function pickExtreme<T extends { price: number | null }>(arr: T[], kind: "min" | "max"): T | null {
  const priced = arr.filter((v) => typeof v.price === "number") as Array<T & { price: number }>;
  if (!priced.length) return null;
  return priced.reduce((acc, cur) =>
    kind === "min" ? (cur.price < acc.price ? cur : acc) : cur.price > acc.price ? cur : acc,
  );
}

export const marketStatisticsService = {
  compute(mine: MyVehicle[], competitor: CompetitorVehicle[]): MarketIndicators {
    const mineStats = computePriceStats(mine.map((v) => v.price));
    const compStats = computePriceStats(competitor.map((v) => v.price));
    const avgPriceMine = mineStats.avg;
    const avgPriceCompetitor = compStats.avg;

    const potentialSavings =
      avgPriceMine !== null && avgPriceCompetitor !== null
        ? Math.max(0, avgPriceCompetitor - avgPriceMine) * mine.length
        : 0;

    return {
      cheapest: {
        mine: pickExtreme(mine, "min"),
        competitor: pickExtreme(competitor, "min"),
      },
      mostExpensive: {
        mine: pickExtreme(mine, "max"),
        competitor: pickExtreme(competitor, "max"),
      },
      avgPriceMine,
      avgPriceCompetitor,
      potentialSavings,
      avgPriceDiff:
        avgPriceMine !== null && avgPriceCompetitor !== null
          ? avgPriceCompetitor - avgPriceMine
          : null,
    };
  },
};
