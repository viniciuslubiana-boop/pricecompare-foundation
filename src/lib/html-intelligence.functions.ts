// HTML Intelligence — server functions
// Mini-Sprint 4A: descoberta de rotas + persistência do run.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { discoverInventoryRoutes } from "@/features/html-intelligence";
import type {
  HtmlIntelligenceRunRow,
  InventoryRouteCandidate,
  RouteDiscoveryResult,
} from "@/features/html-intelligence";

const inputSchema = z.object({
  url: z.string().min(1),
  persist: z.boolean().optional(),
});

export interface DiscoverRoutesPayload {
  result: RouteDiscoveryResult;
  runId: string | null;
}

export const discoverInventoryRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DiscoverRoutesPayload> => {
    const { supabase, userId } = context;
    const persist = data.persist ?? true;

    let result: RouteDiscoveryResult;
    let errorMessage: string | null = null;
    try {
      result = await discoverInventoryRoutes(data.url);
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : "Falha no HIE";
      result = {
        baseUrl: data.url,
        chosen: null,
        candidates: [],
        processingMs: 0,
      };
    }

    let runId: string | null = null;
    if (persist) {
      const { data: row, error } = await supabase
        .from("html_intelligence_runs")
        .insert({
          base_url: result.baseUrl,
          chosen_route: result.chosen?.path ?? null,
          chosen_score: result.chosen?.breakdown?.score ?? 0,
          candidates: result.candidates as unknown as object,
          vehicles_estimated: result.chosen?.vehiclesEstimated ?? 0,
          processing_ms: result.processingMs,
          executed_by: userId,
          error_message: errorMessage,
        })
        .select("id")
        .single();
      if (!error) runId = row?.id ?? null;
    }

    return { result, runId };
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
    })) as HtmlIntelligenceRunRow[];
  });
