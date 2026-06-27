import type { ComparisonFilters, ComparisonRow } from "../types/comparison.types";

export function applyComparisonFilters(
  rows: ComparisonRow[],
  filters: ComparisonFilters,
): ComparisonRow[] {
  const term = filters.search?.trim().toLowerCase() ?? "";
  return rows.filter((r) => {
    if (filters.onlyMatches && r.kind !== "match") return false;
    if (filters.onlyOpportunities && r.kind !== "opportunity") return false;
    if (filters.onlyDifferentials && r.kind !== "differential") return false;
    if (filters.onlyMeCheaper && r.winner !== "me") return false;
    if (filters.onlyCompetitorCheaper && r.winner !== "competitor") return false;
    if (typeof filters.minScore === "number" && r.score.total < filters.minScore) return false;
    if (term) {
      const haystack = [
        r.myVehicle?.brand,
        r.myVehicle?.model,
        r.competitorVehicle?.brand,
        r.competitorVehicle?.model,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}
