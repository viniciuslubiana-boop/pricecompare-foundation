// Sprint 006 — Deduplicação de estoque sincronizado.
// Comparação tolerante para KM (±5%) e preço (±5%).

import type { NormalizedVehiclePreview } from "../types";

const KM_TOLERANCE = 0.05;
const PRICE_TOLERANCE = 0.05;

export interface ExistingVehicleLike {
  id: string;
  brand: string | null;
  model: string | null;
  year_model: string | null;
  km: number | null;
  price: number | string | null;
  source_url?: string | null;
}

function n(s: string | null | undefined): string {
  return (s ?? "").toString().trim().toLowerCase();
}

function within(a: number | null, b: number | null, tol: number): boolean {
  if (a == null || b == null) return a == null && b == null;
  if (a === 0 && b === 0) return true;
  const base = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) / base <= tol;
}

function priceNum(p: number | string | null): number | null {
  if (p == null) return null;
  const n = typeof p === "number" ? p : Number(p);
  return Number.isFinite(n) ? n : null;
}

export function findDuplicate(
  item: NormalizedVehiclePreview,
  existing: ExistingVehicleLike[],
  opts: { useSourceUrl?: boolean } = {},
): ExistingVehicleLike | null {
  for (const row of existing) {
    if (n(row.brand) !== n(item.brand)) continue;
    if (n(row.model) !== n(item.model)) continue;
    if (n(row.year_model) !== n(item.year_model)) continue;

    if (opts.useSourceUrl && item.source_url && row.source_url) {
      if (n(row.source_url) === n(item.source_url)) return row;
    }

    if (!within(row.km ?? null, item.km, KM_TOLERANCE)) continue;
    if (!within(priceNum(row.price), item.price, PRICE_TOLERANCE)) continue;
    return row;
  }
  return null;
}
