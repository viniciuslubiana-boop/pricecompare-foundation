/**
 * Market Update Service — orquestra todo o fluxo "Atualizar Mercado".
 *
 * Reutiliza:
 *  - Competitor Engine   → lista de concorrentes ativos
 *  - Extraction Engine   → preview + persistência de veículos extraídos
 *  - Comparison Engine   → matching, winner, market price
 *  - Analytics Engine    → consumido via invalidação de queries pelo hook
 *
 * Nenhuma regra de cálculo vive aqui. Apenas orquestração.
 */
import { competitorRepository } from "@/repositories/competitor.repository";
import { runCompetitorExtraction } from "@/features/extraction/services/extraction.functions";
import { comparisonService } from "@/features/comparison/services/comparison.service";
import { detectChanges } from "@/features/comparison/calculators/change-detection";
import { marketUpdateRepository } from "../repositories/market-update.repository";
import { marketChangesRepository } from "../repositories/market-changes.repository";
import type {
  CompetitorRunDetail,
  MarketChangeInsert,
  MarketUpdateProgress,
  MarketUpdateResult,
  MarketUpdateStatus,
} from "../types";
import type { Competitor } from "@/types/database.types";

type ProgressFn = (p: MarketUpdateProgress) => void;

interface RunParams {
  userId: string;
  onProgress?: ProgressFn;
  signal?: AbortSignal;
}

const noop: ProgressFn = () => {};

