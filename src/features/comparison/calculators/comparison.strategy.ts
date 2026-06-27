/**
 * Estratégia de Preço — derivações puras sobre MarketIntelligence.
 *
 * - Simulador de Posição: cenários de -R$ 500 / -R$ 1.000 / -R$ 1.500 e
 *   valor necessário para alcançar o menor preço do mercado.
 * - Recomendação Comercial: uma única recomendação por veículo.
 *
 * Toda a regra vive aqui. UI apenas exibe.
 */
import type {
  MarketIntelligence,
  MyVehicle,
  PriceScenario,
  StrategyRecommendation,
  StrategyRow,
} from "../types/comparison.types";

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtBRL = (n: number) => Math.round(n).toLocaleString("pt-BR");

/** Recalcula a posição (1 = mais barato) considerando um novo preço meu. */
function rankAt(newPrice: number, marketPrices: number[]): number {
  const cheaper = marketPrices.filter((p) => p < newPrice).length;
  return cheaper + 1;
}

function buildScenario(
  id: PriceScenario["id"],
  label: string,
  reduction: number,
  myPrice: number,
  marketPrices: number[],
  currentRank: number | null,
  applicable: boolean,
): PriceScenario {
  const newPrice = Math.max(0, myPrice - reduction);
  const newRank = applicable ? rankAt(newPrice, marketPrices) : null;
  const positionsGained =
    applicable && currentRank != null && newRank != null ? Math.max(0, currentRank - newRank) : 0;
  return {
    id,
    label,
    reduction: round2(reduction),
    newPrice: round2(newPrice),
    newRank,
    totalRanked: marketPrices.length + 1,
    positionsGained,
    becomesBestPrice: applicable && newRank === 1,
    applicable,
  };
}

export function simulateScenarios(intel: MarketIntelligence): PriceScenario[] {
  const myPrice = intel.myPrice ?? 0;
  const marketPrices: number[] = [];

  // Reconstrói lista de preços compatível com a contagem do mercado: usamos
  // min/avg/max/count para gerar um conjunto sintético consistente com o
  // ranking (cheaperCount = rank - 1). Para cenários, basta saber quantos
  // preços ficam abaixo de um novo valor — o cálculo é exato quando
  // operamos apenas com min e count e usamos a aproximação min para todos
  // abaixo do meu preço atual. Como o serviço passa o pool real, usamos
  // marketPrices reais via segunda assinatura abaixo. Esta função é mantida
  // como fallback puro caso só haja MarketIntelligence agregado.
  if (intel.min != null && intel.competitorCount > 0) {
    for (let i = 0; i < intel.competitorCount; i++) marketPrices.push(intel.min);
  }

  const hasMarket = intel.competitorCount > 0 && myPrice > 0 && intel.min != null;
  const rank = intel.rankPosition;

  const reductions: Array<{ id: PriceScenario["id"]; label: string; r: number; ok: boolean }> = [
    { id: "reduce_500", label: "Redução de R$ 500", r: 500, ok: hasMarket && myPrice > 500 },
    { id: "reduce_1000", label: "Redução de R$ 1.000", r: 1000, ok: hasMarket && myPrice > 1000 },
    { id: "reduce_1500", label: "Redução de R$ 1.500", r: 1500, ok: hasMarket && myPrice > 1500 },
  ];

  const scenarios = reductions.map((s) =>
    buildScenario(s.id, s.label, s.r, myPrice, marketPrices, rank, s.ok),
  );

  // Cenário 4: alcançar menor preço (ficar 1 real abaixo do mínimo)
  const min = intel.min ?? 0;
  const needToReachMin = hasMarket && myPrice > min ? round2(myPrice - min + 1) : 0;
  scenarios.push(
    buildScenario(
      "reach_min",
      "Alcançar menor preço",
      needToReachMin,
      myPrice,
      marketPrices,
      rank,
      hasMarket && needToReachMin > 0,
    ),
  );

  return scenarios;
}

/** Versão que usa o pool real de preços (precisa quando o serviço o fornece). */
export function simulateScenariosWithPrices(
  intel: MarketIntelligence,
  marketPrices: number[],
): PriceScenario[] {
  const myPrice = intel.myPrice ?? 0;
  const hasMarket = marketPrices.length > 0 && myPrice > 0 && intel.min != null;
  const rank = intel.rankPosition;

  const reductions: Array<{ id: PriceScenario["id"]; label: string; r: number; ok: boolean }> = [
    { id: "reduce_500", label: "Redução de R$ 500", r: 500, ok: hasMarket && myPrice > 500 },
    { id: "reduce_1000", label: "Redução de R$ 1.000", r: 1000, ok: hasMarket && myPrice > 1000 },
    { id: "reduce_1500", label: "Redução de R$ 1.500", r: 1500, ok: hasMarket && myPrice > 1500 },
  ];

  const scenarios = reductions.map((s) =>
    buildScenario(s.id, s.label, s.r, myPrice, marketPrices, rank, s.ok),
  );

  const min = intel.min ?? 0;
  const needToReachMin = hasMarket && myPrice > min ? round2(myPrice - min + 1) : 0;
  scenarios.push(
    buildScenario(
      "reach_min",
      "Alcançar menor preço",
      needToReachMin,
      myPrice,
      marketPrices,
      rank,
      hasMarket && needToReachMin > 0,
    ),
  );

  return scenarios;
}

export function recommendationFor(intel: MarketIntelligence): StrategyRecommendation {
  if (intel.competitorCount === 0 || intel.myPrice == null || intel.min == null) {
    return {
      kind: "insufficient_data",
      label: "Não há dados suficientes",
      amount: null,
      impact: "Cadastre concorrentes equivalentes para gerar uma recomendação.",
    };
  }
  if (intel.status === "best_price") {
    return {
      kind: "excellent_position",
      label: "Excelente posição",
      amount: null,
      impact: "Você possui o menor preço do mercado para este veículo.",
    };
  }
  if (intel.status === "competitive" || intel.status === "very_competitive") {
    return {
      kind: "keep",
      label: "Manter preço",
      amount: null,
      impact: `Competitividade ${intel.competitiveness}% — alinhado ao mercado.`,
    };
  }
  // above_market / far_above_market → reduzir mirando 2% acima do mínimo
  const target = intel.min * 1.02;
  const reduction = Math.max(0, intel.myPrice - target);
  if (reduction <= 0) {
    return {
      kind: "keep",
      label: "Manter preço",
      amount: null,
      impact: "Preço já alinhado ao alvo de mercado.",
    };
  }
  return {
    kind: "reduce",
    label: `Reduzir R$ ${fmtBRL(reduction)}`,
    amount: round2(reduction),
    impact: `Aproxima do menor preço (R$ ${fmtBRL(intel.min)}) e melhora a competitividade.`,
  };
}

/** Produz a linha completa de Estratégia para um veículo. */
export function strategyFor(
  me: MyVehicle,
  intel: MarketIntelligence,
  marketPrices: number[],
): StrategyRow {
  const scenarios = simulateScenariosWithPrices(intel, marketPrices);
  const recommendation = recommendationFor(intel);
  const maxImpact = scenarios.reduce(
    (acc, s) => (s.applicable && s.reduction > acc ? s.reduction : acc),
    0,
  );
  return {
    id: `strategy-${me.id}`,
    myVehicle: me,
    market: intel,
    scenarios,
    recommendation,
    maxImpact: round2(maxImpact),
  };
}

/** Uma linha possui recomendação se não for "insufficient_data". */
export function hasRecommendation(row: StrategyRow): boolean {
  return row.recommendation.kind !== "insufficient_data";
}
