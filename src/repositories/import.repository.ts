import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["import_logs"]["Row"];
type Insert = Database["public"]["Tables"]["import_logs"]["Insert"];

class ImportLogRepository {
  async list(): Promise<Row[]> {
    const { data, error } = await supabase
      .from("import_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async create(payload: Insert): Promise<Row> {
    const { data, error } = await supabase.from("import_logs").insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async listByCompetitor(competitorId: string): Promise<Row[]> {
    const { data, error } = await supabase
      .from("import_logs")
      .select("*")
      .eq("competitor_id", competitorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async remove(id: string) {
    const { error, count } = await supabase
      .from("import_logs")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw error;
    if (!count) throw new Error("Sem permissão para excluir este log ou registro não encontrado.");
  }
}

export const importLogRepository = new ImportLogRepository();
export type ImportLog = Row;
