/**
 * Strategy Service — orquestra estoque + pool de mercado e produz o StrategyResult.
 * Toda a inteligência fica nos calculadores (Comparison + Analytics).
 */
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { comparisonDataRepository } from "../repositories/comparison.repository";
import {
  equivalentPricesFor,
  equivalentsFor,
  intelligenceFor,
} from "../calculators/comparison.market-price";
import { strategyFor, hasRecommendation } from "../calculators/comparison.strategy";
import { summarizeStrategy } from "@/features/analytics/calculators/strategy-summary";
import type {
  CompetitorVehicle,
  StrategyResult,
  StrategyRow,
} from "../types/comparison.types";

export const strategyService = {
  async run(opts?: { competitorName?: string }): Promise<StrategyResult> {
    const [mine, fullPool] = await Promise.all([
      vehicleRepository.list({}),
      comparisonDataRepository.listMarketPool(),
    ]);

    const pool: CompetitorVehicle[] = opts?.competitorName
      ? fullPool.filter((c) => c.competitor_name === opts.competitorName)
      : fullPool;

    const rows: StrategyRow[] = mine.map((me) => {
      const intel = intelligenceFor(me, pool);
      const prices = equivalentPricesFor(me, pool);
      const eq = equivalentsFor(me, pool);
      return { ...strategyFor(me, intel, prices), equivalents: eq };
    });

    const recommendedRows = rows.filter(hasRecommendation);
    const summary = summarizeStrategy(rows);

    const brands = Array.from(
      new Set(mine.map((v) => (v.brand ?? "").trim()).filter(Boolean)),
    ).sort();
    const competitors = Array.from(
      new Set(fullPool.map((c) => c.competitor_name).filter(Boolean) as string[]),
    ).sort();

    return { rows, recommendedRows, summary, brands, competitors };
  },
};
