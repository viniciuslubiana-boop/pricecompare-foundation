/**
 * Strategy Summary — agregados + filtros puros sobre StrategyRow.
 * Vive no Analytics Engine. UI apenas exibe.
 */
import type {
  StrategyFilters,
  StrategyRow,
  StrategySummary,
} from "@/features/comparison/types/comparison.types";

export function summarizeStrategy(rows: StrategyRow[]): StrategySummary {
  let totalWithRecommendation = 0;
  let reduceCount = 0;
  let keepCount = 0;
  let excellentCount = 0;
  let totalSuggestedReduction = 0;
  let biggestOpportunityValue = 0;
  let biggestOpportunityLabel: string | null = null;
  let compSum = 0;
  let compCount = 0;

  for (const r of rows) {
    const kind = r.recommendation.kind;
    if (kind !== "insufficient_data") totalWithRecommendation++;
    if (kind === "reduce") {
      reduceCount++;
      const amt = r.recommendation.amount ?? 0;
      totalSuggestedReduction += amt;
      if (amt > biggestOpportunityValue) {
        biggestOpportunityValue = amt;
        biggestOpportunityLabel = `${r.myVehicle.brand} ${r.myVehicle.model}`;
      }
    }
    if (kind === "keep") keepCount++;
    if (kind === "excellent_position") excellentCount++;

    if (r.market.competitorCount > 0) {
      compSum += r.market.competitiveness;
      compCount++;
    }
  }

  return {
    totalWithRecommendation,
    reduceCount,
    keepCount,
    excellentCount,
    totalSuggestedReduction: Math.round(totalSuggestedReduction * 100) / 100,
    biggestOpportunityValue: Math.round(biggestOpportunityValue * 100) / 100,
    biggestOpportunityLabel,
    avgCompetitiveness: compCount > 0 ? Math.round(compSum / compCount) : 0,
  };
}

export function applyStrategyFilters<T extends StrategyRow>(
  rows: T[],
  filters: StrategyFilters,
): T[] {
  const term = filters.search?.trim().toLowerCase() ?? "";
  let out = rows.filter((r) => {
    if (filters.onlyReduce && r.recommendation.kind !== "reduce") return false;
    if (filters.brand && (r.myVehicle.brand ?? "").toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }
    if (term) {
      const hay = `${r.myVehicle.brand ?? ""} ${r.myVehicle.model ?? ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const sort = filters.sort ?? "none";
  if (sort === "max_impact") {
    out = [...out].sort((a, b) => b.maxImpact - a.maxImpact);
  } else if (sort === "suggested_reduction") {
    out = [...out].sort(
      (a, b) => (b.recommendation.amount ?? 0) - (a.recommendation.amount ?? 0),
    );
  } else if (sort === "best_opportunity") {
    // Maior oportunidade considerando redução vs ganho de posição
    out = [...out].sort((a, b) => {
      const aReach = a.scenarios.find((s) => s.id === "reach_min");
      const bReach = b.scenarios.find((s) => s.id === "reach_min");
      const aScore = (a.recommendation.amount ?? 0) + (aReach?.positionsGained ?? 0) * 100;
      const bScore = (b.recommendation.amount ?? 0) + (bReach?.positionsGained ?? 0) * 100;
      return bScore - aScore;
    });
  }
  return out;
}
