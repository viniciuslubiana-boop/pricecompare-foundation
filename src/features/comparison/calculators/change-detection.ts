/**
 * Change Detection — compara dois estados (anterior x atual) de veículos de
 * um concorrente e identifica novos, removidos, alterações de preço e KM.
 *
 * Lógica pura. Nenhuma chamada à UI, nada de I/O.
 */

export interface SnapshotVehicle {
  brand: string | null;
  model: string | null;
  year_model: string | null;
  km: number | null;
  price: number | null;
}

export type ChangeType = "new" | "removed" | "price" | "km";

export interface DetectedChange {
  changeType: ChangeType;
  vehicleKey: string;
  brand: string | null;
  model: string | null;
  yearModel: string | null;
  previousPrice: number | null;
  currentPrice: number | null;
  priceDiff: number | null;
  priceDiffPct: number | null;
  previousKm: number | null;
  currentKm: number | null;
  kmDiff: number | null;
  summary: string;
}

const norm = (v: string | null | undefined): string =>
  (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function vehicleKey(v: SnapshotVehicle): string {
  return [norm(v.brand), norm(v.model), norm(v.year_model)].join("|");
}

function fmtBRL(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function describe(v: SnapshotVehicle): string {
  const parts = [v.brand, v.model, v.year_model].filter(Boolean);
  return parts.join(" ") || "Veículo";
}

/** Diferença percentual mínima para registrar alteração de preço (1%). */
const PRICE_NOISE_PCT = 0.01;

export function detectChanges(
  previous: SnapshotVehicle[],
  current: SnapshotVehicle[],
): DetectedChange[] {
  const prevMap = new Map<string, SnapshotVehicle>();
  for (const v of previous) prevMap.set(vehicleKey(v), v);

  const curMap = new Map<string, SnapshotVehicle>();
  for (const v of current) curMap.set(vehicleKey(v), v);

  const out: DetectedChange[] = [];

  // novos
  for (const [k, v] of curMap) {
    if (!prevMap.has(k)) {
      out.push({
        changeType: "new",
        vehicleKey: k,
        brand: v.brand,
        model: v.model,
        yearModel: v.year_model,
        previousPrice: null,
        currentPrice: v.price ?? null,
        priceDiff: null,
        priceDiffPct: null,
        previousKm: null,
        currentKm: v.km ?? null,
        kmDiff: null,
        summary: `${describe(v)} — novo anúncio por ${fmtBRL(v.price ?? null)}`,
      });
    }
  }

  // removidos
  for (const [k, v] of prevMap) {
    if (!curMap.has(k)) {
      out.push({
        changeType: "removed",
        vehicleKey: k,
        brand: v.brand,
        model: v.model,
        yearModel: v.year_model,
        previousPrice: v.price ?? null,
        currentPrice: null,
        priceDiff: null,
        priceDiffPct: null,
        previousKm: v.km ?? null,
        currentKm: null,
        kmDiff: null,
        summary: `${describe(v)} — saiu do mercado (antes ${fmtBRL(v.price ?? null)})`,
      });
    }
  }

  // alterações em itens existentes
  for (const [k, cur] of curMap) {
    const prev = prevMap.get(k);
    if (!prev) continue;

    // Preço
    if (
      prev.price != null &&
      cur.price != null &&
      prev.price > 0 &&
      Math.abs(cur.price - prev.price) / prev.price >= PRICE_NOISE_PCT
    ) {
      const diff = cur.price - prev.price;
      const pct = (diff / prev.price) * 100;
      out.push({
        changeType: "price",
        vehicleKey: k,
        brand: cur.brand,
        model: cur.model,
        yearModel: cur.year_model,
        previousPrice: prev.price,
        currentPrice: cur.price,
        priceDiff: diff,
        priceDiffPct: pct,
        previousKm: prev.km ?? null,
        currentKm: cur.km ?? null,
        kmDiff: null,
        summary: `${describe(cur)} — ${diff < 0 ? "reduziu" : "aumentou"} ${fmtBRL(Math.abs(diff))} (${pct.toFixed(1)}%)`,
      });
    }

    // KM (variação relevante: > 5%)
    if (
      prev.km != null &&
      cur.km != null &&
      prev.km > 0 &&
      Math.abs(cur.km - prev.km) / prev.km >= 0.05
    ) {
      const diff = cur.km - prev.km;
      out.push({
        changeType: "km",
        vehicleKey: k,
        brand: cur.brand,
        model: cur.model,
        yearModel: cur.year_model,
        previousPrice: prev.price ?? null,
        currentPrice: cur.price ?? null,
        priceDiff: null,
        priceDiffPct: null,
        previousKm: prev.km,
        currentKm: cur.km,
        kmDiff: diff,
        summary: `${describe(cur)} — KM atualizado de ${prev.km.toLocaleString("pt-BR")} para ${cur.km.toLocaleString("pt-BR")}`,
      });
    }
  }

  return out;
}
