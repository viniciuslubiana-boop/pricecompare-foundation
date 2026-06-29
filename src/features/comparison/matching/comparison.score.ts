/**
 * Comparison Score — confiabilidade entre dois veículos.
 *
 * Gating obrigatório (PCM_BUSINESS_RULES.md):
 *   - Marca, modelo e ano precisam ser EXATAMENTE iguais. Sem isso, total = 0.
 *
 * O breakdown legado (brand/model/year/price/km) é mantido para a UI;
 * `total` agora é equivalente ao Match Score (0..100).
 */
import type { CompetitorVehicle, MyVehicle, ScoreBreakdown } from "../types/comparison.types";
import { evaluateEquivalence, prepareVehicle } from "./vehicle-equivalence";

function priceCloseness(a: number | null, b: number | null): number {
  if (!a || !b) return 0;
  const diff = Math.abs(a - b) / Math.max(a, b);
  if (diff <= 0.1) return 10;
  if (diff <= 0.2) return 5;
  return 0;
}

function kmCloseness(a: number | null, b: number | null): number {
  if (a === null || b === null) return 0;
  const denom = Math.max(a, b, 1);
  const diff = Math.abs(a - b) / denom;
  if (diff <= 0.2) return 5;
  if (diff <= 0.4) return 2.5;
  return 0;
}

export function computeScore(me: MyVehicle, comp: CompetitorVehicle): ScoreBreakdown {
  const result = evaluateEquivalence(me, comp);
  if (!result.equivalent) {
    return { brand: 0, model: 0, year: 0, price: 0, km: 0, total: 0 };
  }
  const a = prepareVehicle(me);
  const b = prepareVehicle(comp);
  const brand = a.brand === b.brand ? 40 : 0;
  const model = a.modelCompact === b.modelCompact ? 30 : 0;
  const year = a.year && b.year && a.year === b.year ? 15 : 0;
  const price = priceCloseness(me.price ?? null, comp.price ?? null);
  const km = kmCloseness(me.km ?? null, comp.km ?? null);
  // total = Match Score da equivalência (100/95/80). price/km não influenciam o gate.
  return { brand, model, year, price, km, total: result.confidence };
}
