// HTML Intelligence — server functions
// Mini-Sprint 4A: descoberta de rotas + persistência do run.
// Mini-Sprint 4B: prévia técnica + detectores + Firecrawl actions.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  discoverInventoryRoutes,
  runTechnicalPreview,
} from "@/features/html-intelligence";
import type {
  HtmlIntelligenceRunRow,
  InventoryRouteCandidate,
  RouteDiscoveryResult,
  TechnicalPreview,
} from "@/features/html-intelligence";

const inputSchema = z.object({
  url: z.string().min(1),
  persist: z.boolean().optional(),
  withPreview: z.boolean().optional(),
});

export interface DiscoverRoutesPayload {
  result: RouteDiscoveryResult;
  preview: TechnicalPreview | null;
  runId: string | null;
}

export const discoverInventoryRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DiscoverRoutesPayload> => {
    const { supabase, userId } = context;
    const persist = data.persist ?? true;
    const withPreview = data.withPreview ?? true;

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

    let runId: string | null = null;
    if (persist) {
      const { data: row, error } = await supabase
        .from("html_intelligence_runs")
        .insert({
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
        })
        .select("id")
        .single();
      if (!error) runId = row?.id ?? null;
    }

    return { result, preview, runId };
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
