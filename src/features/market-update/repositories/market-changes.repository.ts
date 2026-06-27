import { supabase } from "@/integrations/supabase/client";
import type { MarketChangeRow, MarketChangeInsert } from "../types";

class MarketChangesRepository {
  async bulkInsert(rows: MarketChangeInsert[]): Promise<number> {
    if (!rows.length) return 0;
    const { error, count } = await supabase
      .from("market_changes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(rows as any, { count: "exact" });
    if (error) throw error;
    return count ?? rows.length;
  }

  async list(params: { since?: string; runId?: string; limit?: number } = {}): Promise<MarketChangeRow[]> {
    let q = supabase
      .from("market_changes")
      .select("*")
      .order("detected_at", { ascending: false });
    if (params.since) q = q.gte("detected_at", params.since);
    if (params.runId) q = q.eq("run_id", params.runId);
    q = q.limit(params.limit ?? 500);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as MarketChangeRow[];
  }

  async fetchSnapshot(competitorName: string): Promise<
    Array<{ brand: string | null; model: string | null; year_model: string | null; km: number | null; price: number | null }>
  > {
    const { data, error } = await supabase
      .from("competitor_vehicles")
      .select("brand,model,year_model,km,price")
      .eq("competitor_name", competitorName);
    if (error) throw error;
    return (data ?? []) as Array<{
      brand: string | null;
      model: string | null;
      year_model: string | null;
      km: number | null;
      price: number | null;
    }>;
  }

  async fetchNewSince(competitorName: string, isoSince: string): Promise<
    Array<{ brand: string | null; model: string | null; year_model: string | null; km: number | null; price: number | null }>
  > {
    const { data, error } = await supabase
      .from("competitor_vehicles")
      .select("brand,model,year_model,km,price")
      .eq("competitor_name", competitorName)
      .gte("created_at", isoSince);
    if (error) throw error;
    return (data ?? []) as Array<{
      brand: string | null;
      model: string | null;
      year_model: string | null;
      km: number | null;
      price: number | null;
    }>;
  }
}

export const marketChangesRepository = new MarketChangesRepository();
