import type {
  ComparisonStatistics,
  ExecutiveSummary,
  InventoryStatistics,
  MarketIndicators,
} from "@/features/analytics";

export type CompetitivenessLevel = "high" | "medium" | "low" | "unknown";

export interface CompetitivenessScore {
  percent: number | null;
  level: CompetitivenessLevel;
}

/**
 * Derives a 0..100 competitiveness percent from comparison stats.
 * Source of data: Analytics Engine only.
 */
export function deriveCompetitiveness(
  cmp: Pick<ComparisonStatistics, "meCheaper" | "competitorCheaper" | "ties" | "total">,
): CompetitivenessScore {
  const denom = cmp.meCheaper + cmp.competitorCheaper + cmp.ties;
  if (!denom) return { percent: null, level: "unknown" };
  const percent = ((cmp.meCheaper + cmp.ties * 0.5) / denom) * 100;
  const level: CompetitivenessLevel =
    percent >= 65 ? "high" : percent >= 40 ? "medium" : "low";
  return { percent, level };
}

export interface Insight {
  id: string;
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  description?: string;
}

export function buildInsights(args: {
  summary: ExecutiveSummary;
  inventory: InventoryStatistics;
  market: MarketIndicators;
  competitiveness: CompetitivenessScore;
}): Insight[] {
  const { summary, market, competitiveness } = args;
  const out: Insight[] = [];

  if (summary.totalMyVehicles > summary.totalCompetitorVehicles) {
    out.push({
      id: "inventory-leadership",
      tone: "success",
      title: "Você possui mais veículos que os concorrentes monitorados.",
    });
  } else if (
    summary.totalCompetitorVehicles > 0 &&
    summary.totalMyVehicles < summary.totalCompetitorVehicles
  ) {
    out.push({
      id: "inventory-behind",
      tone: "warning",
      title: "Concorrentes possuem mais veículos em estoque do que você.",
    });
  }

  if (summary.opportunities > 0) {
    out.push({
      id: "opportunities",
      tone: "info",
      title: `Existem ${summary.opportunities} oportunidades de mercado.`,
      description: "Veículos onde o concorrente está mais barato e você pode reagir.",
    });
  }

  if (
    market.avgPriceMine !== null &&
    market.avgPriceCompetitor !== null
  ) {
    if (market.avgPriceMine > market.avgPriceCompetitor) {
      out.push({
        id: "avg-above",
        tone: "warning",
        title: "Seu preço médio está acima da média do mercado.",
      });
    } else if (market.avgPriceMine < market.avgPriceCompetitor) {
      out.push({
        id: "avg-below",
        tone: "success",
        title: "Seu preço médio está abaixo da média do mercado.",
      });
    }
  }

  if (competitiveness.level === "high") {
    out.push({
      id: "competitiveness-high",
      tone: "success",
      title: "Sua competitividade está alta.",
    });
  } else if (competitiveness.level === "low") {
    out.push({
      id: "competitiveness-low",
      tone: "danger",
      title: "Sua competitividade está baixa.",
    });
  }

  return out;
}
