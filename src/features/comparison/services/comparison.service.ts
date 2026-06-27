/**
 * Comparison Service — orquestra Inventory + Competitor data,
 * Matcher, Winner, Market Price e Summary. Único ponto de entrada
 * para qualquer tela ou rotina que precise comparar preços.
 */
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { competitorRepository } from "@/repositories/competitor.repository";
import {
  comparisonDataRepository,
  comparisonRepository,
} from "../repositories/comparison.repository";
import {
  matchInventoryAgainstCompetitor,
  statusFromScore,
} from "../matching/comparison.matcher";
import { decideWinner, summarize } from "../calculators/comparison.summary";
import { marketPriceFor } from "../calculators/comparison.market-price";
import type {
  ComparisonResult,
  ComparisonRow,
  ScoreBreakdown,
} from "../types/comparison.types";

function emptyScore(): ScoreBreakdown {
  return { brand: 0, model: 0, year: 0, price: 0, km: 0, total: 0 };
}

export const comparisonService = {
  async run(competitorId: string): Promise<ComparisonResult> {
    const all = await competitorRepository.list({});
    const target = all.find((c) => c.id === competitorId);
    if (!target) throw new Error("Concorrente não encontrado.");


    const [mine, compVehicles] = await Promise.all([
      vehicleRepository.list({}),
      comparisonDataRepository.listCompetitorVehiclesByName(target.name),
    ]);

    const { matches, unmatchedMine, opportunities } =
      matchInventoryAgainstCompetitor(mine, compVehicles);

    const rows: ComparisonRow[] = [];

    for (const m of matches) {
      const { winner, diff } = decideWinner(
        m.myVehicle.price ?? null,
        m.competitorVehicle.price ?? null,
      );
      rows.push({
        id: `match-${m.myVehicle.id}-${m.competitorVehicle.id}`,
        kind: "match",
        myVehicle: m.myVehicle,
        competitorVehicle: m.competitorVehicle,
        score: m.score,
        status: m.status,
        winner,
        priceDiff: diff,
        market: marketPriceFor(m.myVehicle, compVehicles),
      });
    }

    for (const v of unmatchedMine) {
      rows.push({
        id: `diff-${v.id}`,
        kind: "differential",
        myVehicle: v,
        competitorVehicle: null,
        score: emptyScore(),
        status: "none",
        winner: "unmatched",
        priceDiff: null,
        market: marketPriceFor(v, compVehicles),
      });
    }

    for (const c of opportunities) {
      rows.push({
        id: `opp-${c.id}`,
        kind: "opportunity",
        myVehicle: null,
        competitorVehicle: c,
        score: emptyScore(),
        status: "none",
        winner: "unmatched",
        priceDiff: null,
        market: { min: null, max: null, avg: null, myPrice: null, diffFromAvg: null },
      });
    }

    return {
      rows,
      summary: summarize(rows),
      competitorId,
      competitorName: target.name,
    };
  },

  /** Persiste cada match (com par my/competitor) em `comparisons`. */
  async save(result: ComparisonResult) {
    const payloads = result.rows
      .filter((r) => r.kind === "match" && r.myVehicle && r.competitorVehicle)
      .map((r) => ({
        my_vehicle_id: r.myVehicle!.id,
        competitor_vehicle_id: r.competitorVehicle!.id,
        compatibility_score: r.score.total,
        winner: r.winner,
        savings: r.winner === "me" ? r.priceDiff : null,
      }));

    const saved = await Promise.all(
      payloads.map((p) => comparisonRepository.create(p)),
    );
    return saved.length;
  },

  // re-exports úteis para a UI sem expor lógica
  statusFromScore,
};
