/**
 * Radar Service — orquestra estoque + pool de mercado e produz o RadarResult.
 * Toda a inteligência fica nos calculadores (Comparison + Analytics).
 */
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { comparisonDataRepository } from "../repositories/comparison.repository";
import { equivalentsFor, intelligenceFor } from "../calculators/comparison.market-price";
import {
  priorityFor,
  radarActionFor,
} from "../calculators/radar";
import { summarizeRadar } from "@/features/analytics/calculators/radar-summary";
import type {
  CompetitorVehicle,
  RadarResult,
  RadarRow,
} from "../types/comparison.types";

export const radarService = {
  async run(opts?: { competitorName?: string }): Promise<RadarResult> {
    const [mine, fullPool] = await Promise.all([
      vehicleRepository.list({}),
      comparisonDataRepository.listMarketPool(),
    ]);

    // Pool efetivo: se um concorrente foi escolhido, restringe;
    // caso contrário usa todo o mercado.
    const pool: CompetitorVehicle[] = opts?.competitorName
      ? fullPool.filter((c) => c.competitor_name === opts.competitorName)
      : fullPool;

    const rows: RadarRow[] = mine.map((me) => {
      const eq = equivalentsFor(me, pool);
      const market = intelligenceFor(me, pool);
      const priority = priorityFor(market);
      const action = radarActionFor(market, priority);
      return {
        id: `radar-${me.id}`,
        myVehicle: me,
        market,
        priority,
        action,
        equivalents: eq,
      };
    });

    const actionableRows = rows.filter((r) => r.priority === "high" || r.priority === "medium");
    const summary = summarizeRadar(rows);

    const brands = Array.from(
      new Set(mine.map((v) => (v.brand ?? "").trim()).filter(Boolean)),
    ).sort();
    const competitors = Array.from(
      new Set(fullPool.map((c) => c.competitor_name).filter(Boolean) as string[]),
    ).sort();

    return { rows, actionableRows, summary, brands, competitors };
  },
};
