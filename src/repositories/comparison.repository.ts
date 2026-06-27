import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type { Comparison, ComparisonInsert } from "@/types/database.types";

class ComparisonRepository extends BaseRepository<"comparisons"> {
  constructor() {
    super("comparisons");
  }

  async list(): Promise<Comparison[]> {
    return (await this.listAll()) as Comparison[];
  }

  async create(payload: ComparisonInsert) {
    const { data, error } = await supabase.from("comparisons").insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async recent(limit = 20) {
    const { data, error } = await supabase
      .from("comparisons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
}

export const comparisonRepository = new ComparisonRepository();
