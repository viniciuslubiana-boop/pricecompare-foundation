/**
 * Market Changes Analytics — agregações e indicadores sobre alterações
 * detectadas no mercado. Lógica pura, sem cálculo na UI.
 */
import type { MarketChangeRow } from "@/features/market-update/types";

export interface MarketChangesSummary {
  total: number;
  newVehicles: number;
  removed: number;
  priceReduced: number;
  priceIncreased: number;
  kmChanged: number;
  totalCompetitors: number;
  averagePriceDiffPct: number; // valor absoluto médio das variações de preço
}

export function summarizeChanges(rows: MarketChangeRow[]): MarketChangesSummary {
  const competitors = new Set<string>();
  let total = 0;
  let newVehicles = 0;
  let removed = 0;
  let priceReduced = 0;
  let priceIncreased = 0;
  let kmChanged = 0;
  let pctSum = 0;
  let pctCount = 0;

  for (const r of rows) {
    total++;
    if (r.competitor_name) competitors.add(r.competitor_name);
    if (r.change_type === "new") newVehicles++;
    else if (r.change_type === "removed") removed++;
    else if (r.change_type === "price") {
      if ((r.price_diff ?? 0) < 0) priceReduced++;
      else if ((r.price_diff ?? 0) > 0) priceIncreased++;
      if (r.price_diff_pct != null) {
        pctSum += Math.abs(r.price_diff_pct);
        pctCount++;
      }
    } else if (r.change_type === "km") kmChanged++;
  }

  return {
    total,
    newVehicles,
    removed,
    priceReduced,
    priceIncreased,
    kmChanged,
    totalCompetitors: competitors.size,
    averagePriceDiffPct: pctCount ? pctSum / pctCount : 0,
  };
}

export interface ChangeFilters {
  competitorName?: string | null;
  onlyNew?: boolean;
  onlyRemoved?: boolean;
  onlyPrice?: boolean;
  minPctAbs?: number | null; // ex: 2 => |%| ≥ 2
}

export function applyChangeFilters(
  rows: MarketChangeRow[],
  filters: ChangeFilters,
): MarketChangeRow[] {
  return rows.filter((r) => {
    if (filters.competitorName && r.competitor_name !== filters.competitorName) return false;
    if (filters.onlyNew && r.change_type !== "new") return false;
    if (filters.onlyRemoved && r.change_type !== "removed") return false;
    if (filters.onlyPrice && r.change_type !== "price") return false;
    if (
      filters.minPctAbs != null &&
      filters.minPctAbs > 0 &&
      (r.change_type !== "price" ||
        r.price_diff_pct == null ||
        Math.abs(r.price_diff_pct) < filters.minPctAbs)
    ) {
      return false;
    }
    return true;
  });
}
