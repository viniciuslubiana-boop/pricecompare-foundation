import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type {
  ExtractionLog,
  ExtractionLogInsert,
  ExtractionLogUpdate,
} from "@/types/database.types";

class ExtractionRepository extends BaseRepository<"extraction_logs"> {
  constructor() {
    super("extraction_logs");
  }

  async list(): Promise<ExtractionLog[]> {
    return (await this.listAll()) as ExtractionLog[];
  }

  async create(payload: ExtractionLogInsert) {
    const { data, error } = await supabase
      .from("extraction_logs")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, payload: ExtractionLogUpdate) {
    const { data, error } = await supabase
      .from("extraction_logs")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listByCompetitor(competitorId: string) {
    const { data, error } = await supabase
      .from("extraction_logs")
      .select("*")
      .eq("competitor_id", competitorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}

export const extractionRepository = new ExtractionRepository();
