/**
 * Market Intelligence Engine — para cada veículo do estoque, calcula
 * todas as métricas de mercado: min/max/avg, contagem, ranking, diffs,
 * competitividade, status comercial e ação recomendada.
 *
 * Toda a inteligência de comparação vive aqui. A UI apenas exibe.
 */
import type {
  CommercialStatus,
  CompetitorVehicle,
  MarketIntelligence,
  MyVehicle,
  RecommendedAction,
} from "../types/comparison.types";

const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toLowerCase();

function firstToken(model: string): string {
  return norm(model).split(/\s+/)[0] ?? "";
}

function sameYear(a: string | null, b: string | null): boolean {
  const ya = a?.match(/\d{4}/)?.[0];
  const yb = b?.match(/\d{4}/)?.[0];
  return !!ya && !!yb && ya === yb;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function equivalents(me: MyVehicle, pool: CompetitorVehicle[]): CompetitorVehicle[] {
  const meBrand = norm(me.brand);
  const meModelRoot = firstToken(me.model);
  return pool.filter(
    (c) =>
      norm(c.brand) === meBrand &&
      firstToken(c.model) === meModelRoot &&
      sameYear(c.year_model, me.year_model) &&
      typeof c.price === "number" &&
      (c.price as number) > 0,
  );
}

/** 0..100 — 100 quando me <= min; cai linearmente ~2 pp por 1% acima do menor. */
function computeCompetitiveness(myPrice: number | null, min: number | null): number {
  if (!myPrice || !min || min <= 0) return 0;
  if (myPrice <= min) return 100;
  const overshoot = (myPrice - min) / min; // ex.: 0.05 = 5% acima
  const score = 100 - overshoot * 100 * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeRank(myPrice: number | null, prices: number[]): number | null {
  if (!myPrice || prices.length === 0) return null;
  const cheaperOrEqual = prices.filter((p) => p < myPrice).length;
  return cheaperOrEqual + 1;
}

function computeStatus(
  myPrice: number | null,
  min: number | null,
  avg: number | null,
  competitorCount: number,
): CommercialStatus {
  if (!myPrice || !min || !avg || competitorCount === 0) return "insufficient_data";
  if (myPrice <= min) return "best_price";
  if (myPrice <= avg * 0.97) return "very_competitive";
  if (myPrice <= avg * 1.03) return "competitive";
  if (myPrice <= avg * 1.1) return "above_market";
  return "far_above_market";
}

function computeAction(
  myPrice: number | null,
  min: number | null,
  avg: number | null,
  status: CommercialStatus,
): RecommendedAction {
  if (status === "insufficient_data" || !myPrice || !min || !avg) {
    return { kind: "insufficient_data", label: "Sem concorrência suficiente", amount: null };
  }
  if (status === "best_price") {
    // Underpriced em relação à média → oportunidade de subir preço
    const room = avg - myPrice;
    if (room > 0 && room / avg >= 0.05) {
      return {
        kind: "excellent_opportunity",
        label: `Excelente oportunidade · pode subir até R$ ${Math.round(room).toLocaleString("pt-BR")}`,
        amount: round2(room),
      };
    }
    return { kind: "keep", label: "Manter preço", amount: null };
  }
  if (status === "very_competitive" || status === "competitive") {
    return { kind: "follow_market", label: "Acompanhar mercado", amount: null };
  }
  // above_market / far_above_market → reduzir para um pouco acima do menor preço (alvo: min * 1.02)
  const target = min * 1.02;
  const reduction = Math.max(0, myPrice - target);
  return {
    kind: "reduce",
    label: `Reduzir R$ ${Math.round(reduction).toLocaleString("pt-BR")}`,
    amount: round2(reduction),
  };
}

export function intelligenceFor(me: MyVehicle, pool: CompetitorVehicle[]): MarketIntelligence {
  const myPrice = me.price ?? null;
  const eq = equivalents(me, pool);
  const prices = eq.map((c) => c.price as number);

  if (prices.length === 0) {
    return {
      min: null,
      max: null,
      avg: null,
      myPrice,
      competitorCount: 0,
      rankPosition: null,
      diffFromMin: null,
      diffFromAvg: null,
      competitiveness: 0,
      status: "insufficient_data",
      action: { kind: "insufficient_data", label: "Sem concorrência suficiente", amount: null },
    };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diffFromMin = myPrice != null ? myPrice - min : null;
  const diffFromAvg = myPrice != null ? myPrice - avg : null;
  const competitiveness = computeCompetitiveness(myPrice, min);
  const rankPosition = computeRank(myPrice, prices);
  const status = computeStatus(myPrice, min, avg, prices.length);
  const action = computeAction(myPrice, min, avg, status);

  return {
    min,
    max,
    avg: round2(avg),
    myPrice,
    competitorCount: prices.length,
    rankPosition,
    diffFromMin: diffFromMin != null ? round2(diffFromMin) : null,
    diffFromAvg: diffFromAvg != null ? round2(diffFromAvg) : null,
    competitiveness,
    status,
    action,
  };
}

export function emptyIntelligence(myPrice: number | null = null): MarketIntelligence {
  return {
    min: null,
    max: null,
    avg: null,
    myPrice,
    competitorCount: 0,
    rankPosition: null,
    diffFromMin: null,
    diffFromAvg: null,
    competitiveness: 0,
    status: "insufficient_data",
    action: { kind: "insufficient_data", label: "Sem concorrência suficiente", amount: null },
  };
}

/** Compat: nome antigo usado pelo service. */
export const marketPriceFor = intelligenceFor;

/** Retorna os preços dos veículos equivalentes no pool informado. */
export function equivalentPricesFor(me: MyVehicle, pool: CompetitorVehicle[]): number[] {
  return equivalents(me, pool).map((c) => c.price as number);
}
