/**
 * Consulta Global de Mercado — Service
 *
 * Orquestra dados existentes. Nenhuma nova regra de negócio.
 *
 *  - Inventory Engine    (vehicleRepository) → encontra "MEU VEÍCULO"
 *  - Competitor Engine   (competitorRepository, comparisonDataRepository) → pool
 *  - Comparison Engine   (equivalentsFor + intelligenceFor) → equivalentes + stats
 *  - Analytics Engine    (marketChangesRepository) → histórico
 */
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { competitorRepository } from "@/repositories/competitor.repository";
import { comparisonDataRepository } from "../repositories/comparison.repository";
import { marketChangesRepository } from "@/features/market-update/repositories/market-changes.repository";
import { baseCompaniesService } from "@/features/base-companies/services/base-companies.service";
import { equivalentsFor, intelligenceFor } from "../calculators/comparison.market-price";
import type {
  MarketIntelligence,
  MyVehicle,
  Vehicle360CompetitorEntry,
  Vehicle360HistoryEntry,
} from "../types/comparison.types";

export interface GlobalSearchQuery {
  brand: string;
  model: string;
  version?: string;
  year?: string;
}

export interface GlobalSearchCompanyGroup {
  baseCompanyId: string | null;
  baseCompanyName: string;
  vehicles: MyVehicle[];
}

export interface GlobalSearchResult {
  myVehicle: MyVehicle | null;
  myVehiclesByCompany: GlobalSearchCompanyGroup[];
  market: MarketIntelligence;
  competitors: Vehicle360CompetitorEntry[];
  history: Vehicle360HistoryEntry[];
  query: GlobalSearchQuery;
}


const norm = (s: string | null | undefined) => (s ?? "").toString().trim().toLowerCase();
const firstToken = (s: string) => norm(s).split(/\s+/)[0] ?? "";
const round2 = (n: number) => Math.round(n * 100) / 100;

function yearOf(s: string | null | undefined): string | null {
  return s?.match(/\d{4}/)?.[0] ?? null;
}

export const globalSearchService = {
  async search(query: GlobalSearchQuery): Promise<GlobalSearchResult> {
    const brand = query.brand.trim();
    const model = query.model.trim();
    if (!brand || !model) {
      throw new Error("Informe ao menos Marca e Modelo para realizar a consulta.");
    }

    const [inventory, competitors, marketPool] = await Promise.all([
      vehicleRepository.list({}),
      competitorRepository.list({}),
      comparisonDataRepository.listMarketPool(),
    ]);

    const bBrand = norm(brand);
    const bModelRoot = firstToken(model);
    const versionTerm = norm(query.version);
    const yearTerm = query.year ? yearOf(query.year) : null;

    // 1) Tenta localizar um veículo do estoque (heurística reuso: brand + model-root + ano)
    const myVehicle =
      inventory.find((v) => {
        if (norm(v.brand) !== bBrand) return false;
        if (firstToken(v.model) !== bModelRoot) return false;
        if (yearTerm && yearOf(v.year_model) !== yearTerm) return false;
        if (versionTerm && !norm(v.model).includes(versionTerm)) return false;
        return true;
      }) ?? null;

    // 2) Sintetiza um "alvo" para reusar o Comparison Engine sem duplicar lógica.
    //    Quando há veículo do estoque, usamos ele (preço, ano reais).
    const target: MyVehicle = myVehicle ?? ({
      id: "__synthetic__",
      brand,
      model,
      year_model: yearTerm ?? "",
      km: null,
      price: null,
      supplier_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as MyVehicle);

    // 3) Equivalentes via Comparison Engine (mesmo brand + model-root + mesmo ano).
    //    Se a busca não trouxer ano, fazemos um match mais largo (apenas brand + model-root).
    let eq = equivalentsFor(target, marketPool);
    if (!yearTerm && !target.year_model) {
      eq = marketPool.filter(
        (c) =>
          norm(c.brand) === bBrand &&
          firstToken(c.model) === bModelRoot &&
          typeof c.price === "number" &&
          (c.price as number) > 0,
      );
    }
    if (versionTerm) {
      eq = eq.filter((c) => norm(c.model).includes(versionTerm));
    }

    // 4) Intelligence (stats) — reuso direto. Quando filtramos por versão, recalculamos via
    //    pool sintético equivalente (sem nova fórmula: chamamos o mesmo calculator).
    const market = versionTerm || (!yearTerm && !target.year_model)
      ? intelligenceFor(target, eq)
      : intelligenceFor(target, marketPool);

    const myPrice = target.price ?? null;
    const competitorByName = new Map<
      string,
      { id: string | null; url: string | null; city: string | null; state: string | null }
    >();
    for (const c of competitors) {
      competitorByName.set(c.name, {
        id: c.id,
        url: (c as { url?: string | null }).url ?? null,
        city: (c as { city?: string | null }).city ?? null,
        state: (c as { state?: string | null }).state ?? null,
      });
    }

    const hostOf = (u: string | null | undefined): string | null => {
      if (!u) return null;
      try {
        return new URL(u).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    };

    const entries: Vehicle360CompetitorEntry[] = eq.map((c) => {
      const name = c.competitor_name ?? "—";
      const meta = competitorByName.get(name) ?? { id: null, url: null, city: null, state: null };
      const price = c.price as number;
      const diff = myPrice != null ? price - myPrice : null;
      const diffPct =
        diff != null && myPrice != null && myPrice > 0 ? round2((diff / myPrice) * 100) : null;
      const src = hostOf(c.source_url) ?? name;
      return {
        id: c.id,
        competitorName: name,
        competitorId: meta.id,
        competitorUrl: meta.url,
        store: name,
        city: meta.city,
        state: meta.state,
        source: src,
        brand: c.brand,
        model: c.model,
        yearModel: c.year_model,
        km: c.km ?? null,
        price,
        diffFromMe: diff != null ? round2(diff) : null,
        diffPctFromMe: diffPct,
        lastCollectedAt: c.updated_at ?? c.created_at,
        sourceUrl: c.source_url ?? null,
      };
    });
    entries.sort((a, b) => a.price - b.price);

    // 5) Histórico via Analytics (market_changes) — filtra pelo conjunto de equivalentes.
    const competitorNames = new Set(entries.map((e) => e.competitorName));
    const history: Vehicle360HistoryEntry[] = [];
    try {
      const changes = await marketChangesRepository.list({ limit: 500 });
      for (const ch of changes) {
        if (ch.change_type !== "price") continue;
        if (!competitorNames.has(ch.competitor_name)) continue;
        if (norm(ch.brand) !== bBrand) continue;
        if (firstToken(ch.model ?? "") !== bModelRoot) continue;
        if (yearTerm) {
          const chYear = yearOf(ch.year_model);
          if (!chYear || chYear !== yearTerm) continue;
        }
        history.push({
          id: ch.id,
          competitorName: ch.competitor_name,
          previousPrice: ch.previous_price,
          currentPrice: ch.current_price,
          diff: ch.price_diff,
          diffPct: ch.price_diff_pct,
          detectedAt: ch.detected_at,
          summary: ch.summary,
        });
      }
    } catch {
      // histórico é opcional
    }
    history.sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));

    return {
      myVehicle,
      market,
      competitors: entries,
      history,
      query,
    };
  },
};
