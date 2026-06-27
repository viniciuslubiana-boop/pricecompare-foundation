/**
 * Comparison Score — calcula a compatibilidade entre dois veículos.
 * Pesos: marca 40, modelo 30, ano 15, preço 10, km 5.
 */
import type {
  CompetitorVehicle,
  MyVehicle,
  ScoreBreakdown,
} from "../types/comparison.types";

const norm = (s: string | null | undefined) =>
  (s ?? "").toString().trim().toLowerCase();

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(norm(a).split(/\s+/).filter(Boolean));
  const tb = new Set(norm(b).split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  return inter / Math.max(ta.size, tb.size);
}

function parseYear(input: string | null | undefined): number | null {
  if (!input) return null;
  const m = String(input).match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

function brandScore(a: string, b: string): number {
  if (!a || !b) return 0;
  return norm(a) === norm(b) ? 40 : 0;
}

function modelScore(a: string, b: string): number {
  const ratio = tokenOverlap(a, b);
  return Math.round(ratio * 30 * 100) / 100;
}

function yearScore(a: string | null, b: string | null): number {
  const ya = parseYear(a);
  const yb = parseYear(b);
  if (ya === null || yb === null) return 0;
  const diff = Math.abs(ya - yb);
  if (diff === 0) return 15;
  if (diff === 1) return 7.5;
  return 0;
}

function priceScore(a: number | null, b: number | null): number {
  if (!a || !b) return 0;
  const diff = Math.abs(a - b) / Math.max(a, b);
  if (diff <= 0.1) return 10;
  if (diff <= 0.2) return 5;
  return 0;
}

function kmScore(a: number | null, b: number | null): number {
  if (a === null || b === null) return 0;
  const denom = Math.max(a, b, 1);
  const diff = Math.abs(a - b) / denom;
  if (diff <= 0.2) return 5;
  if (diff <= 0.4) return 2.5;
  return 0;
}

export function computeScore(
  me: MyVehicle,
  comp: CompetitorVehicle,
): ScoreBreakdown {
  const brand = brandScore(me.brand, comp.brand);
  const model = modelScore(me.model, comp.model);
  const year = yearScore(me.year_model, comp.year_model);
  const price = priceScore(me.price ?? null, comp.price ?? null);
  const km = kmScore(me.km ?? null, comp.km ?? null);
  const total = Math.round(brand + model + year + price + km);
  return { brand, model, year, price, km, total };
}
