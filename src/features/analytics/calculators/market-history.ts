/**
 * Market History — agregações para a tela "Histórico de Mercado".
 *
 * Lógica pura (sem side effects, sem fetch). Consome MarketChangeRow já
 * persistido pelo Market Update Engine.
 */
import type { MarketChangeRow } from "@/features/market-update/types";

const norm = (v: string | null | undefined): string =>
  (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/** Mesma chave usada em change-detection.ts (brand|model|year_model). */
export function changeVehicleKey(r: {
  brand: string | null;
  model: string | null;
  year_model: string | null;
}): string {
  return [norm(r.brand), norm(r.model), norm(r.year_model)].join("|");
}

export interface HistoryFilters {
  competitorName?: string | null;
  brand?: string | null;
  model?: string | null;
  /** "drop" | "up" | null — só preço */
  direction?: "drop" | "up" | null;
  onlyType?: "new" | "removed" | "price" | "km" | null;
  /** true => somente alterações cujo vehicle_key bate com algum item do estoque */
  onlyStockImpacted?: boolean;
  minPctAbs?: number | null;
  /** ISO inicial; rows.detected_at >= since */
  since?: string | null;
  stockKeys?: Set<string>; // chaves do estoque para impacto/filtro
}

export interface HistorySummary {
  total: number;
  newVehicles: number;
  removed: number;
  priceReduced: number;
  priceIncreased: number;
  kmChanged: number;
  totalCompetitors: number;
  stockImpacted: number; // alterações que tocam meu estoque
  stockImpactedVehicles: number; // veículos distintos do meu estoque tocados
  averagePriceDiffPct: number;
}

export function summarizeHistory(
  rows: MarketChangeRow[],
  stockKeys?: Set<string>,
): HistorySummary {
  const competitors = new Set<string>();
  const impactedVehicleKeys = new Set<string>();
  let total = 0;
  let newVehicles = 0;
  let removed = 0;
  let priceReduced = 0;
  let priceIncreased = 0;
  let kmChanged = 0;
  let stockImpacted = 0;
  let pctSum = 0;
  let pctCount = 0;

  for (const r of rows) {
    total++;
    if (r.competitor_name) competitors.add(r.competitor_name);
    if (r.change_type === "new") newVehicles++;
    else if (r.change_type === "removed") removed++;
    else if (r.change_type === "km") kmChanged++;
    else if (r.change_type === "price") {
      if ((r.price_diff ?? 0) < 0) priceReduced++;
      else if ((r.price_diff ?? 0) > 0) priceIncreased++;
      if (r.price_diff_pct != null) {
        pctSum += Math.abs(r.price_diff_pct);
        pctCount++;
      }
    }
    if (stockKeys && stockKeys.has(r.vehicle_key)) {
      stockImpacted++;
      impactedVehicleKeys.add(r.vehicle_key);
    }
  }

  return {
    total,
    newVehicles,
    removed,
    priceReduced,
    priceIncreased,
    kmChanged,
    totalCompetitors: competitors.size,
    stockImpacted,
    stockImpactedVehicles: impactedVehicleKeys.size,
    averagePriceDiffPct: pctCount ? pctSum / pctCount : 0,
  };
}

export function applyHistoryFilters(
  rows: MarketChangeRow[],
  filters: HistoryFilters,
): MarketChangeRow[] {
  const wantBrand = filters.brand ? norm(filters.brand) : null;
  const wantModel = filters.model ? norm(filters.model) : null;
  return rows.filter((r) => {
    if (filters.since && r.detected_at < filters.since) return false;
    if (filters.competitorName && r.competitor_name !== filters.competitorName) return false;
    if (wantBrand && norm(r.brand) !== wantBrand) return false;
    if (wantModel && !norm(r.model).startsWith(wantModel)) return false;
    if (filters.onlyType && r.change_type !== filters.onlyType) return false;
    if (filters.direction === "drop") {
      if (r.change_type !== "price" || (r.price_diff ?? 0) >= 0) return false;
    }
    if (filters.direction === "up") {
      if (r.change_type !== "price" || (r.price_diff ?? 0) <= 0) return false;
    }
    if (
      filters.minPctAbs != null &&
      filters.minPctAbs > 0 &&
      (r.change_type !== "price" ||
        r.price_diff_pct == null ||
        Math.abs(r.price_diff_pct) < filters.minPctAbs)
    ) {
      return false;
    }
    if (filters.onlyStockImpacted) {
      if (!filters.stockKeys || !filters.stockKeys.has(r.vehicle_key)) return false;
    }
    return true;
  });
}

export interface VehicleHistoryAggregate {
  vehicleKey: string;
  brand: string | null;
  model: string | null;
  yearModel: string | null;
  competitors: string[]; // únicos
  changesCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  currentPrice: number | null;
  lastChangeAt: string | null;
  lastChangeCompetitor: string | null;
  lastChangeDiff: number | null;
  lastChangeDiffPct: number | null;
  stockImpacted: boolean;
}

/**
 * Agrega alterações por veículo (chave brand|model|year). `currentPriceByKey`
 * é o preço vigente conhecido (geralmente do competitor_vehicles).
 */
export function aggregatePerVehicle(
  rows: MarketChangeRow[],
  options: {
    currentPriceByKey?: Map<string, number | null>;
    stockKeys?: Set<string>;
  } = {},
): VehicleHistoryAggregate[] {
  const byKey = new Map<string, MarketChangeRow[]>();
  for (const r of rows) {
    const arr = byKey.get(r.vehicle_key) ?? [];
    arr.push(r);
    byKey.set(r.vehicle_key, arr);
  }

  const out: VehicleHistoryAggregate[] = [];
  for (const [key, list] of byKey) {
    const sorted = [...list].sort(
      (a, b) => +new Date(b.detected_at) - +new Date(a.detected_at),
    );
    const last = sorted[0];
    const competitors = Array.from(new Set(list.map((r) => r.competitor_name))).sort();
    const prices: number[] = [];
    for (const r of list) {
      if (r.previous_price != null) prices.push(r.previous_price);
      if (r.current_price != null) prices.push(r.current_price);
    }
    const currentFromMap = options.currentPriceByKey?.get(key) ?? null;
    const currentFromLast = last?.current_price ?? null;
    out.push({
      vehicleKey: key,
      brand: last?.brand ?? null,
      model: last?.model ?? null,
      yearModel: last?.year_model ?? null,
      competitors,
      changesCount: list.length,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      currentPrice: currentFromMap ?? currentFromLast,
      lastChangeAt: last?.detected_at ?? null,
      lastChangeCompetitor: last?.competitor_name ?? null,
      lastChangeDiff: last?.price_diff ?? null,
      lastChangeDiffPct: last?.price_diff_pct ?? null,
      stockImpacted: !!options.stockKeys?.has(key),
    });
  }

  out.sort((a, b) => {
    if (!a.lastChangeAt && !b.lastChangeAt) return 0;
    if (!a.lastChangeAt) return 1;
    if (!b.lastChangeAt) return -1;
    return +new Date(b.lastChangeAt) - +new Date(a.lastChangeAt);
  });
  return out;
}
