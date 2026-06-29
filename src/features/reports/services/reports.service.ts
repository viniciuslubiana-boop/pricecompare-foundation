import { analyticsService } from "@/features/analytics";
import { comparisonStatisticsService } from "@/features/analytics/services/comparison-statistics.service";
import { analyticsRepository } from "@/features/analytics/repositories/analytics.repository";

export interface ReportSummary {
  summary: {
    totalMyVehicles: number;
    totalCompetitors: number;
    totalCompetitorVehicles: number;
    totalComparisons: number;
    differentials: number;
    opportunities: number;
  };
  comparison: {
    meCheaper: number;
    competitorCheaper: number;
    ties: number;
    unmatched: number;
    totalSavings: number | null;
  };
  competitiveness: { percent: number | null; level: string };
  market: { avgPriceDiff: number | null };
}

export const reportsService = {
  async buildSummary(baseCompanyId: string | null): Promise<ReportSummary> {
    const [executive, market, comparisons] = await Promise.all([
      analyticsService.getExecutiveSummary(baseCompanyId),
      analyticsService.getMarketIndicators(baseCompanyId),
      analyticsRepository.listComparisons(),
    ]);
    const cmp = comparisonStatisticsService.compute(comparisons);

    const percent =
      executive.totalComparisons > 0
        ? Math.round((executive.differentials / executive.totalComparisons) * 100)
        : null;
    const level =
      percent === null
        ? "Sem dados"
        : percent >= 70
          ? "Alta"
          : percent >= 40
            ? "Média"
            : "Baixa";

    const avgPriceDiff =
      market.avgPriceMine !== null && market.avgPriceCompetitor !== null
        ? market.avgPriceMine - market.avgPriceCompetitor
        : null;

    return {
      summary: {
        totalMyVehicles: executive.totalMyVehicles,
        totalCompetitors: executive.totalCompetitors,
        totalCompetitorVehicles: executive.totalCompetitorVehicles,
        totalComparisons: executive.totalComparisons,
        differentials: executive.differentials,
        opportunities: executive.opportunities,
      },
      comparison: {
        meCheaper: cmp.meCheaper,
        competitorCheaper: cmp.competitorCheaper,
        ties: cmp.ties,
        unmatched: cmp.unmatched,
        totalSavings: cmp.totalSavings,
      },
      competitiveness: { percent, level },
      market: { avgPriceDiff },
    };
  },
};