async function fetchCompetitorContent(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { method: "GET", signal, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  return await res.text();
}

async function processCompetitor(
  competitor: Competitor,
  userId: string,
  runId: string | null,
  emit: (patch: Partial<MarketUpdateProgress>) => void,
  signal?: AbortSignal,
): Promise<CompetitorRunDetail> {
  const startedAt = new Date();
  const detail: CompetitorRunDetail = {
    competitorId: competitor.id,
    competitorName: competitor.name,
    competitorUrl: competitor.url,
    status: "completed",
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
    durationMs: 0,
    pagesProcessed: 0,
    totalPages: 1,
    vehiclesFound: 0,
    comparisonsCreated: 0,
    matches: 0,
    opportunities: 0,
    differentials: 0,
    error: null,
  };

  emit({
    currentCompetitorName: competitor.name,
    currentPage: 0,
    totalPages: 1,
    vehiclesFoundCurrent: 0,
  });

  try {
    if (!competitor.url) {
      throw new Error("Concorrente sem site cadastrado. Configure uma fonte de estoque antes de atualizar.");
    }

    // ETAPA 1.5 — snapshot lógico ANTES de inserir novos veículos
    const previousSnapshot = await marketChangesRepository
      .fetchSnapshot(competitor.name)
      .catch(() => []);
    const snapshotTakenAt = new Date().toISOString();

    // ETAPA 2 — extração real via server function (Firecrawl + IA)
    void userId;
    const extracted = await runCompetitorExtraction({
      data: {
        competitorId: competitor.id,
        competitorName: competitor.name,
        url: competitor.url,
      },
    });
    detail.pagesProcessed = 1;
    detail.vehiclesFound = extracted.savedCount;
    emit({ currentPage: 1, vehiclesFoundCurrent: extracted.savedCount });
    if (extracted.status === "failed" && extracted.error) {
      detail.error = extracted.error;
    }

    // ETAPA 2.5 — detectar e persistir alterações (lógica em Comparison Engine)
    try {
      const currentSnapshot = await marketChangesRepository.fetchNewSince(
        competitor.name,
        snapshotTakenAt,
      );
      const changes = detectChanges(previousSnapshot, currentSnapshot);
      if (changes.length) {
        const payload: MarketChangeInsert[] = changes.map((c) => ({
          run_id: runId,
          competitor_id: competitor.id,
          competitor_name: competitor.name,
          change_type: c.changeType,
          vehicle_key: c.vehicleKey,
          brand: c.brand,
          model: c.model,
          year_model: c.yearModel,
          previous_price: c.previousPrice,
          current_price: c.currentPrice,
          price_diff: c.priceDiff,
          price_diff_pct: c.priceDiffPct,
          previous_km: c.previousKm,
          current_km: c.currentKm,
          km_diff: c.kmDiff,
          summary: c.summary,
        }));
        await marketChangesRepository.bulkInsert(payload);
      }
    } catch {
      /* não interrompe o fluxo se a persistência de changes falhar */
    }

    // ETAPA 3 — comparação automática deste concorrente vs estoque
    const cmp = await comparisonService.run(competitor.id);
    const persisted = await comparisonService.save(cmp);
    detail.comparisonsCreated = persisted;
    detail.matches = cmp.summary.totalMatches;
    detail.opportunities = cmp.summary.opportunities;
    detail.differentials = cmp.summary.differentials;
  } catch (err) {
    detail.status = "failed";
    detail.error = err instanceof Error ? err.message : String(err);
  }

  const finishedAt = new Date();
  detail.finishedAt = finishedAt.toISOString();
  detail.durationMs = finishedAt.getTime() - startedAt.getTime();
  return detail;
}

function aggregate(details: CompetitorRunDetail[], competitorsTotal: number): Omit<
  MarketUpdateResult,
  "runId" | "startedAt" | "finishedAt" | "durationMs" | "details" | "message" | "status"
> {
  const processed = details.filter((d) => d.status === "completed").length;
  const failed = details.filter((d) => d.status === "failed").length;
  return {
    competitorsTotal,
    competitorsProcessed: processed,
    competitorsFailed: failed,
    vehiclesFound: details.reduce((a, b) => a + b.vehiclesFound, 0),
    comparisonsCreated: details.reduce((a, b) => a + b.comparisonsCreated, 0),
    matches: details.reduce((a, b) => a + b.matches, 0),
    opportunities: details.reduce((a, b) => a + b.opportunities, 0),
    differentials: details.reduce((a, b) => a + b.differentials, 0),
  };
}

function deriveStatus(competitorsTotal: number, processed: number, failed: number): MarketUpdateStatus {
  if (competitorsTotal === 0) return "completed";
  if (failed === 0) return "completed";
  if (processed === 0) return "failed";
  return "partial";
}

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} segundo${s === 1 ? "" : "s"}`;
  return `${m} minuto${m === 1 ? "" : "s"} e ${s} segundo${s === 1 ? "" : "s"}`;
}

export const marketUpdateService = {
  /**
   * Executa o fluxo completo. Lança erro apenas em condições impeditivas
   * (sem concorrentes ativos). Erros por concorrente são capturados e
   * registrados sem interromper o restante.
   */
  async run({ userId, onProgress = noop, signal }: RunParams): Promise<MarketUpdateResult> {
    const startedAt = new Date();
    onProgress({
      phase: "loading-competitors",
      currentCompetitorIndex: 0,
      totalCompetitors: 0,
      currentCompetitorName: null,
      currentPage: 0,
      totalPages: 0,
      vehiclesFoundCurrent: 0,
      elapsedMs: 0,
      percent: 0,
    });

    // ETAPA 1 — concorrentes ativos
    const competitors = await competitorRepository.list({ status: "active" });
    if (!competitors.length) {
      const err = new Error("Nenhum concorrente ativo cadastrado.");
      err.name = "NoActiveCompetitorsError";
      throw err;
    }

    // Cria registro de execução (ETAPA 6 — histórico)
    let runId: string | null = null;
    try {
      const created = await marketUpdateRepository.create({ userId });
      runId = created.id;
    } catch {
      // se não conseguir registrar histórico, segue o fluxo mesmo assim
      runId = null;
    }

    const details: CompetitorRunDetail[] = [];
    const total = competitors.length;

    for (let i = 0; i < competitors.length; i++) {
      if (signal?.aborted) break;
      const c = competitors[i];
      onProgress({
        phase: "processing-competitor",
        currentCompetitorIndex: i + 1,
        totalCompetitors: total,
        currentCompetitorName: c.name,
        currentPage: 0,
        totalPages: 1,
        vehiclesFoundCurrent: 0,
        elapsedMs: Date.now() - startedAt.getTime(),
        percent: Math.round((i / total) * 100),
      });

      const detail = await processCompetitor(c, userId, runId, (patch) => {
        onProgress({
          phase: "processing-competitor",
          currentCompetitorIndex: i + 1,
          totalCompetitors: total,
          currentCompetitorName: patch.currentCompetitorName ?? c.name,
          currentPage: patch.currentPage ?? 0,
          totalPages: patch.totalPages ?? 1,
          vehiclesFoundCurrent: patch.vehiclesFoundCurrent ?? 0,
          elapsedMs: Date.now() - startedAt.getTime(),
          percent: Math.round(((i + 0.5) / total) * 100),
        });
      }, signal);
      details.push(detail);
    }

    onProgress({
      phase: "finalizing",
      currentCompetitorIndex: total,
      totalCompetitors: total,
      currentCompetitorName: null,
      currentPage: 0,
      totalPages: 0,
      vehiclesFoundCurrent: 0,
      elapsedMs: Date.now() - startedAt.getTime(),
      percent: 95,
    });

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const agg = aggregate(details, total);
    const status = deriveStatus(total, agg.competitorsProcessed, agg.competitorsFailed);

    const message =
      status === "completed"
        ? `Mercado atualizado com sucesso. ${agg.competitorsProcessed} concorrente(s) processado(s). ${agg.vehiclesFound} veículo(s) encontrado(s). ${agg.matches} veículo(s) iguais. ${agg.opportunities} oportunidade(s). Tempo total: ${formatDuration(durationMs)}.`
        : status === "partial"
          ? `Atualização parcial. ${agg.competitorsProcessed} concorrente(s) atualizado(s). ${agg.competitorsFailed} apresentaram erro.`
          : `Falha ao atualizar mercado. ${agg.competitorsFailed} concorrente(s) com erro.`;

    if (runId) {
      try {
        await marketUpdateRepository.finalize(runId, {
          status,
          finishedAt: finishedAt.toISOString(),
          durationMs,
          totals: {
            competitors_total: total,
            competitors_processed: agg.competitorsProcessed,
            competitors_failed: agg.competitorsFailed,
            vehicles_found: agg.vehiclesFound,
            comparisons_created: agg.comparisonsCreated,
            matches: agg.matches,
            opportunities: agg.opportunities,
            differentials: agg.differentials,
          },
          details,
        });
      } catch {
        /* ignore history write failure */
      }
    }

    onProgress({
      phase: "done",
      currentCompetitorIndex: total,
      totalCompetitors: total,
      currentCompetitorName: null,
      currentPage: 0,
      totalPages: 0,
      vehiclesFoundCurrent: 0,
      elapsedMs: durationMs,
      percent: 100,
    });

    return {
      runId,
      status,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs,
      ...agg,
      details,
      message,
    };
  },

  listRecent: (limit?: number) => marketUpdateRepository.listRecent(limit),
};
