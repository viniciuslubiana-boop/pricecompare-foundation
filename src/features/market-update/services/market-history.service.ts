/**
 * Market History Service — orquestra repositórios existentes para alimentar a
 * tela "Histórico de Mercado". Sem regra de negócio nova; sem cálculo na UI.
 */
import { marketChangesRepository } from "../repositories/market-changes.repository";
import { comparisonDataRepository } from "@/features/comparison/repositories/comparison.repository";
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { changeVehicleKey } from "@/features/analytics/calculators/market-history";
import type { MarketChangeRow } from "../types";

export interface MarketHistorySourceEnriched {
  /** url do anúncio (do competitor_vehicles atual), quando localizado */
  sourceUrl: string | null;
  /** preço vigente conhecido no competitor_vehicles */
  currentPriceLive: number | null;
}

export interface MarketHistoryBundle {
  rows: MarketChangeRow[];
  /** chave: `${competitor_name}|${vehicle_key}` */
  enrichmentByKey: Map<string, MarketHistorySourceEnriched>;
  /** chave: vehicle_key — preço vigente (qualquer concorrente, último) */
  currentPriceByVehicleKey: Map<string, number | null>;
  /** Conjunto de chaves do meu estoque (brand|model|year) */
  stockKeys: Set<string>;
  /** Lista de concorrentes presentes para o filtro */
  competitors: string[];
  /** Lista de marcas presentes para o filtro */
  brands: string[];
}

class MarketHistoryService {
  async load(params: { sinceHours?: number } = {}): Promise<MarketHistoryBundle> {
    const sinceIso = params.sinceHours
      ? new Date(Date.now() - params.sinceHours * 3600_000).toISOString()
      : undefined;

    const [rows, pool, stock] = await Promise.all([
      marketChangesRepository.list({ since: sinceIso, limit: 1000 }),
      comparisonDataRepository.listMarketPool(),
      vehicleRepository.list({}),
    ]);

    const enrichmentByKey = new Map<string, MarketHistorySourceEnriched>();
    const currentPriceByVehicleKey = new Map<string, number | null>();

    for (const v of pool) {
      const key = changeVehicleKey({
        brand: v.brand ?? null,
        model: v.model ?? null,
        year_model: v.year_model ?? null,
      });
      // mantém preço mais recente por veículo
      const prev = currentPriceByVehicleKey.get(key);
      if (prev == null && v.price != null) {
        currentPriceByVehicleKey.set(key, Number(v.price));
      }
      const combo = `${v.competitor_name ?? ""}|${key}`;
      if (!enrichmentByKey.has(combo)) {
        enrichmentByKey.set(combo, {
          sourceUrl: v.source_url ?? null,
          currentPriceLive: v.price != null ? Number(v.price) : null,
        });
      }
    }

    const stockKeys = new Set<string>();
    for (const s of stock) {
      stockKeys.add(
        changeVehicleKey({
          brand: s.brand,
          model: s.model,
          year_model: s.year_model,
        }),
      );
    }

    const competitorsSet = new Set<string>();
    const brandsSet = new Set<string>();
    for (const r of rows) {
      if (r.competitor_name) competitorsSet.add(r.competitor_name);
      if (r.brand) brandsSet.add(r.brand);
    }

    return {
      rows,
      enrichmentByKey,
      currentPriceByVehicleKey,
      stockKeys,
      competitors: Array.from(competitorsSet).sort(),
      brands: Array.from(brandsSet).sort(),
    };
  }
}

export const marketHistoryService = new MarketHistoryService();
