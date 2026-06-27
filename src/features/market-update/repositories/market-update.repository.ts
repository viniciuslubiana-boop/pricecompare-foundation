import { supabase } from "@/integrations/supabase/client";
import type {
  CompetitorRunDetail,
  MarketUpdateRunRow,
  MarketUpdateStatus,
} from "../types";

interface CreateRunPayload {
  userId: string;
}

interface FinalizeRunPayload {
  status: MarketUpdateStatus;
  finishedAt: string;
  durationMs: number;
  totals: MarketUpdateRunRow["totals"];
  details: CompetitorRunDetail[];
}

class MarketUpdateRepository {
  async create(payload: CreateRunPayload): Promise<MarketUpdateRunRow> {
    const { data, error } = await supabase
      .from("market_update_runs")
      .insert({
        user_id: payload.userId,
        status: "running",
        totals: {},
        details: [],
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as MarketUpdateRunRow;
  }

  async finalize(id: string, payload: FinalizeRunPayload): Promise<void> {
    const { error } = await supabase
      .from("market_update_runs")
      .update({
        status: payload.status,
        finished_at: payload.finishedAt,
        duration_ms: payload.durationMs,
        totals: payload.totals,
        details: payload.details as unknown as never,
      })
      .eq("id", id);
    if (error) throw error;
  }

  async listRecent(limit = 20): Promise<MarketUpdateRunRow[]> {
    const { data, error } = await supabase
      .from("market_update_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as MarketUpdateRunRow[];
  }
}

export const marketUpdateRepository = new MarketUpdateRepository();
