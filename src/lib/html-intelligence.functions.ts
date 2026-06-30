// HTML Intelligence — server functions
// Mini-Sprint 4A: descoberta de rotas + persistência do run.
// Mini-Sprint 4B: prévia técnica + detectores + Firecrawl actions.
// Mini-Sprint 4C: Source Score + rate limit + aprendizado.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyPostNormalization,
  computeSourceScore,
  deriveRecoveryInfo,
  detectSuddenDrop,
  discoverInventoryRoutes,
  runAiNormalization,
  runTechnicalPreview,
  type AliasEntry,
  type CatalogEntry,
  type RecoveryInfo,
} from "@/features/html-intelligence";
import type {
  AiTelemetry,
  HtmlIntelligenceRunRow,
  InventoryRouteCandidate,
  NormalizationStatus,
  NormalizedVehiclePreview,
  PostNormalizationResult,
  RouteDiscoveryResult,
  SourceScoreBreakdown,
  TechnicalPreview,
} from "@/features/html-intelligence";




const RATE_LIMIT_WINDOW_MS = 60_000;
const SOURCE_METHOD_HTML = "HTML";

const inputSchema = z.object({
  url: z.string().min(1),
  persist: z.boolean().optional(),
  withPreview: z.boolean().optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyType: z.enum(["base_company", "competitor"]).optional(),
  force: z.boolean().optional(),
});

export interface NormalizationPayload {
  items: NormalizedVehiclePreview[];
  statusCounts: Record<NormalizationStatus, number>;
  confidenceAvg: number;
  aiUsed: boolean;
  aiModel: string | null;
  aiTokens: number;
  aiDurationMs: number;
  errors: string[];
  /** Sprint 011 — telemetria detalhada (status da IA, payload, etc). */
  telemetry: AiTelemetry;
}


export interface DiscoverRoutesPayload {
  result: RouteDiscoveryResult;
  preview: TechnicalPreview | null;
  runId: string | null;
  score: SourceScoreBreakdown | null;
  normalization: NormalizationPayload | null;
  rateLimited: boolean;
  rateLimitMessage: string | null;
  recovery: RecoveryInfo | null;
  suspectedDrop: boolean;
  suddenDropReason: string | null;
  priorAvgVehicles: number;
}



