/**
 * Winner Engine + Summary calculations.
 */
import type { ComparisonRow, ComparisonSummary, WinnerKind } from "../types/comparison.types";

const TIE_TOLERANCE = 0.02; // 2%

export function decideWinner(
  myPrice: number | null | undefined,
  compPrice: number | null | undefined,
): { winner: WinnerKind; diff: number | null } {
  if (!myPrice || !compPrice) return { winner: "unmatched", diff: null };
  const avg = (myPrice + compPrice) / 2;
  const diff = compPrice - myPrice; // positivo = você é mais barato
  if (Math.abs(diff) / avg <= TIE_TOLERANCE) return { winner: "tie", diff };
  return { winner: diff > 0 ? "me" : "competitor", diff };
}

export function summarize(rows: ComparisonRow[]): ComparisonSummary {
  let meCheaper = 0;
  let competitorCheaper = 0;
  let ties = 0;
  let opportunities = 0;
  let differentials = 0;
  let totalSavings = 0;
  let totalMatches = 0;

  // Intelligence aggregates — calculados sobre linhas com myVehicle (estoque)
  let totalCompared = 0;
  let bestPriceCount = 0;
  let aboveMarketCount = 0;
  let competitivenessSum = 0;
  let competitivenessCount = 0;
  let biggestOpportunityValue = 0;
  let biggestOpportunityLabel: string | null = null;

  for (const r of rows) {
    if (r.kind === "opportunity") opportunities++;
    else if (r.kind === "differential") differentials++;
    else if (r.kind === "match") {
      totalMatches++;
      if (r.winner === "me") {
        meCheaper++;
        if (r.priceDiff && r.priceDiff > 0) totalSavings += r.priceDiff;
      } else if (r.winner === "competitor") {
        competitorCheaper++;
      } else if (r.winner === "tie") {
        ties++;
      }
    }

    // intelligence — qualquer linha do estoque conta
    if (r.myVehicle) {
      totalCompared++;
      const m = r.market;
      if (m.status === "best_price") bestPriceCount++;
      if (m.status === "above_market" || m.status === "far_above_market") aboveMarketCount++;
      if (m.competitorCount > 0) {
        competitivenessSum += m.competitiveness;
        competitivenessCount++;
      }
      if (m.action.kind === "reduce" && m.action.amount && m.action.amount > biggestOpportunityValue) {
        biggestOpportunityValue = m.action.amount;
        biggestOpportunityLabel = `${r.myVehicle.brand} ${r.myVehicle.model}`;
      }
    }
  }

  return {
    totalMatches,
    meCheaper,
    competitorCheaper,
    ties,
    opportunities,
    differentials,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalCompared,
    bestPriceCount,
    aboveMarketCount,
    avgCompetitiveness:
      competitivenessCount > 0 ? Math.round(competitivenessSum / competitivenessCount) : 0,
    biggestOpportunityValue: Math.round(biggestOpportunityValue * 100) / 100,
    biggestOpportunityLabel,
  };
}
