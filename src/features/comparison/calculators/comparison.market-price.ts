/**
 * Market Price Engine — para cada veículo do estoque, calcula
 * min, max, média de preço e diferença em relação aos veículos
 * equivalentes (mesma marca + ano + token raiz do modelo) no pool.
 */
import type { CompetitorVehicle, MarketPriceInfo, MyVehicle } from "../types/comparison.types";

const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toLowerCase();

function firstToken(model: string): string {
  return norm(model).split(/\s+/)[0] ?? "";
}

function sameYear(a: string | null, b: string | null): boolean {
  const ya = a?.match(/\d{4}/)?.[0];
  const yb = b?.match(/\d{4}/)?.[0];
  return !!ya && !!yb && ya === yb;
}

export function marketPriceFor(me: MyVehicle, pool: CompetitorVehicle[]): MarketPriceInfo {
  const meBrand = norm(me.brand);
  const meModelRoot = firstToken(me.model);
  const equivalents = pool.filter(
    (c) =>
      norm(c.brand) === meBrand &&
      firstToken(c.model) === meModelRoot &&
      sameYear(c.year_model, me.year_model) &&
      typeof c.price === "number" &&
      c.price! > 0,
  );

  if (!equivalents.length) {
    return {
      min: null,
      max: null,
      avg: null,
      myPrice: me.price ?? null,
      diffFromAvg: null,
    };
  }

  const prices = equivalents.map((c) => c.price as number);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diffFromAvg = me.price ? me.price - avg : null;
  return {
    min,
    max,
    avg: Math.round(avg * 100) / 100,
    myPrice: me.price ?? null,
    diffFromAvg: diffFromAvg !== null ? Math.round(diffFromAvg * 100) / 100 : null,
  };
}
