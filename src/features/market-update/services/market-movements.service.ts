/**
 * Market Movements Service — Central de Movimentações do Mercado.
 *
 * Orquestra dados existentes (sem novas regras de negócio):
 *  - Market Update repo (última run e seus totais)
 *  - Market Changes repo (alterações detectadas)
 *  - Inventory Engine (meu estoque)
 *  - Comparison Engine (pool de mercado + intelligenceFor)
 *  - Analytics calculator buildMovements
 */
import { marketUpdateRepository } from "../repositories/market-update.repository";
import { marketChangesRepository } from "../repositories/market-changes.repository";
import { vehicleRepository } from "@/repositories/vehicle.repository";
import { comparisonDataRepository } from "@/features/comparison/repositories/comparison.repository";
import {
  buildMovements,
  type MovementsBlocks,
} from "@/features/analytics/calculators/market-movements";
import type { MarketUpdateRunRow } from "../types";
import type { MyVehicle } from "@/features/comparison/types/comparison.types";

export interface MovementsCenterResult {
  run: MarketUpdateRunRow | null;
  blocks: MovementsBlocks;
}

async function loadByWindowHours(hours: number | undefined): Promise<MovementsCenterResult> {
  const since = hours ? new Date(Date.now() - hours * 3600_000).toISOString() : undefined;
  const [changes, runs, myVehiclesRaw, marketPool] = await Promise.all([
    marketChangesRepository.list({ since, limit: 1000 }),
    marketUpdateRepository.listRecent(1),
    vehicleRepository.list({}),
    comparisonDataRepository.listMarketPool(),
  ]);
  const run = runs[0] ?? null;
  const myVehicles = myVehiclesRaw as unknown as MyVehicle[];
  const vehiclesMonitored = run?.totals?.vehicles_found ?? marketPool.length;
  const blocks = buildMovements(changes, myVehicles, marketPool, vehiclesMonitored);
  return { run, blocks };
}

async function loadByRun(runId: string): Promise<MovementsCenterResult> {
  const [changes, runs, myVehiclesRaw, marketPool] = await Promise.all([
    marketChangesRepository.list({ runId, limit: 1000 }),
    marketUpdateRepository.listRecent(20),
    vehicleRepository.list({}),
    comparisonDataRepository.listMarketPool(),
  ]);
  const run = runs.find((r) => r.id === runId) ?? null;
  const myVehicles = myVehiclesRaw as unknown as MyVehicle[];
  const vehiclesMonitored = run?.totals?.vehicles_found ?? marketPool.length;
  const blocks = buildMovements(changes, myVehicles, marketPool, vehiclesMonitored);
  return { run, blocks };
}

async function loadByDateRange(sinceISO: string, untilISO?: string): Promise<MovementsCenterResult> {
  const [changesRaw, runs, myVehiclesRaw, marketPool] = await Promise.all([
    marketChangesRepository.list({ since: sinceISO, limit: 1000 }),
    marketUpdateRepository.listRecent(1),
    vehicleRepository.list({}),
    comparisonDataRepository.listMarketPool(),
  ]);
  const changes = untilISO
    ? changesRaw.filter((c) => c.detected_at <= untilISO)
    : changesRaw;
  const run = runs[0] ?? null;
  const myVehicles = myVehiclesRaw as unknown as MyVehicle[];
  const vehiclesMonitored = run?.totals?.vehicles_found ?? marketPool.length;
  const blocks = buildMovements(changes, myVehicles, marketPool, vehiclesMonitored);
  return { run, blocks };
}

export const marketMovementsService = {
  loadByWindowHours,
  loadByRun,
  loadByDateRange,
};
