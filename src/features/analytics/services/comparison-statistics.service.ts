import type { Comparison, ComparisonStatistics } from "../types/analytics.types";

export const comparisonStatisticsService = {
  compute(comparisons: Comparison[]): ComparisonStatistics {
    let me = 0;
    let comp = 0;
    let tie = 0;
    let unmatched = 0;
    let savings = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    let diffSum = 0;
    let diffCount = 0;

    for (const c of comparisons) {
      switch (c.winner) {
        case "me":
          me += 1;
          break;
        case "competitor":
          comp += 1;
          break;
        case "tie":
          tie += 1;
          break;
        default:
          unmatched += 1;
      }
      if (typeof c.savings === "number") {
        savings += c.savings;
        diffSum += c.savings;
        diffCount += 1;
      }
      if (typeof c.compatibility_score === "number") {
        scoreSum += c.compatibility_score;
        scoreCount += 1;
      }
    }

    return {
      total: comparisons.length,
      meCheaper: me,
      competitorCheaper: comp,
      ties: tie,
      unmatched,
      totalSavings: savings,
      avgScore: scoreCount ? scoreSum / scoreCount : null,
      avgDiff: diffCount ? diffSum / diffCount : null,
    };
  },
};
