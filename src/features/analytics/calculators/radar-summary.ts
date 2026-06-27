/**
 * Radar Summary — agregados puros sobre as linhas do Radar.
 * Vive no Analytics Engine. UI apenas exibe.
 */
import type { RadarRow, RadarSummary } from "@/features/comparison/types/comparison.types";

export function summarizeRadar(rows: RadarRow[]): RadarSummary {
  let totalActionable = 0;
  let highCount = 0;
  let mediumCount = 0;
  let bestPriceCount = 0;

  let biggestDiffValue = 0;
  let biggestDiffLabel: string | null = null;
  let biggestOpportunityValue = 0;
  let biggestOpportunityLabel: string | null = null;

  let compSum = 0;
  let compCount = 0;

  for (const r of rows) {
    if (r.priority === "high") highCount++;
    if (r.priority === "medium") mediumCount++;
    if (r.priority === "best_price") bestPriceCount++;
    if (r.priority === "high" || r.priority === "medium") totalActionable++;

    if (r.market.competitorCount > 0) {
      compSum += r.market.competitiveness;
      compCount++;
    }

    const diff = r.market.diffFromMin ?? 0;
    if (diff > biggestDiffValue) {
      biggestDiffValue = diff;
      biggestDiffLabel = `${r.myVehicle.brand} ${r.myVehicle.model}`;
    }

    if (r.action.kind === "reduce" && r.action.amount && r.action.amount > biggestOpportunityValue) {
      biggestOpportunityValue = r.action.amount;
      biggestOpportunityLabel = `${r.myVehicle.brand} ${r.myVehicle.model}`;
    }
  }

  return {
    totalActionable,
    highCount,
    mediumCount,
    bestPriceCount,
    biggestDiffValue: Math.round(biggestDiffValue * 100) / 100,
    biggestDiffLabel,
    biggestOpportunityValue: Math.round(biggestOpportunityValue * 100) / 100,
    biggestOpportunityLabel,
    avgCompetitiveness: compCount > 0 ? Math.round(compSum / compCount) : 0,
  };
}

export function applyRadarFilters<T extends RadarRow>(
  rows: T[],
  filters: {
    onlyHigh?: boolean;
    onlyMedium?: boolean;
    onlyBestPrice?: boolean;
    brand?: string;
    competitorName?: string;
    search?: string;
  },
): T[] {
  const term = filters.search?.trim().toLowerCase() ?? "";
  const anyToggle = filters.onlyHigh || filters.onlyMedium || filters.onlyBestPrice;

  return rows.filter((r) => {
    if (anyToggle) {
      const matchHigh = !!filters.onlyHigh && r.priority === "high";
      const matchMed = !!filters.onlyMedium && r.priority === "medium";
      const matchBest = !!filters.onlyBestPrice && r.priority === "best_price";
      if (!(matchHigh || matchMed || matchBest)) return false;
    }
    if (filters.brand && (r.myVehicle.brand ?? "").toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }
    if (term) {
      const hay = `${r.myVehicle.brand ?? ""} ${r.myVehicle.model ?? ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    // competitorName filter is applied at the service layer (requires market pool slice)
    return true;
  });
}