export const discoverInventoryRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DiscoverRoutesPayload> => {
    const { supabase, userId } = context;
    const persist = data.persist ?? true;
    const withPreview = data.withPreview ?? true;
    const companyType = data.companyType ?? "competitor";
    const force = data.force ?? false;

    // ── Rate limit simples ───────────────────────────────────
    if (!force) {
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
      const { data: recent } = await supabase
        .from("html_intelligence_runs")
        .select("id, created_at")
        .eq("base_url", data.url)
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();
      if (recent) {
        return {
          result: { baseUrl: data.url, chosen: null, candidates: [], processingMs: 0 },
          preview: null,
          runId: null,
          score: null,
          normalization: null,
          rateLimited: true,
          rateLimitMessage:
            "Execução recente detectada para esta URL. Aguarde 60 segundos ou marque 'forçar reexecução'.",
          recovery: null,
          suspectedDrop: false,
          suddenDropReason: null,
          priorAvgVehicles: 0,
        };
      }


    }

    let result: RouteDiscoveryResult;
    let errorMessage: string | null = null;
    try {
      result = await discoverInventoryRoutes(data.url);
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : "Falha no HIE";
      result = { baseUrl: data.url, chosen: null, candidates: [], processingMs: 0 };
    }

    let preview: TechnicalPreview | null = null;
    if (withPreview && result.chosen?.url) {
      try {
        preview = await runTechnicalPreview(result.chosen.url);
      } catch (e) {
        errorMessage = (errorMessage ? errorMessage + " | " : "") +
          (e instanceof Error ? e.message : "Falha na prévia técnica");
      }
    }

    // ── Carrega score anterior p/ estabilidade ───────────────
    const { data: priorRow } = await supabase
      .from("market_source_scores")
      .select("executions_total, executions_success, vehicles_estimated")
      .eq("url", data.url)
      .eq("source_method", SOURCE_METHOD_HTML)
      .maybeSingle();

    const success = (preview?.rawAfter ?? 0) > 0;

    const score = computeSourceScore({
      htmlBreakdown: result.chosen?.breakdown ?? null,
      preview,
      vehiclesEstimated: result.chosen?.vehiclesEstimated ?? 0,
      prior: priorRow
        ? {
            executionsTotal: priorRow.executions_total,
            executionsSuccess: priorRow.executions_success,
            avgVehicles: priorRow.vehicles_estimated,
          }
        : null,
      fallbackUsed: preview?.actionsUsed ?? false,
    });

    // ── Sprint 005: Normalização inteligente com IA ──────────
    let normalization: NormalizationPayload | null = null;
    if (preview && preview.preview.length > 0) {
      const sourceContext = `URL ${data.url} (rota ${result.chosen?.url ?? "?"})`;
      const ai = await runAiNormalization(preview.preview, sourceContext);

      let post: PostNormalizationResult = {
        items: [], statusCounts: { approved: 0, review: 0, invalid: 0, duplicated: 0 }, confidenceAvg: 0,
      };
      if (ai.items.length > 0) {
        try {
          const [catalogRes, aliasesRes] = await Promise.all([
            supabase.from("vehicle_master_catalog").select("brand, canonical_model").eq("active", true),
            supabase.from("vehicle_model_aliases").select("brand, alias, canonical"),
          ]);
          const catalog = (catalogRes.data ?? []) as CatalogEntry[];
          const aliases = (aliasesRes.data ?? []) as AliasEntry[];
          post = applyPostNormalization(ai.items, catalog, aliases);
        } catch (e) {
          ai.errors.push(e instanceof Error ? e.message : "Falha no catálogo/alias");
        }
      }

      normalization = {
        items: post.items,
        statusCounts: post.statusCounts,
        confidenceAvg: post.confidenceAvg,
        aiUsed: ai.aiUsed,
        aiModel: ai.aiModel,
        aiTokens: ai.aiTokens,
        aiDurationMs: ai.aiDurationMs,
        errors: ai.errors,
        telemetry: ai.telemetry,
      };

    }

    // ── Sprint 008: aprendizado + recuperação + queda brusca ──
    const recovery = deriveRecoveryInfo(preview, errorMessage);
    const currentVehicles = preview?.rawAfter ?? 0;
    const drop = detectSuddenDrop({
      priorAvgVehicles: priorRow?.vehicles_estimated ?? null,
      priorExecutions: priorRow?.executions_total ?? 0,
      currentVehicles,
    });
    const fallbackReason = recovery.fallbackReason ?? (drop.suspectedDrop ? drop.reason : null);

    let runId: string | null = null;
    if (persist) {
      const insertRow: Record<string, unknown> = {
        base_url: result.baseUrl,
        chosen_route: result.chosen?.path ?? null,
        chosen_score: result.chosen?.breakdown?.score ?? 0,
        candidates: JSON.parse(JSON.stringify(result.candidates)),
        vehicles_estimated: result.chosen?.vehiclesEstimated ?? 0,
        processing_ms: result.processingMs + (preview?.processingMs ?? 0),
        executed_by: userId,
        error_message: errorMessage,
        actions_used: preview?.actionsUsed ?? false,
        scroll_cycles: preview?.scrollCycles ?? 0,
        load_more_clicks: preview?.loadMoreClicks ?? 0,
        pagination_detected: preview?.pagination.detected ?? false,
        embedded_json_detected: (preview?.embeddedJsonSources.length ?? 0) > 0,
        structured_data_detected: preview?.structuredDataDetected ?? false,
        raw_items_found: preview?.cardsDetected ?? 0,
        technical_preview: preview ? JSON.parse(JSON.stringify(preview)) : {},
        normalized_preview: normalization
          ? JSON.parse(JSON.stringify(normalization.items))
          : [],
        normalization_confidence_avg: normalization?.confidenceAvg ?? 0,
        normalization_status_counts: normalization?.statusCounts ?? {},
        ai_used: normalization?.aiUsed ?? false,
        ai_model: normalization?.aiModel ?? null,
        ai_tokens: normalization?.aiTokens ?? 0,
        ai_duration_ms: normalization?.aiDurationMs ?? 0,
        normalization_errors: normalization?.errors ?? [],
        initial_method: recovery.initialMethod,
        final_method: recovery.finalMethod,
        fallback_reason: fallbackReason,
        recovered: recovery.recovered,
        suspected_drop: drop.suspectedDrop,
        prior_avg_vehicles: drop.priorAvgVehicles,
      };
      const { data: row } = await supabase
        .from("html_intelligence_runs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertRow as any)
        .select("id")
        .single();
      runId = row?.id ?? null;

      // Upsert score — em caso de drop suspeito, NÃO reescreve vehicles_estimated
      const nextTotal = (priorRow?.executions_total ?? 0) + 1;
      const nextSuccess = (priorRow?.executions_success ?? 0) + (success ? 1 : 0);
      const vehiclesEstimatedToPersist = drop.suspectedDrop
        ? (priorRow?.vehicles_estimated ?? result.chosen?.vehiclesEstimated ?? 0)
        : (result.chosen?.vehiclesEstimated ?? 0);

      await supabase.from("market_source_scores").upsert(
        {
          company_id: data.companyId ?? null,
          company_type: companyType,
          url: data.url,
          source_method: SOURCE_METHOD_HTML,
          route_url: result.chosen?.url ?? null,
          html_score: score.htmlScore,
          source_score: score.sourceScore,
          coverage_score: score.coverageScore,
          quality_score: score.qualityScore,
          performance_score: score.performanceScore,
          stability_score: score.stabilityScore,
          success_rate: nextTotal > 0 ? nextSuccess / nextTotal : 0,
          raw_items_found: preview?.rawAfter ?? 0,
          vehicles_estimated: vehiclesEstimatedToPersist,
          actions_used: preview?.actionsUsed ?? false,
          fallback_used: preview?.actionsUsed ?? false,
          executions_total: nextTotal,
          executions_success: nextSuccess,
          last_success_at: success ? new Date().toISOString() : (priorRow ? undefined : null),
          last_failure_at: !success ? new Date().toISOString() : (priorRow ? undefined : null),
        },
        { onConflict: "url,source_method" },
      );

      // Aprendizado SSS: registra histórico do método final
      await supabase.from("market_source_history").insert({
        company_id: data.companyId ?? null,
        company_type: companyType,
        url: data.url,
        method_used: recovery.finalMethod === "STRUCTURED_DATA" ? "EMBEDDED_JSON" : recovery.finalMethod,
        confidence: score.sourceScore,
        vehicles_found: preview?.rawAfter ?? 0,
        execution_time_ms: preview?.processingMs ?? result.processingMs,
        success,
        fallback_used: recovery.fallbackUsed,
        fallback_chain: recovery.fallbackUsed
          ? ([{ initial: recovery.initialMethod, final: recovery.finalMethod, reason: fallbackReason }] as never)
          : null,
      });
    }

    return {
      result,
      preview,
      runId,
      score,
      normalization,
      rateLimited: false,
      rateLimitMessage: null,
      recovery,
      suspectedDrop: drop.suspectedDrop,
      suddenDropReason: drop.reason,
      priorAvgVehicles: drop.priorAvgVehicles,
    };
  });



export const listHtmlIntelligenceRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HtmlIntelligenceRunRow[]> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("html_intelligence_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      ...r,
      candidates: (r.candidates as unknown as InventoryRouteCandidate[]) ?? [],
    })) as unknown as HtmlIntelligenceRunRow[];
  });

// ── Source Scores (4C) ───────────────────────────────────────
export interface SourceScoreRow {
  id: string;
  company_id: string | null;
  company_type: string;
  url: string;
  source_method: string;
  route_url: string | null;
  html_score: number;
  source_score: number;
  coverage_score: number;
  quality_score: number;
  performance_score: number;
  stability_score: number;
  success_rate: number;
  raw_items_found: number;
  vehicles_estimated: number;
  actions_used: boolean;
  fallback_used: boolean;
  executions_total: number;
  executions_success: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
}

export const listSourceScores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SourceScoreRow[]> => {
    const { data, error } = await context.supabase
      .from("market_source_scores")
      .select("*")
      .order("source_score", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as SourceScoreRow[];
  });

export const getSourceScoreForUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ url: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<SourceScoreRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("market_source_scores")
      .select("*")
      .eq("url", data.url)
      .order("source_score", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as SourceScoreRow[];
  });
