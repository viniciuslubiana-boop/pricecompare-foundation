/**
 * Radar de Competitividade — derivações puras sobre MarketIntelligence.
 *
 * - Prioridade comercial (high | medium | low | best_price | none)
 * - Ação recomendada específica do radar (uma só por veículo)
 *
 * Toda a regra vive aqui. UI apenas exibe.
 */
import type {
  CommercialPriority,
  MarketIntelligence,
  RadarAction,
  RadarActionKind,
} from "../types/comparison.types";

const HIGH_DIFF_THRESHOLD = 3000; // R$
const COMP_LOW = 70;
const COMP_MED = 85;

export function priorityFor(intel: MarketIntelligence): CommercialPriority {
  if (intel.competitorCount === 0) return "none";
  if (intel.status === "best_price") return "best_price";

  const diffFromMin = intel.diffFromMin ?? 0;
  if (intel.competitiveness < COMP_LOW || diffFromMin > HIGH_DIFF_THRESHOLD) return "high";
  if (intel.competitiveness < COMP_MED) return "medium";
  return "low";
}

export function radarActionFor(
  intel: MarketIntelligence,
  priority: CommercialPriority,
): RadarAction {
  if (priority === "none") {
    return { kind: "insufficient_data", label: "Sem concorrência suficiente", amount: null };
  }
  if (priority === "best_price") {
    return { kind: "excellent_position", label: "Excelente posição", amount: null };
  }
  if (priority === "high") {
    const reduce = intel.action.kind === "reduce" ? (intel.action.amount ?? 0) : 0;
    if (reduce > 0) {
      return {
        kind: "reduce",
        label: `Reduzir R$ ${Math.round(reduce).toLocaleString("pt-BR")}`,
        amount: reduce,
      };
    }
    return { kind: "review_today", label: "Revisar preço hoje", amount: null };
  }
  if (priority === "medium") {
    return { kind: "follow_market", label: "Acompanhar mercado", amount: null };
  }
  return { kind: "keep", label: "Manter preço", amount: null };
}

const PRIORITY_RANK: Record<CommercialPriority, number> = {
  high: 0,
  medium: 1,
  best_price: 2,
  low: 3,
  none: 4,
};

export function comparePriority(a: CommercialPriority, b: CommercialPriority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}

/** Apenas prioridades acionáveis no painel principal (Alta e Média). */
export function isActionable(priority: CommercialPriority): boolean {
  return priority === "high" || priority === "medium";
}

/** Decide se um RadarActionKind sugere atenção hoje. */
export function requiresActionToday(kind: RadarActionKind): boolean {
  return kind === "review_today" || kind === "reduce";
}
