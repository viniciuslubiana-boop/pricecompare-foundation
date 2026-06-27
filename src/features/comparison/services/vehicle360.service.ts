/**
 * Vehicle 360° Service — Visão 360° de um veículo do estoque.
 *
 * Não cria regras de negócio. Apenas orquestra dados já existentes:
 *  - Inventory Engine (vehicleRepository)
 *  - Competitor Engine (competitorRepository, comparisonDataRepository)
 *  - Comparison Engine (intelligenceFor + equivalentsFor)
 *  - Analytics Engine (market_changes para histórico)
 */
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { competitorRepository } from "@/repositories/competitor.repository";
import { comparisonDataRepository } from "../repositories/comparison.repository";
import { marketChangesRepository } from "@/features/market-update/repositories/market-changes.repository";
import { equivalentsFor, intelligenceFor } from "../calculators/comparison.market-price";
import { vehicleKey } from "../calculators/change-detection";
import type {
  MyVehicle,
  Vehicle360CompetitorEntry,
  Vehicle360HistoryEntry,
  Vehicle360Result,
} from "../types/comparison.types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const vehicle360Service = {
  async load(vehicleId: string): Promise<Vehicle360Result> {
    const raw = await vehicleRepository.getById(vehicleId);
    if (!raw) throw new Error("Veículo não encontrado.");
    const myVehicle = raw as MyVehicle;

    const [competitors, marketPool] = await Promise.all([
      competitorRepository.list({}),
      comparisonDataRepository.listMarketPool(),
    ]);

    const competitorByName = new Map<string, { id: string; url: string | null }>();
    for (const c of competitors) {
      competitorByName.set(c.name, { id: c.id, url: (c as { url?: string | null }).url ?? null });
    }

    const eq = equivalentsFor(myVehicle, marketPool);
    const myPrice = myVehicle.price ?? null;

    const entries: Vehicle360CompetitorEntry[] = eq.map((c) => {
      const name = c.competitor_name ?? "—";
      const meta = competitorByName.get(name) ?? { id: null, url: null };
      const price = c.price as number;
      const diff = myPrice != null ? price - myPrice : null;
      const diffPct =
        diff != null && myPrice != null && myPrice > 0 ? round2((diff / myPrice) * 100) : null;
      return {
        id: c.id,
        competitorName: name,
        competitorId: meta.id,
        competitorUrl: meta.url,
        store: name,
        city: null,
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

    const market = intelligenceFor(myVehicle, marketPool);

    // Histórico via market_changes — filtra pelos competidores equivalentes
    const myKey = vehicleKey({
      brand: myVehicle.brand,
      model: myVehicle.model,
      year_model: myVehicle.year_model,
      km: myVehicle.km ?? null,
      price: myVehicle.price ?? null,
    });
    // Modelo no my_vehicle pode ter mais que o token raiz usado nos equivalents;
    // o vehicle_key usa model completo, então recorremos a um filtro mais largo
    // por brand+ano e cruzamos pelo conjunto de nomes presentes em `eq`.
    const competitorNames = new Set(entries.map((e) => e.competitorName));

    const history: Vehicle360HistoryEntry[] = [];
    try {
      const changes = await marketChangesRepository.list({ limit: 500 });
      const yearMatch = (myVehicle.year_model ?? "").match(/\d{4}/)?.[0];
      for (const ch of changes) {
        if (ch.change_type !== "price") continue;
        if (!competitorNames.has(ch.competitor_name)) continue;
        const chYear = (ch.year_model ?? "").match(/\d{4}/)?.[0];
        const sameBrand = (ch.brand ?? "").trim().toLowerCase() ===
          myVehicle.brand.trim().toLowerCase();
        const sameYear = !!yearMatch && !!chYear && yearMatch === chYear;
        const sameModelRoot =
          (ch.model ?? "").trim().toLowerCase().split(/\s+/)[0] ===
          myVehicle.model.trim().toLowerCase().split(/\s+/)[0];
        if (!sameBrand || !sameYear || !sameModelRoot) continue;
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
      // histórico é opcional — silencia se a tabela estiver indisponível
    }

    history.sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));

    // referência silenciosa para evitar lint (myKey reservado para uso futuro)
    void myKey;

    return { myVehicle, market, competitors: entries, history };
  },
};
