/**
 * Market Movements — agrega as alterações detectadas pelo Market Update
 * em blocos prontos para a "Central de Movimentações do Mercado".
 *
 * Lógica pura. Sem I/O. Reusa Comparison Engine (equivalentsFor/intelligenceFor)
 * para correlacionar cada alteração com o estoque.
 */
import type { MarketChangeRow } from "@/features/market-update/types";
import type {
  CompetitorVehicle,
  MarketIntelligence,
  MyVehicle,
} from "@/features/comparison/types/comparison.types";
import { intelligenceFor } from "@/features/comparison/calculators/comparison.market-price";

const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toLowerCase();
const firstToken = (s: string | null | undefined) => norm(s).split(/\s+/)[0] ?? "";
const yearOf = (s: string | null | undefined) => s?.match(/\d{4}/)?.[0] ?? null;

export interface InventoryImpact {
  change: MarketChangeRow;
  myVehicleId: string;
  myBrand: string;
  myModel: string;
  myYear: string | null;
  myPrice: number | null;
  competitorPrice: number | null;
  diff: number | null;
  diffPct: number | null;
  intelligence: MarketIntelligence;
}

export interface MovementsBlocks {
  newAds: MarketChangeRow[];
  removedAds: MarketChangeRow[];
  priceChanges: MarketChangeRow[];
  kmChanges: MarketChangeRow[];
  impacts: InventoryImpact[];
  summary: {
    competitorsUpdated: number;
    vehiclesMonitored: number;
    newCount: number;
    removedCount: number;
    priceChangeCount: number;
    kmChangeCount: number;
    impactedMyVehicles: number;
  };
}

/** Encontra o veículo do estoque equivalente a uma alteração. */
function findMatchingMyVehicle(
  change: MarketChangeRow,
  myVehicles: MyVehicle[],
): MyVehicle | null {
  const brand = norm(change.brand);
  const modelRoot = firstToken(change.model);
  const year = yearOf(change.year_model);
  if (!brand || !modelRoot) return null;
  for (const v of myVehicles) {
    if (norm(v.brand) !== brand) continue;
    if (firstToken(v.model) !== modelRoot) continue;
    if (year && yearOf(v.year_model) !== year) continue;
    return v;
  }
  return null;
}

export function buildMovements(
  changes: MarketChangeRow[],
  myVehicles: MyVehicle[],
  marketPool: CompetitorVehicle[],
  vehiclesMonitored: number,
): MovementsBlocks {
  const newAds: MarketChangeRow[] = [];
  const removedAds: MarketChangeRow[] = [];
  const priceChanges: MarketChangeRow[] = [];
  const kmChanges: MarketChangeRow[] = [];
  const competitors = new Set<string>();
  const impactedIds = new Set<string>();
  const impacts: InventoryImpact[] = [];

  for (const c of changes) {
    if (c.competitor_name) competitors.add(c.competitor_name);
    if (c.change_type === "new") newAds.push(c);
    else if (c.change_type === "removed") removedAds.push(c);
    else if (c.change_type === "price") priceChanges.push(c);
    else if (c.change_type === "km") kmChanges.push(c);

    const match = findMatchingMyVehicle(c, myVehicles);
    if (!match) continue;
    impactedIds.add(match.id);
    const intel = intelligenceFor(match, marketPool);
    const myPrice = match.price ?? null;
    const competitorPrice = c.current_price ?? c.previous_price ?? null;
    const diff = myPrice != null && competitorPrice != null ? competitorPrice - myPrice : null;
    const diffPct =
      diff != null && myPrice && myPrice > 0
        ? Math.round((diff / myPrice) * 10000) / 100
        : null;
    impacts.push({
      change: c,
      myVehicleId: match.id,
      myBrand: match.brand,
      myModel: match.model,
      myYear: match.year_model,
      myPrice,
      competitorPrice,
      diff,
      diffPct,
      intelligence: intel,
    });
  }

  // Ordena impactos: alterações de preço com maior |diffPct| primeiro,
  // depois novos anúncios, depois removidos, depois KM.
  const order: Record<MarketChangeRow["change_type"], number> = {
    price: 0,
    new: 1,
    removed: 2,
    km: 3,
  };
  impacts.sort((a, b) => {
    const o = order[a.change.change_type] - order[b.change.change_type];
    if (o !== 0) return o;
    const ap = Math.abs(a.change.price_diff_pct ?? 0);
    const bp = Math.abs(b.change.price_diff_pct ?? 0);
    return bp - ap;
  });

  return {
    newAds,
    removedAds,
    priceChanges,
    kmChanges,
    impacts,
    summary: {
      competitorsUpdated: competitors.size,
      vehiclesMonitored,
      newCount: newAds.length,
      removedCount: removedAds.length,
      priceChangeCount: priceChanges.length,
      kmChangeCount: kmChanges.length,
      impactedMyVehicles: impactedIds.size,
    },
  };
}

export type MovementsFilter = {
  onlyPrice?: boolean;
  onlyImpact?: boolean;
  competitorName?: string | null;
};

export function filterMovementsChanges(
  rows: MarketChangeRow[],
  impacts: InventoryImpact[],
  filter: MovementsFilter,
): MarketChangeRow[] {
  const impactKeys = new Set(impacts.map((i) => i.change.id));
  return rows.filter((r) => {
    if (filter.onlyPrice && r.change_type !== "price") return false;
    if (filter.onlyImpact && !impactKeys.has(r.id)) return false;
    if (filter.competitorName && r.competitor_name !== filter.competitorName) return false;
    return true;
  });
}
