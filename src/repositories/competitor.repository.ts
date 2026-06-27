import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type { Competitor, CompetitorInsert, CompetitorUpdate } from "@/types/database.types";

class CompetitorRepository extends BaseRepository<"competitors"> {
  constructor() {
    super("competitors");
  }

  async list(): Promise<Competitor[]> {
    return (await this.listAll()) as Competitor[];
  }

  async create(payload: CompetitorInsert) {
    const { data, error } = await supabase.from("competitors").insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, payload: CompetitorUpdate) {
    const { data, error } = await supabase
      .from("competitors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export const competitorRepository = new CompetitorRepository();
