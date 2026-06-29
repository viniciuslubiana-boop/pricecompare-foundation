import type { MyVehicle } from "@/types/database.types";

export interface FipeIndicators {
  /** Veículos com FIPE vinculada e preço definido. */
  withFipe: number;
  /** Veículos sem FIPE confirmada / não vinculados / não encontrados. */
  withoutFipe: number;
  /** Veículos com preço acima da FIPE. */
  aboveFipe: number;
  /** Veículos com preço abaixo da FIPE. */
  belowFipe: number;
  /** Veículos com preço equivalente à FIPE (Δ < 0,5%). */
  atFipe: number;
  /** Diferença média absoluta (R$) entre preço e FIPE, dentre vinculados. */
  avgDiff: number | null;
  /** Diferença média percentual em relação à FIPE. */
  avgDiffPercent: number | null;
}

const STATUS_LINKED = new Set(["vinculada", "vinculada_manualmente"]);

export function computeFipeIndicators(vehicles: Pick<
  MyVehicle,
  "price" | "fipe_value" | "fipe_status"
>[]): FipeIndicators {
  let withFipe = 0;
  let withoutFipe = 0;
  let above = 0;
  let below = 0;
  let at = 0;
  let sumDiff = 0;
  let sumPct = 0;

  for (const v of vehicles) {
    const linked = STATUS_LINKED.has(String(v.fipe_status ?? ""));
    const fipe = typeof v.fipe_value === "number" ? v.fipe_value : null;
    const price = typeof v.price === "number" ? v.price : null;

    if (!linked || fipe === null || fipe <= 0 || price === null) {
      withoutFipe += 1;
      continue;
    }
    withFipe += 1;
    const diff = price - fipe;
    const pct = diff / fipe;
    sumDiff += diff;
    sumPct += pct;
    if (Math.abs(pct) < 0.005) at += 1;
    else if (diff > 0) above += 1;
    else below += 1;
  }

  return {
    withFipe,
    withoutFipe,
    aboveFipe: above,
    belowFipe: below,
    atFipe: at,
    avgDiff: withFipe ? sumDiff / withFipe : null,
    avgDiffPercent: withFipe ? (sumPct / withFipe) * 100 : null,
  };
}
