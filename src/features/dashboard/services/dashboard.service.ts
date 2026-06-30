/**
 * Dashboard Service — Camada única de agregação do Dashboard Executivo.
 *
 * Fachada sobre os Engines existentes (Analytics, Comparison, Inventory,
 * Competitor). A tela do Dashboard NÃO deve consultar Supabase nem calcular
 * KPIs — apenas consumir este service via useDashboardData.
 */
import {
  analyticsService,
  competitorStatisticsService,
  comparisonStatisticsService,
  inventoryStatisticsService,
  marketStatisticsService,
} from "@/features/analytics";
import { computePriceDistribution } from "@/features/analytics/calculators/price-distribution";

import { buildInsights, deriveCompetitiveness } from "./dashboard.derive";

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

async function loadDashboard(baseCompanyId?: string | null) {
  const snap = await analyticsService.loadSnapshot(baseCompanyId);
  const inventory = inventoryStatisticsService.compute(snap.myVehicles);
  const competitors = competitorStatisticsService.compute(
    snap.competitors,
    snap.competitorVehicles,
  );
  const comparison = comparisonStatisticsService.compute(snap.comparisons);
  const market = marketStatisticsService.compute(snap.myVehicles, snap.competitorVehicles);
  const distribution = computePriceDistribution(snap.myVehicles, snap.competitorVehicles);
  const competitiveness = deriveCompetitiveness(comparison);

  const summary = {
    totalMyVehicles: inventory.total,
    totalCompetitorVehicles: competitors.totalVehicles,
    totalCompetitors: competitors.totalCompetitors,
    totalComparisons: comparison.total,
    opportunities: comparison.competitorCheaper,
    differentials: comparison.meCheaper,
    potentialSavings: market.potentialSavings,
    avgPriceMine: market.avgPriceMine,
    avgPriceCompetitor: market.avgPriceCompetitor,
  };

  const insights = buildInsights({ summary, inventory, market, competitiveness });

  return {
    summary,
    inventory,
    competitors,
    comparison,
    market,
    distribution,
    competitiveness,
    insights,
  };
}

export const dashboardService = {
  /** Agregação completa consumida pelo Dashboard Executivo. */
  getDashboardSummary: (baseCompanyId?: string | null) => loadDashboard(baseCompanyId),
  /** Métricas de mercado (preços médios, savings, deltas). */
  getMarketOverview: async (baseCompanyId?: string | null) =>
    (await loadDashboard(baseCompanyId)).market,
  /** Métricas escopadas a uma Empresa Base específica. */
  getBaseCompanyMetrics: (baseCompanyId: string) => loadDashboard(baseCompanyId),
  /** Estatísticas de concorrentes monitorados. */
  getCompetitorMetrics: async () => (await loadDashboard(null)).competitors,
  /** Estatísticas do estoque próprio. */
  getInventoryMetrics: async (baseCompanyId?: string | null) =>
    (await loadDashboard(baseCompanyId)).inventory,
  /** Estatísticas de comparações (matches, vitórias, empates). */
  getComparisonMetrics: async (baseCompanyId?: string | null) =>
    (await loadDashboard(baseCompanyId)).comparison,
};
