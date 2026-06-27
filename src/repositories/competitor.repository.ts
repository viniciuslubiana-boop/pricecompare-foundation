import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type { Competitor, CompetitorInsert, CompetitorUpdate } from "@/types/database.types";
import type { CompetitorFilters } from "@/features/competitors/types/competitor.types";

class CompetitorRepository extends BaseRepository<"competitors"> {
  constructor() {
    super("competitors");
  }

  async list(filters: CompetitorFilters = {}): Promise<Competitor[]> {
    let query = supabase.from("competitors").select("*").order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},url.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Competitor[];
  }

  async findActiveByUrl(url: string, excludeId?: string): Promise<Competitor | null> {
    let q = supabase.from("competitors").select("*").eq("status", "active").eq("url", url).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data?.[0] as Competitor) ?? null;
  }

  async create(payload: CompetitorInsert): Promise<Competitor> {
    const { data, error } = await supabase.from("competitors").insert(payload).select().single();
    if (error) throw error;
    return data as Competitor;
  }

  async update(id: string, payload: CompetitorUpdate): Promise<Competitor> {
    const { data, error } = await supabase
      .from("competitors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Competitor;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("competitors").delete().eq("id", id);
    if (error) throw error;
  }
}

export const competitorRepository = new CompetitorRepository();
